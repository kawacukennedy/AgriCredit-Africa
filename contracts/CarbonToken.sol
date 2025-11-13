// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

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

    constructor() ERC20("AgriCredit Carbon Token", "CARBT") Ownable(msg.sender) {
        lastRewardUpdate = block.timestamp;
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
            uint256 totalRewards = (totalStaked * rewardRate * timeElapsed) / (365 days * 10000);
            uint256 userRewards = (stakedBalances[user] * totalRewards) / totalStaked;
            stakingRewards[user] += userRewards;
        }
        lastRewardUpdate = block.timestamp;
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