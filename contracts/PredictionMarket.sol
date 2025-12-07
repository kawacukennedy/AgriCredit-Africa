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

contract PredictionMarket is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    struct Market {
        uint256 id;
        string question;
        string description;
        string[] outcomes;
        uint256 endTime;
        uint256 resolutionTime;
        address creator;
        MarketStatus status;
        uint256 totalLiquidity;
        uint256 totalVolume;
        address collateralToken;
        uint256 fee; // in basis points
        bytes32 oracleDataKey;
        uint256 winningOutcome;
    }

    struct Position {
        uint256 marketId;
        address user;
        uint256 outcomeIndex;
        uint256 shares;
        uint256 avgPrice;
        uint256 totalInvested;
    }

    struct OutcomePool {
        uint256 totalShares;
        uint256 totalLiquidity;
        mapping(address => uint256) shares;
    }

    enum MarketStatus { Active, Resolved, Cancelled, Paused }

    // Core contracts
    DecentralizedOracle public oracle;

    // Markets
    mapping(uint256 => Market) public markets;
    uint256 public nextMarketId = 1;

    // Outcome pools
    mapping(uint256 => mapping(uint256 => OutcomePool)) public outcomePools; // marketId => outcomeIndex => pool

    // User positions
    mapping(address => Position[]) public userPositions;
    mapping(bytes32 => uint256) public positionHashes; // keccak256(user, marketId, outcomeIndex) => positionIndex

    // Protocol parameters
    uint256 public marketCreationFee = 100 * 10**18; // 100 AGC
    uint256 public tradingFee = 30; // 0.3% in basis points
    uint256 public minLiquidity = 1000 * 10**18; // Minimum liquidity per market
    uint256 public maxOutcomes = 10; // Maximum outcomes per market
    uint256 public resolutionPeriod = 7 days; // Time allowed for resolution

    // Fee collection
    uint256 public collectedFees;
    address public feeRecipient;

    // Emergency controls
    bool public emergencyPause;
    mapping(address => bool) public marketCreators;

    // Events
    event MarketCreated(uint256 indexed marketId, address indexed creator, string question, uint256 endTime);
    event MarketResolved(uint256 indexed marketId, uint256 winningOutcome);
    event PositionOpened(address indexed user, uint256 indexed marketId, uint256 outcomeIndex, uint256 shares, uint256 cost);
    event PositionClosed(address indexed user, uint256 indexed marketId, uint256 outcomeIndex, uint256 shares, uint256 payout);
    event LiquidityAdded(uint256 indexed marketId, address indexed provider, uint256 amount);
    event LiquidityRemoved(uint256 indexed marketId, address indexed provider, uint256 amount);
    event FeesCollected(address indexed recipient, uint256 amount);

    function initialize(address _oracle, address _feeRecipient) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        oracle = DecentralizedOracle(_oracle);
        feeRecipient = _feeRecipient;
        marketCreators[msg.sender] = true;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ============ MARKET CREATION ============

    function createMarket(
        string memory _question,
        string memory _description,
        string[] memory _outcomes,
        uint256 _endTime,
        uint256 _resolutionTime,
        address _collateralToken,
        bytes32 _oracleDataKey
    ) external payable nonReentrant returns (uint256) {
        require(!emergencyPause, "Protocol paused");
        require(marketCreators[msg.sender], "Not authorized to create markets");
        require(msg.value >= marketCreationFee, "Insufficient creation fee");
        require(_outcomes.length >= 2 && _outcomes.length <= maxOutcomes, "Invalid number of outcomes");
        require(_endTime > block.timestamp, "End time must be in future");
        require(_resolutionTime > _endTime, "Resolution time must be after end time");

        uint256 marketId = nextMarketId++;
        markets[marketId] = Market({
            id: marketId,
            question: _question,
            description: _description,
            outcomes: _outcomes,
            endTime: _endTime,
            resolutionTime: _resolutionTime,
            creator: msg.sender,
            status: MarketStatus.Active,
            totalLiquidity: 0,
            totalVolume: 0,
            collateralToken: _collateralToken,
            fee: tradingFee,
            oracleDataKey: _oracleDataKey,
            winningOutcome: 0
        });

        // Collect creation fee
        collectedFees += msg.value;

        emit MarketCreated(marketId, msg.sender, _question, _endTime);
        return marketId;
    }

    // ============ LIQUIDITY MANAGEMENT ============

    function addLiquidity(uint256 _marketId, uint256 _amount) external nonReentrant {
        Market storage market = markets[_marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(block.timestamp < market.endTime, "Market ended");

        // Transfer tokens
        IERC20(market.collateralToken).safeTransferFrom(msg.sender, address(this), _amount);

        // Distribute liquidity equally among outcomes
        uint256 liquidityPerOutcome = _amount / market.outcomes.length;

        for (uint256 i = 0; i < market.outcomes.length; i++) {
            OutcomePool storage pool = outcomePools[_marketId][i];
            pool.totalLiquidity += liquidityPerOutcome;
        }

        market.totalLiquidity += _amount;

        emit LiquidityAdded(_marketId, msg.sender, _amount);
    }

    function removeLiquidity(uint256 _marketId, uint256 _amount) external nonReentrant {
        Market storage market = markets[_marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(block.timestamp < market.endTime, "Market ended");
        require(_amount <= market.totalLiquidity, "Insufficient liquidity");

        // Calculate share per outcome
        uint256 liquidityPerOutcome = _amount / market.outcomes.length;

        for (uint256 i = 0; i < market.outcomes.length; i++) {
            OutcomePool storage pool = outcomePools[_marketId][i];
            require(liquidityPerOutcome <= pool.totalLiquidity, "Insufficient outcome liquidity");
            pool.totalLiquidity -= liquidityPerOutcome;
        }

        market.totalLiquidity -= _amount;

        // Transfer tokens back
        IERC20(market.collateralToken).safeTransfer(msg.sender, _amount);

        emit LiquidityRemoved(_marketId, msg.sender, _amount);
    }

    // ============ TRADING ============

    function buyShares(
        uint256 _marketId,
        uint256 _outcomeIndex,
        uint256 _maxCost
    ) external nonReentrant returns (uint256 shares, uint256 totalCost) {
        Market storage market = markets[_marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(block.timestamp < market.endTime, "Market ended");
        require(_outcomeIndex < market.outcomes.length, "Invalid outcome");

        OutcomePool storage outcomePool = outcomePools[_marketId][_outcomeIndex];

        // Calculate current price and shares
        (uint256 price, uint256 availableShares) = _calculatePriceAndShares(_marketId, _outcomeIndex, 1 ether);

        // Calculate how many shares we can buy with maxCost
        shares = (_maxCost * 1 ether) / price;
        shares = Math.min(shares, availableShares);

        if (shares == 0) return (0, 0);

        totalCost = (shares * price) / 1 ether;

        // Apply trading fee
        uint256 fee = (totalCost * market.fee) / 10000;
        uint256 costAfterFee = totalCost - fee;

        // Transfer tokens
        IERC20(market.collateralToken).safeTransferFrom(msg.sender, address(this), totalCost);

        // Update outcome pool
        outcomePool.totalShares += shares;
        outcomePool.shares[msg.sender] += shares;

        // Update market
        market.totalVolume += totalCost;

        // Collect fee
        collectedFees += fee;

        // Record position
        _updateUserPosition(_marketId, _outcomeIndex, shares, totalCost, true);

        emit PositionOpened(msg.sender, _marketId, _outcomeIndex, shares, totalCost);
        return (shares, totalCost);
    }

    function sellShares(
        uint256 _marketId,
        uint256 _outcomeIndex,
        uint256 _shares
    ) external nonReentrant returns (uint256 payout) {
        Market storage market = markets[_marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(block.timestamp < market.endTime, "Market ended");

        OutcomePool storage outcomePool = outcomePools[_marketId][_outcomeIndex];
        require(outcomePool.shares[msg.sender] >= _shares, "Insufficient shares");

        // Calculate current price
        (uint256 price, ) = _calculatePriceAndShares(_marketId, _outcomeIndex, 1 ether);
        payout = (_shares * price) / 1 ether;

        // Apply trading fee
        uint256 fee = (payout * market.fee) / 10000;
        payout -= fee;

        // Update outcome pool
        outcomePool.totalShares -= _shares;
        outcomePool.shares[msg.sender] -= _shares;

        // Update market
        market.totalVolume += payout;

        // Collect fee
        collectedFees += fee;

        // Transfer payout
        IERC20(market.collateralToken).safeTransfer(msg.sender, payout);

        // Update position
        _updateUserPosition(_marketId, _outcomeIndex, _shares, payout, false);

        emit PositionClosed(msg.sender, _marketId, _outcomeIndex, _shares, payout);
        return payout;
    }

    function _calculatePriceAndShares(
        uint256 _marketId,
        uint256 _outcomeIndex,
        uint256 _amount
    ) internal view returns (uint256 price, uint256 shares) {
        Market memory market = markets[_marketId];
        OutcomePool memory outcomePool = outcomePools[_marketId][_outcomeIndex];

        // LMSR (Logarithmic Market Scoring Rule) pricing
        uint256 totalOutcomeLiquidity = 0;
        for (uint256 i = 0; i < market.outcomes.length; i++) {
            totalOutcomeLiquidity += outcomePools[_marketId][i].totalLiquidity;
        }

        if (totalOutcomeLiquidity == 0) return (1 ether, 0);

        // Simplified LMSR calculation
        uint256 b = Math.sqrt(totalOutcomeLiquidity); // Liquidity parameter
        uint256 sumExp = 0;

        for (uint256 i = 0; i < market.outcomes.length; i++) {
            uint256 outcomeShares = outcomePools[_marketId][i].totalShares;
            sumExp += Math.exp(int256(outcomeShares) / int256(b));
        }

        uint256 expOutcome = Math.exp(int256(outcomePool.totalShares + _amount) / int256(b));
        uint256 expOutcomeMinus = Math.exp(int256(outcomePool.totalShares) / int256(b));

        price = (b * Math.log(sumExp + expOutcome - expOutcomeMinus)) * 1 ether / _amount;
        shares = _amount;
    }

    function _updateUserPosition(
        uint256 _marketId,
        uint256 _outcomeIndex,
        uint256 _shares,
        uint256 _cost,
        bool _isBuy
    ) internal {
        bytes32 positionKey = keccak256(abi.encodePacked(msg.sender, _marketId, _outcomeIndex));
        uint256 positionIndex = positionHashes[positionKey];

        if (positionIndex == 0) {
            // Create new position
            positionIndex = userPositions[msg.sender].length;
            userPositions[msg.sender].push(Position({
                marketId: _marketId,
                user: msg.sender,
                outcomeIndex: _outcomeIndex,
                shares: 0,
                avgPrice: 0,
                totalInvested: 0
            }));
            positionHashes[positionKey] = positionIndex + 1; // Store as 1-indexed
        }

        Position storage position = userPositions[msg.sender][positionIndex];

        if (_isBuy) {
            // Update average price for buys
            uint256 totalValue = position.totalInvested + _cost;
            uint256 totalShares = position.shares + _shares;
            position.avgPrice = (totalValue * 1 ether) / totalShares;
            position.totalInvested = totalValue;
            position.shares = totalShares;
        } else {
            // For sells, just reduce shares
            position.shares -= _shares;
            position.totalInvested -= (_cost * position.shares) / (position.shares + _shares);
        }
    }

    // ============ MARKET RESOLUTION ============

    function resolveMarket(uint256 _marketId) external nonReentrant {
        Market storage market = markets[_marketId];
        require(market.status == MarketStatus.Active, "Market not active");
        require(block.timestamp >= market.endTime, "Market not ended");
        require(block.timestamp <= market.resolutionTime, "Resolution period expired");

        // Get outcome from oracle
        (uint256 oracleData, , ) = oracle.getLatestData(
            DecentralizedOracle.DataType.AIModel,
            "prediction_resolution",
            string(abi.encodePacked("market_", _marketId, "_result"))
        );

        // Determine winning outcome (simplified - in practice would decode properly)
        uint256 winningOutcome = oracleData % market.outcomes.length;
        market.winningOutcome = winningOutcome;
        market.status = MarketStatus.Resolved;

        // Distribute winnings
        _distributeWinnings(_marketId, winningOutcome);

        emit MarketResolved(_marketId, winningOutcome);
    }

    function _distributeWinnings(uint256 _marketId, uint256 _winningOutcome) internal {
        Market storage market = markets[_marketId];
        OutcomePool storage winningPool = outcomePools[_marketId][_winningOutcome];

        if (winningPool.totalShares == 0) return;

        // Calculate total losing liquidity
        uint256 totalLosingLiquidity = 0;
        for (uint256 i = 0; i < market.outcomes.length; i++) {
            if (i != _winningOutcome) {
                totalLosingLiquidity += outcomePools[_marketId][i].totalLiquidity;
            }
        }

        // Winners get their share of losing liquidity proportional to their shares
        uint256 totalWinnings = totalLosingLiquidity;
        uint256 totalWinningShares = winningPool.totalShares;

        // This is a simplified distribution - in practice, would iterate through all winners
        // For now, just mark the market as resolved
    }

    function claimWinnings(uint256 _marketId) external nonReentrant {
        Market storage market = markets[_marketId];
        require(market.status == MarketStatus.Resolved, "Market not resolved");

        bytes32 positionKey = keccak256(abi.encodePacked(msg.sender, _marketId, market.winningOutcome));
        uint256 positionIndex = positionHashes[positionKey] - 1; // Convert from 1-indexed

        if (positionIndex >= userPositions[msg.sender].length) return;

        Position storage position = userPositions[msg.sender][positionIndex];
        require(position.shares > 0, "No winning position");

        // Calculate winnings (simplified)
        uint256 winnings = position.shares; // 1:1 payout for simplicity

        // Reset position
        position.shares = 0;

        // Transfer winnings
        IERC20(market.collateralToken).safeTransfer(msg.sender, winnings);

        emit PositionClosed(msg.sender, _marketId, market.winningOutcome, position.shares, winnings);
    }

    // ============ VIEW FUNCTIONS ============

    function getMarket(uint256 _marketId) external view returns (Market memory) {
        return markets[_marketId];
    }

    function getOutcomePool(uint256 _marketId, uint256 _outcomeIndex) external view returns (
        uint256 totalShares,
        uint256 totalLiquidity
    ) {
        OutcomePool storage pool = outcomePools[_marketId][_outcomeIndex];
        return (pool.totalShares, pool.totalLiquidity);
    }

    function getUserPosition(address _user, uint256 _marketId, uint256 _outcomeIndex) external view returns (Position memory) {
        bytes32 positionKey = keccak256(abi.encodePacked(_user, _marketId, _outcomeIndex));
        uint256 positionIndex = positionHashes[positionKey] - 1;

        if (positionIndex >= userPositions[_user].length) {
            return Position(0, address(0), 0, 0, 0, 0);
        }

        return userPositions[_user][positionIndex];
    }

    function getMarketPrice(uint256 _marketId, uint256 _outcomeIndex) external view returns (uint256) {
        (uint256 price, ) = _calculatePriceAndShares(_marketId, _outcomeIndex, 1 ether);
        return price;
    }

    function getUserPositions(address _user) external view returns (Position[] memory) {
        return userPositions[_user];
    }

    // ============ ADMIN FUNCTIONS ============

    function setMarketCreator(address _creator, bool _status) external onlyOwner {
        marketCreators[_creator] = _status;
    }

    function setProtocolParameters(
        uint256 _marketCreationFee,
        uint256 _tradingFee,
        uint256 _minLiquidity,
        uint256 _maxOutcomes
    ) external onlyOwner {
        marketCreationFee = _marketCreationFee;
        tradingFee = _tradingFee;
        minLiquidity = _minLiquidity;
        maxOutcomes = _maxOutcomes;
    }

    function setEmergencyPause(bool _paused) external onlyOwner {
        emergencyPause = _paused;
    }

    function collectFees() external onlyOwner {
        require(collectedFees > 0, "No fees to collect");

        uint256 amount = collectedFees;
        collectedFees = 0;

        payable(feeRecipient).transfer(amount);

        emit FeesCollected(feeRecipient, amount);
    }

    function cancelMarket(uint256 _marketId) external onlyOwner {
        Market storage market = markets[_marketId];
        require(market.status == MarketStatus.Active, "Market not active");

        market.status = MarketStatus.Cancelled;

        // Return liquidity to providers (simplified)
        // In practice, would need to track individual liquidity providers
    }
}