// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./IdentityRegistry.sol";
import "./LiquidityPool.sol";
import "./YieldToken.sol";

// Interfaces for external contracts
interface IPriceOracle {
    function getPrice(address token) external view returns (uint256);
    function getCollateralRatio(address collateral, address debt) external view returns (uint256);
}

interface IInsurancePool {
    function provideInsurance(uint256 loanId, uint256 coverageAmount) external;
    function claimInsurance(uint256 loanId) external returns (uint256);
    function getInsuranceCost(uint256 coverageAmount, uint256 duration) external view returns (uint256);
}

contract LoanManager is Ownable, ReentrancyGuard, Pausable, ERC2771Context {
    using SafeERC20 for IERC20;

    struct Loan {
        uint256 id;
        address borrower;
        uint256 amount;
        uint256 interestRate; // in basis points (e.g., 850 = 8.5%)
        uint256 duration; // in seconds
        uint256 startTime;
        uint256 repaidAmount;
        uint256 collateralAmount;
        address collateralToken;
        uint256 creditScore; // From AI scoring
        uint256 gracePeriod; // Additional time before default
        bool isActive;
        bool isRepaid;
        bool isDefaulted;
    }

    struct LoanTerms {
        uint256 minAmount;
        uint256 maxAmount;
        uint256 baseInterestRate;
        uint256 duration;
        uint256 collateralRatio; // in basis points
    }

    struct Insurance {
        uint256 loanId;
        uint256 coverageAmount;
        uint256 premium;
        uint256 coveragePeriod;
        bool isActive;
        uint256 startTime;
    }

    struct DynamicRateParams {
        uint256 baseRate;
        uint256 utilizationMultiplier;
        uint256 creditScoreAdjustment;
        uint256 timeBasedDecay; // Rate decreases over time
        uint256 lastUpdateTime;
    }

    IdentityRegistry public identityRegistry;
    LiquidityPool public liquidityPool;
    YieldToken public yieldToken;
    IERC20 public stableToken;
    IPriceOracle public priceOracle;
    IInsurancePool public insurancePool;

    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public userLoans;
    mapping(uint256 => LoanTerms) public loanTerms; // Different terms for different credit scores
    mapping(uint256 => Insurance) public loanInsurance;
    mapping(uint256 => DynamicRateParams) public loanRateParams;

    uint256 public nextLoanId = 1;
    uint256 public totalLoansFunded;
    uint256 public totalRepaid;
    uint256 public totalInsuredAmount;
    uint256 public insuranceUtilizationRate; // in basis points

    // Gas optimization
    uint256 public constant META_TX_GAS_LIMIT = 100000;
    mapping(bytes32 => bool) public executedMetaTx;

    // Constants
    uint256 constant MAX_INTEREST_RATE = 2000; // 20%
    uint256 constant GRACE_PERIOD_DEFAULT = 30 days;
    uint256 constant COLLATERAL_RATIO_DEFAULT = 15000; // 150%

    event LoanCreated(uint256 indexed loanId, address indexed borrower, uint256 amount, uint256 creditScore);
    event LoanRepaid(uint256 indexed loanId, uint256 amount);
    event LoanDefaulted(uint256 indexed loanId);
    event CollateralLiquidated(uint256 indexed loanId, uint256 amount);
    event YieldDistributed(uint256 indexed loanId, address indexed lender, uint256 amount);

    constructor(
        address _identityRegistry,
        address _liquidityPool,
        address _yieldToken,
        address _stableToken,
        address _priceOracle,
        address _insurancePool,
        address trustedForwarder
    ) Ownable(msg.sender) ERC2771Context(trustedForwarder) {
        identityRegistry = IdentityRegistry(_identityRegistry);
        liquidityPool = LiquidityPool(_liquidityPool);
        yieldToken = YieldToken(_yieldToken);
        stableToken = IERC20(_stableToken);
        priceOracle = IPriceOracle(_priceOracle);
        insurancePool = IInsurancePool(_insurancePool);

        // Initialize default loan terms
        _setDefaultLoanTerms();
    }

    function _setDefaultLoanTerms() internal {
        // Low credit score (300-649)
        loanTerms[1] = LoanTerms({
            minAmount: 100 * 10**18, // 100 tokens
            maxAmount: 1000 * 10**18, // 1000 tokens
            baseInterestRate: 1500, // 15%
            duration: 180 days,
            collateralRatio: 20000 // 200%
        });

        // Medium credit score (650-749)
        loanTerms[2] = LoanTerms({
            minAmount: 500 * 10**18,
            maxAmount: 5000 * 10**18,
            baseInterestRate: 1000, // 10%
            duration: 365 days,
            collateralRatio: 15000 // 150%
        });

        // High credit score (750-850)
        loanTerms[3] = LoanTerms({
            minAmount: 1000 * 10**18,
            maxAmount: 10000 * 10**18,
            baseInterestRate: 500, // 5%
            duration: 730 days,
            collateralRatio: 12000 // 120%
        });
    }

    function createLoan(
        address _borrower,
        uint256 _amount,
        uint256 _creditScore,
        address _collateralToken,
        uint256 _collateralAmount
    ) external onlyOwner returns (uint256) {
        require(identityRegistry.isIdentityVerified(_borrower), "Borrower not verified");
        require(_amount > 0, "Amount must be > 0");
        require(_creditScore >= 300 && _creditScore <= 850, "Invalid credit score");

        // Determine loan terms based on credit score
        uint256 tier = _getCreditTier(_creditScore);
        LoanTerms memory terms = loanTerms[tier];

        require(_amount >= terms.minAmount && _amount <= terms.maxAmount, "Amount out of range");

        // Calculate required collateral
        uint256 requiredCollateral = (_amount * terms.collateralRatio) / 10000;
        require(_collateralAmount >= requiredCollateral, "Insufficient collateral");

        // Adjust interest rate based on credit score
        uint256 adjustedRate = _adjustInterestRate(terms.baseInterestRate, _creditScore);

        uint256 loanId = nextLoanId++;
        loans[loanId] = Loan({
            id: loanId,
            borrower: _borrower,
            amount: _amount,
            interestRate: adjustedRate,
            duration: terms.duration,
            startTime: block.timestamp,
            repaidAmount: 0,
            collateralAmount: _collateralAmount,
            collateralToken: _collateralToken,
            creditScore: _creditScore,
            gracePeriod: GRACE_PERIOD_DEFAULT,
            isActive: true,
            isRepaid: false,
            isDefaulted: false
        });

        userLoans[_borrower].push(loanId);

        // Transfer collateral to contract
        IERC20(_collateralToken).safeTransferFrom(_borrower, address(this), _collateralAmount);

        // Fund loan from liquidity pool
        liquidityPool.issueLoan(_borrower, address(stableToken), _amount);

        totalLoansFunded += _amount;

        emit LoanCreated(loanId, _borrower, _amount, _creditScore);
        return loanId;
    }

    function _getCreditTier(uint256 _creditScore) internal pure returns (uint256) {
        if (_creditScore >= 750) return 3;
        if (_creditScore >= 650) return 2;
        return 1;
    }

    function _adjustInterestRate(uint256 _baseRate, uint256 _creditScore) internal pure returns (uint256) {
        // Adjust rate based on credit score deviation from 750
        int256 deviation = int256(_creditScore) - 750;
        int256 adjustment = deviation * 5; // 0.05% per point
        uint256 adjustedRate = uint256(int256(_baseRate) - adjustment);
        return adjustedRate > MAX_INTEREST_RATE ? MAX_INTEREST_RATE : adjustedRate;
    }

    function repayLoan(uint256 _loanId, uint256 _amount) external nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.isActive && !loan.isDefaulted, "Loan not active");
        require(msg.sender == loan.borrower, "Not the borrower");
        require(_amount > 0, "Amount must be > 0");

        uint256 totalOwed = calculateTotalOwed(_loanId);
        uint256 remainingOwed = totalOwed - loan.repaidAmount;
        require(_amount <= remainingOwed, "Overpayment not allowed");

        loan.repaidAmount += _amount;

        // Transfer repayment to liquidity pool
        stableToken.safeTransferFrom(msg.sender, address(liquidityPool), _amount);

        // Notify liquidity pool of repayment
        liquidityPool.repayLoan(msg.sender, address(stableToken), _amount);

        // Distribute yield to lenders (simplified - mint yield tokens to pool)
        uint256 yieldAmount = (_amount * loan.interestRate) / 10000;
        if (yieldAmount > 0) {
            yieldToken.mint(address(liquidityPool), yieldAmount);
            emit YieldDistributed(_loanId, address(liquidityPool), yieldAmount);
        }

        totalRepaid += _amount;

        if (loan.repaidAmount >= totalOwed) {
            loan.isRepaid = true;
            loan.isActive = false;

            // Return collateral
            IERC20(loan.collateralToken).safeTransfer(loan.borrower, loan.collateralAmount);

            emit LoanRepaid(_loanId, loan.repaidAmount);
        }
    }

    function calculateTotalOwed(uint256 _loanId) public view returns (uint256) {
        Loan memory loan = loans[_loanId];
        uint256 interest = (loan.amount * loan.interestRate * loan.duration) / (365 days * 10000);
        return loan.amount + interest;
    }

    function getLoan(uint256 _loanId) external view returns (Loan memory) {
        return loans[_loanId];
    }

    function getUserLoans(address _user) external view returns (uint256[] memory) {
        return userLoans[_user];
    }

    function liquidateLoan(uint256 _loanId) external nonReentrant {
        Loan storage loan = loans[_loanId];
        require(loan.isActive && !loan.isRepaid, "Loan not active or repaid");
        require(isLoanDefaulted(_loanId), "Loan not defaulted");

        loan.isActive = false;
        loan.isDefaulted = true;

        // Liquidate collateral (simplified - sell collateral and recover funds)
        // In practice, integrate with DEX or auction system
        uint256 collateralValue = _estimateCollateralValue(loan.collateralToken, loan.collateralAmount);
        uint256 totalOwed = calculateTotalOwed(_loanId);
        uint256 loss = totalOwed > collateralValue ? totalOwed - collateralValue : 0;

        // Transfer collateral to liquidity pool or burn
        IERC20(loan.collateralToken).safeTransfer(address(liquidityPool), loan.collateralAmount);

        totalLoansFunded -= loan.amount;

        emit LoanDefaulted(_loanId);
        emit CollateralLiquidated(_loanId, loan.collateralAmount);
    }

    function _estimateCollateralValue(address _token, uint256 _amount) internal view returns (uint256) {
        // Simplified - assume 1:1 ratio for stable collateral
        // In practice, use price oracles
        return _amount;
    }

    function isLoanDefaulted(uint256 _loanId) public view returns (bool) {
        Loan memory loan = loans[_loanId];
        return loan.isActive && !loan.isRepaid &&
               (block.timestamp > loan.startTime + loan.duration + loan.gracePeriod);
    }

    // Additional functions
    function updateLoanTerms(uint256 _tier, LoanTerms calldata _terms) external onlyOwner {
        loanTerms[_tier] = _terms;
    }

    function getLoanDetails(uint256 _loanId) external view returns (Loan memory) {
        return loans[_loanId];
    }

    function getUserActiveLoans(address _user) external view returns (uint256[] memory) {
        uint256[] memory allLoans = userLoans[_user];
        uint256 activeCount = 0;

        for (uint256 i = 0; i < allLoans.length; i++) {
            if (loans[allLoans[i]].isActive) {
                activeCount++;
            }
        }

        uint256[] memory activeLoans = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allLoans.length; i++) {
            if (loans[allLoans[i]].isActive) {
                activeLoans[index] = allLoans[i];
                index++;
            }
        }

        return activeLoans;
    }

    // ============ INSURANCE FUNCTIONS ============

    function purchaseInsurance(
        uint256 _loanId,
        uint256 _coverageAmount,
        uint256 _coveragePeriod
    ) external payable nonReentrant whenNotPaused {
        Loan storage loan = loans[_loanId];
        require(loan.isActive && !loan.isDefaulted, "Loan not eligible for insurance");
        require(msg.sender == loan.borrower, "Only borrower can purchase insurance");
        require(loanInsurance[_loanId].isActive == false, "Insurance already purchased");

        uint256 insuranceCost = insurancePool.getInsuranceCost(_coverageAmount, _coveragePeriod);
        require(msg.value >= insuranceCost, "Insufficient payment for insurance");

        // Refund excess payment
        if (msg.value > insuranceCost) {
            payable(msg.sender).transfer(msg.value - insuranceCost);
        }

        loanInsurance[_loanId] = Insurance({
            loanId: _loanId,
            coverageAmount: _coverageAmount,
            premium: insuranceCost,
            coveragePeriod: _coveragePeriod,
            isActive: true,
            startTime: block.timestamp
        });

        totalInsuredAmount += _coverageAmount;

        // Provide insurance through insurance pool
        insurancePool.provideInsurance(_loanId, _coverageAmount);

        emit InsurancePurchased(_loanId, _coverageAmount, insuranceCost);
    }

    function claimInsurance(uint256 _loanId) external nonReentrant {
        Loan storage loan = loans[_loanId];
        Insurance storage insurance = loanInsurance[_loanId];

        require(insurance.isActive, "No active insurance");
        require(loan.isDefaulted, "Loan not defaulted");
        require(block.timestamp <= insurance.startTime + insurance.coveragePeriod, "Insurance expired");

        uint256 claimAmount = insurancePool.claimInsurance(_loanId);
        require(claimAmount > 0, "No claimable amount");

        insurance.isActive = false;
        totalInsuredAmount -= insurance.coverageAmount;

        // Transfer claim to borrower
        payable(loan.borrower).transfer(claimAmount);

        emit InsuranceClaimed(_loanId, claimAmount);
    }

    // ============ DYNAMIC INTEREST RATE FUNCTIONS ============

    function updateDynamicRates(uint256 _loanId) external {
        Loan storage loan = loans[_loanId];
        require(loan.isActive, "Loan not active");

        DynamicRateParams storage params = loanRateParams[_loanId];
        if (params.lastUpdateTime == 0) {
            // Initialize dynamic params
            params.baseRate = loan.interestRate;
            params.utilizationMultiplier = 100; // 1x
            params.creditScoreAdjustment = 0;
            params.timeBasedDecay = 1; // 0.01% per day
            params.lastUpdateTime = block.timestamp;
            return;
        }

        uint256 timeElapsed = block.timestamp - params.lastUpdateTime;
        if (timeElapsed < 1 days) return; // Update once per day

        // Update utilization multiplier based on pool utilization
        uint256 poolUtilization = liquidityPool.getUtilizationRate();
        params.utilizationMultiplier = 100 + (poolUtilization * 50 / 10000); // 0.5% per 10% utilization

        // Update credit score adjustment
        uint256 currentScore = loan.creditScore;
        if (currentScore > 750) {
            params.creditScoreAdjustment = (currentScore - 750) * 2; // Reduce rate for high scores
        }

        // Apply time-based decay
        params.timeBasedDecay = timeElapsed * 1 / 1 days; // 0.01% per day

        params.lastUpdateTime = block.timestamp;

        // Calculate new rate
        uint256 newRate = params.baseRate +
                          (params.baseRate * params.utilizationMultiplier / 100) -
                          params.creditScoreAdjustment -
                          params.timeBasedDecay;

        newRate = Math.max(newRate, 100); // Minimum 1%
        newRate = Math.min(newRate, MAX_INTEREST_RATE);

        loan.interestRate = newRate;

        emit RateUpdated(_loanId, newRate);
    }

    function getDynamicRate(uint256 _loanId) external view returns (uint256) {
        Loan memory loan = loans[_loanId];
        DynamicRateParams memory params = loanRateParams[_loanId];

        if (params.lastUpdateTime == 0) return loan.interestRate;

        uint256 timeElapsed = block.timestamp - params.lastUpdateTime;
        uint256 utilizationMultiplier = 100 + (liquidityPool.getUtilizationRate() * 50 / 10000);

        uint256 creditAdjustment = 0;
        if (loan.creditScore > 750) {
            creditAdjustment = (loan.creditScore - 750) * 2;
        }

        uint256 timeDecay = timeElapsed * 1 / 1 days;

        uint256 newRate = params.baseRate +
                          (params.baseRate * utilizationMultiplier / 100) -
                          creditAdjustment -
                          timeDecay;

        return Math.max(Math.min(newRate, MAX_INTEREST_RATE), 100);
    }

    // ============ ORACLE INTEGRATION ============

    function getCollateralValue(address _token, uint256 _amount) public view returns (uint256) {
        if (address(priceOracle) == address(0)) {
            return _amount; // Fallback to 1:1
        }
        uint256 price = priceOracle.getPrice(_token);
        return (_amount * price) / 1e18; // Assuming 18 decimals
    }

    function getRequiredCollateral(uint256 _loanId) external view returns (uint256) {
        Loan memory loan = loans[_loanId];
        uint256 loanValue = loan.amount; // Assuming stable token

        if (address(priceOracle) == address(0)) {
            return (loanValue * loanTerms[_getCreditTier(loan.creditScore)].collateralRatio) / 10000;
        }

        uint256 collateralRatio = priceOracle.getCollateralRatio(loan.collateralToken, address(stableToken));
        return (loanValue * collateralRatio) / 10000;
    }

    // ============ GAS OPTIMIZATION & META-TRANSACTIONS ============

    function executeMetaTx(
        address user,
        bytes memory functionSignature,
        bytes32 sigR,
        bytes32 sigS,
        uint8 sigV,
        uint256 nonce,
        uint256 gasPrice,
        uint256 gasLimit
    ) external whenNotPaused returns (bytes memory) {
        require(gasLimit <= META_TX_GAS_LIMIT, "Gas limit too high");

        bytes32 txHash = keccak256(abi.encode(user, functionSignature, nonce, gasPrice, gasLimit));
        require(!executedMetaTx[txHash], "Meta tx already executed");

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", txHash));
        address signer = ECDSA.recover(messageHash, sigV, sigR, sigS);
        require(signer == user, "Invalid signature");

        // Mark as executed
        executedMetaTx[txHash] = true;

        // Execute the function
        (bool success, bytes memory returnData) = address(this).call{gas: gasLimit}(functionSignature);
        require(success, "Meta tx execution failed");

        emit MetaTxExecuted(txHash, user, gasLimit);

        return returnData;
    }

    function getMetaTxNonce(address user) external view returns (uint256) {
        // Simple nonce - in production, use a mapping
        return uint256(keccak256(abi.encode(user, block.timestamp))) % 2**128;
    }

    // ============ PAUSABLE FUNCTIONS ============

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ ADDITIONAL EVENTS ============

    event InsurancePurchased(uint256 indexed loanId, uint256 coverageAmount, uint256 premium);
    event InsuranceClaimed(uint256 indexed loanId, uint256 claimAmount);
    event RateUpdated(uint256 indexed loanId, uint256 newRate);
    event MetaTxExecuted(bytes32 indexed txHash, address indexed user, uint256 gasUsed);

    // ============ OVERRIDE FUNCTIONS ============

    function _msgSender() internal view override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }
}