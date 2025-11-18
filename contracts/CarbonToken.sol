// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

// Soulbound Token for Verified Carbon Credits
contract SoulboundCarbonCredit is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    mapping(uint256 => bool) public soulbound; // Soulbound tokens cannot be transferred
    mapping(uint256 => uint256) public carbonAmount; // Carbon amount represented by token

    constructor() ERC721("Soulbound Carbon Credit", "SCC") Ownable(msg.sender) {}

    function safeMint(address to, string memory uri, uint256 _carbonAmount) external onlyOwner returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        soulbound[tokenId] = true;
        carbonAmount[tokenId] = _carbonAmount;
        return tokenId;
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721)
    {
        require(from == address(0) || !soulbound[tokenId], "Soulbound token cannot be transferred");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

contract CarbonToken is ERC20, ERC20Burnable, Ownable, ReentrancyGuard {
    using Math for uint256;

    struct CarbonCredit {
        uint256 id;
        address farmer;
        uint256 amount; // in tons CO2
        uint256 sequestrationDate;
        uint256 verificationDate;
        string methodology; // e.g., "reforestation", "soil_carbon", "agri_practices"
        string location;
        string verificationProof; // IPFS hash
        uint256 aiConfidence; // AI confidence score 0-100
        bool isVerified;
        bool isRetired;
    }

    struct ClimateData {
        uint256 timestamp;
        string dataType; // "satellite", "iot", "weather"
        string location;
        uint256 co2Sequestered;
        uint256 ndviScore;
        string proofHash;
        address submittedBy;
    }

    // Carbon credits tracking
    mapping(uint256 => CarbonCredit) public carbonCredits;
    mapping(address => uint256[]) public farmerCredits;
    uint256 public nextCreditId = 1;

    // Climate AI data
    mapping(uint256 => ClimateData) public climateData;
    uint256 public nextDataId = 1;

    // Staking and rewards
    mapping(address => uint256) public stakedBalances;
    mapping(address => uint256) public stakingRewards;
    mapping(address => uint256) public carbonOffsets; // Track carbon offsets per user
    uint256 public totalStaked;
    uint256 public rewardRate = 500; // 5% APY in basis points
    uint256 public lastRewardUpdate;

    // Soulbound carbon credits
    SoulboundCarbonCredit public soulboundCredit;

    // Dynamic rewards based on market conditions
    struct RewardParams {
        uint256 baseRate;
        uint256 marketMultiplier; // Based on carbon price
        uint256 scarcityBonus; // Based on total supply vs demand
        uint256 lastUpdate;
    }

    RewardParams public rewardParams;

    // Cross-chain bridging
    struct BridgeRequest {
        address user;
        uint256 amount;
        uint256 targetChainId;
        address targetContract;
        uint256 requestTime;
        bool completed;
    }

    mapping(uint256 => BridgeRequest) public bridgeRequests;
    uint256 public nextBridgeId = 1;

    // Oracle for carbon pricing
    address public carbonPriceOracle;

    // Tokenomics parameters
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1B tokens
    uint256 public constant CARBON_PER_TOKEN = 1; // 1 CARBT = 1 ton CO2
    uint256 public constant AI_CONFIDENCE_THRESHOLD = 70; // Minimum AI confidence for auto-minting

    // Events
    event CarbonCreditMinted(uint256 indexed creditId, address indexed farmer, uint256 amount, uint256 aiConfidence);
    event CarbonCreditVerified(uint256 indexed creditId, string verificationProof);
    event CarbonCreditRetired(uint256 indexed creditId, address indexed by);
    event ClimateDataSubmitted(uint256 indexed dataId, string dataType, uint256 co2Sequestered);
    event TokensStaked(address indexed user, uint256 amount);
    event TokensUnstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event CarbonOffsetBurned(address indexed user, uint256 amount);
    event SoulboundCreditMinted(address indexed to, uint256 indexed tokenId, uint256 carbonAmount);
    event RewardParamsUpdated(uint256 baseRate, uint256 marketMultiplier, uint256 scarcityBonus);
    event BridgeInitiated(uint256 indexed bridgeId, address indexed user, uint256 amount, uint256 targetChainId);
    event BridgeCompleted(uint256 indexed bridgeId, address indexed user, uint256 amount);
    event CarbonPriceOracleSet(address indexed oracle);

    constructor() ERC20("AgriCredit Carbon Token", "CARBT") Ownable(msg.sender) {
        lastRewardUpdate = block.timestamp;
        soulboundCredit = new SoulboundCarbonCredit();

        // Initialize reward params
        rewardParams = RewardParams({
            baseRate: 500, // 5%
            marketMultiplier: 100, // 1x
            scarcityBonus: 0,
            lastUpdate: block.timestamp
        });
    }

    // Climate AI Data Submission
    function submitClimateData(
        string memory dataType,
        string memory location,
        uint256 co2Sequestered,
        uint256 ndviScore,
        string memory proofHash
    ) external returns (uint256) {
        uint256 dataId = nextDataId++;

        climateData[dataId] = ClimateData({
            timestamp: block.timestamp,
            dataType: dataType,
            location: location,
            co2Sequestered: co2Sequestered,
            ndviScore: ndviScore,
            proofHash: proofHash,
            submittedBy: msg.sender
        });

        emit ClimateDataSubmitted(dataId, dataType, co2Sequestered);
        return dataId;
    }

    // AI-Powered Carbon Credit Minting
    function mintCarbonCredit(
        address farmer,
        uint256 co2Amount,
        string memory methodology,
        string memory location,
        uint256 aiConfidence,
        string memory aiProof
    ) external onlyOwner returns (uint256) {
        require(co2Amount > 0, "CO2 amount must be > 0");
        require(aiConfidence <= 100, "Invalid AI confidence");
        require(totalSupply() + co2Amount <= MAX_SUPPLY, "Would exceed max supply");

        uint256 creditId = nextCreditId++;

        carbonCredits[creditId] = CarbonCredit({
            id: creditId,
            farmer: farmer,
            amount: co2Amount,
            sequestrationDate: block.timestamp,
            verificationDate: 0,
            methodology: methodology,
            location: location,
            verificationProof: aiProof,
            aiConfidence: aiConfidence,
            isVerified: aiConfidence >= AI_CONFIDENCE_THRESHOLD,
            isRetired: false
        });

        farmerCredits[farmer].push(creditId);

        // Auto-mint tokens if AI confidence is high enough
        if (aiConfidence >= AI_CONFIDENCE_THRESHOLD) {
            _mint(farmer, co2Amount);
            carbonCredits[creditId].verificationDate = block.timestamp;

            // Issue soulbound token
            string memory tokenURI = string(abi.encodePacked(
                "ipfs://", aiProof, "/", Strings.toString(creditId)
            ));
            uint256 soulboundTokenId = soulboundCredit.safeMint(farmer, tokenURI, co2Amount);

            emit SoulboundCreditMinted(farmer, soulboundTokenId, co2Amount);
        }

        emit CarbonCreditMinted(creditId, farmer, co2Amount, aiConfidence);
        return creditId;
    }

    // Manual verification for low-confidence credits
    function verifyCarbonCredit(uint256 creditId, string memory verificationProof) external onlyOwner {
        CarbonCredit storage credit = carbonCredits[creditId];
        require(!credit.isVerified, "Already verified");
        require(!credit.isRetired, "Credit retired");

        credit.isVerified = true;
        credit.verificationDate = block.timestamp;
        credit.verificationProof = verificationProof;

        // Mint tokens upon verification
        _mint(credit.farmer, credit.amount);

        emit CarbonCreditVerified(creditId, verificationProof);
        return creditId;
    }

    // Staking Functions
    function stakeTokens(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        _updateRewards(msg.sender);

        _transfer(msg.sender, address(this), amount);
        stakedBalances[msg.sender] += amount;
        totalStaked += amount;

        emit TokensStaked(msg.sender, amount);
    }

    function unstakeTokens(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(stakedBalances[msg.sender] >= amount, "Insufficient staked balance");

        _updateRewards(msg.sender);

        stakedBalances[msg.sender] -= amount;
        totalStaked -= amount;
        _transfer(address(this), msg.sender, amount);

        emit TokensUnstaked(msg.sender, amount);
    }

    function claimRewards() external nonReentrant {
        _updateRewards(msg.sender);
        uint256 rewards = stakingRewards[msg.sender];
        require(rewards > 0, "No rewards to claim");

        stakingRewards[msg.sender] = 0;
        _mint(msg.sender, rewards);

        emit RewardsClaimed(msg.sender, rewards);
    }

    function _updateRewards(address user) internal {
        uint256 timeElapsed = block.timestamp - lastRewardUpdate;
        if (timeElapsed > 0 && totalStaked > 0) {
            // Dynamic reward calculation
            uint256 effectiveRate = _calculateEffectiveRewardRate();
            uint256 totalRewards = (totalStaked * effectiveRate * timeElapsed) / (365 days * 10000);
            uint256 userRewards = (stakedBalances[user] * totalRewards) / totalStaked;
            stakingRewards[user] += userRewards;
        }
        lastRewardUpdate = block.timestamp;
    }

    function _calculateEffectiveRewardRate() internal view returns (uint256) {
        uint256 baseRate = rewardParams.baseRate;

        // Market multiplier based on carbon price
        uint256 marketMultiplier = rewardParams.marketMultiplier;
        if (carbonPriceOracle != address(0)) {
            // In production, query oracle for carbon price
            // For now, use base multiplier
        }

        // Scarcity bonus based on utilization
        uint256 scarcityBonus = 0;
        uint256 utilization = (totalSupply() * 10000) / MAX_SUPPLY;
        if (utilization > 8000) { // > 80% supply used
            scarcityBonus = (utilization - 8000) * 10; // Bonus increases with scarcity
        }

        return baseRate + (baseRate * marketMultiplier / 100) + scarcityBonus;
    }

    function updateRewardParams() external onlyOwner {
        // Update market multiplier based on external data
        // In production, this would query oracles or external APIs

        rewardParams.marketMultiplier = 100 + (block.timestamp % 50); // Simplified
        rewardParams.scarcityBonus = _calculateScarcityBonus();
        rewardParams.lastUpdate = block.timestamp;

        emit RewardParamsUpdated(rewardParams.baseRate, rewardParams.marketMultiplier, rewardParams.scarcityBonus);
    }

    function _calculateScarcityBonus() internal view returns (uint256) {
        uint256 utilization = (totalSupply() * 10000) / MAX_SUPPLY;
        if (utilization > 9000) return 200; // 2% bonus when > 90% utilized
        if (utilization > 8000) return 100; // 1% bonus when > 80% utilized
        return 0;
    }

    // Enhanced burning with retirement tracking
    function retireCarbonCredits(uint256 creditId) external {
        CarbonCredit storage credit = carbonCredits[creditId];
        require(credit.farmer == msg.sender, "Not the owner");
        require(credit.isVerified, "Credit not verified");
        require(!credit.isRetired, "Already retired");
        require(balanceOf(msg.sender) >= credit.amount, "Insufficient token balance");

        credit.isRetired = true;
        _burn(msg.sender, credit.amount);

        emit CarbonCreditRetired(creditId, msg.sender);
    }

    /**
     * @dev Burn CARBT tokens (for retirement or trading)
     * @param amount Amount to burn
     */
    function burnCarbonTokens(uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient CARBT balance");

        _burn(msg.sender, amount);
        carbonOffsets[msg.sender] += amount;

        emit CarbonOffsetBurned(msg.sender, amount);
    }

    // Getter functions
    function getFarmerCredits(address farmer) external view returns (uint256[] memory) {
        return farmerCredits[farmer];
    }

    function getCreditDetails(uint256 creditId) external view returns (CarbonCredit memory) {
        return carbonCredits[creditId];
    }

    function getClimateData(uint256 dataId) external view returns (ClimateData memory) {
        return climateData[dataId];
    }

    function getStakingInfo(address user) external view returns (uint256 staked, uint256 rewards) {
        uint256 pendingRewards = stakingRewards[user];
        // Calculate additional rewards since last update
        uint256 timeElapsed = block.timestamp - lastRewardUpdate;
        if (timeElapsed > 0 && totalStaked > 0) {
            uint256 totalRewards = (totalStaked * rewardRate * timeElapsed) / (365 days * 10000);
            uint256 userRewards = (stakedBalances[user] * totalRewards) / totalStaked;
            pendingRewards += userRewards;
        }
        return (stakedBalances[user], pendingRewards);
    }

    function getTotalCarbonSequestered() external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 1; i < nextCreditId; i++) {
            if (carbonCredits[i].isVerified) {
                total += carbonCredits[i].amount;
            }
        }
        return total;
    }

    // ============ CROSS-CHAIN BRIDGING ============

    function initiateBridge(
        uint256 amount,
        uint256 targetChainId,
        address targetContract
    ) external returns (uint256) {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        require(amount > 0, "Amount must be > 0");

        // Lock tokens
        _transfer(msg.sender, address(this), amount);

        uint256 bridgeId = nextBridgeId++;
        bridgeRequests[bridgeId] = BridgeRequest({
            user: msg.sender,
            amount: amount,
            targetChainId: targetChainId,
            targetContract: targetContract,
            requestTime: block.timestamp,
            completed: false
        });

        emit BridgeInitiated(bridgeId, msg.sender, amount, targetChainId);

        return bridgeId;
    }

    function completeBridge(
        uint256 bridgeId,
        bytes memory proof
    ) external onlyOwner {
        BridgeRequest storage request = bridgeRequests[bridgeId];
        require(!request.completed, "Bridge already completed");

        // In production, verify proof from bridge oracle
        // For now, assume valid proof

        request.completed = true;

        // Mint equivalent tokens on this chain (simulating cross-chain mint)
        _mint(request.user, request.amount);

        emit BridgeCompleted(bridgeId, request.user, request.amount);
    }

    function setCarbonPriceOracle(address _oracle) external onlyOwner {
        carbonPriceOracle = _oracle;
        emit CarbonPriceOracleSet(_oracle);
    }

    // ============ SOULBOUND CREDIT FUNCTIONS ============

    function getSoulboundCredits(address owner) external view returns (uint256[] memory) {
        uint256 balance = soulboundCredit.balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](balance);

        for (uint256 i = 0; i < balance; i++) {
            tokenIds[i] = soulboundCredit.tokenOfOwnerByIndex(owner, i);
        }

        return tokenIds;
    }

    function getSoulboundCreditCarbon(uint256 tokenId) external view returns (uint256) {
        return soulboundCredit.carbonAmount(tokenId);
    }

    /**
     * @dev Override decimals to match carbon measurement precision
     */
    function decimals() public pure override returns (uint8) {
        return 18; // Standard ERC20 decimals for fractional tons
    }

    // Admin functions
    function setRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= 2000, "Rate too high"); // Max 20%
        _updateRewards(address(0)); // Update all rewards before changing rate
        rewardRate = newRate;
    }
}