// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./IdentityRegistry.sol";

// Fractional ownership token for farm NFTs
contract FarmShareToken is Initializable, IERC20 {
    using SafeERC20 for IERC20;

    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    address public farmNFT;
    uint256 public nftId;

    function initialize(string memory _name, string memory _symbol, address _farmNFT, uint256 _nftId) public initializer {
        name = _name;
        symbol = _symbol;
        farmNFT = _farmNFT;
        nftId = _nftId;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        emit Transfer(from, to, amount);
        return true;
    }

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract NFTFarming is Initializable, ERC721Upgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    using Counters for Counters.Counter;

    struct FarmNFT {
        uint256 id;
        address farmer;
        string farmName;
        string location; // Geo coordinates or description
        uint256 size; // in hectares
        string cropType;
        uint256 expectedYield; // in tons
        uint256 plantingDate;
        uint256 harvestDate;
        string metadataURI; // IPFS hash with farm details
        bool isActive;
        uint256 qualityScore; // AI-determined quality score
        string supplyChainData; // JSON string with supply chain tracking
        uint256[] batchIds; // Associated marketplace batches
    }

    struct SupplyChainEvent {
        uint256 timestamp;
        string eventType; // planting, fertilizing, harvesting, processing, shipping
        string location;
        string description;
        string proof; // IPFS hash of evidence (photos, sensor data)
        address recordedBy;
    }

    CountersUpgradeable.Counter private _tokenIdCounter;
    mapping(uint256 => FarmNFT) public farmNFTs;
    mapping(address => uint256[]) public farmerNFTs;
    mapping(uint256 => SupplyChainEvent[]) public supplyChainHistory;
    mapping(uint256 => uint256) public nftBatchCount;

    // Fractional ownership
    mapping(uint256 => FarmShareToken) public fractionalTokens;
    mapping(uint256 => bool) public isFractionalized;
    mapping(uint256 => uint256) public fractionalSupply; // Total fractional shares

    // Enhanced Staking and rewards
    struct StakeInfo {
        uint256 stakeTime;
        uint256 lastRewardClaim;
        uint256 accumulatedRewards;
        bool isActive;
    }

    // Cross-chain NFT farming
    struct CrossChainFarm {
        uint256 sourceChainId;
        uint256 sourceTokenId;
        address sourceContract;
        uint256 bridgedTokenId;
        bool isBridged;
        uint256 bridgeTimestamp;
    }

    struct YieldPrediction {
        uint256 predictedYield;
        uint256 confidence;
        uint256 predictionTime;
        string modelVersion;
        bytes32 predictionHash;
    }

    mapping(uint256 => StakeInfo) public nftStakes;
    mapping(uint256 => CrossChainFarm) public crossChainFarms;
    mapping(uint256 => YieldPrediction) public yieldPredictions;

    // Cross-chain bridge interface
    interface ICrossChainBridge {
        function bridgeNFT(uint256 tokenId, uint256 targetChainId, address targetContract) external;
        function receiveBridgedNFT(bytes calldata nftData) external;
    }

    ICrossChainBridge public crossChainBridge;

    // Enhanced reward system
    uint256 public stakingRewardRate = 500; // 5% APY
    uint256 public fractionalRewardBonus = 200; // 2% bonus for fractional holders
    address public rewardToken;

    // AI Oracle for yield predictions
    address public yieldOracle;

    mapping(uint256 => mapping(address => StakeInfo)) public nftStakeInfo; // NFT ID => staker => stake info
    mapping(uint256 => uint256) public totalNftStakes;
    mapping(address => uint256[]) public stakerNFTs;
    mapping(address => uint256) public stakingRewards;

    uint256 public baseStakingRewardRate = 500; // 5% APY in basis points
    uint256 public qualityBonusMultiplier = 200; // 2x bonus for quality score > 80
    uint256 public longTermBonusRate = 100; // Additional 1% per month staked
    uint256 public maxLongTermBonus = 500; // Max 5% additional bonus
    uint256 public lastRewardUpdate;

    // Bridge validator security
    mapping(address => bool) public bridgeValidators;
    mapping(uint256 => address[]) public nftValidators; // NFT ID => approved validators
    uint256 public minValidatorApprovals = 2; // Minimum validator approvals for cross-chain transfers

    IdentityRegistry public identityRegistry;
    IERC20 public rewardToken;

    // Events
    event FarmNFTMinted(uint256 indexed tokenId, address indexed farmer, string farmName);
    event FarmNFTHarvested(uint256 indexed tokenId, uint256 actualYield);
    event FarmNFTTransferred(uint256 indexed tokenId, address indexed from, address indexed to);
    event SupplyChainEventRecorded(uint256 indexed tokenId, string eventType, string location);
    event QualityScoreUpdated(uint256 indexed tokenId, uint256 score);
    event BatchAssociated(uint256 indexed tokenId, uint256 batchId);

    function initialize(
        address _identityRegistry,
        address _rewardToken,
        address _yieldOracle,
        address _crossChainBridge
    ) public initializer {
        __ERC721_init("AgriCredit Farm NFT", "FARM");
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        identityRegistry = IdentityRegistry(_identityRegistry);
        rewardToken = IERC20(_rewardToken);
        yieldOracle = _yieldOracle;
        crossChainBridge = ICrossChainBridge(_crossChainBridge);
        lastRewardUpdate = block.timestamp;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @dev Mint a new Farm NFT representing future yield
     * @param farmer Farmer address
     * @param farmName Name of the farm
     * @param location Geographic location
     * @param size Farm size in hectares
     * @param cropType Type of crop
     * @param expectedYield Expected yield in tons
     * @param metadataURI IPFS URI with farm details
     */
    function mintFarmNFT(
        address farmer,
        string memory farmName,
        string memory location,
        uint256 size,
        string memory cropType,
        uint256 expectedYield,
        string memory metadataURI,
        string memory initialSupplyChainData
    ) external returns (uint256) {
        require(identityRegistry.isIdentityVerified(farmer), "Farmer not verified");
        require(msg.sender == farmer || msg.sender == owner(), "Not authorized");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        uint256[] memory emptyBatches;

        farmNFTs[tokenId] = FarmNFT({
            id: tokenId,
            farmer: farmer,
            farmName: farmName,
            location: location,
            size: size,
            cropType: cropType,
            expectedYield: expectedYield,
            plantingDate: block.timestamp,
            harvestDate: 0,
            metadataURI: metadataURI,
            isActive: true,
            qualityScore: 0, // To be updated by AI
            supplyChainData: initialSupplyChainData,
            batchIds: emptyBatches
        });

        farmerNFTs[farmer].push(tokenId);
        _mint(farmer, tokenId);

        // Record initial planting event
        _recordSupplyChainEvent(tokenId, "planting", location, "Crop planting initiated", "");

        emit FarmNFTMinted(tokenId, farmer, farmName);
        return tokenId;
    }

    function recordSupplyChainEvent(
        uint256 tokenId,
        string memory eventType,
        string memory location,
        string memory description,
        string memory proof
    ) external {
        require(ownerOf(tokenId) == msg.sender || msg.sender == owner(), "Not authorized");
        require(farmNFTs[tokenId].isActive, "Farm NFT not active");

        _recordSupplyChainEvent(tokenId, eventType, location, description, proof);
    }

    function _recordSupplyChainEvent(
        uint256 tokenId,
        string memory eventType,
        string memory location,
        string memory description,
        string memory proof
    ) internal {
        SupplyChainEvent memory eventData = SupplyChainEvent({
            timestamp: block.timestamp,
            eventType: eventType,
            location: location,
            description: description,
            proof: proof,
            recordedBy: msg.sender
        });

        supplyChainHistory[tokenId].push(eventData);

        emit SupplyChainEventRecorded(tokenId, eventType, location);
    }

    /**
     * @dev Record harvest data for a farm NFT
     * @param tokenId Token ID
     * @param actualYield Actual harvested yield
     */
    function recordHarvest(uint256 tokenId, uint256 actualYield, string memory harvestProof) external {
        require(ownerOf(tokenId) == msg.sender || msg.sender == owner(), "Not authorized");
        require(farmNFTs[tokenId].isActive, "Farm NFT not active");

        FarmNFT storage farm = farmNFTs[tokenId];
        farm.harvestDate = block.timestamp;
        farm.expectedYield = actualYield; // Update with actual yield
        farm.isActive = false; // Mark as harvested

        // Record harvest event
        _recordSupplyChainEvent(tokenId, "harvesting", farm.location, "Crop harvested", harvestProof);

        emit FarmNFTHarvested(tokenId, actualYield);
    }

    function updateQualityScore(uint256 tokenId, uint256 score) external onlyOwner {
        require(_exists(tokenId), "Farm NFT does not exist");
        require(score <= 100, "Score must be 0-100");

        farmNFTs[tokenId].qualityScore = score;

        emit QualityScoreUpdated(tokenId, score);
    }

    function associateBatch(uint256 tokenId, uint256 batchId) external {
        require(ownerOf(tokenId) == msg.sender || msg.sender == owner(), "Not authorized");

        FarmNFT storage farm = farmNFTs[tokenId];
        farm.batchIds.push(batchId);
        nftBatchCount[tokenId]++;

        emit BatchAssociated(tokenId, batchId);
    }

    /**
     * @dev Transfer farm NFT (overrides ERC721 transfer)
     */
    function transferFrom(address from, address to, uint256 tokenId) public override {
        super.transferFrom(from, to, tokenId);

        // Update farmer NFT lists
        _removeFromFarmerList(from, tokenId);
        farmerNFTs[to].push(tokenId);

        // Update farm ownership
        farmNFTs[tokenId].farmer = to;

        emit FarmNFTTransferred(tokenId, from, to);
    }

    /**
     * @dev Get farm NFT details
     * @param tokenId Token ID
     */
    function getFarmNFT(uint256 tokenId) external view returns (FarmNFT memory) {
        require(_exists(tokenId), "Farm NFT does not exist");
        return farmNFTs[tokenId];
    }

    /**
     * @dev Get all NFTs owned by a farmer
     * @param farmer Farmer address
     */
    function getFarmerNFTs(address farmer) external view returns (uint256[] memory) {
        return farmerNFTs[farmer];
    }

    function getSupplyChainHistory(uint256 tokenId) external view returns (SupplyChainEvent[] memory) {
        return supplyChainHistory[tokenId];
    }

    function getNFTBatches(uint256 tokenId) external view returns (uint256[] memory) {
        return farmNFTs[tokenId].batchIds;
    }

    function getNFTBatchCount(uint256 tokenId) external view returns (uint256) {
        return nftBatchCount[tokenId];
    }

    /**
     * @dev Get token URI for metadata
     * @param tokenId Token ID
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Farm NFT does not exist");
        return farmNFTs[tokenId].metadataURI;
    }

    /**
     * @dev Internal function to remove token from farmer's list
     */
    function _removeFromFarmerList(address farmer, uint256 tokenId) internal {
        uint256[] storage farmerTokens = farmerNFTs[farmer];
        for (uint256 i = 0; i < farmerTokens.length; i++) {
            if (farmerTokens[i] == tokenId) {
                farmerTokens[i] = farmerTokens[farmerTokens.length - 1];
                farmerTokens.pop();
                break;
            }
        }
    }

    /**
     * @dev Get total supply of farm NFTs
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    // ============ FRACTIONAL OWNERSHIP FUNCTIONS ============

    function fractionalizeNFT(uint256 tokenId, uint256 totalShares, string memory shareName, string memory shareSymbol) external {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(!isFractionalized[tokenId], "Already fractionalized");
        require(totalShares > 0, "Total shares must be > 0");

        // Create fractional token contract
        FarmShareToken shareToken = new FarmShareToken(shareName, shareSymbol, address(this), tokenId);
        fractionalTokens[tokenId] = shareToken;
        fractionalSupply[tokenId] = totalShares;
        isFractionalized[tokenId] = true;

        // Mint all shares to the owner
        shareToken.balanceOf[msg.sender] = totalShares;
        shareToken.totalSupply = totalShares;

        emit NFTFractionalized(tokenId, address(shareToken), totalShares);
    }

    function getFractionalToken(uint256 tokenId) external view returns (address) {
        require(isFractionalized[tokenId], "NFT not fractionalized");
        return address(fractionalTokens[tokenId]);
    }

    // ============ STAKING AND REWARDS FUNCTIONS ============

    function stakeNFT(uint256 tokenId) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(farmNFTs[tokenId].isActive, "Farm NFT not active");
        require(!nftStakeInfo[tokenId][msg.sender].isActive, "Already staked");

        nftStakeInfo[tokenId][msg.sender] = StakeInfo({
            stakeTime: block.timestamp,
            lastRewardClaim: block.timestamp,
            accumulatedRewards: 0,
            isActive: true
        });

        totalNftStakes[tokenId]++;
        stakerNFTs[msg.sender].push(tokenId);

        _updateStakingRewards(msg.sender);

        emit NFTStaked(tokenId, msg.sender, block.timestamp);
    }

    function unstakeNFT(uint256 tokenId) external nonReentrant {
        require(nftStakeInfo[tokenId][msg.sender].isActive, "Not staked");

        StakeInfo storage stake = nftStakeInfo[tokenId][msg.sender];
        uint256 stakeDuration = block.timestamp - stake.stakeTime;

        stake.isActive = false;
        totalNftStakes[tokenId]--;

        // Remove from staker's list
        uint256[] storage stakerTokens = stakerNFTs[msg.sender];
        for (uint256 i = 0; i < stakerTokens.length; i++) {
            if (stakerTokens[i] == tokenId) {
                stakerTokens[i] = stakerTokens[stakerTokens.length - 1];
                stakerTokens.pop();
                break;
            }
        }

        _updateStakingRewards(msg.sender);

        emit NFTUnstaked(tokenId, msg.sender, stakeDuration);
    }

    function claimStakingRewards() external nonReentrant {
        _updateStakingRewards(msg.sender);
        uint256 rewards = stakingRewards[msg.sender];
        require(rewards > 0, "No rewards to claim");

        stakingRewards[msg.sender] = 0;
        require(rewardToken.transfer(msg.sender, rewards), "Reward transfer failed");

        emit RewardsClaimed(msg.sender, rewards);
    }

    function _updateStakingRewards(address staker) internal {
        uint256 timeElapsed = block.timestamp - lastRewardUpdate;
        if (timeElapsed > 0) {
            uint256[] memory stakedTokens = stakerNFTs[staker];
            uint256 totalRewards = 0;

            for (uint256 i = 0; i < stakedTokens.length; i++) {
                uint256 tokenId = stakedTokens[i];
                StakeInfo storage stake = nftStakeInfo[tokenId][staker];

                if (stake.isActive) {
                    uint256 stakeDuration = block.timestamp - stake.stakeTime;
                    uint256 baseRewards = _calculateBaseRewards(tokenId, timeElapsed);

                    // Apply quality bonus
                    uint256 qualityBonus = _calculateQualityBonus(tokenId);

                    // Apply long-term staking bonus
                    uint256 longTermBonus = _calculateLongTermBonus(stakeDuration);

                    uint256 totalTokenRewards = baseRewards * (10000 + qualityBonus + longTermBonus) / 10000;
                    totalRewards += totalTokenRewards;

                    stake.accumulatedRewards += totalTokenRewards;
                }
            }

            if (totalRewards > 0) {
                stakingRewards[staker] += totalRewards;
            }
        }
        lastRewardUpdate = block.timestamp;
    }

    function _calculateBaseRewards(uint256 tokenId, uint256 timeElapsed) internal view returns (uint256) {
        // Base rewards scaled by NFT value (expected yield as proxy)
        uint256 nftValue = farmNFTs[tokenId].expectedYield;
        return (nftValue * baseStakingRewardRate * timeElapsed) / (365 days * 10000);
    }

    function _calculateQualityBonus(uint256 tokenId) internal view returns (uint256) {
        uint256 qualityScore = farmNFTs[tokenId].qualityScore;
        if (qualityScore >= 80) {
            return qualityBonusMultiplier; // 2x bonus
        } else if (qualityScore >= 60) {
            return qualityBonusMultiplier / 2; // 1x bonus
        }
        return 0;
    }

    function _calculateLongTermBonus(uint256 stakeDuration) internal view returns (uint256) {
        uint256 monthsStaked = stakeDuration / 30 days;
        uint256 bonus = monthsStaked * longTermBonusRate;
        return bonus > maxLongTermBonus ? maxLongTermBonus : bonus;
    }

    function getStakingInfo(address staker) external view returns (uint256 stakedCount, uint256 pendingRewards, uint256 totalAccumulated) {
        uint256[] memory stakedTokens = stakerNFTs[staker];
        stakedCount = stakedTokens.length;
        totalAccumulated = 0;

        // Calculate pending rewards
        uint256 timeElapsed = block.timestamp - lastRewardUpdate;
        uint256 newRewards = 0;

        for (uint256 i = 0; i < stakedTokens.length; i++) {
            uint256 tokenId = stakedTokens[i];
            StakeInfo memory stake = nftStakeInfo[tokenId][staker];

            if (stake.isActive) {
                totalAccumulated += stake.accumulatedRewards;

                if (timeElapsed > 0) {
                    uint256 stakeDuration = block.timestamp - stake.stakeTime;
                    uint256 baseRewards = _calculateBaseRewards(tokenId, timeElapsed);
                    uint256 qualityBonus = _calculateQualityBonus(tokenId);
                    uint256 longTermBonus = _calculateLongTermBonus(stakeDuration);
                    newRewards += baseRewards * (10000 + qualityBonus + longTermBonus) / 10000;
                }
            }
        }

        pendingRewards = stakingRewards[staker] + newRewards;
        return (stakedCount, pendingRewards, totalAccumulated);
    }

    // ============ BRIDGE VALIDATOR FUNCTIONS ============

    function addBridgeValidator(address validator) external onlyOwner {
        require(validator != address(0), "Invalid validator address");
        require(!bridgeValidators[validator], "Already a validator");

        bridgeValidators[validator] = true;
        emit BridgeValidatorAdded(validator);
    }

    function removeBridgeValidator(address validator) external onlyOwner {
        require(bridgeValidators[validator], "Not a validator");

        bridgeValidators[validator] = false;
        emit BridgeValidatorRemoved(validator);
    }

    function initiateCrossChainTransfer(uint256 tokenId, address to, string memory destinationChain) external {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(bytes(destinationChain).length > 0, "Invalid destination chain");

        // Reset validator approvals for this transfer
        delete nftValidators[tokenId];

        emit CrossChainTransferInitiated(tokenId, msg.sender, to, destinationChain);
    }

    function approveCrossChainTransfer(uint256 tokenId, address recipient) external {
        require(bridgeValidators[msg.sender], "Not a bridge validator");
        require(ownerOf(tokenId) != address(0), "NFT does not exist");

        // Check if validator already approved
        address[] storage validators = nftValidators[tokenId];
        for (uint256 i = 0; i < validators.length; i++) {
            require(validators[i] != msg.sender, "Already approved by this validator");
        }

        validators.push(msg.sender);

        emit CrossChainTransferApproved(tokenId, msg.sender);

        // If minimum approvals reached, execute transfer
        if (validators.length >= minValidatorApprovals) {
            _executeCrossChainTransfer(tokenId, recipient);
        }
    }

    function _executeCrossChainTransfer(uint256 tokenId, address recipient) internal {
        address currentOwner = ownerOf(tokenId);

        // Transfer NFT to recipient
        _transfer(currentOwner, recipient, tokenId);

        // Update farmer NFT lists
        _removeFromFarmerList(currentOwner, tokenId);
        farmerNFTs[recipient].push(tokenId);
        farmNFTs[tokenId].farmer = recipient;

        // Clear validator approvals
        delete nftValidators[tokenId];

        emit FarmNFTTransferred(tokenId, currentOwner, recipient);
    }

    function getCrossChainValidators(uint256 tokenId) external view returns (address[] memory) {
        return nftValidators[tokenId];
    }

    function isBridgeValidator(address validator) external view returns (bool) {
        return bridgeValidators[validator];
    }

    // ============ ADMIN FUNCTIONS ============

    function updateStakingParameters(
        uint256 _baseRewardRate,
        uint256 _qualityBonus,
        uint256 _longTermBonus,
        uint256 _maxLongTermBonus
    ) external onlyOwner {
        baseStakingRewardRate = _baseRewardRate;
        qualityBonusMultiplier = _qualityBonus;
        longTermBonusRate = _longTermBonus;
        maxLongTermBonus = _maxLongTermBonus;
    }

    function updateBridgeParameters(uint256 _minValidatorApprovals) external onlyOwner {
        minValidatorApprovals = _minValidatorApprovals;
    }

    function emergencyUnstake(uint256 tokenId, address staker) external onlyOwner {
        require(nftStakeInfo[tokenId][staker].isActive, "Not staked");

        StakeInfo storage stake = nftStakeInfo[tokenId][staker];
        stake.isActive = false;
        totalNftStakes[tokenId]--;

        // Remove from staker's list
        uint256[] storage stakerTokens = stakerNFTs[staker];
        for (uint256 i = 0; i < stakerTokens.length; i++) {
            if (stakerTokens[i] == tokenId) {
                stakerTokens[i] = stakerTokens[stakerTokens.length - 1];
                stakerTokens.pop();
                break;
            }
        }

        emit NFTUnstaked(tokenId, staker, block.timestamp - stake.stakeTime);
    }

    // ============ ADDITIONAL EVENTS ============

    event NFTFractionalized(uint256 indexed tokenId, address indexed shareToken, uint256 totalShares);
    event NFTStaked(uint256 indexed tokenId, address indexed staker, uint256 stakeTime);
    event NFTUnstaked(uint256 indexed tokenId, address indexed staker, uint256 stakeDuration);
    event RewardsClaimed(address indexed staker, uint256 amount);
    event QualityScoreUpdated(uint256 indexed tokenId, uint256 score);
    event BatchAssociated(uint256 indexed tokenId, uint256 batchId);
    event BridgeValidatorAdded(address indexed validator);
    event BridgeValidatorRemoved(address indexed validator);
    event CrossChainTransferInitiated(uint256 indexed tokenId, address indexed from, address indexed to, string destinationChain);
    event CrossChainTransferApproved(uint256 indexed tokenId, address indexed validator);

    // ============ CROSS-CHAIN NFT FARMING FUNCTIONS ============

    function bridgeNFT(uint256 tokenId, uint256 targetChainId, address targetContract) external {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        require(address(crossChainBridge) != address(0), "Bridge not set");

        // Mark as bridged
        crossChainFarms[tokenId] = CrossChainFarm({
            sourceChainId: block.chainid,
            sourceTokenId: tokenId,
            sourceContract: address(this),
            bridgedTokenId: 0, // Will be set when received
            isBridged: true,
            bridgeTimestamp: block.timestamp
        });

        // Call bridge
        crossChainBridge.bridgeNFT(tokenId, targetChainId, targetContract);

        emit NFTBridged(tokenId, targetChainId, targetContract);
    }

    function receiveBridgedNFT(bytes calldata nftData) external {
        require(msg.sender == address(crossChainBridge), "Only bridge can call");

        (
            uint256 sourceChainId,
            uint256 sourceTokenId,
            address sourceContract,
            address owner,
            FarmNFT memory farmData
        ) = abi.decode(nftData, (uint256, uint256, address, address, FarmNFT));

        // Mint bridged NFT
        uint256 newTokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        farmNFTs[newTokenId] = farmData;
        farmerNFTs[owner].push(newTokenId);

        _safeMint(owner, newTokenId);

        // Record cross-chain info
        crossChainFarms[newTokenId] = CrossChainFarm({
            sourceChainId: sourceChainId,
            sourceTokenId: sourceTokenId,
            sourceContract: sourceContract,
            bridgedTokenId: newTokenId,
            isBridged: true,
            bridgeTimestamp: block.timestamp
        });

        emit BridgedNFTReceived(newTokenId, sourceChainId, owner);
    }

    // ============ AI YIELD PREDICTION FUNCTIONS ============

    function updateYieldPrediction(uint256 tokenId, uint256 predictedYield, uint256 confidence, string memory modelVersion) external {
        require(msg.sender == yieldOracle || msg.sender == owner(), "Not authorized");
        require(_exists(tokenId), "NFT does not exist");

        bytes32 predictionHash = keccak256(abi.encodePacked(tokenId, predictedYield, confidence, modelVersion, block.timestamp));

        yieldPredictions[tokenId] = YieldPrediction({
            predictedYield: predictedYield,
            confidence: confidence,
            predictionTime: block.timestamp,
            modelVersion: modelVersion,
            predictionHash: predictionHash
        });

        emit YieldPredicted(tokenId, predictedYield, confidence, modelVersion);
    }

    function getYieldPrediction(uint256 tokenId) external view returns (YieldPrediction memory) {
        return yieldPredictions[tokenId];
    }

    function validateYieldPrediction(uint256 tokenId, uint256 actualYield) external onlyOwner {
        YieldPrediction memory prediction = yieldPredictions[tokenId];
        require(prediction.predictionTime > 0, "No prediction available");

        uint256 accuracy = actualYield >= prediction.predictedYield ?
            (prediction.predictedYield * 100) / actualYield :
            (actualYield * 100) / prediction.predictedYield;

        emit YieldPredictionValidated(tokenId, actualYield, accuracy);
    }

    // ============ ENHANCED REWARD SYSTEM ============

    function distributeFractionalRewards(uint256 tokenId) external onlyOwner {
        require(isFractionalized[tokenId], "NFT not fractionalized");

        FarmShareToken shareToken = fractionalTokens[tokenId];
        uint256 totalShares = fractionalSupply[tokenId];

        // Calculate rewards based on NFT performance
        uint256 totalRewards = _calculateNFTRewards(tokenId);

        if (totalRewards > 0) {
            // Distribute proportionally to fractional holders
            // This is simplified - in practice, would track holder balances
            uint256 rewardPerShare = totalRewards / totalShares;

            emit FractionalRewardsDistributed(tokenId, totalRewards, rewardPerShare);
        }
    }

    function _calculateNFTRewards(uint256 tokenId) internal view returns (uint256) {
        FarmNFT memory farm = farmNFTs[tokenId];
        uint256 baseRewards = (farm.expectedYield * stakingRewardRate * 1 days) / (365 * 10000);

        // Quality bonus
        uint256 qualityMultiplier = 10000 + (farm.qualityScore * 50); // 0.5% per quality point
        baseRewards = (baseRewards * qualityMultiplier) / 10000;

        // Fractional bonus
        if (isFractionalized[tokenId]) {
            baseRewards = (baseRewards * (10000 + fractionalRewardBonus)) / 10000;
        }

        return baseRewards;
    }

    // ============ ADMIN FUNCTIONS ============

    function setCrossChainBridge(address _bridge) external onlyOwner {
        crossChainBridge = ICrossChainBridge(_bridge);
        emit CrossChainBridgeSet(_bridge);
    }

    function setYieldOracle(address _oracle) external onlyOwner {
        yieldOracle = _oracle;
        emit YieldOracleSet(_oracle);
    }

    function setRewardToken(address _token) external onlyOwner {
        rewardToken = IERC20(_token);
        emit RewardTokenSet(_token);
    }

    function updateRewardRates(uint256 _stakingRate, uint256 _fractionalBonus) external onlyOwner {
        stakingRewardRate = _stakingRate;
        fractionalRewardBonus = _fractionalBonus;
        emit RewardRatesUpdated(_stakingRate, _fractionalBonus);
    }

    // ============ ADDITIONAL EVENTS ============

    event NFTBridged(uint256 indexed tokenId, uint256 indexed targetChainId, address indexed targetContract);
    event BridgedNFTReceived(uint256 indexed newTokenId, uint256 indexed sourceChainId, address indexed owner);
    event YieldPredicted(uint256 indexed tokenId, uint256 predictedYield, uint256 confidence, string modelVersion);
    event YieldPredictionValidated(uint256 indexed tokenId, uint256 actualYield, uint256 accuracy);
    event FractionalRewardsDistributed(uint256 indexed tokenId, uint256 totalRewards, uint256 rewardPerShare);
    event CrossChainBridgeSet(address indexed bridge);
    event YieldOracleSet(address indexed oracle);
    event RewardTokenSet(address indexed token);
    event RewardRatesUpdated(uint256 stakingRate, uint256 fractionalBonus);
}