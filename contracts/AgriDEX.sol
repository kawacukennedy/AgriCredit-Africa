// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

// Flash Loan Interface
interface IFlashLoanReceiver {
    function executeOperation(
        address token,
        uint256 amount,
        uint256 fee,
        address initiator,
        bytes calldata params
    ) external returns (bool);
}

contract AgriDEX is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable, IFlashLoanReceiver {
    using SafeERC20 for IERC20;

    struct Order {
        uint256 id;
        address maker;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        uint256 filledAmount;
        uint256 price; // Amount out per amount in, scaled by 10^18
        uint256 expiry;
        bool active;
        OrderType orderType;
    }

    struct LiquidityPool {
        address tokenA;
        address tokenB;
        uint256 reserveA;
        uint256 reserveB;
        uint256 totalLiquidity;
        uint256 fee; // Fee in basis points
        bool active;
    }

    struct LiquidityPosition {
        uint256 poolId;
        address provider;
        uint256 liquidityAmount;
        uint256 tokenAAmount;
        uint256 tokenBAmount;
        uint256 rewards;
    }

    enum OrderType { Limit, Market, StopLoss, TakeProfit }
    enum OrderSide { Buy, Sell }

    // Flash Loan structures
    struct FlashLoanParams {
        address token;
        uint256 amount;
        address borrower;
        bytes data;
    }

    // Advanced order structures
    struct StopLossOrder {
        uint256 orderId;
        uint256 triggerPrice;
        bool isAbove; // true for stop-loss sell when price goes below, false for stop-loss buy when price goes above
    }

    struct TakeProfitOrder {
        uint256 orderId;
        uint256 triggerPrice;
        bool isAbove; // true for take-profit sell when price goes above, false for take-profit buy when price goes below
    }

    // Orders
    mapping(uint256 => Order) public orders;
    uint256 public nextOrderId = 1;

    // Liquidity pools
    mapping(uint256 => LiquidityPool) public liquidityPools;
    mapping(bytes32 => uint256) public poolIds; // keccak256(tokenA, tokenB) => poolId
    uint256 public nextPoolId = 1;

    // Liquidity positions
    mapping(uint256 => LiquidityPosition) public liquidityPositions;
    uint256 public nextPositionId = 1;

    // User positions
    mapping(address => uint256[]) public userOrders;
    mapping(address => uint256[]) public userPositions;

    // Flash loan parameters
    uint256 public flashLoanFee; // Fee in basis points

    // Advanced orders
    mapping(uint256 => StopLossOrder) public stopLossOrders;
    mapping(uint256 => TakeProfitOrder) public takeProfitOrders;
    uint256 public orderCount;

    // Trading parameters
    uint256 public tradingFee = 30; // 0.3% in basis points
    uint256 public maxSlippage = 500; // 5% max slippage
    uint256 public orderExpiry = 30 days;

    // Liquidity mining rewards
    uint256 public rewardRate = 100; // Rewards per second
    uint256 public totalRewardsDistributed;

    // Supported tokens
    mapping(address => bool) public supportedTokens;

    // Events
    event OrderPlaced(uint256 indexed orderId, address indexed maker, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut);
    event OrderFilled(uint256 indexed orderId, address indexed taker, uint256 filledAmount);
    event OrderCancelled(uint256 indexed orderId);
    event LiquidityPoolCreated(uint256 indexed poolId, address tokenA, address tokenB);
    event LiquidityAdded(uint256 indexed positionId, address indexed provider, uint256 poolId, uint256 liquidityAmount);
    event LiquidityRemoved(uint256 indexed positionId, address indexed provider, uint256 poolId, uint256 liquidityAmount);
    event SwapExecuted(address indexed user, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut, uint256 fee);
    event RewardsClaimed(address indexed user, uint256 amount);
    event FlashLoanExecuted(address indexed borrower, address token, uint256 amount, uint256 fee);
    event FlashLoanFeeUpdated(uint256 newFee);
    event StopLossOrderCreated(uint256 indexed orderId, address indexed maker, address tokenIn, address tokenOut, uint256 amountIn, uint256 triggerPrice, bool isAbove);
    event TakeProfitOrderCreated(uint256 indexed orderId, address indexed maker, address tokenIn, address tokenOut, uint256 amountIn, uint256 triggerPrice, bool isAbove);
    event AdvancedOrderExecuted(uint256 indexed orderId, address indexed executor, uint256 executedAmount);

    function initialize() public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ============ FLASH LOAN FUNCTIONALITY ============

    /**
     * @dev Executes a flash loan
     * @param token The token to borrow
     * @param amount The amount to borrow
     * @param params Additional parameters for the flash loan
     */
    function flashLoan(
        address token,
        uint256 amount,
        bytes calldata params
    ) external nonReentrant {
        require(supportedTokens[token], "Token not supported");
        require(amount > 0, "Amount must be greater than 0");

        uint256 balanceBefore = IERC20(token).balanceOf(address(this));
        require(balanceBefore >= amount, "Insufficient liquidity");

        uint256 fee = (amount * flashLoanFee) / 10000; // Fee in basis points
        uint256 totalDebt = amount + fee;

        // Transfer tokens to borrower
        IERC20(token).safeTransfer(msg.sender, amount);

        // Execute borrower's operation
        require(
            IFlashLoanReceiver(msg.sender).executeOperation(token, amount, fee, msg.sender, params),
            "Flash loan execution failed"
        );

        // Check that borrower returned the funds
        uint256 balanceAfter = IERC20(token).balanceOf(address(this));
        require(balanceAfter >= balanceBefore + fee, "Flash loan not repaid");

        emit FlashLoanExecuted(msg.sender, token, amount, fee);
    }

    /**
     * @dev Executes operation for flash loan receiver
     */
    function executeOperation(
        address token,
        uint256 amount,
        uint256 fee,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        // This function should be implemented by contracts inheriting from IFlashLoanReceiver
        // For AgriDEX itself, we don't need to do anything special
        return true;
    }

    /**
     * @dev Sets the flash loan fee
     * @param _fee Fee in basis points (e.g., 9 = 0.09%)
     */
    function setFlashLoanFee(uint256 _fee) external onlyOwner {
        require(_fee <= 100, "Fee too high"); // Max 1%
        flashLoanFee = _fee;
        emit FlashLoanFeeUpdated(_fee);
    }

    // ============ ADVANCED ORDER MANAGEMENT ============

    /**
     * @dev Creates a stop-loss order
     */
    function createStopLossOrder(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 triggerPrice,
        bool isAbove,
        uint256 expiry
    ) external nonReentrant returns (uint256) {
        require(supportedTokens[tokenIn] && supportedTokens[tokenOut], "Tokens not supported");
        require(amountIn > 0, "Amount must be greater than 0");
        require(expiry > block.timestamp, "Expiry must be in future");

        orderCount++;
        uint256 orderId = orderCount;

        orders[orderId] = Order({
            id: orderId,
            maker: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            amountOut: 0, // Will be calculated when triggered
            filledAmount: 0,
            price: triggerPrice,
            expiry: expiry,
            active: true,
            orderType: OrderType.StopLoss
        });

        stopLossOrders[orderId] = StopLossOrder({
            orderId: orderId,
            triggerPrice: triggerPrice,
            isAbove: isAbove
        });

        emit StopLossOrderCreated(orderId, msg.sender, tokenIn, tokenOut, amountIn, triggerPrice, isAbove);
        return orderId;
    }

    /**
     * @dev Creates a take-profit order
     */
    function createTakeProfitOrder(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 triggerPrice,
        bool isAbove,
        uint256 expiry
    ) external nonReentrant returns (uint256) {
        require(supportedTokens[tokenIn] && supportedTokens[tokenOut], "Tokens not supported");
        require(amountIn > 0, "Amount must be greater than 0");
        require(expiry > block.timestamp, "Expiry must be in future");

        orderCount++;
        uint256 orderId = orderCount;

        orders[orderId] = Order({
            id: orderId,
            maker: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            amountOut: 0,
            filledAmount: 0,
            price: triggerPrice,
            expiry: expiry,
            active: true,
            orderType: OrderType.TakeProfit
        });

        takeProfitOrders[orderId] = TakeProfitOrder({
            orderId: orderId,
            triggerPrice: triggerPrice,
            isAbove: isAbove
        });

        emit TakeProfitOrderCreated(orderId, msg.sender, tokenIn, tokenOut, amountIn, triggerPrice, isAbove);
        return orderId;
    }

    /**
     * @dev Checks and executes stop-loss and take-profit orders
     * @param tokenA First token in pair
     * @param tokenB Second token in pair
     * @param currentPrice Current price of tokenA in terms of tokenB
     */
    function checkAndExecuteOrders(
        address tokenA,
        address tokenB,
        uint256 currentPrice
    ) external {
        // Check stop-loss orders
        for (uint256 i = 1; i <= orderCount; i++) {
            if (orders[i].active && orders[i].orderType == OrderType.StopLoss) {
                StopLossOrder memory slo = stopLossOrders[i];
                bool shouldTrigger = slo.isAbove ? (currentPrice >= slo.triggerPrice) : (currentPrice <= slo.triggerPrice);

                if (shouldTrigger && orders[i].expiry > block.timestamp) {
                    _executeOrder(i);
                }
            }
        }

        // Check take-profit orders
        for (uint256 i = 1; i <= orderCount; i++) {
            if (orders[i].active && orders[i].orderType == OrderType.TakeProfit) {
                TakeProfitOrder memory tpo = takeProfitOrders[i];
                bool shouldTrigger = tpo.isAbove ? (currentPrice >= tpo.triggerPrice) : (currentPrice <= tpo.triggerPrice);

                if (shouldTrigger && orders[i].expiry > block.timestamp) {
                    _executeOrder(i);
                }
            }
        }
    }

    // ============ TOKEN MANAGEMENT ============

    function addSupportedToken(address _token) external onlyOwner {
        supportedTokens[_token] = true;
    }

    function removeSupportedToken(address _token) external onlyOwner {
        supportedTokens[_token] = false;
    }

    // ============ ORDER BOOK TRADING ============

    function placeLimitOrder(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _amountOut,
        uint256 _price
    ) external nonReentrant returns (uint256) {
        require(supportedTokens[_tokenIn] && supportedTokens[_tokenOut], "Tokens not supported");
        require(_amountIn > 0 && _amountOut > 0, "Invalid amounts");

        // Transfer tokens to contract
        IERC20(_tokenIn).safeTransferFrom(msg.sender, address(this), _amountIn);

        uint256 orderId = nextOrderId++;
        orders[orderId] = Order({
            id: orderId,
            maker: msg.sender,
            tokenIn: _tokenIn,
            tokenOut: _tokenOut,
            amountIn: _amountIn,
            amountOut: _amountOut,
            filledAmount: 0,
            price: _price,
            expiry: block.timestamp + orderExpiry,
            active: true,
            orderType: OrderType.Limit
        });

        userOrders[msg.sender].push(orderId);

        emit OrderPlaced(orderId, msg.sender, _tokenIn, _tokenOut, _amountIn, _amountOut);
        return orderId;
    }

    function fillOrder(uint256 _orderId, uint256 _fillAmount) external nonReentrant {
        Order storage order = orders[_orderId];
        require(order.active, "Order not active");
        require(block.timestamp <= order.expiry, "Order expired");
        require(_fillAmount <= order.amountIn - order.filledAmount, "Fill amount too high");

        uint256 expectedOut = (_fillAmount * order.amountOut) / order.amountIn;
        uint256 fee = (expectedOut * tradingFee) / 10000;
        uint256 actualOut = expectedOut - fee;

        // Transfer tokens
        IERC20(order.tokenOut).safeTransferFrom(msg.sender, address(this), expectedOut);
        IERC20(order.tokenIn).safeTransfer(msg.sender, _fillAmount);
        IERC20(order.tokenOut).safeTransfer(order.maker, actualOut);

        order.filledAmount += _fillAmount;

        // Deactivate if fully filled
        if (order.filledAmount >= order.amountIn) {
            order.active = false;
        }

        emit OrderFilled(_orderId, msg.sender, _fillAmount);
    }

    function cancelOrder(uint256 _orderId) external nonReentrant {
        Order storage order = orders[_orderId];
        require(order.maker == msg.sender, "Not order maker");
        require(order.active, "Order not active");

        order.active = false;

        // Return remaining tokens
        uint256 remainingAmount = order.amountIn - order.filledAmount;
        if (remainingAmount > 0) {
            IERC20(order.tokenIn).safeTransfer(msg.sender, remainingAmount);
        }

        emit OrderCancelled(_orderId);
    }

    // ============ LIQUIDITY POOLS (AMM) ============

    function createLiquidityPool(
        address _tokenA,
        address _tokenB,
        uint256 _fee
    ) external onlyOwner returns (uint256) {
        require(supportedTokens[_tokenA] && supportedTokens[_tokenB], "Tokens not supported");
        require(_tokenA != _tokenB, "Same tokens");
        require(_fee <= 1000, "Fee too high"); // Max 10%

        bytes32 poolKey = keccak256(abi.encodePacked(_tokenA, _tokenB));
        require(poolIds[poolKey] == 0, "Pool already exists");

        uint256 poolId = nextPoolId++;
        liquidityPools[poolId] = LiquidityPool({
            tokenA: _tokenA,
            tokenB: _tokenB,
            reserveA: 0,
            reserveB: 0,
            totalLiquidity: 0,
            fee: _fee,
            active: true
        });

        poolIds[poolKey] = poolId;

        emit LiquidityPoolCreated(poolId, _tokenA, _tokenB);
        return poolId;
    }

    function addLiquidity(
        uint256 _poolId,
        uint256 _amountA,
        uint256 _amountB
    ) external nonReentrant returns (uint256) {
        LiquidityPool storage pool = liquidityPools[_poolId];
        require(pool.active, "Pool not active");
        require(_amountA > 0 && _amountB > 0, "Invalid amounts");

        // Transfer tokens
        IERC20(pool.tokenA).safeTransferFrom(msg.sender, address(this), _amountA);
        IERC20(pool.tokenB).safeTransferFrom(msg.sender, address(this), _amountB);

        uint256 liquidityAmount;
        if (pool.totalLiquidity == 0) {
            // First liquidity provision
            liquidityAmount = Math.sqrt(_amountA * _amountB);
        } else {
            // Subsequent liquidity provision
            uint256 liquidityA = (_amountA * pool.totalLiquidity) / pool.reserveA;
            uint256 liquidityB = (_amountB * pool.totalLiquidity) / pool.reserveB;
            liquidityAmount = Math.min(liquidityA, liquidityB);
        }

        // Update pool
        pool.reserveA += _amountA;
        pool.reserveB += _amountB;
        pool.totalLiquidity += liquidityAmount;

        // Create position
        uint256 positionId = nextPositionId++;
        liquidityPositions[positionId] = LiquidityPosition({
            poolId: _poolId,
            provider: msg.sender,
            liquidityAmount: liquidityAmount,
            tokenAAmount: _amountA,
            tokenBAmount: _amountB,
            rewards: 0
        });

        userPositions[msg.sender].push(positionId);

        emit LiquidityAdded(positionId, msg.sender, _poolId, liquidityAmount);
        return positionId;
    }

    function removeLiquidity(uint256 _positionId) external nonReentrant {
        LiquidityPosition storage position = liquidityPositions[_positionId];
        require(position.provider == msg.sender, "Not position owner");

        LiquidityPool storage pool = liquidityPools[position.poolId];
        require(pool.active, "Pool not active");

        // Calculate token amounts to return
        uint256 amountA = (position.liquidityAmount * pool.reserveA) / pool.totalLiquidity;
        uint256 amountB = (position.liquidityAmount * pool.reserveB) / pool.totalLiquidity;

        // Update pool
        pool.reserveA -= amountA;
        pool.reserveB -= amountB;
        pool.totalLiquidity -= position.liquidityAmount;

        // Update position
        position.liquidityAmount = 0;

        // Transfer tokens back
        IERC20(pool.tokenA).safeTransfer(msg.sender, amountA);
        IERC20(pool.tokenB).safeTransfer(msg.sender, amountB);

        emit LiquidityRemoved(_positionId, msg.sender, position.poolId, position.liquidityAmount);
    }

    // ============ SWAPPING ============

    function swap(
        uint256 _poolId,
        address _tokenIn,
        uint256 _amountIn,
        uint256 _minAmountOut
    ) public nonReentrant returns (uint256) {
        LiquidityPool storage pool = liquidityPools[_poolId];
        require(pool.active, "Pool not active");

        bool isTokenA = _tokenIn == pool.tokenA;
        require(isTokenA || _tokenIn == pool.tokenB, "Invalid token");

        // Calculate output amount with fee
        uint256 amountInWithFee = _amountIn * (10000 - pool.fee);
        uint256 numerator = amountInWithFee * (isTokenA ? pool.reserveB : pool.reserveA);
        uint256 denominator = (isTokenA ? pool.reserveA : pool.reserveB) * 10000 + amountInWithFee;
        uint256 amountOut = numerator / denominator;

        require(amountOut >= _minAmountOut, "Insufficient output amount");
        require(amountOut <= (isTokenA ? pool.reserveB : pool.reserveA), "Insufficient liquidity");

        // Transfer tokens
        IERC20(_tokenIn).safeTransferFrom(msg.sender, address(this), _amountIn);

        address tokenOut = isTokenA ? pool.tokenB : pool.tokenA;
        IERC20(tokenOut).safeTransfer(msg.sender, amountOut);

        // Update reserves
        if (isTokenA) {
            pool.reserveA += _amountIn;
            pool.reserveB -= amountOut;
        } else {
            pool.reserveB += _amountIn;
            pool.reserveA -= amountOut;
        }

        uint256 fee = (_amountIn * pool.fee) / 10000;
        emit SwapExecuted(msg.sender, _tokenIn, tokenOut, _amountIn, amountOut, fee);
        return amountOut;
    }

    // ============ LIQUIDITY MINING REWARDS ============

    function claimLiquidityRewards(uint256 _positionId) external nonReentrant {
        LiquidityPosition storage position = liquidityPositions[_positionId];
        require(position.provider == msg.sender, "Not position owner");

        // Calculate pending rewards
        uint256 pendingRewards = _calculatePendingRewards(_positionId);
        require(pendingRewards > 0, "No rewards to claim");

        position.rewards += pendingRewards;
        totalRewardsDistributed += pendingRewards;

        // In practice, would mint reward tokens
        // For now, just track the rewards
        emit RewardsClaimed(msg.sender, pendingRewards);
    }

    function _calculatePendingRewards(uint256 _positionId) internal view returns (uint256) {
        LiquidityPosition memory position = liquidityPositions[_positionId];
        LiquidityPool memory pool = liquidityPools[position.poolId];

        if (position.liquidityAmount == 0 || !pool.active) return 0;

        // Simple reward calculation based on liquidity share
        uint256 share = (position.liquidityAmount * 1e18) / pool.totalLiquidity;
        uint256 timeStaked = block.timestamp - position.rewards; // Simplified

        return (share * rewardRate * timeStaked) / 1e18;
    }

    // ============ VIEW FUNCTIONS ============

    function getOrder(uint256 _orderId) external view returns (Order memory) {
        return orders[_orderId];
    }

    function getLiquidityPool(uint256 _poolId) external view returns (LiquidityPool memory) {
        return liquidityPools[_poolId];
    }

    function getPoolId(address _tokenA, address _tokenB) external view returns (uint256) {
        bytes32 poolKey = keccak256(abi.encodePacked(_tokenA, _tokenB));
        return poolIds[poolKey];
    }

    function getLiquidityPosition(uint256 _positionId) external view returns (LiquidityPosition memory) {
        return liquidityPositions[_positionId];
    }

    function getUserOrders(address _user) external view returns (uint256[] memory) {
        return userOrders[_user];
    }

    function getUserPositions(address _user) external view returns (uint256[] memory) {
        return userPositions[_user];
    }

    function getExpectedSwapAmount(
        uint256 _poolId,
        address _tokenIn,
        uint256 _amountIn
    ) public view returns (uint256) {
        LiquidityPool memory pool = liquidityPools[_poolId];

        bool isTokenA = _tokenIn == pool.tokenA;
        require(isTokenA || _tokenIn == pool.tokenB, "Invalid token");

        uint256 amountInWithFee = _amountIn * (10000 - pool.fee);
        uint256 numerator = amountInWithFee * (isTokenA ? pool.reserveB : pool.reserveA);
        uint256 denominator = (isTokenA ? pool.reserveA : pool.reserveB) * 10000 + amountInWithFee;

        return numerator / denominator;
    }

    function _executeOrder(uint256 orderId) internal {
        Order storage order = orders[orderId];
        require(order.active, "Order not active");

        // Find the appropriate AMM pool
        bytes32 poolHash = keccak256(abi.encodePacked(order.tokenIn, order.tokenOut));
        uint256 poolId = poolIds[poolHash];
        if (poolId == 0) {
            // Try reverse order
            poolHash = keccak256(abi.encodePacked(order.tokenOut, order.tokenIn));
            poolId = poolIds[poolHash];
        }

        require(poolId != 0, "No pool found for token pair");
        require(liquidityPools[poolId].active, "Pool not active");

        // Calculate minimum amount out (with slippage protection)
        uint256 expectedOut = getExpectedSwapAmount(poolId, order.tokenIn, order.amountIn);
        uint256 minAmountOut = expectedOut * (10000 - maxSlippage) / 10000;

        // Execute swap
        uint256 amountOut = swap(poolId, order.tokenIn, order.amountIn, minAmountOut);

        // Update order
        order.amountOut = amountOut;
        order.filledAmount = order.amountIn;
        order.active = false;

        emit AdvancedOrderExecuted(orderId, msg.sender, order.amountIn);
    }

    // ============ FLASH LOANS ============

    function flashLoan(
        uint256 _poolId,
        address _token,
        uint256 _amount,
        bytes memory _params
    ) external nonReentrant {
        LiquidityPool storage pool = liquidityPools[_poolId];
        require(pool.active, "Pool not active");
        require(_token == pool.tokenA || _token == pool.tokenB, "Token not in pool");

        uint256 balanceBefore = IERC20(_token).balanceOf(address(this));

        // Check available liquidity
        uint256 availableAmount = _token == pool.tokenA ? pool.reserveA : pool.reserveB;
        require(_amount <= availableAmount, "Insufficient liquidity");

        // Calculate flash loan fee
        uint256 fee = (_amount * 9) / 10000; // 0.09% fee

        // Transfer tokens to borrower
        IERC20(_token).safeTransfer(msg.sender, _amount);

        // Execute borrower's callback
        IFlashLoanReceiver(msg.sender).executeOperation(_token, _amount, fee, msg.sender, _params);

        // Check that tokens were returned
        uint256 balanceAfter = IERC20(_token).balanceOf(address(this));
        require(balanceAfter >= balanceBefore + fee, "Flash loan not repaid");

        // Update pool reserves
        if (_token == pool.tokenA) {
            pool.reserveA = balanceAfter;
        } else {
            pool.reserveB = balanceAfter;
        }

        emit FlashLoanExecuted(msg.sender, _token, _amount, fee);
    }



    // ============ ADMIN FUNCTIONS ============

    function setTradingFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high"); // Max 10%
        tradingFee = _fee;
    }

    function setMaxSlippage(uint256 _slippage) external onlyOwner {
        maxSlippage = _slippage;
    }

    function setOrderExpiry(uint256 _expiry) external onlyOwner {
        orderExpiry = _expiry;
    }

    function setRewardRate(uint256 _rate) external onlyOwner {
        rewardRate = _rate;
    }

    function pausePool(uint256 _poolId) external onlyOwner {
        liquidityPools[_poolId].active = false;
    }

    function unpausePool(uint256 _poolId) external onlyOwner {
        liquidityPools[_poolId].active = true;
    }
}