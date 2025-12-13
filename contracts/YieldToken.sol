// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract YieldToken is Initializable, ERC20Upgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    struct YieldPosition {
        uint256 amount;
        uint256 depositTime;
        uint256 lastClaimTime;
        uint256 accumulatedYield;
        bool autoCompound;
        uint256 lockPeriod; // Lock period for boosted yields
    }

    struct MultiTokenFarm {
        address token;
        uint256 totalStaked;
        uint256 rewardRate; // rewards per second
        uint256 lastRewardTime;
        uint256 rewardPerTokenStored;
        mapping(address => uint256) userRewardPerTokenPaid;
        mapping(address => uint256) userRewards;
        bool active;
    }

    // Enhanced yield farming parameters
    uint256 public baseYieldRate; // 5% APY in basis points
    uint256 public constant SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
    uint256 public autoCompoundBonus; // 2% bonus for auto-compounding
    uint256 public lockBonusMultiplier; // 1.5x for locked positions

    // Multi-token farming
    mapping(address => MultiTokenFarm) public multiTokenFarms;
    address[] public supportedFarmTokens;

    // Legacy single token farming (for backward compatibility)
    address public underlyingToken;
    uint256 public totalStaked;
    mapping(address => YieldPosition) public positions;

    // Events
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event YieldClaimed(address indexed user, uint256 amount);
    event FarmDeposited(address indexed user, address indexed token, uint256 amount);
    event FarmWithdrawn(address indexed user, address indexed token, uint256 amount);
    event FarmRewardsClaimed(address indexed user, address indexed token, uint256 amount);
    event FarmCreated(address indexed token, uint256 rewardRate);
    event AutoCompounded(address indexed user, uint256 amount);

    function initialize(address _underlyingToken, string memory name, string memory symbol) public initializer {
        __ERC20_init(name, symbol);
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        underlyingToken = _underlyingToken;

        baseYieldRate = 500;
        autoCompoundBonus = 200;
        lockBonusMultiplier = 150;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @dev Enhanced deposit with auto-compounding and lock options
     * @param amount Amount to deposit
     * @param autoCompound Whether to auto-compound yields
     * @param lockPeriod Lock period in seconds for bonus yields
     */
    function deposit(uint256 amount, bool autoCompound, uint256 lockPeriod) public nonReentrant {
        require(amount > 0, "Amount must be > 0");

        // Transfer underlying tokens from user
        IERC20(underlyingToken).transferFrom(msg.sender, address(this), amount);

        // Update or create position
        YieldPosition storage position = positions[msg.sender];
        if (position.amount > 0) {
            // Claim pending yield before adding more
            _claimYield(msg.sender);
        }

        position.amount += amount;
        position.depositTime = block.timestamp;
        position.lastClaimTime = block.timestamp;
        position.autoCompound = autoCompound;
        position.lockPeriod = lockPeriod;

        totalStaked += amount;

        // Mint yield tokens (1:1 ratio initially)
        _mint(msg.sender, amount);

        emit Deposited(msg.sender, amount);
    }

    // Backward compatibility function
    function deposit(uint256 amount) external nonReentrant {
        deposit(amount, false, 0);
    }

    /**
     * @dev Deposit to multi-token farm
     * @param token Token to stake
     * @param amount Amount to deposit
     */
    function depositToFarm(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        MultiTokenFarm storage farm = multiTokenFarms[token];
        require(farm.active, "Farm not active");

        // Transfer tokens from user
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        // Update rewards
        _updateFarmRewards(token);

        // Update user rewards
        farm.userRewards[msg.sender] += _calculateFarmRewards(msg.sender, token);
        farm.userRewardPerTokenPaid[msg.sender] = farm.rewardPerTokenStored;

        // Update staking
        farm.totalStaked += amount;

        emit FarmDeposited(msg.sender, token, amount);
    }

    /**
     * @dev Withdraw underlying tokens
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        YieldPosition storage position = positions[msg.sender];
        require(position.amount >= amount, "Insufficient balance");

        // Claim pending yield
        _claimYield(msg.sender);

        // Update position
        position.amount -= amount;
        totalStaked -= amount;

        // Burn yield tokens
        _burn(msg.sender, amount);

        // Transfer underlying tokens back
        IERC20(underlyingToken).transfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @dev Claim accumulated yield
     */
    function claimYield() external nonReentrant {
        _claimYield(msg.sender);
    }

    /**
     * @dev Internal function to claim yield
     * @param user User address
     */
    function _claimYield(address user) internal {
        YieldPosition storage position = positions[user];
        if (position.amount == 0) return;

        uint256 pendingYield = calculatePendingYield(user);
        if (pendingYield == 0) return;

        position.accumulatedYield += pendingYield;
        position.lastClaimTime = block.timestamp;

        // Mint additional yield tokens as reward
        _mint(user, pendingYield);

        emit YieldClaimed(user, pendingYield);
    }

    /**
     * @dev Calculate pending yield for a user
     * @param user User address
     */
    function calculatePendingYield(address user) public view returns (uint256) {
        YieldPosition memory position = positions[user];
        if (position.amount == 0) return 0;

        uint256 timeElapsed = block.timestamp - position.lastClaimTime;
        uint256 baseYield = (position.amount * baseYieldRate * timeElapsed) / (SECONDS_PER_YEAR * 10000);

        // Apply bonuses
        uint256 totalYield = baseYield;

        // Auto-compound bonus
        if (position.autoCompound) {
            totalYield += (baseYield * autoCompoundBonus) / 10000;
        }

        // Lock period bonus
        if (position.lockPeriod > 0 && block.timestamp < position.depositTime + position.lockPeriod) {
            totalYield = (totalYield * lockBonusMultiplier) / 100;
        }

        return totalYield;
    }

    /**
     * @dev Auto-compound yields (can be called by keepers or users)
     * @param user User address
     */
    function autoCompound(address user) external {
        YieldPosition storage position = positions[user];
        require(position.autoCompound, "Auto-compound not enabled");
        require(position.amount > 0, "No position");

        uint256 pendingYield = calculatePendingYield(user);
        if (pendingYield == 0) return;

        // Add yield to position
        position.amount += pendingYield;
        position.lastClaimTime = block.timestamp;
        position.accumulatedYield += pendingYield;

        // Mint yield tokens
        _mint(user, pendingYield);

        emit AutoCompounded(user, pendingYield);
        emit YieldClaimed(user, pendingYield);
    }

    // Multi-Token Farm Functions
    function createFarm(address token, uint256 rewardRate) external onlyOwner {
        require(token != address(0), "Invalid token");
        require(multiTokenFarms[token].token == address(0), "Farm already exists");

        multiTokenFarms[token].token = token;
        multiTokenFarms[token].totalStaked = 0;
        multiTokenFarms[token].rewardRate = rewardRate;
        multiTokenFarms[token].lastRewardTime = block.timestamp;
        multiTokenFarms[token].rewardPerTokenStored = 0;
        multiTokenFarms[token].active = true;

        supportedFarmTokens.push(token);

        emit FarmCreated(token, rewardRate);
    }

    function _updateFarmRewards(address token) internal {
        MultiTokenFarm storage farm = multiTokenFarms[token];
        if (farm.totalStaked == 0) {
            farm.lastRewardTime = block.timestamp;
            return;
        }

        uint256 timeElapsed = block.timestamp - farm.lastRewardTime;
        uint256 reward = (farm.rewardRate * timeElapsed * 1e18) / farm.totalStaked; // Scale up for precision
        farm.rewardPerTokenStored += reward;
        farm.lastRewardTime = block.timestamp;
    }

    function _calculateFarmRewards(address user, address token) internal view returns (uint256) {
        MultiTokenFarm storage farm = multiTokenFarms[token];
        return (farm.rewardPerTokenStored - farm.userRewardPerTokenPaid[user]) * farm.totalStaked / 1e18;
    }

    function claimFarmRewards(address token) external nonReentrant {
        MultiTokenFarm storage farm = multiTokenFarms[token];
        require(farm.active, "Farm not active");

        _updateFarmRewards(token);

        uint256 rewards = farm.userRewards[msg.sender] + _calculateFarmRewards(msg.sender, token);
        require(rewards > 0, "No rewards");

        farm.userRewards[msg.sender] = 0;
        farm.userRewardPerTokenPaid[msg.sender] = farm.rewardPerTokenStored;

        // Mint reward tokens (assuming this contract is the reward token)
        _mint(msg.sender, rewards);

        emit FarmRewardsClaimed(msg.sender, token, rewards);
    }

    function withdrawFromFarm(address token, uint256 amount) external nonReentrant {
        MultiTokenFarm storage farm = multiTokenFarms[token];
        require(amount > 0, "Amount must be > 0");

        _updateFarmRewards(token);

        // Update user rewards
        farm.userRewards[msg.sender] += _calculateFarmRewards(msg.sender, token);

        // Transfer tokens back
        IERC20(token).transfer(msg.sender, amount);
        farm.totalStaked -= amount;

        emit FarmWithdrawn(msg.sender, token, amount);
    }

    /**
     * @dev Get user's yield position
     * @param user User address
     */
    function getPosition(address user) external view returns (
        uint256 amount,
        uint256 depositTime,
        uint256 lastClaimTime,
        uint256 pendingYield,
        uint256 totalAccumulated
    ) {
        YieldPosition memory position = positions[user];
        uint256 pending = calculatePendingYield(user);
        return (
            position.amount,
            position.depositTime,
            position.lastClaimTime,
            pending,
            position.accumulatedYield + pending
        );
    }

    /**
     * @dev Get total value locked
     */
    function totalValueLocked() external view returns (uint256) {
        return totalStaked;
    }

    /**
     * @dev Emergency withdraw (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = IERC20(underlyingToken).balanceOf(address(this));
        IERC20(underlyingToken).transfer(owner(), balance);
    }
}