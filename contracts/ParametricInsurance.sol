// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./DecentralizedOracle.sol";

interface IWeatherOracle {
    function getWeatherData(string memory location) external view returns (
        uint256 temperature,
        uint256 rainfall,
        uint256 windSpeed,
        uint256 humidity
    );
}

interface ICropOracle {
    function getCropHealth(string memory location, string memory cropType) external view returns (
        uint256 ndvi,
        uint256 healthScore,
        uint256 yieldEstimate
    );
}

contract ParametricInsurance is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    enum InsuranceType { Drought, Flood, Pest, Disease, ExtremeWeather }
    enum ClaimStatus { None, Submitted, Approved, Rejected, Paid }

    struct InsurancePolicy {
        uint256 id;
        address farmer;
        InsuranceType insuranceType;
        string location;
        string cropType;
        uint256 coverageAmount;
        uint256 premium;
        uint256 deductible;
        uint256 startTime;
        uint256 endTime;
        bool active;
        uint256 triggerThreshold; // Threshold for automatic payout
    }

    struct InsuranceClaim {
        uint256 id;
        uint256 policyId;
        address claimant;
        uint256 claimAmount;
        ClaimStatus status;
        uint256 submittedAt;
        uint256 processedAt;
        string evidence; // IPFS hash of evidence
        uint256 oracleData; // Data from oracle at claim time
    }

    struct InsurancePool {
        InsuranceType insuranceType;
        uint256 totalPremiums;
        uint256 totalCoverage;
        uint256 totalClaimsPaid;
        uint256 poolBalance;
        bool active;
    }

    // Oracles
    IWeatherOracle public weatherOracle;
    ICropOracle public cropOracle;
    DecentralizedOracle public decentralizedOracle;

    // Insurance data
    mapping(uint256 => InsurancePolicy) public policies;
    mapping(uint256 => InsuranceClaim) public claims;
    mapping(InsuranceType => InsurancePool) public insurancePools;

    uint256 public nextPolicyId = 1;
    uint256 public nextClaimId = 1;

    // Risk parameters
    mapping(InsuranceType => uint256) public basePremiumRates; // in basis points
    mapping(InsuranceType => uint256) public triggerThresholds;

    IERC20Upgradeable public paymentToken;

    // AI-enhanced risk assessment
    struct AIRiskAssessment {
        uint256 policyId;
        uint256 aiRiskScore;
        uint256 predictedLoss;
        uint256 confidenceLevel;
        uint256 timestamp;
    }

    mapping(uint256 => AIRiskAssessment) public aiRiskAssessments;

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

    // Events
    event PolicyCreated(uint256 indexed policyId, address indexed farmer, InsuranceType insuranceType, uint256 coverageAmount);
    event ClaimSubmitted(uint256 indexed claimId, uint256 indexed policyId, address indexed claimant, uint256 claimAmount);
    event ClaimProcessed(uint256 indexed claimId, ClaimStatus status, uint256 payoutAmount);
    event ParametricTrigger(uint256 indexed policyId, uint256 oracleData, uint256 payoutAmount);
    event AIRiskAssessed(uint256 indexed policyId, uint256 aiRiskScore, uint256 predictedLoss, uint256 confidenceLevel);
    event CrossChainPolicyCreated(uint256 indexed policyId, uint256 sourceChainId, uint256 coverageAmount);
    event CrossChainClaimProcessed(uint256 indexed policyId, uint256 payoutAmount);

    function initialize(
        address _weatherOracle,
        address _cropOracle,
        address _paymentToken,
        address _decentralizedOracle
    ) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        weatherOracle = IWeatherOracle(_weatherOracle);
        cropOracle = ICropOracle(_cropOracle);
        paymentToken = IERC20Upgradeable(_paymentToken);
        decentralizedOracle = DecentralizedOracle(_decentralizedOracle);

        // Initialize base premium rates (in basis points)
        basePremiumRates[InsuranceType.Drought] = 200; // 2%
        basePremiumRates[InsuranceType.Flood] = 150; // 1.5%
        basePremiumRates[InsuranceType.Pest] = 300; // 3%
        basePremiumRates[InsuranceType.Disease] = 250; // 2.5%
        basePremiumRates[InsuranceType.ExtremeWeather] = 180; // 1.8%

        // Initialize trigger thresholds
        triggerThresholds[InsuranceType.Drought] = 30; // 30 days without rain
        triggerThresholds[InsuranceType.Flood] = 200; // 200mm rainfall in 24h
        triggerThresholds[InsuranceType.Pest] = 70; // 70% crop damage
        triggerThresholds[InsuranceType.Disease] = 60; // 60% disease incidence
        triggerThresholds[InsuranceType.ExtremeWeather] = 35; // 35°C temperature

        // Initialize insurance pools
        for (uint256 i = 0; i <= uint256(InsuranceType.ExtremeWeather); i++) {
            insurancePools[InsuranceType(i)] = InsurancePool({
                insuranceType: InsuranceType(i),
                totalPremiums: 0,
                totalCoverage: 0,
                totalClaimsPaid: 0,
                poolBalance: 0,
                active: true
            });
        }
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ============ POLICY MANAGEMENT ============

    function createPolicy(
        InsuranceType _insuranceType,
        string memory _location,
        string memory _cropType,
        uint256 _coverageAmount,
        uint256 _duration
    ) external nonReentrant returns (uint256) {
        require(_coverageAmount > 0, "Coverage amount must be > 0");
        require(_duration > 0 && _duration <= 365 days, "Invalid duration");

        InsurancePool storage pool = insurancePools[_insuranceType];
        require(pool.active, "Insurance type not available");

        // Calculate premium based on risk factors
        uint256 premium = calculatePremium(_insuranceType, _coverageAmount, _duration, _location, _cropType);

        // Transfer premium payment
        paymentToken.safeTransferFrom(msg.sender, address(this), premium);

        uint256 policyId = nextPolicyId++;
        policies[policyId] = InsurancePolicy({
            id: policyId,
            farmer: msg.sender,
            insuranceType: _insuranceType,
            location: _location,
            cropType: _cropType,
            coverageAmount: _coverageAmount,
            premium: premium,
            deductible: _coverageAmount / 10, // 10% deductible
            startTime: block.timestamp,
            endTime: block.timestamp + _duration,
            active: true,
            triggerThreshold: triggerThresholds[_insuranceType]
        });

        // Update pool
        pool.totalPremiums += premium;
        pool.totalCoverage += _coverageAmount;
        pool.poolBalance += premium;

        emit PolicyCreated(policyId, msg.sender, _insuranceType, _coverageAmount);
        return policyId;
    }

    function calculatePremium(
        InsuranceType _insuranceType,
        uint256 _coverageAmount,
        uint256 _duration,
        string memory _location,
        string memory _cropType
    ) public view returns (uint256) {
        uint256 baseRate = basePremiumRates[_insuranceType];
        uint256 basePremium = (_coverageAmount * baseRate * _duration) / (365 days * 10000);

        // Adjust for location risk
        uint256 locationMultiplier = getLocationRiskMultiplier(_location);

        // Adjust for crop type risk
        uint256 cropMultiplier = getCropRiskMultiplier(_cropType);

        return (basePremium * locationMultiplier * cropMultiplier) / 10000;
    }

    function getLocationRiskMultiplier(string memory _location) internal pure returns (uint256) {
        // Simplified risk assessment - in production, use historical data
        bytes32 locationHash = keccak256(abi.encodePacked(_location));

        if (locationHash == keccak256(abi.encodePacked("drought-prone"))) return 15000; // 1.5x
        if (locationHash == keccak256(abi.encodePacked("flood-prone"))) return 14000; // 1.4x
        if (locationHash == keccak256(abi.encodePacked("pest-prone"))) return 16000; // 1.6x

        return 10000; // 1x base risk
    }

    function getCropRiskMultiplier(string memory _cropType) internal pure returns (uint256) {
        bytes32 cropHash = keccak256(abi.encodePacked(_cropType));

        if (cropHash == keccak256(abi.encodePacked("maize"))) return 12000; // 1.2x
        if (cropHash == keccak256(abi.encodePacked("rice"))) return 13000; // 1.3x
        if (cropHash == keccak256(abi.encodePacked("coffee"))) return 15000; // 1.5x

        return 10000; // 1x base risk
    }

    // ============ PARAMETRIC CLAIMS ============

    function checkParametricTriggers() external {
        // Check all active policies for trigger conditions
        for (uint256 i = 1; i < nextPolicyId; i++) {
            InsurancePolicy storage policy = policies[i];
            if (policy.active && block.timestamp <= policy.endTime) {
                _checkPolicyTrigger(policy);
            }
        }
    }

    function _checkPolicyTrigger(InsurancePolicy storage policy) internal {
        uint256 oracleData;
        bool triggered = false;

        if (policy.insuranceType == InsuranceType.Drought) {
            (uint256 rainfall, , , ) = weatherOracle.getWeatherData(policy.location);
            oracleData = rainfall;
            triggered = rainfall < policy.triggerThreshold;
        } else if (policy.insuranceType == InsuranceType.Flood) {
            (, uint256 rainfall, , ) = weatherOracle.getWeatherData(policy.location);
            oracleData = rainfall;
            triggered = rainfall > policy.triggerThreshold;
        } else if (policy.insuranceType == InsuranceType.ExtremeWeather) {
            (uint256 temperature, , , ) = weatherOracle.getWeatherData(policy.location);
            oracleData = temperature;
            triggered = temperature > policy.triggerThreshold;
        } else if (policy.insuranceType == InsuranceType.Pest || policy.insuranceType == InsuranceType.Disease) {
            (, uint256 healthScore, ) = cropOracle.getCropHealth(policy.location, policy.cropType);
            oracleData = healthScore;
            triggered = healthScore < policy.triggerThreshold;
        }

        if (triggered) {
            _processParametricPayout(policy, oracleData);
        }
    }

    function _processParametricPayout(InsurancePolicy storage policy, uint256 oracleData) internal {
        uint256 payoutAmount = Math.min(policy.coverageAmount, insurancePools[policy.insuranceType].poolBalance);

        if (payoutAmount > policy.deductible) {
            payoutAmount -= policy.deductible;

            // Transfer payout
            paymentToken.safeTransfer(policy.farmer, payoutAmount);

            // Update pool
            InsurancePool storage pool = insurancePools[policy.insuranceType];
            pool.totalClaimsPaid += payoutAmount;
            pool.poolBalance -= payoutAmount;

            // Deactivate policy
            policy.active = false;

            emit ParametricTrigger(policy.id, oracleData, payoutAmount);
        }
    }

    // ============ MANUAL CLAIMS ============

    function submitClaim(
        uint256 _policyId,
        uint256 _claimAmount,
        string memory _evidence
    ) external nonReentrant returns (uint256) {
        InsurancePolicy storage policy = policies[_policyId];
        require(policy.farmer == msg.sender, "Not policy owner");
        require(policy.active, "Policy not active");
        require(block.timestamp <= policy.endTime, "Policy expired");
        require(_claimAmount <= policy.coverageAmount, "Claim exceeds coverage");

        uint256 claimId = nextClaimId++;
        claims[claimId] = InsuranceClaim({
            id: claimId,
            policyId: _policyId,
            claimant: msg.sender,
            claimAmount: _claimAmount,
            status: ClaimStatus.Submitted,
            submittedAt: block.timestamp,
            processedAt: 0,
            evidence: _evidence,
            oracleData: 0
        });

        emit ClaimSubmitted(claimId, _policyId, msg.sender, _claimAmount);
        return claimId;
    }

    function processClaim(uint256 _claimId, bool _approved) external onlyOwner {
        InsuranceClaim storage claim = claims[_claimId];
        require(claim.status == ClaimStatus.Submitted, "Claim not submitted");

        InsurancePolicy storage policy = policies[claim.policyId];
        InsurancePool storage pool = insurancePools[policy.insuranceType];

        claim.processedAt = block.timestamp;
        claim.status = _approved ? ClaimStatus.Approved : ClaimStatus.Rejected;

        if (_approved && pool.poolBalance >= claim.claimAmount) {
            // Get current oracle data for verification
            if (policy.insuranceType == InsuranceType.Drought || policy.insuranceType == InsuranceType.Flood) {
                (, uint256 rainfall, , ) = weatherOracle.getWeatherData(policy.location);
                claim.oracleData = rainfall;
            } else if (policy.insuranceType == InsuranceType.ExtremeWeather) {
                (uint256 temperature, , , ) = weatherOracle.getWeatherData(policy.location);
                claim.oracleData = temperature;
            } else {
                (, uint256 healthScore, ) = cropOracle.getCropHealth(policy.location, policy.cropType);
                claim.oracleData = healthScore;
            }

            // Process payout
            paymentToken.safeTransfer(claim.claimant, claim.claimAmount);
            pool.totalClaimsPaid += claim.claimAmount;
            pool.poolBalance -= claim.claimAmount;
            policy.active = false;

            emit ClaimProcessed(_claimId, ClaimStatus.Approved, claim.claimAmount);
        } else {
            emit ClaimProcessed(_claimId, ClaimStatus.Rejected, 0);
        }
    }

    // ============ VIEW FUNCTIONS ============

    function getPolicy(uint256 _policyId) external view returns (InsurancePolicy memory) {
        return policies[_policyId];
    }

    function getClaim(uint256 _claimId) external view returns (InsuranceClaim memory) {
        return claims[_claimId];
    }

    function getInsurancePool(InsuranceType _type) external view returns (InsurancePool memory) {
        return insurancePools[_type];
    }

    function getUserPolicies(address _user) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i < nextPolicyId; i++) {
            if (policies[i].farmer == _user) {
                count++;
            }
        }

        uint256[] memory userPolicies = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i < nextPolicyId; i++) {
            if (policies[i].farmer == _user) {
                userPolicies[index] = i;
                index++;
            }
        }

        return userPolicies;
    }

    // ============ AI-ENHANCED RISK ASSESSMENT ============

    function assessRiskWithAI(
        uint256 _policyId,
        string memory _location,
        string memory _cropType,
        InsuranceType _insuranceType
    ) external returns (uint256 aiRiskScore, uint256 predictedLoss, uint256 confidenceLevel) {
        // Get AI prediction from decentralized oracle
        (uint256 aiPrediction, , ) = decentralizedOracle.getLatestData(
            DecentralizedOracle.DataType.AIModel,
            _location,
            string(abi.encodePacked(_cropType, "_", _insuranceType, "_risk"))
        );

        // Parse AI prediction (simplified - in practice would decode structured data)
        aiRiskScore = aiPrediction % 1000; // 0-999 risk score
        predictedLoss = (aiPrediction / 1000) % 1000000; // Up to 1M loss prediction
        confidenceLevel = (aiPrediction / 1000000000) % 100; // 0-99 confidence

        // Store assessment
        aiRiskAssessments[_policyId] = AIRiskAssessment({
            policyId: _policyId,
            aiRiskScore: aiRiskScore,
            predictedLoss: predictedLoss,
            confidenceLevel: confidenceLevel,
            timestamp: block.timestamp
        });

        emit AIRiskAssessed(_policyId, aiRiskScore, predictedLoss, confidenceLevel);
    }

    function getAIRiskAssessment(uint256 _policyId) external view returns (AIRiskAssessment memory) {
        return aiRiskAssessments[_policyId];
    }

    // ============ CROSS-CHAIN INSURANCE ============

    function createCrossChainPolicy(
        uint256 _sourceChainId,
        InsuranceType _insuranceType,
        string memory _location,
        string memory _cropType,
        uint256 _coverageAmount,
        uint256 _duration
    ) external payable returns (uint256) {
        require(_coverageAmount > 0, "Coverage amount must be > 0");
        require(_duration > 0 && _duration <= 365 days, "Invalid duration");

        InsurancePool storage pool = insurancePools[_insuranceType];
        require(pool.active, "Insurance type not available");

        // Calculate premium
        uint256 premium = calculatePremium(_insuranceType, _coverageAmount, _duration, _location, _cropType);

        // Transfer premium payment
        paymentToken.safeTransferFrom(msg.sender, address(this), premium);

        uint256 policyId = nextCrossChainPolicyId++;
        crossChainPolicies[policyId] = CrossChainPolicy({
            sourceChainId: _sourceChainId,
            policyId: policyId,
            beneficiary: msg.sender,
            coverageAmount: _coverageAmount,
            expirationDate: block.timestamp + _duration,
            active: true,
            bridgeTxHash: bytes32(0)
        });

        // Update pool
        pool.totalPremiums += premium;
        pool.totalCoverage += _coverageAmount;
        pool.poolBalance += premium;

        emit CrossChainPolicyCreated(policyId, _sourceChainId, _coverageAmount);
        return policyId;
    }

    function claimCrossChainInsurance(uint256 _policyId, bytes memory _proof) external {
        CrossChainPolicy storage policy = crossChainPolicies[_policyId];
        require(policy.active, "Policy not active");
        require(policy.beneficiary == msg.sender, "Not the beneficiary");
        require(block.timestamp <= policy.expirationDate, "Policy expired");

        // Verify cross-chain proof (simplified)
        require(_proof.length > 0, "Invalid proof");

        policy.active = false;

        // Transfer coverage amount
        paymentToken.safeTransfer(msg.sender, policy.coverageAmount);

        emit CrossChainClaimProcessed(_policyId, policy.coverageAmount);
    }

    // ============ ADMIN FUNCTIONS ============

    function updatePremiumRate(InsuranceType _type, uint256 _rate) external onlyOwner {
        require(_rate <= 1000, "Rate too high"); // Max 10%
        basePremiumRates[_type] = _rate;
    }

    function updateTriggerThreshold(InsuranceType _type, uint256 _threshold) external onlyOwner {
        triggerThresholds[_type] = _threshold;
    }

    function setPoolActive(InsuranceType _type, bool _active) external onlyOwner {
        insurancePools[_type].active = _active;
    }

    function emergencyWithdraw(uint256 _amount) external onlyOwner {
        require(_amount <= paymentToken.balanceOf(address(this)), "Insufficient balance");
        paymentToken.safeTransfer(owner(), _amount);
    }
}</content>
</xai:function_call