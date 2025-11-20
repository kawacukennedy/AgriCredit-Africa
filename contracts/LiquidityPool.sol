// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./CarbonToken.sol";

contract LiquidityPool is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    struct Pool {
        IERC20 token;
        uint256 totalLiquidity;
        uint256 totalBorrowed;
        uint256 interestRate; // in basis points (e.g., 500 = 5%)
        uint256 lastUpdateTime;
        bool active;
    }

    struct AMMPool {
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalLiquidity;
        uint256 fee; // in basis points (e.g., 30 = 0.3%)
        bool active;
    }

    struct YieldFarm {
        address stakingToken;
        address rewardToken;
        uint256 totalStaked;
        uint256 rewardRate; // rewards per second
        uint256 lastRewardTime;
        uint256 rewardPerTokenStored;
        mapping(address => uint256) userRewardPerTokenPaid;
        mapping(address => uint256) userRewards;
        mapping(address => uint256) userStakes;
    }

    // Enhanced features
    struct ImpermanentLossProtection {
        uint256 protectionPeriod; // in seconds
        uint256 maxProtection; // in basis points (e.g., 5000 = 50%)
        uint256 protectionFee; // fee for IL protection
    }

    struct DynamicFee {
        uint256 baseFee;
        uint256 volatilityMultiplier;
        uint256 volumeMultiplier;
        uint256 lastUpdateTime;
    }

    struct CrossChainLiquidity {
        uint256 chainId;
        address remotePool;
        uint256 lockedLiquidity;
        bool active;
    }

    mapping(address => ImpermanentLossProtection) public ilProtections;
    mapping(bytes32 => DynamicFee) public dynamicFees;
    mapping(uint256 => CrossChainLiquidity) public crossChainPools;

    uint256 public totalCrossChainLiquidity;
    uint256 public ilProtectionFund;

    mapping(address => Pool) public pools;
    address[] public supportedTokens;

    // AMM pools
    mapping(bytes32 => AMMPool) public ammPools; // keccak256(abi.encodePacked(tokenA, tokenB)) => pool
    mapping(address => bytes32[]) public userAMMLiquidity; // user => pool hashes

    // Yield farming
    mapping(address => YieldFarm) public yieldFarms;
    address[] public farmingTokens;

    CarbonToken public carbonToken;

    // User liquidity positions
    mapping(address => mapping(address => uint256)) public userLiquidity; // user => token => amount

    // Events
    event PoolCreated(address indexed token, uint256 interestRate);
    event LiquidityAdded(address indexed user, address indexed token, uint256 amount);
    event LiquidityRemoved(address indexed user, address indexed token, uint256 amount);
    event LoanIssued(address indexed borrower, address indexed token, uint256 amount);
    event AMMPoolCreated(address indexed tokenA, address indexed tokenB, uint256 fee);
    event AMMLiquidityAdded(address indexed user, bytes32 indexed poolHash, uint256 amountA, uint256 amountB, uint256 liquidity);
    event AMMLiquidityRemoved(address indexed user, bytes32 indexed poolHash, uint256 amountA, uint256 amountB, uint256 liquidity);
    event AMMSwap(address indexed user, bytes32 indexed poolHash, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);
    event YieldFarmCreated(address indexed stakingToken, address indexed rewardToken, uint256 rewardRate);
    event FarmStaked(address indexed user, address indexed token, uint256 amount);
    event FarmUnstaked(address indexed user, address indexed token, uint256 amount);
    event FarmRewardsClaimed(address indexed user, address indexed token, uint256 amount);
    event FarmRewardRateUpdated(address indexed token, uint256 newRate);
    event ILProtectionPurchased(address indexed user, bytes32 indexed poolHash, uint256 protectionAmount);
    event CrossChainLiquidityBridged(uint256 indexed chainId, address indexed token, uint256 amount);
    event DynamicFeeUpdated(bytes32 indexed poolHash, uint256 newFee);
    event CrossChainMessageSent(uint256 indexed messageId, uint256 indexed targetChainId, address indexed targetContract);
    event CrossChainMessageReceived(uint256 indexed messageId, uint256 indexed sourceChainId, address indexed sender);
    event CrossChainBridgeSet(address indexed bridge);
    event LoanRepaid(uint256 indexed loanId, uint256 amount);

    // Cross-chain bridge interface
    interface ICrossChainBridge {
        function sendMessage(uint256 targetChainId, address targetContract, bytes calldata message) external;
        function receiveMessage(bytes calldata message) external;
    }

    struct CrossChainMessage {
        uint256 messageId;
        uint256 sourceChainId;
        uint256 targetChainId;
        address sender;
        bytes data;
        uint256 timestamp;
        bool executed;
    }

    mapping(uint256 => CrossChainMessage) public crossChainMessages;
    uint256 public nextMessageId = 1;

    ICrossChainBridge public crossChainBridge;

    function initialize(address _carbonToken, address _crossChainBridge) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        carbonToken = CarbonToken(_carbonToken);
        crossChainBridge = ICrossChainBridge(_crossChainBridge);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @dev Create a new liquidity pool for a token
     * @param token Address of the ERC20 token
     * @param interestRate Annual interest rate in basis points
     */
    function createPool(address token, uint256 interestRate) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(pools[token].token == IERC20(address(0)), "Pool already exists");
        require(interestRate > 0 && interestRate <= 2000, "Invalid interest rate"); // Max 20%

        pools[token] = Pool({
            token: IERC20(token),
            totalLiquidity: 0,
            totalBorrowed: 0,
            interestRate: interestRate,
            lastUpdateTime: block.timestamp,
            active: true
        });

        supportedTokens.push(token);

        emit PoolCreated(token, interestRate);
    }

    /**
     * @dev Add liquidity to a pool
     * @param token Token address
     * @param amount Amount to add
     */
    function addLiquidity(address token, uint256 amount) external nonReentrant {
        require(pools[token].active, "Pool not active");
        require(amount > 0, "Amount must be > 0");

        Pool storage pool = pools[token];

        // Transfer tokens from user
        require(pool.token.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        // Update pool and user balances
        pool.totalLiquidity += amount;
        userLiquidity[msg.sender][token] += amount;

        emit LiquidityAdded(msg.sender, token, amount);
    }

    /**
     * @dev Remove liquidity from a pool
     * @param token Token address
     * @param amount Amount to remove
     */
    function removeLiquidity(address token, uint256 amount) external nonReentrant {
        require(pools[token].active, "Pool not active");
        require(userLiquidity[msg.sender][token] >= amount, "Insufficient liquidity");

        Pool storage pool = pools[token];
        require(pool.totalLiquidity >= amount, "Insufficient pool liquidity");

        userLiquidity[msg.sender][token] -= amount;
        pool.totalLiquidity -= amount;

        require(pool.token.transfer(msg.sender, amount), "Transfer failed");

        emit LiquidityRemoved(msg.sender, token, amount);
    }

    // Impermanent Loss Protection
    function purchaseILProtection(bytes32 poolHash, uint256 protectionAmount) external payable {
        AMMPool storage pool = ammPools[poolHash];
        require(pool.active, "Pool not active");
        require(protectionAmount > 0, "Invalid protection amount");

        ImpermanentLossProtection storage protection = ilProtections[address(uint160(uint256(poolHash)))];
        require(protection.protectionPeriod > 0, "IL protection not available");

        uint256 cost = (protectionAmount * protection.protectionFee) / 10000;
        require(msg.value >= cost, "Insufficient payment");

        // Refund excess
        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }

        ilProtectionFund += cost;

        emit ILProtectionPurchased(msg.sender, poolHash, protectionAmount);
    }

    function claimILProtection(bytes32 poolHash, uint256 liquidityAmount) external {
        // Simplified IL protection claim - in practice, would calculate actual IL
        uint256 protectionAmount = (liquidityAmount * ilProtections[address(uint160(uint256(poolHash)))].maxProtection) / 10000;
        require(protectionAmount > 0, "No protection available");

        // Transfer from protection fund
        require(ilProtectionFund >= protectionAmount, "Insufficient protection fund");
        ilProtectionFund -= protectionAmount;

        payable(msg.sender).transfer(protectionAmount);
    }

    function setILProtection(address poolAddress, uint256 _protectionPeriod, uint256 _maxProtection, uint256 _protectionFee) external onlyOwner {
        ilProtections[poolAddress] = ImpermanentLossProtection({
            protectionPeriod: _protectionPeriod,
            maxProtection: _maxProtection,
            protectionFee: _protectionFee
        });
    }

    // Dynamic Fees
    function updateDynamicFee(bytes32 poolHash) external {
        DynamicFee storage fee = dynamicFees[poolHash];
        require(fee.lastUpdateTime > 0, "Fee not configured");

        // Simplified dynamic fee calculation based on time
        uint256 timeSinceUpdate = block.timestamp - fee.lastUpdateTime;
        uint256 newFee = fee.baseFee + (timeSinceUpdate * fee.volatilityMultiplier) / 1 days;

        newFee = Math.min(newFee, 1000); // Max 10%
        fee.lastUpdateTime = block.timestamp;

        emit DynamicFeeUpdated(poolHash, newFee);
    }

    function setDynamicFee(bytes32 poolHash, uint256 _baseFee, uint256 _volatilityMultiplier, uint256 _volumeMultiplier) external onlyOwner {
        dynamicFees[poolHash] = DynamicFee({
            baseFee: _baseFee,
            volatilityMultiplier: _volatilityMultiplier,
            volumeMultiplier: _volumeMultiplier,
            lastUpdateTime: block.timestamp
        });
    }

    function getDynamicFee(bytes32 poolHash) external view returns (uint256) {
        DynamicFee memory fee = dynamicFees[poolHash];
        if (fee.lastUpdateTime == 0) return 30; // Default 0.3%

        uint256 timeSinceUpdate = block.timestamp - fee.lastUpdateTime;
        uint256 currentFee = fee.baseFee + (timeSinceUpdate * fee.volatilityMultiplier) / 1 days;

        return Math.min(currentFee, 1000); // Max 10%
    }

    // Cross-Chain Liquidity
    function bridgeLiquidity(uint256 chainId, address token, uint256 amount) external onlyOwner {
        require(pools[token].active, "Pool not active");
        require(pools[token].totalLiquidity >= amount, "Insufficient liquidity");

        CrossChainLiquidity storage crossChain = crossChainPools[chainId];
        crossChain.chainId = chainId;
        crossChain.lockedLiquidity += amount;
        crossChain.active = true;

        totalCrossChainLiquidity += amount;
        pools[token].totalLiquidity -= amount;

        emit CrossChainLiquidityBridged(chainId, token, amount);
    }

    function unlockCrossChainLiquidity(uint256 chainId, address token, uint256 amount) external onlyOwner {
        CrossChainLiquidity storage crossChain = crossChainPools[chainId];
        require(crossChain.lockedLiquidity >= amount, "Insufficient locked liquidity");

        crossChain.lockedLiquidity -= amount;
        totalCrossChainLiquidity -= amount;
        pools[token].totalLiquidity += amount;

        emit CrossChainLiquidityBridged(chainId, token, amount); // Reusing event for unlock
    }

    // Advanced Cross-Chain Messaging
    function sendCrossChainMessage(uint256 targetChainId, address targetContract, bytes calldata message) external onlyOwner {
        require(address(crossChainBridge) != address(0), "Bridge not set");

        uint256 messageId = nextMessageId++;
        crossChainMessages[messageId] = CrossChainMessage({
            messageId: messageId,
            sourceChainId: block.chainid,
            targetChainId: targetChainId,
            sender: msg.sender,
            data: message,
            timestamp: block.timestamp,
            executed: false
        });

        crossChainBridge.sendMessage(targetChainId, targetContract, message);

        emit CrossChainMessageSent(messageId, targetChainId, targetContract);
    }

    function receiveCrossChainMessage(bytes calldata message) external {
        require(msg.sender == address(crossChainBridge), "Only bridge can call");

        // Decode message and execute
        (uint256 messageId, uint256 sourceChainId, address sender, bytes memory data) = abi.decode(message, (uint256, uint256, address, bytes));

        require(!crossChainMessages[messageId].executed, "Message already executed");

        crossChainMessages[messageId] = CrossChainMessage({
            messageId: messageId,
            sourceChainId: sourceChainId,
            targetChainId: block.chainid,
            sender: sender,
            data: data,
            timestamp: block.timestamp,
            executed: true
        });

        // Execute the cross-chain action
        _executeCrossChainAction(data);

        emit CrossChainMessageReceived(messageId, sourceChainId, sender);
    }

    function _executeCrossChainAction(bytes memory data) internal {
        // Decode action type and parameters
        (uint256 actionType, bytes memory actionData) = abi.decode(data, (uint256, bytes));

        if (actionType == 1) {
            // Cross-chain liquidity provision
            (address token, uint256 amount, address user) = abi.decode(actionData, (address, uint256, address));
            _provideCrossChainLiquidity(token, amount, user);
        } else if (actionType == 2) {
            // Cross-chain loan repayment
            (uint256 loanId, uint256 amount) = abi.decode(actionData, (uint256, uint256));
            _processCrossChainRepayment(loanId, amount);
        }
    }

    function _provideCrossChainLiquidity(address token, uint256 amount, address user) internal {
        require(pools[token].active, "Pool not active");

        Pool storage pool = pools[token];
        pool.totalLiquidity += amount;
        userLiquidity[user][token] += amount;

        emit LiquidityAdded(user, token, amount);
    }

    function _processCrossChainRepayment(uint256 loanId, uint256 amount) internal {
        // Simplified cross-chain repayment processing
        // In practice, would interact with LoanManager
        emit LoanRepaid(loanId, amount);
    }

    function setCrossChainBridge(address _bridge) external onlyOwner {
        crossChainBridge = ICrossChainBridge(_bridge);
        emit CrossChainBridgeSet(_bridge);
    }

    function getCrossChainLiquidity(uint256 chainId) external view returns (uint256) {
        return crossChainPools[chainId].lockedLiquidity;
    }
        pools[token].totalLiquidity += amount;
    }

    function setCrossChainPool(uint256 chainId, address remotePool) external onlyOwner {
        crossChainPools[chainId].remotePool = remotePool;
        crossChainPools[chainId].active = true;
    }

    /**
     * @dev Issue loan from pool (called by LoanManager)
     * @param borrower Borrower address
     * @param token Token address
     * @param amount Loan amount
     */
    function issueLoan(address borrower, address token, uint256 amount) external onlyOwner {
        Pool storage pool = pools[token];
        require(pool.active, "Pool not active");
        require(pool.totalLiquidity - pool.totalBorrowed >= amount, "Insufficient liquidity");

        pool.totalBorrowed += amount;

        // Transfer tokens to borrower (LoanManager should handle this)
        require(pool.token.transfer(borrower, amount), "Transfer failed");

        emit LoanIssued(borrower, token, amount);
    }

    /**
     * @dev Repay loan to pool (called by LoanManager)
     * @param borrower Borrower address
     * @param token Token address
     * @param amount Repayment amount
     */
    function repayLoan(address borrower, address token, uint256 amount) external onlyOwner {
        Pool storage pool = pools[token];
        require(pool.totalBorrowed >= amount, "Over-repayment");

        pool.totalBorrowed -= amount;

        // Tokens should already be transferred to this contract by LoanManager
    }

    /**
     * @dev Get pool utilization rate in basis points
     * @param token Token address
     */
    function getUtilizationRate(address token) external view returns (uint256) {
        Pool memory pool = pools[token];
        if (pool.totalLiquidity == 0) return 0;
        return (pool.totalBorrowed * 10000) / pool.totalLiquidity;
    }

    // ============ AUTOMATED MARKET MAKER FUNCTIONS ============

    function createAMMPool(address tokenA, address tokenB, uint256 fee) external onlyOwner returns (bytes32) {
        require(tokenA != tokenB, "Tokens must be different");
        require(tokenA < tokenB, "TokenA must be less than tokenB"); // Ensure consistent ordering
        require(fee <= 100, "Fee too high"); // Max 1%

        bytes32 poolHash = keccak256(abi.encodePacked(tokenA, tokenB));
        require(ammPools[poolHash].tokenA == address(0), "Pool already exists");

        ammPools[poolHash] = AMMPool({
            tokenA: tokenA,
            tokenB: tokenB,
            reserveA: 0,
            reserveB: 0,
            totalLiquidity: 0,
            fee: fee,
            active: true
        });

        emit AMMPoolCreated(tokenA, tokenB, fee);
        return poolHash;
    }

    function addAMMLiquidity(
        bytes32 poolHash,
        uint256 amountA,
        uint256 amountB,
        uint256 minLiquidity
    ) external nonReentrant returns (uint256) {
        AMMPool storage pool = ammPools[poolHash];
        require(pool.active, "Pool not active");
        require(amountA > 0 && amountB > 0, "Amounts must be > 0");

        uint256 liquidity;

        if (pool.totalLiquidity == 0) {
            // First liquidity provision
            liquidity = Math.sqrt(amountA * amountB);
            require(liquidity >= minLiquidity, "Insufficient liquidity minted");
        } else {
            // Subsequent liquidity provision
            uint256 liquidityA = (amountA * pool.totalLiquidity) / pool.reserveA;
            uint256 liquidityB = (amountB * pool.totalLiquidity) / pool.reserveB;
            liquidity = Math.min(liquidityA, liquidityB);
            require(liquidity >= minLiquidity, "Insufficient liquidity minted");
        }

        // Transfer tokens
        IERC20(pool.tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(pool.tokenB).transferFrom(msg.sender, address(this), amountB);

        // Update reserves and liquidity
        pool.reserveA += amountA;
        pool.reserveB += amountB;
        pool.totalLiquidity += liquidity;

        // Track user liquidity
        userAMMLiquidity[msg.sender].push(poolHash);

        emit AMMLiquidityAdded(msg.sender, poolHash, amountA, amountB, liquidity);
        return liquidity;
    }

    function removeAMMLiquidity(bytes32 poolHash, uint256 liquidity) external nonReentrant {
        AMMPool storage pool = ammPools[poolHash];
        require(pool.active, "Pool not active");
        require(liquidity > 0, "Liquidity must be > 0");

        uint256 amountA = (liquidity * pool.reserveA) / pool.totalLiquidity;
        uint256 amountB = (liquidity * pool.reserveB) / pool.totalLiquidity;

        // Update reserves and liquidity
        pool.reserveA -= amountA;
        pool.reserveB -= amountB;
        pool.totalLiquidity -= liquidity;

        // Transfer tokens back
        IERC20(pool.tokenA).transfer(msg.sender, amountA);
        IERC20(pool.tokenB).transfer(msg.sender, amountB);

        emit AMMLiquidityRemoved(msg.sender, poolHash, amountA, amountB, liquidity);
    }

    function swap(
        bytes32 poolHash,
        address tokenIn,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant returns (uint256) {
        AMMPool storage pool = ammPools[poolHash];
        require(pool.active, "Pool not active");

        bool isTokenA = tokenIn == pool.tokenA;
        require(isTokenA || tokenIn == pool.tokenB, "Invalid token");

        // Calculate output amount with fee
        uint256 amountInWithFee = amountIn * (10000 - pool.fee);
        uint256 numerator = amountInWithFee * (isTokenA ? pool.reserveB : pool.reserveA);
        uint256 denominator = (isTokenA ? pool.reserveA : pool.reserveB) * 10000 + amountInWithFee;
        uint256 amountOut = numerator / denominator;

        require(amountOut >= minAmountOut, "Insufficient output amount");
        require(amountOut <= (isTokenA ? pool.reserveB : pool.reserveA), "Insufficient liquidity");

        // Transfer input token
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);

        // Transfer output token
        address tokenOut = isTokenA ? pool.tokenB : pool.tokenA;
        IERC20(tokenOut).transfer(msg.sender, amountOut);

        // Update reserves
        if (isTokenA) {
            pool.reserveA += amountIn;
            pool.reserveB -= amountOut;
        } else {
            pool.reserveB += amountIn;
            pool.reserveA -= amountOut;
        }

        emit AMMSwap(msg.sender, poolHash, tokenIn, tokenOut, amountIn, amountOut);
        return amountOut;
    }

    function getAMMPool(bytes32 poolHash) external view returns (AMMPool memory) {
        return ammPools[poolHash];
    }

    function getAMMPrice(bytes32 poolHash, address tokenIn, uint256 amountIn) external view returns (uint256) {
        AMMPool memory pool = ammPools[poolHash];
        require(pool.active, "Pool not active");

        bool isTokenA = tokenIn == pool.tokenA;
        require(isTokenA || tokenIn == pool.tokenB, "Invalid token");

        uint256 amountInWithFee = amountIn * (10000 - pool.fee);
        uint256 numerator = amountInWithFee * (isTokenA ? pool.reserveB : pool.reserveA);
        uint256 denominator = (isTokenA ? pool.reserveA : pool.reserveB) * 10000 + amountInWithFee;

        return numerator / denominator;
    }

    // ============ ADVANCED YIELD FARMING FUNCTIONS ============

    function createYieldFarm(
        address stakingToken,
        address rewardToken,
        uint256 rewardRate
    ) external onlyOwner {
        require(stakingToken != address(0), "Invalid staking token");
        require(rewardToken != address(0), "Invalid reward token");
        require(rewardRate > 0, "Reward rate must be > 0");

        YieldFarm storage farm = yieldFarms[stakingToken];
        require(farm.stakingToken == address(0), "Farm already exists");

        farm.stakingToken = stakingToken;
        farm.rewardToken = rewardToken;
        farm.rewardRate = rewardRate;
        farm.lastRewardTime = block.timestamp;

        farmingTokens.push(stakingToken);

        emit YieldFarmCreated(stakingToken, rewardToken, rewardRate);
    }

    function stakeInFarm(address token, uint256 amount) external nonReentrant {
        YieldFarm storage farm = yieldFarms[token];
        require(farm.stakingToken != address(0), "Farm does not exist");
        require(amount > 0, "Amount must be > 0");

        _updateFarmRewards(token);

        // Transfer staking tokens
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        // Update user stake
        farm.userStakes[msg.sender] += amount;
        farm.totalStaked += amount;

        emit FarmStaked(msg.sender, token, amount);
    }

    function unstakeFromFarm(address token, uint256 amount) external nonReentrant {
        YieldFarm storage farm = yieldFarms[token];
        require(farm.userStakes[msg.sender] >= amount, "Insufficient stake");

        _updateFarmRewards(token);

        // Update user stake
        farm.userStakes[msg.sender] -= amount;
        farm.totalStaked -= amount;

        // Transfer staking tokens back
        IERC20(token).transfer(msg.sender, amount);

        emit FarmUnstaked(msg.sender, token, amount);
    }

    function claimFarmRewards(address token) external nonReentrant {
        _updateFarmRewards(token);

        YieldFarm storage farm = yieldFarms[token];
        uint256 rewards = farm.userRewards[msg.sender];
        require(rewards > 0, "No rewards to claim");

        farm.userRewards[msg.sender] = 0;

        // Transfer reward tokens
        IERC20(farm.rewardToken).transfer(msg.sender, rewards);

        emit FarmRewardsClaimed(msg.sender, token, rewards);
    }

    function _updateFarmRewards(address token) internal {
        YieldFarm storage farm = yieldFarms[token];
        uint256 currentTime = block.timestamp;

        if (farm.totalStaked > 0 && currentTime > farm.lastRewardTime) {
            uint256 timeElapsed = currentTime - farm.lastRewardTime;
            uint256 rewards = timeElapsed * farm.rewardRate;

            farm.rewardPerTokenStored += (rewards * 1e18) / farm.totalStaked;
            farm.lastRewardTime = currentTime;
        }

        // Update user rewards
        uint256 userReward = (farm.userStakes[msg.sender] *
            (farm.rewardPerTokenStored - farm.userRewardPerTokenPaid[msg.sender])) / 1e18;
        farm.userRewards[msg.sender] += userReward;
        farm.userRewardPerTokenPaid[msg.sender] = farm.rewardPerTokenStored;
    }

    function getFarmInfo(address token, address user) external view returns (
        uint256 totalStaked,
        uint256 userStaked,
        uint256 userRewards,
        uint256 rewardRate
    ) {
        YieldFarm memory farm = yieldFarms[token];

        // Calculate pending rewards
        uint256 currentTime = block.timestamp;
        uint256 timeElapsed = currentTime - farm.lastRewardTime;
        uint256 pendingRewards = timeElapsed * farm.rewardRate;

        uint256 rewardPerToken = farm.rewardPerTokenStored;
        if (farm.totalStaked > 0) {
            rewardPerToken += (pendingRewards * 1e18) / farm.totalStaked;
        }

        uint256 userReward = farm.userRewards[user] +
            (farm.userStakes[user] * (rewardPerToken - farm.userRewardPerTokenPaid[user])) / 1e18;

        return (farm.totalStaked, farm.userStakes[user], userReward, farm.rewardRate);
    }

    function updateFarmRewardRate(address token, uint256 newRate) external onlyOwner {
        YieldFarm storage farm = yieldFarms[token];
        require(farm.stakingToken != address(0), "Farm does not exist");

        _updateFarmRewards(token);
        farm.rewardRate = newRate;

        emit FarmRewardRateUpdated(token, newRate);
    }

    /**
     * @dev Get pool information
     * @param token Token address
     */
    function getPoolInfo(address token) external view returns (
        uint256 totalLiquidity,
        uint256 totalBorrowed,
        uint256 availableLiquidity,
        uint256 interestRate,
        bool active
    ) {
        Pool memory pool = pools[token];
        return (
            pool.totalLiquidity,
            pool.totalBorrowed,
            pool.totalLiquidity - pool.totalBorrowed,
            pool.interestRate,
            pool.active
        );
    }

    /**
     * @dev Get user's liquidity position
     * @param user User address
     * @param token Token address
     */
    function getUserLiquidity(address user, address token) external view returns (uint256) {
        return userLiquidity[user][token];
    }

    /**
     * @dev Get list of supported tokens
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }
}