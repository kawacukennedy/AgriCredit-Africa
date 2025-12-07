// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./DecentralizedOracle.sol";

contract StakingRewards is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    struct StakeInfo {
        uint256 amount;
        uint256 stakedAt;
        uint256 lastClaimTime;
        uint256 accumulatedRewards;
        uint256 lockPeriod;
        bool autoCompound;
    }

    struct RewardTier {
        uint256 minStake;
        uint256 maxStake;
        uint256 baseAPY; // Basis points
        uint256 bonusAPY; // Additional APY for long-term staking
    }

    // Staking token (AGC)
    IERC20 public stakingToken;

    // Reward token (can be same as staking token or different)
    IERC20 public rewardToken;

    // Oracle for dynamic reward adjustments
    DecentralizedOracle public oracle;

    // Staking data
    mapping(address => StakeInfo) public stakes;
    mapping(address => uint256) public pendingRewards;

    // Reward tiers
    RewardTier[] public rewardTiers;

    // Global staking stats
    uint256 public totalStaked;
    uint256 public totalRewardsDistributed;
    uint256 public rewardRate; // Rewards per second
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    // User reward tracking
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    // Staking parameters
    uint256 public minStakeAmount;
    uint256 public maxStakeAmount;
    uint256 public lockPeriodBonus; // Additional APY for locking longer
    uint256 public unstakeFee; // Fee for early unstaking (basis points)

    // AI-enhanced features
    struct AIPrediction {
        uint256 predictedAPY;
        uint256 confidenceScore;
        uint256 timestamp;
    }

    mapping(address => AIPrediction) public aiPredictions;

    // Events
    event Staked(address indexed user, uint256 amount, uint256 lockPeriod);
    event Unstaked(address indexed user, uint256 amount, uint256 rewards);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    event AIPredictionUpdated(address indexed user, uint256 predictedAPY, uint256 confidence);

    function initialize(
        address _stakingToken,
        address _rewardToken,
        address _oracle,
        uint256 _rewardRate,
        uint256 _minStakeAmount,
        uint256 _maxStakeAmount
    ) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        oracle = DecentralizedOracle(_oracle);

        rewardRate = _rewardRate;
        minStakeAmount = _minStakeAmount;
        maxStakeAmount = _maxStakeAmount;
        lastUpdateTime = block.timestamp;

        // Initialize reward tiers
        rewardTiers.push(RewardTier(100 * 10**18, 1000 * 10**18, 500, 100)); // 5% + 1% bonus
        rewardTiers.push(RewardTier(1000 * 10**18, 10000 * 10**18, 800, 200)); // 8% + 2% bonus
        rewardTiers.push(RewardTier(10000 * 10**18, type(uint256).max, 1200, 300)); // 12% + 3% bonus

        lockPeriodBonus = 50; // 0.5% per month locked
        unstakeFee = 500; // 5% fee for early unstaking
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ============ STAKING FUNCTIONS ============

    function stake(uint256 _amount, uint256 _lockPeriod, bool _autoCompound) external nonReentrant {
        require(_amount >= minStakeAmount, "Stake amount too low");
        require(_amount <= maxStakeAmount, "Stake amount too high");
        require(stakes[msg.sender].amount == 0, "Already staking");

        // Update rewards before staking
        _updateReward(msg.sender);

        // Transfer tokens
        stakingToken.safeTransferFrom(msg.sender, address(this), _amount);

        // Create stake
        stakes[msg.sender] = StakeInfo({
            amount: _amount,
            stakedAt: block.timestamp,
            lastClaimTime: block.timestamp,
            accumulatedRewards: 0,
            lockPeriod: _lockPeriod,
            autoCompound: _autoCompound
        });

        totalStaked += _amount;

        emit Staked(msg.sender, _amount, _lockPeriod);
    }

    function unstake() external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No stake found");

        // Update rewards
        _updateReward(msg.sender);

        uint256 stakeAmount = userStake.amount;
        uint256 rewardAmount = rewards[msg.sender];

        // Apply early unstaking fee if applicable
        if (block.timestamp < userStake.stakedAt + userStake.lockPeriod) {
            uint256 fee = (stakeAmount * unstakeFee) / 10000;
            stakeAmount -= fee;
            // Fee stays in contract for redistribution
        }

        // Reset stake
        userStake.amount = 0;
        rewards[msg.sender] = 0;
        totalStaked -= stakeAmount;

        // Transfer tokens
        stakingToken.safeTransfer(msg.sender, stakeAmount);
        if (rewardAmount > 0) {
            rewardToken.safeTransfer(msg.sender, rewardAmount);
        }

        emit Unstaked(msg.sender, stakeAmount, rewardAmount);
    }

    function claimRewards() external nonReentrant {
        _updateReward(msg.sender);
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No rewards to claim");

        rewards[msg.sender] = 0;
        rewardToken.safeTransfer(msg.sender, reward);

        emit RewardsClaimed(msg.sender, reward);
    }

    // ============ REWARD CALCULATION ============

    function _updateReward(address _account) internal {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;

        if (_account != address(0)) {
            rewards[_account] = earned(_account);
            userRewardPerTokenPaid[_account] = rewardPerTokenStored;
        }
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }
        return rewardPerTokenStored + ((block.timestamp - lastUpdateTime) * rewardRate * 1e18) / totalStaked;
    }

    function earned(address _account) public view returns (uint256) {
        StakeInfo memory stakeInfo = stakes[_account];
        if (stakeInfo.amount == 0) return 0;

        uint256 baseReward = stakeInfo.amount * (rewardPerToken() - userRewardPerTokenPaid[_account]) / 1e18;

        // Apply tier bonuses
        uint256 tierBonus = _calculateTierBonus(stakeInfo.amount);

        // Apply lock period bonus
        uint256 lockBonus = _calculateLockBonus(stakeInfo);

        return baseReward + ((baseReward * (tierBonus + lockBonus)) / 10000);
    }

    function _calculateTierBonus(uint256 _amount) internal view returns (uint256) {
        for (uint256 i = 0; i < rewardTiers.length; i++) {
            if (_amount >= rewardTiers[i].minStake && _amount <= rewardTiers[i].maxStake) {
                return rewardTiers[i].bonusAPY;
            }
        }
        return 0;
    }

    function _calculateLockBonus(StakeInfo memory _stake) internal view returns (uint256) {
        if (_stake.lockPeriod == 0) return 0;
        uint256 monthsLocked = _stake.lockPeriod / 30 days;
        return monthsLocked * lockPeriodBonus;
    }

    // ============ AI-ENHANCED FEATURES ============

    function getAIPrediction() external {
        // Get AI prediction from oracle
        (uint256 prediction, , ) = oracle.getLatestData(
            DecentralizedOracle.DataType.AIModel,
            "staking",
            string(abi.encodePacked("user_", msg.sender, "_prediction"))
        );

        uint256 predictedAPY = prediction % 5000; // Max 50%
        uint256 confidence = (prediction / 5000) % 101; // 0-100

        aiPredictions[msg.sender] = AIPrediction({
            predictedAPY: predictedAPY,
            confidenceScore: confidence,
            timestamp: block.timestamp
        });

        emit AIPredictionUpdated(msg.sender, predictedAPY, confidence);
    }

    function getOptimizedStakeAmount() external view returns (uint256 optimalAmount, uint256 expectedAPY) {
        AIPrediction memory prediction = aiPredictions[msg.sender];
        if (prediction.timestamp == 0) return (0, 0);

        // Simple optimization based on AI prediction
        optimalAmount = minStakeAmount + (prediction.predictedAPY * 10**18);
        expectedAPY = prediction.predictedAPY;

        return (optimalAmount, expectedAPY);
    }

    // ============ ADMIN FUNCTIONS ============

    function setRewardRate(uint256 _rewardRate) external onlyOwner {
        _updateReward(address(0));
        emit RewardRateUpdated(rewardRate, _rewardRate);
        rewardRate = _rewardRate;
    }

    function addRewardTokens(uint256 _amount) external onlyOwner {
        rewardToken.safeTransferFrom(msg.sender, address(this), _amount);
        totalRewardsDistributed += _amount;
    }

    function updateRewardTiers(
        uint256[] memory _minStakes,
        uint256[] memory _maxStakes,
        uint256[] memory _baseAPYs,
        uint256[] memory _bonusAPYs
    ) external onlyOwner {
        require(_minStakes.length == _maxStakes.length &&
                _maxStakes.length == _baseAPYs.length &&
                _baseAPYs.length == _bonusAPYs.length, "Array length mismatch");

        delete rewardTiers;
        for (uint256 i = 0; i < _minStakes.length; i++) {
            rewardTiers.push(RewardTier(_minStakes[i], _maxStakes[i], _baseAPYs[i], _bonusAPYs[i]));
        }
    }

    function setStakingParameters(
        uint256 _minStakeAmount,
        uint256 _maxStakeAmount,
        uint256 _lockPeriodBonus,
        uint256 _unstakeFee
    ) external onlyOwner {
        minStakeAmount = _minStakeAmount;
        maxStakeAmount = _maxStakeAmount;
        lockPeriodBonus = _lockPeriodBonus;
        unstakeFee = _unstakeFee;
    }

    // ============ VIEW FUNCTIONS ============

    function getStakeInfo(address _user) external view returns (
        uint256 amount,
        uint256 stakedAt,
        uint256 lockExpiry,
        uint256 earnedRewards,
        bool canUnstake
    ) {
        StakeInfo memory stakeInfo = stakes[_user];
        uint256 earnedRewards = earned(_user);
        bool canUnstake = block.timestamp >= stakeInfo.stakedAt + stakeInfo.lockPeriod;

        return (
            stakeInfo.amount,
            stakeInfo.stakedAt,
            stakeInfo.stakedAt + stakeInfo.lockPeriod,
            earnedRewards,
            canUnstake
        );
    }

    function getRewardTier(uint256 _amount) external view returns (uint256 tierIndex, uint256 baseAPY, uint256 bonusAPY) {
        for (uint256 i = 0; i < rewardTiers.length; i++) {
            if (_amount >= rewardTiers[i].minStake && _amount <= rewardTiers[i].maxStake) {
                return (i, rewardTiers[i].baseAPY, rewardTiers[i].bonusAPY);
            }
        }
        return (0, 0, 0);
    }

    function getTotalRewardTiers() external view returns (uint256) {
        return rewardTiers.length;
    }
}