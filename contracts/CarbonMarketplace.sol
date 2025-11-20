// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

interface ISoulboundCarbonCredit {
    function ownerOf(uint256 tokenId) external view returns (address);
    function carbonAmount(uint256 tokenId) external view returns (uint256);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
}

interface ICarbonToken {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title Carbon Credit Marketplace
 * @dev Decentralized marketplace for trading carbon credits with AI-powered pricing
 */
contract CarbonMarketplace is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    struct Listing {
        uint256 listingId;
        address seller;
        uint256 tokenId; // Soulbound token ID
        uint256 carbonAmount;
        uint256 price; // Price in payment token
        address paymentToken;
        uint256 aiValuation; // AI-determined fair value
        uint256 aiConfidence; // AI confidence score (0-100)
        uint256 expiry;
        bool active;
        ListingType listingType;
    }

    struct Bid {
        uint256 bidId;
        uint256 listingId;
        address bidder;
        uint256 bidAmount;
        uint256 timestamp;
        bool active;
    }

    enum ListingType { FixedPrice, Auction, DutchAuction }

    // State variables
    ISoulboundCarbonCredit public soulboundCredit;
    ICarbonToken public carbonToken;

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Bid[]) public listingBids;
    mapping(address => uint256[]) public userListings;
    mapping(address => uint256[]) public userBids;

    uint256 public nextListingId;
    uint256 public nextBidId;
    uint256 public platformFee; // Fee in basis points
    address public feeRecipient;

    // AI Oracle for carbon credit valuation
    address public aiOracle;

    // Events
    event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 tokenId, uint256 price);
    event ListingUpdated(uint256 indexed listingId, uint256 newPrice);
    event ListingCancelled(uint256 indexed listingId);
    event ListingSold(uint256 indexed listingId, address indexed buyer, uint256 price);
    event BidPlaced(uint256 indexed bidId, uint256 indexed listingId, address indexed bidder, uint256 amount);
    event BidAccepted(uint256 indexed bidId, uint256 indexed listingId);
    event AIBidPlaced(uint256 indexed listingId, uint256 aiPrice, uint256 confidence);

    function initialize(
        address _soulboundCredit,
        address _carbonToken,
        address _aiOracle
    ) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        soulboundCredit = ISoulboundCarbonCredit(_soulboundCredit);
        carbonToken = ICarbonToken(_carbonToken);
        aiOracle = _aiOracle;
        platformFee = 250; // 2.5% platform fee
        feeRecipient = msg.sender;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @dev Creates a new carbon credit listing
     */
    function createListing(
        uint256 tokenId,
        uint256 price,
        address paymentToken,
        ListingType listingType,
        uint256 expiry
    ) external nonReentrant returns (uint256) {
        require(soulboundCredit.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(price > 0, "Price must be greater than 0");
        require(expiry > block.timestamp, "Expiry must be in future");

        uint256 carbonAmount = soulboundCredit.carbonAmount(tokenId);

        nextListingId++;
        uint256 listingId = nextListingId;

        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            tokenId: tokenId,
            carbonAmount: carbonAmount,
            price: price,
            paymentToken: paymentToken,
            aiValuation: 0,
            aiConfidence: 0,
            expiry: expiry,
            active: true,
            listingType: listingType
        });

        userListings[msg.sender].push(listingId);

        // Request AI valuation
        _requestAIValuation(listingId);

        emit ListingCreated(listingId, msg.sender, tokenId, price);
        return listingId;
    }

    /**
     * @dev Purchases a carbon credit listing
     */
    function purchaseListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.expiry > block.timestamp, "Listing expired");
        require(listing.seller != msg.sender, "Cannot buy own listing");

        uint256 fee = (listing.price * platformFee) / 10000;
        uint256 sellerAmount = listing.price - fee;

        // Transfer payment
        IERC20Upgradeable(listing.paymentToken).safeTransferFrom(msg.sender, feeRecipient, fee);
        IERC20Upgradeable(listing.paymentToken).safeTransferFrom(msg.sender, listing.seller, sellerAmount);

        // Transfer carbon credit token
        soulboundCredit.safeTransferFrom(listing.seller, msg.sender, listing.tokenId);

        // Mint equivalent carbon tokens
        carbonToken.mint(msg.sender, listing.carbonAmount);

        listing.active = false;

        emit ListingSold(listingId, msg.sender, listing.price);
    }

    /**
     * @dev Places a bid on a listing
     */
    function placeBid(uint256 listingId, uint256 bidAmount) external nonReentrant returns (uint256) {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.expiry > block.timestamp, "Listing expired");
        require(bidAmount > 0, "Bid amount must be greater than 0");

        nextBidId++;
        uint256 bidId = nextBidId;

        Bid memory newBid = Bid({
            bidId: bidId,
            listingId: listingId,
            bidder: msg.sender,
            bidAmount: bidAmount,
            timestamp: block.timestamp,
            active: true
        });

        listingBids[listingId].push(newBid);
        userBids[msg.sender].push(bidId);

        emit BidPlaced(bidId, listingId, msg.sender, bidAmount);
        return bidId;
    }

    /**
     * @dev Accepts a bid on a listing
     */
    function acceptBid(uint256 bidId) external nonReentrant {
        Bid storage bid = _getBidById(bidId);
        Listing storage listing = listings[bid.listingId];

        require(listing.seller == msg.sender, "Not listing seller");
        require(listing.active, "Listing not active");
        require(bid.active, "Bid not active");

        uint256 fee = (bid.bidAmount * platformFee) / 10000;
        uint256 sellerAmount = bid.bidAmount - fee;

        // Transfer payment
        IERC20Upgradeable(listing.paymentToken).safeTransferFrom(bid.bidder, feeRecipient, fee);
        IERC20Upgradeable(listing.paymentToken).safeTransferFrom(bid.bidder, listing.seller, sellerAmount);

        // Transfer carbon credit token
        soulboundCredit.safeTransferFrom(listing.seller, bid.bidder, listing.tokenId);

        // Mint equivalent carbon tokens
        carbonToken.mint(bid.bidder, listing.carbonAmount);

        listing.active = false;
        bid.active = false;

        emit BidAccepted(bidId, bid.listingId);
    }

    /**
     * @dev AI-powered automatic bidding system
     */
    function placeAIBid(uint256 listingId) external {
        require(msg.sender == aiOracle, "Only AI oracle can place AI bids");

        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");

        // AI determines optimal bid price based on market conditions
        uint256 aiBidPrice = _calculateAIBidPrice(listing);
        uint256 confidence = _calculateAIConfidence(listing);

        // Place AI bid
        nextBidId++;
        uint256 bidId = nextBidId;

        Bid memory aiBid = Bid({
            bidId: bidId,
            listingId: listingId,
            bidder: address(this), // AI system as bidder
            bidAmount: aiBidPrice,
            timestamp: block.timestamp,
            active: true
        });

        listingBids[listingId].push(aiBid);

        // Update AI valuation
        listing.aiValuation = aiBidPrice;
        listing.aiConfidence = confidence;

        emit AIBidPlaced(listingId, aiBidPrice, confidence);
    }

    /**
     * @dev Cancels a listing
     */
    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not listing seller");
        require(listing.active, "Listing not active");

        listing.active = false;
        emit ListingCancelled(listingId);
    }

    /**
     * @dev Updates platform fee
     */
    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high"); // Max 10%
        platformFee = _fee;
    }

    /**
     * @dev Sets AI oracle address
     */
    function setAIOracle(address _aiOracle) external onlyOwner {
        aiOracle = _aiOracle;
    }

    // Internal functions
    function _requestAIValuation(uint256 listingId) internal {
        // In a real implementation, this would call an oracle or AI service
        // For now, we'll simulate AI valuation
        Listing storage listing = listings[listingId];
        listing.aiValuation = listing.price; // Simple placeholder
        listing.aiConfidence = 75; // 75% confidence
    }

    function _calculateAIBidPrice(Listing memory listing) internal pure returns (uint256) {
        // AI algorithm to determine optimal bid price
        // This is a simplified version - real AI would use market data, historical prices, etc.
        uint256 basePrice = listing.price;
        uint256 adjustment = (listing.carbonAmount * 1e18) / 1000; // $0.001 per ton of CO2
        return Math.min(basePrice, adjustment);
    }

    function _calculateAIConfidence(Listing memory listing) internal pure returns (uint256) {
        // Calculate AI confidence based on various factors
        // Simplified version
        return 80; // 80% confidence
    }

    function _getBidById(uint256 bidId) internal view returns (Bid storage) {
        for (uint256 i = 1; i <= nextListingId; i++) {
            Bid[] storage bids = listingBids[i];
            for (uint256 j = 0; j < bids.length; j++) {
                if (bids[j].bidId == bidId) {
                    return bids[j];
                }
            }
        }
        revert("Bid not found");
    }

    // View functions
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    function getListingBids(uint256 listingId) external view returns (Bid[] memory) {
        return listingBids[listingId];
    }

    function getUserListings(address user) external view returns (uint256[] memory) {
        return userListings[user];
    }

    function getUserBids(address user) external view returns (uint256[] memory) {
        return userBids[user];
    }
}