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
import "./IdentityRegistry.sol";

contract LendingProtocol is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    struct Loan {
        uint256 id;
        address borrower;
        address lender;
        address collateralToken;
        address loanToken;
        uint256 collateralAmount;
        uint256 loanAmount;
        uint256 interestRate; // in basis points
        uint256 duration;
        uint256 startTime;
        uint256 lastPaymentTime;
        uint256 totalPaid;
        uint256 liquidationPrice;
        LoanStatus status;
    }

    struct CreditProfile {
        uint256 creditScore; // 0-1000
        uint256 totalBorrowed;
        uint256 totalRepaid;
        uint256 activeLoans;
        uint256 defaultedLoans;
        uint256 lastActivity;
        bool isActive;
        mapping(address => uint256) collateralValue; // token => value
    }

    struct LendingPool {
        address token;
        uint256 totalSupplied;
        uint256 totalBorrowed;
        uint256 interestRate; // in basis points
        uint256 utilizationRate; // in basis points
        uint256 lastUpdateTime;
        bool active;
    }

    struct LiquidationData {
        uint256 loanId;
        address liquidator;
        uint256 collateralSeized;
        uint256 debtRepaid;
        uint256 liquidationBonus;
        uint256 timestamp;
    }

    enum LoanStatus { Active, Repaid, Defaulted, Liquidated }

    // Core contracts
    DecentralizedOracle public oracle;
    IdentityRegistry public identityRegistry;

    // Loans
    mapping(uint256 => Loan) public loans;
    uint256 public nextLoanId = 1;

    // Credit profiles
    mapping(address => CreditProfile) public creditProfiles;

    // Lending pools
    mapping(address => LendingPool) public lendingPools;
    address[] public supportedTokens;

    // Liquidations
    mapping(uint256 => LiquidationData) public liquidations;
    uint256 public nextLiquidationId = 1;

    // Protocol parameters
    uint256 public minCollateralRatio = 15000; // 150% in basis points
    uint256 public liquidationBonus = 500; // 5% bonus for liquidators
    uint256 public maxLoanToValue = 7500; // 75% LTV
    uint256 public interestRateUpdatePeriod = 1 hours;
    uint256 public creditScoreUpdatePeriod = 7 days;

    // Fee collection
    uint256 public protocolFee = 100; // 1% in basis points
    uint256 public collectedFees;

    // Emergency controls
    bool public emergencyPause;
    mapping(address => bool) public emergencyAdmins;

    // Events
    event LoanCreated(uint256 indexed loanId, address indexed borrower, address indexed lender, uint256 amount);
    event LoanRepaid(uint256 indexed loanId, uint256 amount);
    event LoanLiquidated(uint256 indexed loanId, address indexed liquidator, uint256 collateralSeized);
    event CreditScoreUpdated(address indexed user, uint256 newScore);
    event LendingPoolUpdated(address indexed token, uint256 newRate);
    event CollateralDeposited(address indexed user, address indexed token, uint256 amount);
    event CollateralWithdrawn(address indexed user, address indexed token, uint256 amount);

    function initialize(
        address _oracle,
        address _identityRegistry
    ) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        oracle = DecentralizedOracle(_oracle);
        identityRegistry = IdentityRegistry(_identityRegistry);

        emergencyAdmins[msg.sender] = true;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ============ LENDING POOL MANAGEMENT ============

    function createLendingPool(
        address _token,
        uint256 _initialRate
    ) external onlyOwner {
        require(lendingPools[_token].token == address(0), "Pool already exists");

        lendingPools[_token] = LendingPool({
            token: _token,
            totalSupplied: 0,
            totalBorrowed: 0,
            interestRate: _initialRate,
            utilizationRate: 0,
            lastUpdateTime: block.timestamp,
            active: true
        });

        supportedTokens.push(_token);

        emit LendingPoolUpdated(_token, _initialRate);
    }

    function depositToPool(address _token, uint256 _amount) external nonReentrant {
        LendingPool storage pool = lendingPools[_token];
        require(pool.active, "Pool not active");

        // Transfer tokens
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        pool.totalSupplied += _amount;
        _updatePoolInterestRate(_token);

        emit CollateralDeposited(msg.sender, _token, _amount);
    }

    function withdrawFromPool(address _token, uint256 _amount) external nonReentrant {
        LendingPool storage pool = lendingPools[_token];
        require(pool.active, "Pool not active");

        uint256 availableLiquidity = pool.totalSupplied - pool.totalBorrowed;
        require(availableLiquidity >= _amount, "Insufficient liquidity");

        pool.totalSupplied -= _amount;
        _updatePoolInterestRate(_token);

        // Transfer tokens back
        IERC20(_token).safeTransfer(msg.sender, _amount);

        emit CollateralWithdrawn(msg.sender, _token, _amount);
    }

    function _updatePoolInterestRate(address _token) internal {
        LendingPool storage pool = lendingPools[_token];

        if (block.timestamp < pool.lastUpdateTime + interestRateUpdatePeriod) {
            return;
        }

        // Calculate utilization rate
        uint256 utilization = pool.totalSupplied > 0 ?
            (pool.totalBorrowed * 10000) / pool.totalSupplied : 0;

        pool.utilizationRate = utilization;

        // Dynamic interest rate based on utilization
        // Base rate: 2%, increases with utilization
        uint256 baseRate = 200; // 2%
        uint256 utilizationMultiplier = utilization > 8000 ? 400 : (utilization * 50) / 10000; // Up to 4% additional

        pool.interestRate = baseRate + utilizationMultiplier;
        pool.lastUpdateTime = block.timestamp;

        emit LendingPoolUpdated(_token, pool.interestRate);
    }

    // ============ CREDIT SCORING SYSTEM ============

    function updateCreditScore(address _user) public {
        CreditProfile storage profile = creditProfiles[_user];

        if (block.timestamp < profile.lastActivity + creditScoreUpdatePeriod) {
            return;
        }

        // Calculate credit score based on various factors
        uint256 baseScore = 500; // Start at 500

        // Activity bonus
        if (profile.isActive) baseScore += 50;

        // Repayment history
        if (profile.totalRepaid > 0) {
            uint256 repaymentRatio = (profile.totalRepaid * 10000) / (profile.totalRepaid + profile.totalBorrowed);
            baseScore += (repaymentRatio * 200) / 10000; // Up to 200 points
        }

        // Default penalty
        if (profile.defaultedLoans > 0) {
            baseScore -= profile.defaultedLoans * 100; // -100 per default
        }

        // Collateral value bonus
        uint256 totalCollateralValue = _calculateTotalCollateralValue(_user);
        if (totalCollateralValue > 0) {
            uint256 collateralBonus = Math.min(totalCollateralValue / 1000, 100); // Up to 100 points
            baseScore += collateralBonus;
        }

        // Identity verification bonus
        if (_isIdentityVerified(_user)) {
            baseScore += 50;
        }

        // Clamp between 0-1000
        profile.creditScore = Math.max(0, Math.min(1000, baseScore));
        profile.lastActivity = block.timestamp;

        emit CreditScoreUpdated(_user, profile.creditScore);
    }

    function _calculateTotalCollateralValue(address _user) internal view returns (uint256) {
        CreditProfile storage profile = creditProfiles[_user];
        uint256 totalValue = 0;

        for (uint256 i = 0; i < supportedTokens.length; i++) {
            address token = supportedTokens[i];
            uint256 amount = profile.collateralValue[token];
            if (amount > 0) {
                uint256 price = _getTokenPrice(token);
                totalValue += (amount * price) / 1e18;
            }
        }

        return totalValue;
    }

    function _isIdentityVerified(address _user) internal view returns (bool) {
        // Check if user has verified identity in the registry
        try identityRegistry.getSoulboundCredential(_user) returns (uint256) {
            return true;
        } catch {
            return false;
        }
    }

    function _getTokenPrice(address _token) internal view returns (uint256) {
        // Get price from oracle
        try oracle.getLatestData(
            DecentralizedOracle.DataType.MarketSentiment,
            "global",
            string(abi.encodePacked(_token, "_price"))
        ) returns (uint256 price, uint256, uint256) {
            return price;
        } catch {
            return 1e18; // Default to 1 USD if oracle fails
        }
    }

    // ============ LOAN MANAGEMENT ============

    function createLoan(
        address _collateralToken,
        address _loanToken,
        uint256 _collateralAmount,
        uint256 _loanAmount,
        uint256 _duration
    ) external nonReentrant returns (uint256) {
        require(!emergencyPause, "Protocol paused");
        require(lendingPools[_loanToken].active, "Loan token not supported");
        require(_duration >= 1 days && _duration <= 365 days, "Invalid duration");

        // Update credit score
        updateCreditScore(msg.sender);

        CreditProfile storage profile = creditProfiles[msg.sender];
        require(profile.creditScore >= 300, "Credit score too low");

        // Calculate required collateral
        uint256 collateralValue = (_collateralAmount * _getTokenPrice(_collateralToken)) / 1e18;
        uint256 loanValue = (_loanAmount * _getTokenPrice(_loanToken)) / 1e18;
        uint256 requiredCollateralValue = (loanValue * minCollateralRatio) / 10000;

        require(collateralValue >= requiredCollateralValue, "Insufficient collateral");
        require(loanValue <= (collateralValue * maxLoanToValue) / 10000, "Loan too large");

        // Check pool liquidity
        LendingPool storage pool = lendingPools[_loanToken];
        uint256 availableLiquidity = pool.totalSupplied - pool.totalBorrowed;
        require(availableLiquidity >= _loanAmount, "Insufficient pool liquidity");

        // Transfer collateral
        IERC20(_collateralToken).safeTransferFrom(msg.sender, address(this), _collateralAmount);

        // Calculate interest rate based on credit score and duration
        uint256 baseRate = pool.interestRate;
        uint256 creditAdjustment = (1000 - profile.creditScore) / 10; // 0-70 basis points
        uint256 durationAdjustment = _duration >= 90 days ? 0 : 50; // Discount for longer loans
        uint256 finalRate = baseRate + creditAdjustment - durationAdjustment;

        // Calculate liquidation price
        uint256 liquidationRatio = 12000; // 120%
        uint256 liquidationValue = (loanValue * liquidationRatio) / 10000;
        uint256 liquidationPrice = (liquidationValue * 1e18) / _getTokenPrice(_collateralToken);

        uint256 loanId = nextLoanId++;
        loans[loanId] = Loan({
            id: loanId,
            borrower: msg.sender,
            lender: address(this), // Protocol-owned pool
            collateralToken: _collateralToken,
            loanToken: _loanToken,
            collateralAmount: _collateralAmount,
            loanAmount: _loanAmount,
            interestRate: finalRate,
            duration: _duration,
            startTime: block.timestamp,
            lastPaymentTime: block.timestamp,
            totalPaid: 0,
            liquidationPrice: liquidationPrice,
            status: LoanStatus.Active
        });

        // Update pool and profile
        pool.totalBorrowed += _loanAmount;
        profile.totalBorrowed += _loanAmount;
        profile.activeLoans++;
        profile.collateralValue[_collateralToken] += _collateralAmount;

        // Transfer loan tokens
        IERC20(_loanToken).safeTransfer(msg.sender, _loanAmount);

        emit LoanCreated(loanId, msg.sender, address(this), _loanAmount);
        return loanId;
    }

    function repayLoan(uint256 _loanId, uint256 _amount) external nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Active, "Loan not active");
        require(loan.borrower == msg.sender, "Not loan borrower");

        uint256 outstandingAmount = _calculateOutstandingAmount(_loanId);
        require(_amount <= outstandingAmount, "Overpayment");

        // Transfer repayment
        IERC20(loan.loanToken).safeTransferFrom(msg.sender, address(this), _amount);

        // Update loan
        loan.totalPaid += _amount;
        loan.lastPaymentTime = block.timestamp;

        // Update pool
        LendingPool storage pool = lendingPools[loan.loanToken];
        pool.totalBorrowed -= Math.min(_amount, loan.loanAmount);

        // Update credit profile
        CreditProfile storage profile = creditProfiles[msg.sender];
        profile.totalRepaid += _amount;

        // Check if fully repaid
        if (loan.totalPaid >= outstandingAmount) {
            loan.status = LoanStatus.Repaid;

            // Return collateral
            IERC20(loan.collateralToken).safeTransfer(msg.sender, loan.collateralAmount);

            // Update profile
            profile.activeLoans--;
            profile.collateralValue[loan.collateralToken] -= loan.collateralAmount;
        }

        emit LoanRepaid(_loanId, _amount);
    }

    function _calculateOutstandingAmount(uint256 _loanId) internal view returns (uint256) {
        Loan memory loan = loans[_loanId];

        uint256 timeElapsed = block.timestamp - loan.startTime;
        uint256 interest = (loan.loanAmount * loan.interestRate * timeElapsed) / (365 days * 10000);

        return loan.loanAmount + interest - loan.totalPaid;
    }

    // ============ LIQUIDATION SYSTEM ============

    function liquidateLoan(uint256 _loanId) external nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.status == LoanStatus.Active, "Loan not active");

        // Check if loan is undercollateralized
        uint256 collateralValue = (loan.collateralAmount * _getTokenPrice(loan.collateralToken)) / 1e18;
        uint256 outstandingAmount = _calculateOutstandingAmount(_loanId);

        uint256 currentRatio = (collateralValue * 10000) / outstandingAmount;
        require(currentRatio < minCollateralRatio, "Loan not undercollateralized");

        // Calculate liquidation amounts
        uint256 debtToRepay = outstandingAmount;
        uint256 collateralToSeize = (debtToRepay * (10000 + liquidationBonus)) / 10000;
        collateralToSeize = Math.min(collateralToSeize, loan.collateralAmount);

        // Transfer debt repayment from liquidator
        IERC20(loan.loanToken).safeTransferFrom(msg.sender, address(this), debtToRepay);

        // Transfer collateral to liquidator
        IERC20(loan.collateralToken).safeTransfer(msg.sender, collateralToSeize);

        // Update loan
        loan.status = LoanStatus.Liquidated;

        // Update pool
        LendingPool storage pool = lendingPools[loan.loanToken];
        pool.totalBorrowed -= loan.loanAmount;

        // Update credit profile
        CreditProfile storage profile = creditProfiles[loan.borrower];
        profile.activeLoans--;
        profile.defaultedLoans++;
        profile.collateralValue[loan.collateralToken] -= loan.collateralAmount;

        // Record liquidation
        liquidations[nextLiquidationId++] = LiquidationData({
            loanId: _loanId,
            liquidator: msg.sender,
            collateralSeized: collateralToSeize,
            debtRepaid: debtToRepay,
            liquidationBonus: collateralToSeize - (debtToRepay * 1e18 / _getTokenPrice(loan.collateralToken)),
            timestamp: block.timestamp
        });

        emit LoanLiquidated(_loanId, msg.sender, collateralToSeize);
    }

    // ============ VIEW FUNCTIONS ============

    function getLoan(uint256 _loanId) external view returns (Loan memory) {
        return loans[_loanId];
    }

    function getCreditProfile(address _user) external view returns (
        uint256 creditScore,
        uint256 totalBorrowed,
        uint256 totalRepaid,
        uint256 activeLoans,
        uint256 defaultedLoans
    ) {
        CreditProfile storage profile = creditProfiles[_user];
        return (
            profile.creditScore,
            profile.totalBorrowed,
            profile.totalRepaid,
            profile.activeLoans,
            profile.defaultedLoans
        );
    }

    function getLendingPool(address _token) external view returns (LendingPool memory) {
        return lendingPools[_token];
    }

    function getOutstandingLoanAmount(uint256 _loanId) external view returns (uint256) {
        return _calculateOutstandingAmount(_loanId);
    }

    function isLoanHealthy(uint256 _loanId) external view returns (bool) {
        Loan memory loan = loans[_loanId];
        if (loan.status != LoanStatus.Active) return false;

        uint256 collateralValue = (loan.collateralAmount * _getTokenPrice(loan.collateralToken)) / 1e18;
        uint256 outstandingAmount = _calculateOutstandingAmount(_loanId);

        uint256 currentRatio = (collateralValue * 10000) / outstandingAmount;
        return currentRatio >= minCollateralRatio;
    }

    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }

    // ============ ADMIN FUNCTIONS ============

    function setProtocolParameters(
        uint256 _minCollateralRatio,
        uint256 _liquidationBonus,
        uint256 _maxLoanToValue,
        uint256 _protocolFee
    ) external onlyOwner {
        minCollateralRatio = _minCollateralRatio;
        liquidationBonus = _liquidationBonus;
        maxLoanToValue = _maxLoanToValue;
        protocolFee = _protocolFee;
    }

    function setEmergencyPause(bool _paused) external {
        require(emergencyAdmins[msg.sender], "Not emergency admin");
        emergencyPause = _paused;
    }

    function addEmergencyAdmin(address _admin) external onlyOwner {
        emergencyAdmins[_admin] = true;
    }

    function collectProtocolFees() external onlyOwner {
        require(collectedFees > 0, "No fees to collect");

        uint256 amount = collectedFees;
        collectedFees = 0;

        // Transfer to owner (simplified - should use treasury)
        payable(owner()).transfer(amount);
    }
}