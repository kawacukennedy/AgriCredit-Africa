// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./IdentityRegistry.sol";

// Interfaces for external services
interface IDeliveryOracle {
    function verifyDelivery(uint256 escrowId, bytes memory proof) external returns (bool);
    function getDeliveryStatus(uint256 escrowId) external view returns (uint8);
}

interface IQualityOracle {
    function assessQuality(uint256 listingId, bytes memory data) external returns (uint256);
}

contract MarketplaceEscrow is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    enum EscrowStatus { Created, Funded, Shipped, Delivered, Completed, Disputed, Cancelled }

    struct Escrow {
        uint256 id;
        address buyer;
        address seller;
        uint256 amount;
        address token;
        EscrowStatus status;
        uint256 createdAt;
        uint256 shippedAt;
        uint256 deliveredAt;
        string deliveryProof; // IPFS hash or IoT data
        string geoLocation; // Geo-tagged location data
        uint256 qualityScore; // AI-determined quality score
        bool buyerConfirmed;
        bool sellerConfirmed;
        uint256 disputeDeadline;
    }

    struct Listing {
        uint256 id;
        address seller;
        string cropType;
        uint256 quantity;
        uint256 pricePerUnit;
        string location;
        uint256 harvestDate;
        uint256 expiryDate;
        bool active;
        uint256 aiRecommendationScore; // AI recommendation score
        string geoData; // Geo-tagging information
    }

    IdentityRegistry public identityRegistry;
    IDeliveryOracle public deliveryOracle;
    IQualityOracle public qualityOracle;

    mapping(uint256 => Escrow) public escrows;
    mapping(uint256 => Listing) public listings;
    uint256 public nextEscrowId = 1;
    uint256 public nextListingId = 1;

    // Batch operations
    struct BatchListing {
        string cropType;
        uint256 quantity;
        uint256 pricePerUnit;
        string location;
        uint256 harvestDate;
        uint256 expiryDate;
        string geoData;
    }

    // Enhanced dispute resolution
    struct Dispute {
        uint256 escrowId;
        address initiator;
        string reason;
        uint256 evidenceCount;
        mapping(uint256 => string) evidence; // IPFS hashes
        uint256 resolutionDeadline;
        bool resolved;
        address winner;
    }

    mapping(uint256 => Dispute) public disputes;
    uint256 public nextDisputeId = 1;

    // Platform fees
    uint256 public platformFee = 25; // 0.25% in basis points
    address public feeCollector;
    uint256 public disputePeriod = 7 days;

    event ListingCreated(uint256 indexed listingId, address indexed seller, string cropType, uint256 quantity);
    event ListingUpdated(uint256 indexed listingId, uint256 aiScore);
    event EscrowCreated(uint256 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount);
    event EscrowFunded(uint256 indexed escrowId);
    event ShipmentConfirmed(uint256 indexed escrowId, string geoData);
    event DeliveryConfirmed(uint256 indexed escrowId, string proof);
    event EscrowCompleted(uint256 indexed escrowId);
    event EscrowDisputed(uint256 indexed escrowId);
    event EscrowCancelled(uint256 indexed escrowId);
    event FormalDisputeInitiated(uint256 indexed disputeId, uint256 indexed escrowId, address indexed initiator, string reason);
    event DisputeEvidenceSubmitted(uint256 indexed disputeId, address indexed submitter, uint256 evidenceIndex, string evidence);
    event FormalDisputeResolved(uint256 indexed disputeId, address indexed winner, string resolutionNotes);

    constructor(
        address _identityRegistry,
        address _deliveryOracle,
        address _qualityOracle,
        address _feeCollector
    ) Ownable(msg.sender) {
        identityRegistry = IdentityRegistry(_identityRegistry);
        deliveryOracle = IDeliveryOracle(_deliveryOracle);
        qualityOracle = IQualityOracle(_qualityOracle);
        feeCollector = _feeCollector;
    }

    // Listing Management
    function createListing(
        string memory _cropType,
        uint256 _quantity,
        uint256 _pricePerUnit,
        string memory _location,
        uint256 _harvestDate,
        uint256 _expiryDate,
        string memory _geoData
    ) external returns (uint256) {
        require(identityRegistry.isIdentityVerified(msg.sender), "Seller not verified");
        require(_quantity > 0, "Quantity must be > 0");
        require(_pricePerUnit > 0, "Price must be > 0");
        require(_harvestDate < _expiryDate, "Invalid dates");

        uint256 listingId = nextListingId++;
        listings[listingId] = Listing({
            id: listingId,
            seller: msg.sender,
            cropType: _cropType,
            quantity: _quantity,
            pricePerUnit: _pricePerUnit,
            location: _location,
            harvestDate: _harvestDate,
            expiryDate: _expiryDate,
            active: true,
            aiRecommendationScore: 0, // To be set by AI service
            geoData: _geoData
        });

        emit ListingCreated(listingId, msg.sender, _cropType, _quantity);
        return listingId;
    }

    function updateListingAIScore(uint256 _listingId, uint256 _aiScore) external onlyOwner {
        require(listings[_listingId].id != 0, "Listing not found");
        listings[_listingId].aiRecommendationScore = _aiScore;
        emit ListingUpdated(_listingId, _aiScore);
    }

    function deactivateListing(uint256 _listingId) external {
        require(listings[_listingId].seller == msg.sender || msg.sender == owner(), "Not authorized");
        listings[_listingId].active = false;
    }

    // Batch operations for efficiency
    function createBatchListings(BatchListing[] memory _listings) external returns (uint256[] memory) {
        require(identityRegistry.isIdentityVerified(msg.sender), "Seller not verified");
        uint256[] memory listingIds = new uint256[](_listings.length);

        for (uint256 i = 0; i < _listings.length; i++) {
            BatchListing memory listing = _listings[i];
            require(listing.quantity > 0, "Quantity must be > 0");
            require(listing.pricePerUnit > 0, "Price must be > 0");
            require(listing.harvestDate < listing.expiryDate, "Invalid dates");

            uint256 listingId = nextListingId++;
            listings[listingId] = Listing({
                id: listingId,
                seller: msg.sender,
                cropType: listing.cropType,
                quantity: listing.quantity,
                pricePerUnit: listing.pricePerUnit,
                location: listing.location,
                harvestDate: listing.harvestDate,
                expiryDate: listing.expiryDate,
                active: true,
                aiRecommendationScore: 0,
                geoData: listing.geoData
            });

            listingIds[i] = listingId;
            emit ListingCreated(listingId, msg.sender, listing.cropType, listing.quantity);
        }

        return listingIds;
    }

    function createEscrow(
        address _seller,
        uint256 _amount,
        address _token,
        uint256 _listingId,
        string memory _geoLocation
    ) external returns (uint256) {
        require(identityRegistry.isIdentityVerified(msg.sender), "Buyer not verified");
        require(identityRegistry.isIdentityVerified(_seller), "Seller not verified");
        require(_amount > 0, "Amount must be > 0");
        require(listings[_listingId].active, "Listing not active");
        require(listings[_listingId].seller == _seller, "Invalid seller for listing");

        uint256 escrowId = nextEscrowId++;
        escrows[escrowId] = Escrow({
            id: escrowId,
            buyer: msg.sender,
            seller: _seller,
            amount: _amount,
            token: _token,
            status: EscrowStatus.Created,
            createdAt: block.timestamp,
            shippedAt: 0,
            deliveredAt: 0,
            deliveryProof: "",
            geoLocation: _geoLocation,
            qualityScore: 0,
            buyerConfirmed: false,
            sellerConfirmed: false,
            disputeDeadline: 0
        });

        emit EscrowCreated(escrowId, msg.sender, _seller, _amount);
        return escrowId;
    }

    function fundEscrow(uint256 _escrowId) external nonReentrant {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Created, "Escrow not in created state");
        require(msg.sender == escrow.buyer, "Only buyer can fund");

        IERC20(escrow.token).safeTransferFrom(msg.sender, address(this), escrow.amount);

        escrow.status = EscrowStatus.Funded;
        emit EscrowFunded(_escrowId);
    }

    function confirmShipment(uint256 _escrowId, string memory _geoData) external {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Funded, "Escrow not funded");
        require(msg.sender == escrow.seller, "Only seller can confirm shipment");

        escrow.status = EscrowStatus.Shipped;
        escrow.shippedAt = block.timestamp;
        escrow.geoLocation = _geoData; // Update with shipment geo-data

        emit ShipmentConfirmed(_escrowId, _geoData);
    }

    function confirmDelivery(uint256 _escrowId, string memory _proof, uint256 _qualityScore) external {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Shipped, "Escrow not shipped");
        require(msg.sender == escrow.buyer, "Only buyer can confirm delivery");

        escrow.status = EscrowStatus.Delivered;
        escrow.deliveredAt = block.timestamp;
        escrow.deliveryProof = _proof;
        escrow.qualityScore = _qualityScore;
        escrow.buyerConfirmed = true;
        escrow.disputeDeadline = block.timestamp + disputePeriod;

        emit DeliveryConfirmed(_escrowId, _proof);
    }

    function completeEscrow(uint256 _escrowId) external nonReentrant {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Delivered, "Delivery not confirmed");
        require(msg.sender == escrow.seller, "Only seller can complete");
        require(block.timestamp > escrow.disputeDeadline, "Dispute period not ended");

        // Calculate platform fee
        uint256 fee = (escrow.amount * platformFee) / 10000;
        uint256 sellerAmount = escrow.amount - fee;

        // Transfer to seller
        IERC20(escrow.token).safeTransfer(escrow.seller, sellerAmount);

        // Transfer fee to owner
        if (fee > 0) {
            IERC20(escrow.token).safeTransfer(owner(), fee);
        }

        escrow.status = EscrowStatus.Completed;
        escrow.sellerConfirmed = true;

        emit EscrowCompleted(_escrowId);
    }

    function raiseDispute(uint256 _escrowId) external {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Delivered, "Can only dispute delivered escrows");
        require(block.timestamp <= escrow.disputeDeadline, "Dispute period expired");
        require(msg.sender == escrow.buyer || msg.sender == escrow.seller, "Not authorized");

        escrow.status = EscrowStatus.Disputed;

        emit EscrowDisputed(_escrowId);
    }

    function resolveDispute(uint256 _escrowId, bool _refundBuyer) external onlyOwner {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Disputed, "Escrow not disputed");

        if (_refundBuyer) {
            // Refund buyer
            IERC20(escrow.token).safeTransfer(escrow.buyer, escrow.amount);
        } else {
            // Pay seller
            uint256 fee = (escrow.amount * platformFee) / 10000;
            uint256 sellerAmount = escrow.amount - fee;
            IERC20(escrow.token).safeTransfer(escrow.seller, sellerAmount);
            if (fee > 0) {
                IERC20(escrow.token).safeTransfer(owner(), fee);
            }
        }

        escrow.status = EscrowStatus.Completed;
        emit EscrowCompleted(_escrowId);
    }

    // Enhanced dispute resolution with evidence submission
    function initiateFormalDispute(
        uint256 _escrowId,
        string memory _reason,
        string memory _initialEvidence
    ) external returns (uint256) {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Delivered, "Can only dispute delivered escrows");
        require(block.timestamp <= escrow.disputeDeadline, "Dispute period expired");
        require(msg.sender == escrow.buyer || msg.sender == escrow.seller, "Not authorized");

        escrow.status = EscrowStatus.Disputed;

        uint256 disputeId = nextDisputeId++;
        Dispute storage dispute = disputes[disputeId];
        dispute.escrowId = _escrowId;
        dispute.initiator = msg.sender;
        dispute.reason = _reason;
        dispute.evidenceCount = 1;
        dispute.evidence[0] = _initialEvidence;
        dispute.resolutionDeadline = block.timestamp + 14 days; // Extended dispute period
        dispute.resolved = false;

        emit FormalDisputeInitiated(disputeId, _escrowId, msg.sender, _reason);
        emit EscrowDisputed(_escrowId);

        return disputeId;
    }

    function submitDisputeEvidence(uint256 _disputeId, string memory _evidence) external {
        Dispute storage dispute = disputes[_disputeId];
        require(!dispute.resolved, "Dispute already resolved");
        require(block.timestamp <= dispute.resolutionDeadline, "Evidence submission period expired");

        Escrow storage escrow = escrows[dispute.escrowId];
        require(msg.sender == escrow.buyer || msg.sender == escrow.seller, "Not authorized");

        uint256 evidenceIndex = dispute.evidenceCount;
        dispute.evidence[evidenceIndex] = _evidence;
        dispute.evidenceCount++;

        emit DisputeEvidenceSubmitted(_disputeId, msg.sender, evidenceIndex, _evidence);
    }

    function resolveFormalDispute(uint256 _disputeId, bool _refundBuyer, string memory _resolutionNotes) external onlyOwner {
        Dispute storage dispute = disputes[_disputeId];
        require(!dispute.resolved, "Dispute already resolved");
        require(block.timestamp <= dispute.resolutionDeadline, "Resolution deadline passed");

        dispute.resolved = true;
        dispute.winner = _refundBuyer ? escrows[dispute.escrowId].buyer : escrows[dispute.escrowId].seller;

        // Resolve the escrow
        resolveDispute(dispute.escrowId, _refundBuyer);

        emit FormalDisputeResolved(_disputeId, dispute.winner, _resolutionNotes);
    }

    function cancelEscrow(uint256 _escrowId) external nonReentrant {
        Escrow storage escrow = escrows[_escrowId];
        require(
            msg.sender == escrow.buyer || msg.sender == escrow.seller || msg.sender == owner(),
            "Not authorized to cancel"
        );
        require(escrow.status != EscrowStatus.Completed && escrow.status != EscrowStatus.Disputed, "Cannot cancel");

        if (escrow.status == EscrowStatus.Funded || escrow.status == EscrowStatus.Shipped) {
            // Refund buyer
            IERC20(escrow.token).safeTransfer(escrow.buyer, escrow.amount);
        }

        escrow.status = EscrowStatus.Cancelled;
        emit EscrowCancelled(_escrowId);
    }

    function getEscrow(uint256 _escrowId) external view returns (Escrow memory) {
        return escrows[_escrowId];
    }

    function getListing(uint256 _listingId) external view returns (Listing memory) {
        return listings[_listingId];
    }

    // Oracle integration functions
    function verifyDeliveryWithOracle(uint256 _escrowId, bytes memory _proof) external {
        Escrow storage escrow = escrows[_escrowId];
        require(escrow.status == EscrowStatus.Shipped, "Escrow not shipped");
        require(msg.sender == escrow.buyer, "Only buyer can verify delivery");

        bool verified = deliveryOracle.verifyDelivery(_escrowId, _proof);
        require(verified, "Delivery verification failed");

        escrow.status = EscrowStatus.Delivered;
        escrow.deliveredAt = block.timestamp;
        escrow.deliveryProof = string(_proof);
        escrow.buyerConfirmed = true;
        escrow.disputeDeadline = block.timestamp + disputePeriod;

        emit DeliveryConfirmed(_escrowId, string(_proof));
    }

    function assessQualityWithOracle(uint256 _listingId, bytes memory _qualityData) external onlyOwner {
        require(listings[_listingId].id != 0, "Listing not found");

        uint256 qualityScore = qualityOracle.assessQuality(_listingId, _qualityData);
        listings[_listingId].aiRecommendationScore = qualityScore;

        emit ListingUpdated(_listingId, qualityScore);
    }

    // Pausable functions
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Admin functions
    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high"); // Max 10%
        platformFee = _fee;
    }

    function setFeeCollector(address _collector) external onlyOwner {
        feeCollector = _collector;
    }

    function setDisputePeriod(uint256 _period) external onlyOwner {
        disputePeriod = _period;
    }

    function getActiveListings(uint256 _offset, uint256 _limit) external view returns (Listing[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i < nextListingId; i++) {
            if (listings[i].active) activeCount++;
        }

        Listing[] memory activeListings = new Listing[](_limit > activeCount - _offset ? activeCount - _offset : _limit);
        uint256 index = 0;
        uint256 count = 0;

        for (uint256 i = 1; i < nextListingId && index < activeListings.length; i++) {
            if (listings[i].active) {
                if (count >= _offset) {
                    activeListings[index] = listings[i];
                    index++;
                }
                count++;
            }
        }

        return activeListings;
    }

    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= 500, "Fee too high"); // Max 5%
        platformFee = _fee;
    }

    function setDisputePeriod(uint256 _period) external onlyOwner {
        disputePeriod = _period;
    }
}