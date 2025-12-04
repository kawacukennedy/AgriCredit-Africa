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
import "./StakingRewards.sol";
import "./YieldVault.sol";
import "./LiquidityPool.sol";

contract YieldAggregator is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    struct Strategy {
        uint256 id;
        string name;
        address protocol;
        bytes4 depositFunction;
        bytes4 withdrawFunction;
        bytes4 harvestFunction;
        address rewardToken;
        uint256 totalDeposited;
        uint256 totalRewards;
        bool active;
        uint256 apy; // Estimated APY in basis points
        uint256 riskLevel; // 1-5 risk level
        uint256 minDeposit;
        uint256 maxDeposit;
    }

    struct UserStrategy {
        uint256 strategyId;
        address user;
        uint256 depositedAmount;
        uint256 rewardsEarned;
        uint256 lastRebalance;
        bool autoRebalance;
        uint256 targetAllocation; // Percentage allocation (basis points)
    }

    struct Portfolio {
        address user;
        uint256 totalValue;
        uint256 totalRewards;
        uint256[] strategyIds;
        mapping(uint256 => uint256) allocations; // strategyId => allocation percentage
        uint256 lastRebalance;
        bool autoRebalance;
        uint256 rebalanceThreshold; // Minimum change to trigger rebalance
    }

    // Core contracts
    DecentralizedOracle public oracle;
    StakingRewards public stakingRewards;
    YieldVault public yieldVault;
    LiquidityPool public liquidityPool;

    // Strategies
    mapping(uint256 => Strategy) public strategies;
    uint256 public nextStrategyId = 1;

    // User portfolios
    mapping(address => Portfolio) public portfolios;
    mapping(address => UserStrategy[]) public userStrategies;

    // Protocol parameters
    uint256 public rebalanceCooldown = 1 hours;
    uint256 public maxSlippage = 500; // 5% max slippage
    uint256 public performanceFee = 2000; // 20% performance fee
    uint256 public minPortfolioValue = 100 * 10**18; // 100 AGC minimum

    // Risk management
    uint256 public maxRiskLevel = 3; // Maximum allowed risk level
    uint256 public diversificationRequirement = 3000; // Minimum 30% diversification

    // Fee collection
    uint256 public collectedFees;
    address public feeRecipient;

    // Emergency controls
    bool public emergencyPause;
    mapping(address => bool) public strategyManagers;

    // Events
    event StrategyAdded(uint256 indexed strategyId, string name, address protocol);
    event PortfolioCreated(address indexed user, uint256[] strategyIds);
    event Deposit(address indexed user, uint256 strategyId, uint256 amount);
    event Withdraw(address indexed user, uint256 strategyId, uint256 amount);
    event RebalanceExecuted(address indexed user, uint256[] strategyIds, uint256[] allocations);
    event RewardsHarvested(address indexed user, uint256 totalRewards);
    event StrategyOptimized(uint256 indexed strategyId, uint256 newAPY);

    function initialize(
        address _oracle,
        address _stakingRewards,
        address _yieldVault,
        address _liquidityPool,
        address _feeRecipient
    ) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        oracle = DecentralizedOracle(_oracle);
        stakingRewards = StakingRewards(_stakingRewards);
        yieldVault = YieldVault(_yieldVault);
        liquidityPool = LiquidityPool(_liquidityPool);
        feeRecipient = _feeRecipient;

        strategyManagers[msg.sender] = true;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ============ STRATEGY MANAGEMENT ============

    function addStrategy(
        string memory _name,
        address _protocol,
        bytes4 _depositFunction,
        bytes4 _withdrawFunction,
        bytes4 _harvestFunction,
        address _rewardToken,
        uint256 _riskLevel,
        uint256 _minDeposit,
        uint256 _maxDeposit
    ) external returns (uint256) {
        require(strategyManagers[msg.sender], "Not authorized");
        require(_riskLevel <= 5, "Invalid risk level");

        uint256 strategyId = nextStrategyId++;
        strategies[strategyId] = Strategy({
            id: strategyId,
            name: _name,
            protocol: _protocol,
            depositFunction: _depositFunction,
            withdrawFunction: _withdrawFunction,
            harvestFunction: _harvestFunction,
            rewardToken: _rewardToken,
            totalDeposited: 0,
            totalRewards: 0,
            active: true,
            apy: 0,
            riskLevel: _riskLevel,
            minDeposit: _minDeposit,
            maxDeposit: _maxDeposit
        });

        emit StrategyAdded(strategyId, _name, _protocol);
        return strategyId;
    }

    function updateStrategyAPY(uint256 _strategyId) external {
        Strategy storage strategy = strategies[_strategyId];
        require(strategy.active, "Strategy not active");

        // Get APY from oracle
        (uint256 apy, , ) = oracle.getLatestData(
            DecentralizedOracle.DataType.AIModel,
            "yield_prediction",
            string(abi.encodePacked("strategy_", _strategyId, "_apy"))
        );

        strategy.apy = apy % 50000; // Max 500% APY

        emit StrategyOptimized(_strategyId, strategy.apy);
    }

    // ============ PORTFOLIO MANAGEMENT ============

    function createPortfolio(
        uint256[] memory _strategyIds,
        uint256[] memory _allocations,
        bool _autoRebalance,
        uint256 _rebalanceThreshold
    ) external returns (uint256 portfolioId) {
        require(_strategyIds.length == _allocations.length, "Mismatched arrays");
        require(_strategyIds.length >= 2, "Need at least 2 strategies");

        // Validate allocations sum to 100%
        uint256 totalAllocation = 0;
        for (uint256 i = 0; i < _allocations.length; i++) {
            totalAllocation += _allocations[i];
        }
        require(totalAllocation == 10000, "Allocations must sum to 100%");

        // Validate diversification
        uint256 maxAllocation = 0;
        for (uint256 i = 0; i < _allocations.length; i++) {
            if (_allocations[i] > maxAllocation) maxAllocation = _allocations[i];
        }
        require(maxAllocation <= (10000 - diversificationRequirement), "Insufficient diversification");

        Portfolio storage portfolio = portfolios[msg.sender];
        portfolio.user = msg.sender;
        portfolio.strategyIds = _strategyIds;
        portfolio.autoRebalance = _autoRebalance;
        portfolio.rebalanceThreshold = _rebalanceThreshold;
        portfolio.lastRebalance = block.timestamp;

        for (uint256 i = 0; i < _strategyIds.length; i++) {
            portfolio.allocations[_strategyIds[i]] = _allocations[i];
        }

        emit PortfolioCreated(msg.sender, _strategyIds);
        return 0; // Simplified - could return portfolio ID
    }

    function depositToPortfolio(uint256 _strategyId, uint256 _amount) external nonReentrant {
        Strategy storage strategy = strategies[_strategyId];
        require(strategy.active, "Strategy not active");
        require(_amount >= strategy.minDeposit, "Deposit too small");
        require(strategy.totalDeposited + _amount <= strategy.maxDeposit, "Strategy capacity exceeded");

        Portfolio storage portfolio = portfolios[msg.sender];
        require(portfolio.strategyIds.length > 0, "Portfolio not created");

        // Check if strategy is in user's portfolio
        bool strategyInPortfolio = false;
        for (uint256 i = 0; i < portfolio.strategyIds.length; i++) {
            if (portfolio.strategyIds[i] == _strategyId) {
                strategyInPortfolio = true;
                break;
            }
        }
        require(strategyInPortfolio, "Strategy not in portfolio");

        // Transfer tokens (assuming AGC token)
        address token = address(stakingRewards.stakingToken());
        IERC20Upgradeable(token).safeTransferFrom(msg.sender, address(this), _amount);

        // Deposit to strategy
        _depositToStrategy(_strategyId, _amount);

        // Update portfolio
        portfolio.totalValue += _amount;

        // Record user strategy
        userStrategies[msg.sender].push(UserStrategy({
            strategyId: _strategyId,
            user: msg.sender,
            depositedAmount: _amount,
            rewardsEarned: 0,
            lastRebalance: block.timestamp,
            autoRebalance: portfolio.autoRebalance,
            targetAllocation: portfolio.allocations[_strategyId]
        }));

        emit Deposit(msg.sender, _strategyId, _amount);
    }

    function _depositToStrategy(uint256 _strategyId, uint256 _amount) internal {
        Strategy storage strategy = strategies[_strategyId];

        // Call deposit function on protocol (simplified)
        if (strategy.protocol == address(stakingRewards)) {
            // Deposit to staking rewards
            IERC20Upgradeable(address(stakingRewards.stakingToken())).approve(address(stakingRewards), _amount);
            stakingRewards.stake(_amount, 30 days, true);
        } else if (strategy.protocol == address(yieldVault)) {
            // Deposit to yield vault
            IERC20Upgradeable(address(stakingRewards.stakingToken())).approve(address(yieldVault), _amount);
            yieldVault.deposit(_strategyId, _amount, true);
        }

        strategy.totalDeposited += _amount;
    }

    // ============ REBALANCING ============

    function rebalancePortfolio() external nonReentrant {
        Portfolio storage portfolio = portfolios[msg.sender];
        require(portfolio.strategyIds.length > 0, "Portfolio not created");
        require(
            block.timestamp >= portfolio.lastRebalance + rebalanceCooldown,
            "Rebalance cooldown active"
        );

        // Check if rebalance is needed
        bool needsRebalance = _checkRebalanceNeeded(portfolio);
        if (!needsRebalance && !portfolio.autoRebalance) return;

        // Calculate optimal allocations using AI
        uint256[] memory optimalAllocations = _calculateOptimalAllocations(portfolio);

        // Execute rebalance
        _executeRebalance(portfolio, optimalAllocations);

        portfolio.lastRebalance = block.timestamp;

        emit RebalanceExecuted(msg.sender, portfolio.strategyIds, optimalAllocations);
    }

    function _checkRebalanceNeeded(Portfolio storage _portfolio) internal view returns (bool) {
        // Check if current allocations deviate from targets
        for (uint256 i = 0; i < _portfolio.strategyIds.length; i++) {
            uint256 strategyId = _portfolio.strategyIds[i];
            uint256 currentAllocation = _getCurrentAllocation(_portfolio.user, strategyId);
            uint256 targetAllocation = _portfolio.allocations[strategyId];

            if (Math.abs(int256(currentAllocation) - int256(targetAllocation)) > _portfolio.rebalanceThreshold) {
                return true;
            }
        }
        return false;
    }

    function _calculateOptimalAllocations(Portfolio storage _portfolio) internal view returns (uint256[] memory) {
        uint256[] memory optimalAllocations = new uint256[](_portfolio.strategyIds.length);

        // Use AI to calculate optimal allocations
        for (uint256 i = 0; i < _portfolio.strategyIds.length; i++) {
            uint256 strategyId = _portfolio.strategyIds[i];
            Strategy memory strategy = strategies[strategyId];

            // Get AI recommendation
            (uint256 aiAllocation, , ) = oracle.getLatestData(
                DecentralizedOracle.DataType.AIModel,
                "portfolio_optimization",
                string(abi.encodePacked("strategy_", strategyId, "_allocation"))
            );

            optimalAllocations[i] = aiAllocation % 10001; // 0-100% in basis points
        }

        // Normalize to sum to 100%
        uint256 total = 0;
        for (uint256 i = 0; i < optimalAllocations.length; i++) {
            total += optimalAllocations[i];
        }

        if (total > 0) {
            for (uint256 i = 0; i < optimalAllocations.length; i++) {
                optimalAllocations[i] = (optimalAllocations[i] * 10000) / total;
            }
        }

        return optimalAllocations;
    }

    function _executeRebalance(Portfolio storage _portfolio, uint256[] memory _optimalAllocations) internal {
        uint256 totalValue = _portfolio.totalValue;

        for (uint256 i = 0; i < _portfolio.strategyIds.length; i++) {
            uint256 strategyId = _portfolio.strategyIds[i];
            uint256 targetValue = (totalValue * _optimalAllocations[i]) / 10000;
            uint256 currentValue = _getCurrentValue(_portfolio.user, strategyId);

            if (currentValue > targetValue) {
                // Need to reduce position
                uint256 reduceAmount = currentValue - targetValue;
                _withdrawFromStrategy(strategyId, reduceAmount);

                // Move to highest performing strategy
                uint256 bestStrategyId = _findBestPerformingStrategy(_portfolio);
                if (bestStrategyId != strategyId) {
                    _depositToStrategy(bestStrategyId, reduceAmount);
                }
            }
        }
    }

    function _withdrawFromStrategy(uint256 _strategyId, uint256 _amount) internal {
        Strategy storage strategy = strategies[_strategyId];

        // Call withdraw function on protocol (simplified)
        if (strategy.protocol == address(stakingRewards)) {
            stakingRewards.unstake();
        } else if (strategy.protocol == address(yieldVault)) {
            // Find user's position in yield vault
            yieldVault.withdraw(_strategyId, _amount);
        }

        strategy.totalDeposited -= _amount;
    }

    function _getCurrentAllocation(address _user, uint256 _strategyId) internal view returns (uint256) {
        uint256 totalValue = portfolios[_user].totalValue;
        if (totalValue == 0) return 0;

        uint256 strategyValue = _getCurrentValue(_user, _strategyId);
        return (strategyValue * 10000) / totalValue;
    }

    function _getCurrentValue(address _user, uint256 _strategyId) internal view returns (uint256) {
        // Simplified - would need to query actual values from protocols
        UserStrategy[] memory userStrats = userStrategies[_user];
        for (uint256 i = 0; i < userStrats.length; i++) {
            if (userStrats[i].strategyId == _strategyId) {
                return userStrats[i].depositedAmount;
            }
        }
        return 0;
    }

    function _findBestPerformingStrategy(Portfolio storage _portfolio) internal view returns (uint256) {
        uint256 bestStrategyId = _portfolio.strategyIds[0];
        uint256 bestAPY = strategies[bestStrategyId].apy;

        for (uint256 i = 1; i < _portfolio.strategyIds.length; i++) {
            uint256 strategyId = _portfolio.strategyIds[i];
            if (strategies[strategyId].apy > bestAPY) {
                bestAPY = strategies[strategyId].apy;
                bestStrategyId = strategyId;
            }
        }

        return bestStrategyId;
    }

    // ============ REWARDS MANAGEMENT ============

    function harvestRewards() external nonReentrant {
        Portfolio storage portfolio = portfolios[msg.sender];
        require(portfolio.strategyIds.length > 0, "Portfolio not created");

        uint256 totalRewards = 0;

        // Harvest from all strategies
        for (uint256 i = 0; i < portfolio.strategyIds.length; i++) {
            uint256 strategyId = portfolio.strategyIds[i];
            uint256 rewards = _harvestFromStrategy(strategyId);
            totalRewards += rewards;
        }

        if (totalRewards > 0) {
            // Take performance fee
            uint256 fee = (totalRewards * performanceFee) / 10000;
            uint256 userRewards = totalRewards - fee;

            collectedFees += fee;
            portfolio.totalRewards += userRewards;

            // Transfer rewards to user
            address rewardToken = address(stakingRewards.stakingToken()); // Simplified
            IERC20Upgradeable(rewardToken).safeTransfer(msg.sender, userRewards);
        }

        emit RewardsHarvested(msg.sender, totalRewards);
    }

    function _harvestFromStrategy(uint256 _strategyId) internal returns (uint256) {
        Strategy storage strategy = strategies[_strategyId];

        uint256 rewards = 0;

        // Call harvest function on protocol (simplified)
        if (strategy.protocol == address(stakingRewards)) {
            stakingRewards.claimRewards();
            // Assume some rewards were claimed
            rewards = 100 * 10**18; // Simplified
        } else if (strategy.protocol == address(yieldVault)) {
            // Harvest from yield vault
            rewards = 50 * 10**18; // Simplified
        }

        strategy.totalRewards += rewards;
        return rewards;
    }

    // ============ VIEW FUNCTIONS ============

    function getStrategy(uint256 _strategyId) external view returns (Strategy memory) {
        return strategies[_strategyId];
    }

    function getPortfolio(address _user) external view returns (
        uint256 totalValue,
        uint256 totalRewards,
        uint256[] memory strategyIds,
        uint256 lastRebalance,
        bool autoRebalance
    ) {
        Portfolio storage portfolio = portfolios[_user];
        return (
            portfolio.totalValue,
            portfolio.totalRewards,
            portfolio.strategyIds,
            portfolio.lastRebalance,
            portfolio.autoRebalance
        );
    }

    function getPortfolioAllocation(address _user, uint256 _strategyId) external view returns (uint256) {
        return portfolios[_user].allocations[_strategyId];
    }

    function getUserStrategies(address _user) external view returns (UserStrategy[] memory) {
        return userStrategies[_user];
    }

    function getOptimalAllocations(address _user) external view returns (uint256[] memory) {
        Portfolio storage portfolio = portfolios[_user];
        return _calculateOptimalAllocations(portfolio);
    }

    // ============ ADMIN FUNCTIONS ============

    function setStrategyManager(address _manager, bool _status) external onlyOwner {
        strategyManagers[_manager] = _status;
    }

    function setProtocolParameters(
        uint256 _rebalanceCooldown,
        uint256 _maxSlippage,
        uint256 _performanceFee,
        uint256 _maxRiskLevel
    ) external onlyOwner {
        rebalanceCooldown = _rebalanceCooldown;
        maxSlippage = _maxSlippage;
        performanceFee = _performanceFee;
        maxRiskLevel = _maxRiskLevel;
    }

    function setEmergencyPause(bool _paused) external onlyOwner {
        emergencyPause = _paused;
    }

    function collectFees() external onlyOwner {
        require(collectedFees > 0, "No fees to collect");

        uint256 amount = collectedFees;
        collectedFees = 0;

        payable(feeRecipient).transfer(amount);
    }

    function deactivateStrategy(uint256 _strategyId) external onlyOwner {
        strategies[_strategyId].active = false;
    }
}</content>
</xai:function_call
</xai:function_call name="todowrite">
<parameter name="todos">[{"content":"Create YieldAggregator contract for automated yield optimization","status":"completed","priority":"medium","id":"create_yield_aggregator"},{"content":"Implement proper governance token with delegation and voting","status":"in_progress","priority":"medium","id":"add_governance_token"}]