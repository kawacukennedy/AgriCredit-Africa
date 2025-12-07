// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./LiquidityPool.sol";
import "./YieldToken.sol";
import "./DecentralizedOracle.sol";

contract YieldVault is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    using Math for uint256;

    struct VaultStrategy {
        uint256 id;
        string name;
        string description;
        uint256[] allocationPercentages; // Percentage allocation to each protocol
        address[] protocols; // Array of protocol addresses
        uint256 minDeposit;
        uint256 lockPeriod;
        uint256 performanceFee; // In basis points
        uint256 totalDeposits;
        uint256 totalShares;
        bool active;
        uint256 apy; // Estimated APY in basis points
        uint256 lastRebalance;
    }

    struct UserPosition {
        uint256 shares;
        uint256 depositAmount;
        uint256 depositTime;
        uint256 lastClaimTime;
        uint256 accumulatedRewards;
        uint256 lockExpiry;
        bool autoCompound;
    }

    struct AutoCompoundSettings {
        uint256 minRewardThreshold; // Minimum rewards to trigger compounding
        uint256 maxSlippage; // Maximum slippage for rebalancing
        uint256 compoundFrequency; // How often to compound (in seconds)
        bool reinvestRewards; // Whether to reinvest rewards
    }

    // Vault strategies
    mapping(uint256 => VaultStrategy) public vaultStrategies;
    uint256 public nextStrategyId = 1;

    // User positions
    mapping(uint256 => mapping(address => UserPosition)) public userPositions; // strategyId => user => position
    mapping(address => AutoCompoundSettings) public userAutoCompoundSettings;

    // Protocol integrations
    LiquidityPool public liquidityPool;
    YieldToken public yieldToken;
    IERC20 public agriCreditToken;
    DecentralizedOracle public decentralizedOracle;

    // AI-enhanced yield optimization
    struct AIYieldPrediction {
        uint256 strategyId;
        uint256 predictedAPY;
        uint256 confidenceScore;
        uint256 recommendedAllocation;
        uint256 timestamp;
    }

    mapping(uint256 => AIYieldPrediction) public aiYieldPredictions;

    // Cross-chain yield farming
    struct CrossChainPosition {
        uint256 sourceChainId;
        uint256 strategyId;
        uint256 shares;
        uint256 depositAmount;
        bytes32 bridgeTxHash;
        bool active;
    }

    mapping(address => CrossChainPosition[]) public crossChainPositions;

    // Vault parameters
    uint256 public totalValueLocked;
    uint256 public performanceFee = 2000; // 20% performance fee
    uint256 public minDepositAmount = 10 * 10**18; // 10 AGC minimum
    uint256 public rebalanceCooldown = 1 hours;
    uint256 public maxStrategiesPerUser = 5;

    // Auto-compounding
    uint256 public compoundGasLimit = 500000; // Gas limit for auto-compound
    uint256 public lastGlobalCompound;

    // Events
    event StrategyCreated(uint256 indexed strategyId, string name, uint256 apy);
    event Deposit(uint256 indexed strategyId, address indexed user, uint256 amount, uint256 shares);
    event Withdraw(uint256 indexed strategyId, address indexed user, uint256 shares, uint256 amount);
    event RewardsClaimed(uint256 indexed strategyId, address indexed user, uint256 amount);
    event AutoCompounded(uint256 indexed strategyId, address indexed user, uint256 rewards, uint256 newShares);
    event StrategyRebalanced(uint256 indexed strategyId, uint256[] newAllocations);
    event PerformanceFeeCollected(uint256 indexed strategyId, uint256 amount);
    event AIYieldPredicted(uint256 indexed strategyId, uint256 predictedAPY, uint256 confidenceScore, uint256 recommendedAllocation);
    event CrossChainPositionCreated(address indexed user, uint256 sourceChainId, uint256 strategyId, uint256 amount, uint256 shares);
    event CrossChainRewardsClaimed(address indexed user, uint256 positionIndex, uint256 rewards);

    function initialize(
        address _liquidityPool,
        address _yieldToken,
        address _agriCreditToken,
        address _decentralizedOracle
    ) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        liquidityPool = LiquidityPool(_liquidityPool);
        yieldToken = YieldToken(_yieldToken);
        agriCreditToken = IERC20(_agriCreditToken);
        decentralizedOracle = DecentralizedOracle(_decentralizedOracle);
        lastGlobalCompound = block.timestamp;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ============ STRATEGY MANAGEMENT ============

    function createStrategy(
        string memory _name,
        string memory _description,
        uint256[] memory _allocationPercentages,
        address[] memory _protocols,
        uint256 _minDeposit,
        uint256 _lockPeriod,
        uint256 _apy
    ) external onlyOwner returns (uint256) {
        require(_allocationPercentages.length == _protocols.length, "Mismatched arrays");
        require(_allocationPercentages.length > 0, "No allocations provided");

        uint256 totalAllocation = 0;
        for (uint256 i = 0; i < _allocationPercentages.length; i++) {
            totalAllocation += _allocationPercentages[i];
        }
        require(totalAllocation == 10000, "Allocations must sum to 100%");

        uint256 strategyId = nextStrategyId++;

        VaultStrategy storage strategy = vaultStrategies[strategyId];
        strategy.id = strategyId;
        strategy.name = _name;
        strategy.description = _description;
        strategy.allocationPercentages = _allocationPercentages;
        strategy.protocols = _protocols;
        strategy.minDeposit = _minDeposit;
        strategy.lockPeriod = _lockPeriod;
        strategy.performanceFee = performanceFee;
        strategy.active = true;
        strategy.apy = _apy;
        strategy.lastRebalance = block.timestamp;

        emit StrategyCreated(strategyId, _name, _apy);
        return strategyId;
    }

    function updateStrategyAllocations(uint256 _strategyId, uint256[] memory _newAllocations) external onlyOwner {
        VaultStrategy storage strategy = vaultStrategies[_strategyId];
        require(strategy.active, "Strategy not active");
        require(block.timestamp >= strategy.lastRebalance + rebalanceCooldown, "Rebalance cooldown active");
        require(_newAllocations.length == strategy.protocols.length, "Invalid allocation length");

        uint256 totalAllocation = 0;
        for (uint256 i = 0; i < _newAllocations.length; i++) {
            totalAllocation += _newAllocations[i];
        }
        require(totalAllocation == 10000, "Allocations must sum to 100%");

        strategy.allocationPercentages = _newAllocations;
        strategy.lastRebalance = block.timestamp;

        emit StrategyRebalanced(_strategyId, _newAllocations);
    }

    // ============ DEPOSIT/WITHDRAW FUNCTIONS ============

    function deposit(uint256 _strategyId, uint256 _amount, bool _autoCompound) external nonReentrant {
        VaultStrategy storage strategy = vaultStrategies[_strategyId];
        require(strategy.active, "Strategy not active");
        require(_amount >= strategy.minDeposit, "Deposit below minimum");
        require(agriCreditToken.balanceOf(msg.sender) >= _amount, "Insufficient balance");

        // Check user strategy limit
        uint256 userStrategyCount = 0;
        for (uint256 i = 1; i < nextStrategyId; i++) {
            if (userPositions[i][msg.sender].shares > 0) {
                userStrategyCount++;
            }
        }
        require(userStrategyCount < maxStrategiesPerUser, "Too many strategies");

        // Transfer tokens
        require(agriCreditToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        // Calculate shares
        uint256 shares = strategy.totalShares == 0 ? _amount : (_amount * strategy.totalShares) / strategy.totalDeposits;

        // Update position
        UserPosition storage position = userPositions[_strategyId][msg.sender];
        position.shares += shares;
        position.depositAmount += _amount;
        position.depositTime = block.timestamp;
        position.lockExpiry = block.timestamp + strategy.lockPeriod;
        position.autoCompound = _autoCompound;

        // Update strategy totals
        strategy.totalDeposits += _amount;
        strategy.totalShares += shares;
        totalValueLocked += _amount;

        // Allocate to protocols
        _allocateToProtocols(_strategyId, _amount);

        emit Deposit(_strategyId, msg.sender, _amount, shares);
    }

    function withdraw(uint256 _strategyId, uint256 _shares) external nonReentrant {
        UserPosition storage position = userPositions[_strategyId][msg.sender];
        VaultStrategy storage strategy = vaultStrategies[_strategyId];

        require(position.shares >= _shares, "Insufficient shares");
        require(block.timestamp >= position.lockExpiry, "Still locked");

        // Calculate withdrawal amount
        uint256 withdrawAmount = (_shares * strategy.totalDeposits) / strategy.totalShares;

        // Update position
        position.shares -= _shares;
        position.depositAmount -= withdrawAmount;

        // Update strategy totals
        strategy.totalDeposits -= withdrawAmount;
        strategy.totalShares -= _shares;
        totalValueLocked -= withdrawAmount;

        // Withdraw from protocols
        _withdrawFromProtocols(_strategyId, withdrawAmount);

        // Transfer tokens back
        require(agriCreditToken.transfer(msg.sender, withdrawAmount), "Transfer failed");

        emit Withdraw(_strategyId, msg.sender, _shares, withdrawAmount);
    }

    // ============ REWARDS AND AUTO-COMPOUNDING ============

    function claimRewards(uint256 _strategyId) external nonReentrant {
        UserPosition storage position = userPositions[_strategyId][msg.sender];
        VaultStrategy storage strategy = vaultStrategies[_strategyId];

        require(position.shares > 0, "No position found");

        // Calculate pending rewards
        uint256 pendingRewards = _calculatePendingRewards(_strategyId, msg.sender);
        require(pendingRewards > 0, "No rewards to claim");

        // Calculate performance fee
        uint256 fee = (pendingRewards * strategy.performanceFee) / 10000;
        uint256 userRewards = pendingRewards - fee;

        // Update position
        position.accumulatedRewards += userRewards;
        position.lastClaimTime = block.timestamp;

        // Collect performance fee
        if (fee > 0) {
            require(agriCreditToken.transfer(owner(), fee), "Fee transfer failed");
            emit PerformanceFeeCollected(_strategyId, fee);
        }

        // Transfer rewards
        require(agriCreditToken.transfer(msg.sender, userRewards), "Reward transfer failed");

        emit RewardsClaimed(_strategyId, msg.sender, userRewards);
    }

    function autoCompound(uint256 _strategyId) external {
        UserPosition storage position = userPositions[_strategyId][msg.sender];
        AutoCompoundSettings memory settings = userAutoCompoundSettings[msg.sender];

        require(position.autoCompound, "Auto-compound not enabled");
        require(position.shares > 0, "No position found");
        require(block.timestamp >= position.lastClaimTime + settings.compoundFrequency, "Compound too frequent");

        // Calculate pending rewards
        uint256 pendingRewards = _calculatePendingRewards(_strategyId, msg.sender);
        require(pendingRewards >= settings.minRewardThreshold, "Rewards below threshold");

        // Apply slippage check (simplified)
        uint256 expectedShares = (pendingRewards * vaultStrategies[_strategyId].totalShares) / vaultStrategies[_strategyId].totalDeposits;
        // In practice, you'd check against oracle price feeds

        if (settings.reinvestRewards) {
            // Reinvest rewards as new deposit
            _reinvestRewards(_strategyId, pendingRewards);
        }

        position.lastClaimTime = block.timestamp;

        emit AutoCompounded(_strategyId, msg.sender, pendingRewards, expectedShares);
    }

    function _reinvestRewards(uint256 _strategyId, uint256 _rewards) internal {
        UserPosition storage position = userPositions[_strategyId][msg.sender];
        VaultStrategy storage strategy = vaultStrategies[_strategyId];

        // Calculate new shares
        uint256 newShares = (_rewards * strategy.totalShares) / strategy.totalDeposits;

        // Update position
        position.shares += newShares;
        position.depositAmount += _rewards;
        position.accumulatedRewards += _rewards;

        // Update strategy totals
        strategy.totalDeposits += _rewards;
        strategy.totalShares += newShares;
        totalValueLocked += _rewards;

        // Re-allocate to protocols
        _allocateToProtocols(_strategyId, _rewards);
    }

    function updateAutoCompoundSettings(
        uint256 _minRewardThreshold,
        uint256 _maxSlippage,
        uint256 _compoundFrequency,
        bool _reinvestRewards
    ) external {
        userAutoCompoundSettings[msg.sender] = AutoCompoundSettings({
            minRewardThreshold: _minRewardThreshold,
            maxSlippage: _maxSlippage,
            compoundFrequency: _compoundFrequency,
            reinvestRewards: _reinvestRewards
        });
    }

    // ============ PROTOCOL ALLOCATION LOGIC ============

    function _allocateToProtocols(uint256 _strategyId, uint256 _amount) internal {
        VaultStrategy storage strategy = vaultStrategies[_strategyId];

        for (uint256 i = 0; i < strategy.protocols.length; i++) {
            uint256 allocationAmount = (_amount * strategy.allocationPercentages[i]) / 10000;

            if (allocationAmount > 0) {
                // Allocate to different protocols based on address
                if (strategy.protocols[i] == address(liquidityPool)) {
                    // Add liquidity to pool
                    require(agriCreditToken.approve(address(liquidityPool), allocationAmount), "Approval failed");
                    // Note: This would need to be adapted based on actual pool interface
                } else if (strategy.protocols[i] == address(yieldToken)) {
                    // Stake in yield farming
                    require(agriCreditToken.approve(address(yieldToken), allocationAmount), "Approval failed");
                    // Note: This would need to be adapted based on actual yield token interface
                }
                // Add more protocol integrations as needed
            }
        }
    }

    function _withdrawFromProtocols(uint256 _strategyId, uint256 _amount) internal {
        VaultStrategy storage strategy = vaultStrategies[_strategyId];

        for (uint256 i = 0; i < strategy.protocols.length; i++) {
            uint256 withdrawAmount = (_amount * strategy.allocationPercentages[i]) / 10000;

            if (withdrawAmount > 0) {
                // Withdraw from protocols
                if (strategy.protocols[i] == address(liquidityPool)) {
                    // Remove liquidity from pool
                    // Implementation depends on pool interface
                } else if (strategy.protocols[i] == address(yieldToken)) {
                    // Unstake from yield farming
                    // Implementation depends on yield token interface
                }
            }
        }
    }

    // ============ REWARDS CALCULATION ============

    function _calculatePendingRewards(uint256 _strategyId, address _user) internal view returns (uint256) {
        UserPosition memory position = userPositions[_strategyId][msg.sender];
        VaultStrategy memory strategy = vaultStrategies[_strategyId];

        if (position.shares == 0) return 0;

        uint256 timeElapsed = block.timestamp - position.lastClaimTime;
        if (timeElapsed == 0) return 0;

        // Calculate rewards based on APY and position
        uint256 annualRewards = (position.depositAmount * strategy.apy) / 10000;
        uint256 pendingRewards = (annualRewards * timeElapsed) / 365 days;

        return pendingRewards;
    }

    // ============ VIEW FUNCTIONS ============

    function getStrategyInfo(uint256 _strategyId) external view returns (
        string memory name,
        string memory description,
        uint256 totalDeposits,
        uint256 totalShares,
        uint256 apy,
        bool active
    ) {
        VaultStrategy storage strategy = vaultStrategies[_strategyId];
        return (
            strategy.name,
            strategy.description,
            strategy.totalDeposits,
            strategy.totalShares,
            strategy.apy,
            strategy.active
        );
    }

    function getUserPosition(uint256 _strategyId, address _user) external view returns (
        uint256 shares,
        uint256 depositAmount,
        uint256 depositTime,
        uint256 lockExpiry,
        uint256 pendingRewards,
        bool autoCompound
    ) {
        UserPosition memory position = userPositions[_strategyId][_user];
        uint256 pendingRewards = _calculatePendingRewards(_strategyId, _user);

        return (
            position.shares,
            position.depositAmount,
            position.depositTime,
            position.lockExpiry,
            pendingRewards,
            position.autoCompound
        );
    }

    function getStrategyAllocations(uint256 _strategyId) external view returns (
        address[] memory protocols,
        uint256[] memory percentages
    ) {
        VaultStrategy storage strategy = vaultStrategies[_strategyId];
        return (strategy.protocols, strategy.allocationPercentages);
    }

    function canWithdraw(uint256 _strategyId, address _user) external view returns (bool) {
        UserPosition memory position = userPositions[_strategyId][_user];
        return block.timestamp >= position.lockExpiry && position.shares > 0;
    }

    function getAutoCompoundSettings(address _user) external view returns (AutoCompoundSettings memory) {
        return userAutoCompoundSettings[_user];
    }

    // ============ AI-ENHANCED YIELD OPTIMIZATION ============

    function predictYieldWithAI(uint256 _strategyId) external returns (uint256 predictedAPY, uint256 confidenceScore, uint256 recommendedAllocation) {
        VaultStrategy storage strategy = vaultStrategies[_strategyId];

        // Get AI prediction from decentralized oracle
        (uint256 aiPrediction, , ) = decentralizedOracle.getLatestData(
            DecentralizedOracle.DataType.AIModel,
            "yield_prediction",
            string(abi.encodePacked("strategy_", _strategyId, "_yield"))
        );

        // Parse AI prediction
        predictedAPY = aiPrediction % 100000; // Up to 1000% APY
        confidenceScore = (aiPrediction / 100000) % 101; // 0-100 confidence
        recommendedAllocation = (aiPrediction / 10000000) % 10001; // 0-100% allocation

        // Store prediction
        aiYieldPredictions[_strategyId] = AIYieldPrediction({
            strategyId: _strategyId,
            predictedAPY: predictedAPY,
            confidenceScore: confidenceScore,
            recommendedAllocation: recommendedAllocation,
            timestamp: block.timestamp
        });

        emit AIYieldPredicted(_strategyId, predictedAPY, confidenceScore, recommendedAllocation);
    }

    function getAIYieldPrediction(uint256 _strategyId) external view returns (AIYieldPrediction memory) {
        return aiYieldPredictions[_strategyId];
    }

    // ============ CROSS-CHAIN YIELD FARMING ============

    function createCrossChainPosition(
        uint256 _sourceChainId,
        uint256 _strategyId,
        uint256 _amount
    ) external payable returns (uint256) {
        require(msg.value == _amount, "Incorrect deposit amount");
        VaultStrategy storage strategy = vaultStrategies[_strategyId];
        require(strategy.active, "Strategy not active");

        // Calculate shares
        uint256 shares = strategy.totalShares == 0 ? _amount : (_amount * strategy.totalShares) / strategy.totalDeposits;

        CrossChainPosition memory position = CrossChainPosition({
            sourceChainId: _sourceChainId,
            strategyId: _strategyId,
            shares: shares,
            depositAmount: _amount,
            bridgeTxHash: bytes32(0), // To be set by bridge
            active: true
        });

        crossChainPositions[msg.sender].push(position);

        // Update strategy totals
        strategy.totalDeposits += _amount;
        strategy.totalShares += shares;
        totalValueLocked += _amount;

        emit CrossChainPositionCreated(msg.sender, _sourceChainId, _strategyId, _amount, shares);
        return crossChainPositions[msg.sender].length - 1; // Return position index
    }

    function claimCrossChainRewards(uint256 _positionIndex, bytes memory _proof) external nonReentrant {
        CrossChainPosition storage position = crossChainPositions[msg.sender][_positionIndex];
        require(position.active, "Position not active");

        // Verify cross-chain proof (simplified)
        require(_proof.length > 0, "Invalid proof");

        // Calculate rewards (simplified)
        uint256 rewards = (position.depositAmount * vaultStrategies[position.strategyId].apy * 30) / (10000 * 365); // 30 days rewards

        position.active = false;

        payable(msg.sender).transfer(rewards);

        emit CrossChainRewardsClaimed(msg.sender, _positionIndex, rewards);
    }

    function getCrossChainPositions(address _user) external view returns (CrossChainPosition[] memory) {
        return crossChainPositions[_user];
    }

    // ============ ADMIN FUNCTIONS ============

    function updateVaultParameters(
        uint256 _performanceFee,
        uint256 _minDepositAmount,
        uint256 _rebalanceCooldown,
        uint256 _maxStrategiesPerUser
    ) external onlyOwner {
        performanceFee = _performanceFee;
        minDepositAmount = _minDepositAmount;
        rebalanceCooldown = _rebalanceCooldown;
        maxStrategiesPerUser = _maxStrategiesPerUser;
    }

    function setStrategyStatus(uint256 _strategyId, bool _active) external onlyOwner {
        vaultStrategies[_strategyId].active = _active;
    }

    function updateStrategyAPY(uint256 _strategyId, uint256 _newAPY) external onlyOwner {
        vaultStrategies[_strategyId].apy = _newAPY;
    }

    function emergencyWithdraw(uint256 _strategyId, address _user) external onlyOwner {
        UserPosition storage position = userPositions[_strategyId][_user];
        VaultStrategy storage strategy = vaultStrategies[_strategyId];

        require(position.shares > 0, "No position found");

        uint256 withdrawAmount = position.depositAmount;

        // Update totals
        strategy.totalDeposits -= withdrawAmount;
        strategy.totalShares -= position.shares;
        totalValueLocked -= withdrawAmount;

        // Reset position
        position.shares = 0;
        position.depositAmount = 0;

        // Transfer tokens back
        require(agriCreditToken.transfer(_user, withdrawAmount), "Emergency transfer failed");
    }

    // Global auto-compounding trigger (can be called by keepers)
    function triggerGlobalAutoCompound() external {
        require(block.timestamp >= lastGlobalCompound + 1 hours, "Too frequent");

        // This would iterate through all users and trigger auto-compounding
        // Implementation depends on gas limits and user tracking

        lastGlobalCompound = block.timestamp;
    }
}