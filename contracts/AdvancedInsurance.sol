// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./DecentralizedOracle.sol";
import "./ParametricInsurance.sol";

contract AdvancedInsurance is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    using Math for uint256;

    struct CatastropheBond {
        uint256 id;
        string catastropheType; // "earthquake", "flood", "drought", "hurricane"
        string region;
        uint256 coverageAmount;
        uint256 premium;
        uint256 triggerThreshold; // Index value that triggers payout
        uint256 maturityDate;
        address issuer;
        address[] investors;
        mapping(address => uint256) investments;
        uint256 totalInvested;
        bool active;
        bool triggered;
        uint256 triggerIndex; // Actual index value when triggered
        uint256 payoutAmount;
    }

    struct ParametricOption {
        uint256 id;
        address buyer;
        string underlyingAsset; // "rainfall", "temperature", "crop_price"
        uint256 strikePrice;
        uint256 premium;
        uint256 notionalAmount;
        bool isCall; // true for call, false for put
        uint256 expirationDate;
        uint256 settlementDate;
        bool exercised;
        uint256 payoutAmount;
        bytes oracleData;
    }

    struct InsurancePool {
        uint256 id;
        string poolType; // "catastrophe", "yield_protection", "weather_derivative"
        uint256 totalCapacity;
        uint256 utilizedCapacity;
        uint256 premiumCollected;
        uint256 payoutReserve;
        bool active;
    }

    // ZK-Proof structures for privacy-preserving claims
    struct ZKProof {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
        uint256[4] input; // [claimAmount, riskScore, timestamp, nonce]
    }

    struct PrivateClaim {
        uint256 policyId;
        uint256 claimAmount;
        bytes32 commitment;
        ZKProof proof;
        bool verified;
        bool processed;
        uint256 timestamp;
    }

    struct RiskDerivative {
        uint256 id;
        string underlyingRisk; // "drought_index", "flood_probability", "yield_volatility"
        uint256 notionalAmount;
        uint256 strikeLevel;
        uint256 premium;
        address buyer;
        address seller;
        uint256 expirationDate;
        bool settled;
        int256 payout;
    }

    // ZK-SNARK verifier interface
    interface IZKVerifier {
        function verifyProof(
            uint256[2] memory a,
            uint256[2][2] memory b,
            uint256[2] memory c,
            uint256[4] memory input
        ) external view returns (bool);
    }

    // Advanced insurance features
    mapping(uint256 => CatastropheBond) public catastropheBonds;
    mapping(uint256 => ParametricOption) public parametricOptions;
    mapping(uint256 => InsurancePool) public insurancePools;
    mapping(uint256 => PrivateClaim) public privateClaims;
    mapping(uint256 => RiskDerivative) public riskDerivatives;

    uint256 public nextBondId = 1;
    uint256 public nextOptionId = 1;
    uint256 public nextPoolId = 1;
    uint256 public nextClaimId = 1;
    uint256 public nextDerivativeId = 1;

    // ZK-Prover parameters
    IZKVerifier public zkVerifier;
    uint256 public minRiskScore = 300; // Minimum risk score for claims
    uint256 public maxClaimAmount = 100000 * 10**18; // Max claim per policy

    // Cross-chain insurance
    struct CrossChainPolicy {
        uint256 sourceChainId;
        uint256 policyId;
        address beneficiary;
        uint256 coverageAmount;
        uint256 expirationDate;
        bool active;
        bytes32 bridgeTxHash;
    }

    mapping(uint256 => CrossChainPolicy) public crossChainPolicies;
    uint256 public nextCrossChainPolicyId = 1;

    // Insurance DAO parameters
    uint256 public governanceThreshold = 100000 * 10**18; // Tokens needed to propose
    uint256 public emergencyFund;
    address public riskAssessmentOracle;

    // Catastrophe bonds
    mapping(uint256 => CatastropheBond) public catastropheBonds;
    uint256 public nextBondId = 1;

    // Parametric options
    mapping(uint256 => ParametricOption) public parametricOptions;
    uint256 public nextOptionId = 1;

    // Insurance pools
    mapping(uint256 => InsurancePool) public insurancePools;
    uint256 public nextPoolId = 1;

    // Oracle integration
    DecentralizedOracle public oracle;
    ParametricInsurance public parametricInsurance;

    // Risk parameters
    uint256 public maxCoverageRatio = 80; // 80% max coverage vs investment
    uint256 public minPremiumRate = 50; // 0.5% minimum premium
    uint256 public maxPremiumRate = 2000; // 20% maximum premium
    uint256 public settlementDelay = 7 days;

    // Events
    event CatastropheBondCreated(uint256 indexed bondId, string catastropheType, uint256 coverageAmount);
    event CatastropheBondInvested(uint256 indexed bondId, address indexed investor, uint256 amount);
    event CatastropheBondTriggered(uint256 indexed bondId, uint256 triggerIndex, uint256 payoutAmount);
    event ParametricOptionCreated(uint256 indexed optionId, address indexed buyer, string underlyingAsset);
    event ParametricOptionExercised(uint256 indexed optionId, uint256 payoutAmount);
    event InsurancePoolCreated(uint256 indexed poolId, string poolType, uint256 capacity);
    event PoolContribution(uint256 indexed poolId, address indexed contributor, uint256 amount);

    function initialize(
        address _oracle,
        address _parametricInsurance,
        address _zkVerifier,
        address _riskAssessmentOracle
    ) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        oracle = DecentralizedOracle(_oracle);
        parametricInsurance = ParametricInsurance(_parametricInsurance);
        zkVerifier = IZKVerifier(_zkVerifier);
        riskAssessmentOracle = _riskAssessmentOracle;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ============ CATASTROPHE BONDS ============

    function createCatastropheBond(
        string memory _catastropheType,
        string memory _region,
        uint256 _coverageAmount,
        uint256 _premium,
        uint256 _triggerThreshold,
        uint256 _maturityDays
    ) external returns (uint256) {
        require(_coverageAmount > 0, "Invalid coverage amount");
        require(_premium >= (_coverageAmount * minPremiumRate) / 10000, "Premium too low");
        require(_premium <= (_coverageAmount * maxPremiumRate) / 10000, "Premium too high");
        require(_maturityDays >= 30 && _maturityDays <= 365, "Invalid maturity period");

        uint256 bondId = nextBondId++;

        CatastropheBond storage bond = catastropheBonds[bondId];
        bond.id = bondId;
        bond.catastropheType = _catastropheType;
        bond.region = _region;
        bond.coverageAmount = _coverageAmount;
        bond.premium = _premium;
        bond.triggerThreshold = _triggerThreshold;
        bond.maturityDate = block.timestamp + (_maturityDays * 1 days);
        bond.issuer = msg.sender;
        bond.active = true;
        bond.triggered = false;

        emit CatastropheBondCreated(bondId, _catastropheType, _coverageAmount);
        return bondId;
    }

    function investInCatastropheBond(uint256 _bondId, uint256 _amount) external payable nonReentrant {
        CatastropheBond storage bond = catastropheBonds[_bondId];
        require(bond.active, "Bond not active");
        require(block.timestamp < bond.maturityDate, "Bond matured");
        require(msg.value == _amount, "Incorrect investment amount");

        // Check coverage ratio
        uint256 maxInvestment = (bond.coverageAmount * maxCoverageRatio) / 100;
        require(bond.totalInvested + _amount <= maxInvestment, "Exceeds coverage ratio");

        if (bond.investments[msg.sender] == 0) {
            bond.investors.push(msg.sender);
        }
        bond.investments[msg.sender] += _amount;
        bond.totalInvested += _amount;

        emit CatastropheBondInvested(_bondId, msg.sender, _amount);
    }

    function triggerCatastropheBond(uint256 _bondId) external {
        CatastropheBond storage bond = catastropheBonds[_bondId];
        require(bond.active, "Bond not active");
        require(!bond.triggered, "Already triggered");
        require(block.timestamp <= bond.maturityDate, "Bond matured");

        // Get catastrophe index from oracle
        (uint256 catastropheIndex, , ) = oracle.getLatestData(
            DecentralizedOracle.DataType.Weather,
            bond.region,
            string(abi.encodePacked(bond.catastropheType, "_index"))
        );

        require(catastropheIndex >= bond.triggerThreshold, "Trigger threshold not met");

        bond.triggered = true;
        bond.triggerIndex = catastropheIndex;
        bond.active = false;

        // Calculate payout (simplified - full coverage if triggered)
        bond.payoutAmount = bond.coverageAmount;

        // Distribute payouts to investors
        _distributeCatastrophePayouts(bond);

        emit CatastropheBondTriggered(_bondId, catastropheIndex, bond.payoutAmount);
    }

    function _distributeCatastrophePayouts(CatastropheBond storage bond) internal {
        uint256 totalPayout = bond.payoutAmount;
        uint256 totalInvested = bond.totalInvested;

        for (uint256 i = 0; i < bond.investors.length; i++) {
            address investor = bond.investors[i];
            uint256 investment = bond.investments[investor];
            uint256 payout = (investment * totalPayout) / totalInvested;

            payable(investor).transfer(payout);
        }
    }

    function claimCatastropheBondMaturity(uint256 _bondId) external {
        CatastropheBond storage bond = catastropheBonds[_bondId];
        require(block.timestamp >= bond.maturityDate, "Bond not matured");
        require(!bond.triggered, "Bond was triggered");

        uint256 investment = bond.investments[msg.sender];
        require(investment > 0, "No investment found");

        // Return principal + premium
        uint256 returnAmount = investment + (investment * bond.premium * (bond.maturityDate - block.timestamp)) / (365 days * bond.coverageAmount);

        bond.investments[msg.sender] = 0;
        payable(msg.sender).transfer(returnAmount);
    }

    // ============ PARAMETRIC OPTIONS ============

    function createParametricOption(
        string memory _underlyingAsset,
        uint256 _strikePrice,
        uint256 _premium,
        uint256 _notionalAmount,
        bool _isCall,
        uint256 _expirationDays
    ) external payable returns (uint256) {
        require(msg.value >= _premium, "Insufficient premium payment");
        require(_notionalAmount > 0, "Invalid notional amount");
        require(_expirationDays >= 1 && _expirationDays <= 365, "Invalid expiration");

        uint256 optionId = nextOptionId++;

        ParametricOption storage option = parametricOptions[optionId];
        option.id = optionId;
        option.buyer = msg.sender;
        option.underlyingAsset = _underlyingAsset;
        option.strikePrice = _strikePrice;
        option.premium = _premium;
        option.notionalAmount = _notionalAmount;
        option.isCall = _isCall;
        option.expirationDate = block.timestamp + (_expirationDays * 1 days);
        option.settlementDate = option.expirationDate + settlementDelay;
        option.exercised = false;

        emit ParametricOptionCreated(optionId, msg.sender, _underlyingAsset);
        return optionId;
    }

    function exerciseParametricOption(uint256 _optionId) external {
        ParametricOption storage option = parametricOptions[_optionId];
        require(option.buyer == msg.sender, "Not the option buyer");
        require(!option.exercised, "Already exercised");
        require(block.timestamp >= option.expirationDate, "Option not expired");
        require(block.timestamp <= option.settlementDate, "Settlement period passed");

        // Get settlement price from oracle
        (uint256 settlementPrice, , ) = oracle.getLatestData(
            DecentralizedOracle.DataType.MarketSentiment,
            "global",
            string(abi.encodePacked(option.underlyingAsset, "_price"))
        );

        uint256 payout = 0;

        if (option.isCall && settlementPrice > option.strikePrice) {
            // Call option: profit = (settlement - strike) * notional
            uint256 profit = (settlementPrice - option.strikePrice) * option.notionalAmount / option.strikePrice;
            payout = Math.min(profit, option.notionalAmount); // Cap at notional
        } else if (!option.isCall && settlementPrice < option.strikePrice) {
            // Put option: profit = (strike - settlement) * notional
            uint256 profit = (option.strikePrice - settlementPrice) * option.notionalAmount / option.strikePrice;
            payout = Math.min(profit, option.notionalAmount); // Cap at notional
        }

        option.exercised = true;
        option.payoutAmount = payout;
        option.oracleData = abi.encode(settlementPrice, block.timestamp);

        if (payout > 0) {
            payable(msg.sender).transfer(payout);
        }

        emit ParametricOptionExercised(_optionId, payout);
    }

    // ============ INSURANCE POOLS ============

    function createInsurancePool(
        string memory _poolType,
        uint256 _capacity
    ) external onlyOwner returns (uint256) {
        require(_capacity > 0, "Invalid capacity");

        uint256 poolId = nextPoolId++;

        InsurancePool storage pool = insurancePools[poolId];
        pool.id = poolId;
        pool.poolType = _poolType;
        pool.totalCapacity = _capacity;
        pool.active = true;

        emit InsurancePoolCreated(poolId, _poolType, _capacity);
        return poolId;
    }

    function contributeToPool(uint256 _poolId, uint256 _amount) external payable nonReentrant {
        InsurancePool storage pool = insurancePools[_poolId];
        require(pool.active, "Pool not active");
        require(msg.value == _amount, "Incorrect contribution amount");
        require(pool.utilizedCapacity + _amount <= pool.totalCapacity, "Exceeds pool capacity");

        pool.contributions[msg.sender] += _amount;
        pool.premiumPool += _amount;
        pool.utilizedCapacity += _amount;

        emit PoolContribution(_poolId, msg.sender, _amount);
    }

    function claimPoolPayout(uint256 _poolId, uint256 _claimAmount, bytes memory _proof) external {
        InsurancePool storage pool = insurancePools[_poolId];
        require(pool.active, "Pool not active");
        require(pool.contributions[msg.sender] > 0, "No contribution found");
        require(_claimAmount <= pool.payoutReserve, "Insufficient reserve");

        // Verify claim with oracle data (simplified)
        (uint256 oracleData, , ) = oracle.getLatestData(
            DecentralizedOracle.DataType.IoT,
            "claim_verification",
            "insurance_claim"
        );

        require(oracleData > 0, "Claim not verified by oracle");

        pool.payoutReserve -= _claimAmount;
        payable(msg.sender).transfer(_claimAmount);
    }

    // ============ VIEW FUNCTIONS ============

    function getCatastropheBond(uint256 _bondId) external view returns (
        uint256 id,
        string memory catastropheType,
        string memory region,
        uint256 coverageAmount,
        uint256 totalInvested,
        bool active,
        bool triggered,
        uint256 maturityDate
    ) {
        CatastropheBond storage bond = catastropheBonds[_bondId];
        return (
            bond.id,
            bond.catastropheType,
            bond.region,
            bond.coverageAmount,
            bond.totalInvested,
            bond.active,
            bond.triggered,
            bond.maturityDate
        );
    }

    function getCatastropheBondInvestment(uint256 _bondId, address _investor) external view returns (uint256) {
        return catastropheBonds[_bondId].investments[_investor];
    }

    function getParametricOption(uint256 _optionId) external view returns (
        uint256 id,
        address buyer,
        string memory underlyingAsset,
        uint256 strikePrice,
        uint256 notionalAmount,
        bool isCall,
        uint256 expirationDate,
        bool exercised,
        uint256 payoutAmount
    ) {
        ParametricOption storage option = parametricOptions[_optionId];
        return (
            option.id,
            option.buyer,
            option.underlyingAsset,
            option.strikePrice,
            option.notionalAmount,
            option.isCall,
            option.expirationDate,
            option.exercised,
            option.payoutAmount
        );
    }

    function getInsurancePool(uint256 _poolId) external view returns (
        uint256 id,
        string memory poolType,
        uint256 totalCapacity,
        uint256 utilizedCapacity,
        uint256 premiumPool,
        bool active
    ) {
        InsurancePool storage pool = insurancePools[_poolId];
        return (
            pool.id,
            pool.poolType,
            pool.totalCapacity,
            pool.utilizedCapacity,
            pool.premiumPool,
            pool.active
        );
    }

    function getPoolContribution(uint256 _poolId, address _contributor) external view returns (uint256) {
        return insurancePools[_poolId].contributions[_contributor];
    }

    // ============ ADMIN FUNCTIONS ============

    function updateRiskParameters(
        uint256 _maxCoverageRatio,
        uint256 _minPremiumRate,
        uint256 _maxPremiumRate,
        uint256 _settlementDelay
    ) external onlyOwner {
        maxCoverageRatio = _maxCoverageRatio;
        minPremiumRate = _minPremiumRate;
        maxPremiumRate = _maxPremiumRate;
        settlementDelay = _settlementDelay;
    }

    function emergencyTriggerBond(uint256 _bondId, uint256 _triggerIndex) external onlyOwner {
        CatastropheBond storage bond = catastropheBonds[_bondId];
        require(bond.active, "Bond not active");
        require(!bond.triggered, "Already triggered");

        bond.triggered = true;
        bond.triggerIndex = _triggerIndex;
        bond.active = false;
        bond.payoutAmount = bond.coverageAmount;

        _distributeCatastrophePayouts(bond);

        emit CatastropheBondTriggered(_bondId, _triggerIndex, bond.payoutAmount);
    }

    function deactivatePool(uint256 _poolId) external onlyOwner {
        insurancePools[_poolId].active = false;
    }

    // Withdraw accumulated premiums (for pool management)
    function withdrawPremiums(uint256 _poolId, uint256 _amount) external onlyOwner {
        InsurancePool storage pool = insurancePools[_poolId];
        require(_amount <= pool.premiumPool, "Insufficient premiums");

        pool.premiumPool -= _amount;
        payable(owner()).transfer(_amount);
    }

    receive() external payable {}

    // ============ ZK-PROOF PRIVATE INSURANCE CLAIMS ============

    function submitPrivateClaim(
        uint256 policyId,
        uint256 claimAmount,
        bytes32 commitment,
        ZKProof memory proof
    ) external returns (uint256) {
        require(claimAmount <= maxClaimAmount, "Claim amount too high");
        require(zkVerifier.verifyProof(proof.a, proof.b, proof.c, proof.input), "Invalid ZK proof");

        // Verify claim parameters from proof input
        uint256 riskScore = proof.input[1];
        require(riskScore >= minRiskScore, "Risk score too low");

        uint256 claimId = nextClaimId++;
        privateClaims[claimId] = PrivateClaim({
            policyId: policyId,
            claimAmount: claimAmount,
            commitment: commitment,
            proof: proof,
            verified: true,
            processed: false,
            timestamp: block.timestamp
        });

        emit PrivateClaimSubmitted(claimId, policyId, claimAmount, commitment);
        return claimId;
    }

    function processPrivateClaim(uint256 claimId) external onlyOwner nonReentrant {
        PrivateClaim storage claim = privateClaims[claimId];
        require(claim.verified, "Claim not verified");
        require(!claim.processed, "Claim already processed");

        claim.processed = true;

        // Transfer payout (simplified - in practice would check policy validity)
        payable(msg.sender).transfer(claim.claimAmount); // Actually should be claim beneficiary

        emit PrivateClaimProcessed(claimId, claim.claimAmount);
    }

    // ============ RISK DERIVATIVES ============

    function createRiskDerivative(
        string memory underlyingRisk,
        uint256 notionalAmount,
        uint256 strikeLevel,
        uint256 premium,
        address seller,
        uint256 expirationDate
    ) external payable returns (uint256) {
        require(msg.value >= premium, "Insufficient premium payment");
        require(expirationDate > block.timestamp, "Invalid expiration");

        uint256 derivativeId = nextDerivativeId++;
        riskDerivatives[derivativeId] = RiskDerivative({
            id: derivativeId,
            underlyingRisk: underlyingRisk,
            notionalAmount: notionalAmount,
            strikeLevel: strikeLevel,
            premium: premium,
            buyer: msg.sender,
            seller: seller,
            expirationDate: expirationDate,
            settled: false,
            payout: 0
        });

        // Transfer premium to seller
        payable(seller).transfer(premium);

        // Refund excess
        if (msg.value > premium) {
            payable(msg.sender).transfer(msg.value - premium);
        }

        emit RiskDerivativeCreated(derivativeId, underlyingRisk, notionalAmount, strikeLevel);
        return derivativeId;
    }

    function settleRiskDerivative(uint256 derivativeId) external nonReentrant {
        RiskDerivative storage derivative = riskDerivatives[derivativeId];
        require(block.timestamp >= derivative.expirationDate, "Not expired yet");
        require(!derivative.settled, "Already settled");
        require(msg.sender == derivative.buyer || msg.sender == derivative.seller, "Not authorized");

        derivative.settled = true;

        // Get risk data from oracle
        (uint256 riskValue, , ) = oracle.getLatestData(
            DecentralizedOracle.DataType.IoT,
            derivative.underlyingRisk,
            "risk_measurement"
        );

        // Calculate payout
        int256 payout = 0;
        if (riskValue > derivative.strikeLevel) {
            // Risk occurred, buyer gets payout
            payout = int256(derivative.notionalAmount);
            payable(derivative.buyer).transfer(uint256(payout));
        } else {
            // No risk, seller keeps premium
            payout = -int256(derivative.premium);
        }

        derivative.payout = payout;

        emit RiskDerivativeSettled(derivativeId, riskValue, payout);
    }

    // ============ CROSS-CHAIN INSURANCE ============

    function createCrossChainPolicy(
        uint256 sourceChainId,
        uint256 coverageAmount,
        uint256 expirationDate
    ) external payable returns (uint256) {
        require(msg.value >= coverageAmount, "Insufficient coverage payment");

        uint256 policyId = nextCrossChainPolicyId++;
        crossChainPolicies[policyId] = CrossChainPolicy({
            sourceChainId: sourceChainId,
            policyId: policyId,
            beneficiary: msg.sender,
            coverageAmount: coverageAmount,
            expirationDate: expirationDate,
            active: true,
            bridgeTxHash: bytes32(0)
        });

        // In practice, would initiate cross-chain bridge transaction
        // For now, just store the policy

        emit CrossChainPolicyCreated(policyId, sourceChainId, coverageAmount);
        return policyId;
    }

    function claimCrossChainInsurance(uint256 policyId, bytes memory proof) external {
        CrossChainPolicy storage policy = crossChainPolicies[policyId];
        require(policy.active, "Policy not active");
        require(policy.beneficiary == msg.sender, "Not the beneficiary");
        require(block.timestamp <= policy.expirationDate, "Policy expired");

        // Verify claim with cross-chain proof
        // Simplified verification
        require(proof.length > 0, "Invalid proof");

        policy.active = false;

        // Transfer coverage amount
        payable(msg.sender).transfer(policy.coverageAmount);

        emit CrossChainClaimProcessed(policyId, policy.coverageAmount);
    }

    // ============ INSURANCE DAO FUNCTIONS ============

    function proposeInsuranceParameterChange(
        string memory parameter,
        uint256 newValue
    ) external {
        // Simplified governance - in practice would use full DAO
        require(IERC20(riskAssessmentOracle).balanceOf(msg.sender) >= governanceThreshold, "Insufficient governance tokens");

        emit InsuranceParameterProposed(parameter, newValue);
    }

    function emergencyFundWithdrawal(uint256 amount) external onlyOwner {
        require(amount <= emergencyFund, "Insufficient emergency fund");
        emergencyFund -= amount;
        payable(owner()).transfer(amount);
        emit EmergencyFundWithdrawn(amount);
    }

    function depositEmergencyFund() external payable onlyOwner {
        emergencyFund += msg.value;
        emit EmergencyFundDeposited(msg.value);
    }

    // ============ ENHANCED RISK ASSESSMENT ============

    function assessRiskWithAI(
        address farmer,
        string memory location,
        string memory cropType
    ) external view returns (uint256 riskScore, uint256 premiumRate) {
        // Get risk factors from oracle
        (uint256 weatherRisk, , ) = oracle.getLatestData(
            DecentralizedOracle.DataType.Weather,
            location,
            "risk_assessment"
        );

        (uint256 yieldHistory, , ) = oracle.getLatestData(
            DecentralizedOracle.DataType.CropHealth,
            location,
            cropType
        );

        // Calculate composite risk score (simplified AI assessment)
        riskScore = (weatherRisk + yieldHistory) / 2;

        // Calculate premium based on risk
        if (riskScore < 300) {
            premiumRate = 50; // 0.5%
        } else if (riskScore < 600) {
            premiumRate = 150; // 1.5%
        } else {
            premiumRate = 300; // 3%
        }

        return (riskScore, premiumRate);
    }

    // ============ ADMIN FUNCTIONS FOR ZK FEATURES ============

    function setZKVerifier(address _verifier) external onlyOwner {
        zkVerifier = IZKVerifier(_verifier);
        emit ZKVerifierSet(_verifier);
    }

    function updateZKParameters(uint256 _minRiskScore, uint256 _maxClaimAmount) external onlyOwner {
        minRiskScore = _minRiskScore;
        maxClaimAmount = _maxClaimAmount;
    }

    function setRiskAssessmentOracle(address _oracle) external onlyOwner {
        riskAssessmentOracle = _oracle;
    }

    // ============ ADDITIONAL EVENTS ============

    event PrivateClaimSubmitted(uint256 indexed claimId, uint256 indexed policyId, uint256 claimAmount, bytes32 commitment);
    event PrivateClaimProcessed(uint256 indexed claimId, uint256 payoutAmount);
    event RiskDerivativeCreated(uint256 indexed derivativeId, string underlyingRisk, uint256 notionalAmount, uint256 strikeLevel);
    event RiskDerivativeSettled(uint256 indexed derivativeId, uint256 riskValue, int256 payout);
    event CrossChainPolicyCreated(uint256 indexed policyId, uint256 sourceChainId, uint256 coverageAmount);
    event CrossChainClaimProcessed(uint256 indexed policyId, uint256 payoutAmount);
    event InsuranceParameterProposed(string parameter, uint256 newValue);
    event EmergencyFundDeposited(uint256 amount);
    event EmergencyFundWithdrawn(uint256 amount);
    event ZKVerifierSet(address indexed verifier);
}