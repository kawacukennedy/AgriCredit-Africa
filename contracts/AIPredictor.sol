// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./DecentralizedOracle.sol";

contract AIPredictor is Ownable, ReentrancyGuard {
    using Math for uint256;

    struct AIModel {
        string name;
        string version;
        bytes32 modelHash; // IPFS hash of the model
        uint256 accuracy; // 0-100
        uint256 lastUpdated;
        bool active;
        address maintainer;
    }

    struct Prediction {
        uint256 id;
        address user;
        string dataType; // "credit_score", "yield_prediction", "risk_assessment"
        bytes inputData; // Encoded input parameters
        int256 prediction; // AI model output
        uint256 confidence; // 0-100
        uint256 timestamp;
        address modelUsed;
        bool verified;
    }

    struct RiskProfile {
        address user;
        uint256 creditScore; // 0-1000
        uint256 riskLevel; // 1-5 (1=lowest risk, 5=highest)
        uint256 lastAssessment;
        uint256 predictionCount;
        mapping(string => int256) riskFactors; // Various risk metrics
    }

    // AI Models
    mapping(bytes32 => AIModel) public aiModels;
    mapping(address => bool) public authorizedModels;
    bytes32[] public activeModels;

    // Predictions and Risk Profiles
    mapping(uint256 => Prediction) public predictions;
    mapping(address => RiskProfile) public riskProfiles;
    uint256 public nextPredictionId = 1;

    // Oracle integration
    DecentralizedOracle public oracle;

    // Model parameters
    uint256 public minModelAccuracy = 70; // Minimum accuracy for active models
    uint256 public predictionFee = 0.01 ether; // Fee per prediction
    uint256 public riskUpdateInterval = 30 days; // How often to update risk profiles

    // Events
    event AIModelRegistered(bytes32 indexed modelId, string name, address maintainer);
    event PredictionMade(uint256 indexed predictionId, address indexed user, string dataType, int256 prediction);
    event RiskProfileUpdated(address indexed user, uint256 creditScore, uint256 riskLevel);
    event ModelAccuracyUpdated(bytes32 indexed modelId, uint256 accuracy);

    constructor(address _oracle) Ownable(msg.sender) {
        oracle = DecentralizedOracle(_oracle);
    }

    // ============ AI MODEL MANAGEMENT ============

    function registerAIModel(
        string memory _name,
        string memory _version,
        bytes32 _modelHash,
        uint256 _accuracy
    ) external returns (bytes32) {
        require(_accuracy >= minModelAccuracy, "Model accuracy too low");
        require(_accuracy <= 100, "Invalid accuracy");

        bytes32 modelId = keccak256(abi.encodePacked(_name, _version, msg.sender, block.timestamp));

        aiModels[modelId] = AIModel({
            name: _name,
            version: _version,
            modelHash: _modelHash,
            accuracy: _accuracy,
            lastUpdated: block.timestamp,
            active: true,
            maintainer: msg.sender
        });

        authorizedModels[msg.sender] = true;
        activeModels.push(modelId);

        emit AIModelRegistered(modelId, _name, msg.sender);
        return modelId;
    }

    function updateModelAccuracy(bytes32 _modelId, uint256 _newAccuracy) external {
        AIModel storage model = aiModels[_modelId];
        require(model.maintainer == msg.sender || msg.sender == owner(), "Not authorized");
        require(_newAccuracy <= 100, "Invalid accuracy");

        model.accuracy = _newAccuracy;
        model.lastUpdated = block.timestamp;

        emit ModelAccuracyUpdated(_modelId, _newAccuracy);
    }

    // ============ PREDICTION FUNCTIONS ============

    function predictCreditScore(
        address _user,
        bytes memory _userData // Encoded user financial data
    ) external payable returns (uint256) {
        require(msg.value >= predictionFee, "Insufficient prediction fee");

        // Get real-time data from oracle
        (uint256 weatherData, , uint256 weatherTimestamp) = oracle.getLatestData(
            DecentralizedOracle.DataType.Weather,
            "user_location", // Would be extracted from user data
            "credit_assessment"
        );

        // Combine user data with oracle data
        bytes memory combinedData = abi.encode(_userData, weatherData, weatherTimestamp);

        // Use ensemble of active models for prediction
        (int256 prediction, uint256 confidence) = _runEnsemblePrediction(combinedData, "credit_score");

        uint256 predictionId = nextPredictionId++;
        predictions[predictionId] = Prediction({
            id: predictionId,
            user: _user,
            dataType: "credit_score",
            inputData: combinedData,
            prediction: prediction,
            confidence: confidence,
            timestamp: block.timestamp,
            modelUsed: address(this), // Ensemble model
            verified: true
        });

        // Update risk profile
        _updateRiskProfile(_user, uint256(prediction), confidence);

        emit PredictionMade(predictionId, _user, "credit_score", prediction);
        return predictionId;
    }

    function predictYield(
        uint256 _farmSize,
        string memory _cropType,
        string memory _location,
        uint256 _plantingDate
    ) external payable returns (uint256) {
        require(msg.value >= predictionFee, "Insufficient prediction fee");

        // Get weather and soil data from oracle
        (uint256 weatherData, , uint256 weatherTimestamp) = oracle.getLatestData(
            DecentralizedOracle.DataType.Weather,
            _location,
            "yield_prediction"
        );

        (uint256 soilData, , ) = oracle.getLatestData(
            DecentralizedOracle.DataType.CropHealth,
            _location,
            "soil_analysis"
        );

        bytes memory inputData = abi.encode(_farmSize, _cropType, _location, _plantingDate, weatherData, soilData);

        (int256 prediction, uint256 confidence) = _runEnsemblePrediction(inputData, "yield_prediction");

        uint256 predictionId = nextPredictionId++;
        predictions[predictionId] = Prediction({
            id: predictionId,
            user: msg.sender,
            dataType: "yield_prediction",
            inputData: inputData,
            prediction: prediction,
            confidence: confidence,
            timestamp: block.timestamp,
            modelUsed: address(this),
            verified: true
        });

        emit PredictionMade(predictionId, msg.sender, "yield_prediction", prediction);
        return predictionId;
    }

    function assessRisk(
        address _user,
        string memory _riskType // "loan_default", "crop_failure", "market_volatility"
    ) external returns (uint256) {
        RiskProfile storage profile = riskProfiles[_user];

        // Check if risk profile needs updating
        if (block.timestamp >= profile.lastAssessment + riskUpdateInterval) {
            _comprehensiveRiskAssessment(_user);
        }

        uint256 predictionId = nextPredictionId++;
        int256 riskScore = profile.riskFactors[_riskType];

        predictions[predictionId] = Prediction({
            id: predictionId,
            user: _user,
            dataType: string(abi.encodePacked("risk_assessment_", _riskType)),
            inputData: abi.encode(_user, _riskType),
            prediction: riskScore,
            confidence: 85, // High confidence for profile-based assessments
            timestamp: block.timestamp,
            modelUsed: address(this),
            verified: true
        });

        emit PredictionMade(predictionId, _user, string(abi.encodePacked("risk_assessment_", _riskType)), riskScore);
        return predictionId;
    }

    // ============ INTERNAL PREDICTION LOGIC ============

    function _runEnsemblePrediction(bytes memory _inputData, string memory _predictionType)
        internal
        view
        returns (int256 prediction, uint256 confidence)
    {
        uint256 totalWeight = 0;
        int256 weightedSum = 0;
        uint256 totalConfidence = 0;

        for (uint256 i = 0; i < activeModels.length; i++) {
            bytes32 modelId = activeModels[i];
            AIModel memory model = aiModels[modelId];

            if (!model.active) continue;

            // Simulate model prediction (in reality, this would call an oracle or ZK proof)
            int256 modelPrediction = _simulateModelPrediction(_inputData, _predictionType, model.accuracy);
            uint256 modelConfidence = model.accuracy;

            // Weight by model accuracy
            uint256 weight = model.accuracy;
            weightedSum += modelPrediction * int256(weight);
            totalWeight += weight;
            totalConfidence += modelConfidence;
        }

        if (totalWeight > 0) {
            prediction = weightedSum / int256(totalWeight);
            confidence = totalConfidence / activeModels.length;
        }

        return (prediction, confidence);
    }

    function _simulateModelPrediction(bytes memory _inputData, string memory _predictionType, uint256 _modelAccuracy)
        internal
        pure
        returns (int256)
    {
        // Simplified simulation - in reality, this would be a complex ML model
        bytes32 hash = keccak256(abi.encodePacked(_inputData, _predictionType, _modelAccuracy));

        if (keccak256(abi.encodePacked(_predictionType)) == keccak256(abi.encodePacked("credit_score"))) {
            // Credit score between 300-850
            return int256(300 + (uint256(hash) % 551));
        } else if (keccak256(abi.encodePacked(_predictionType)) == keccak256(abi.encodePacked("yield_prediction"))) {
            // Yield prediction in tons per hectare
            return int256(1 + (uint256(hash) % 20));
        } else {
            // Risk score 0-100
            return int256(uint256(hash) % 101);
        }
    }

    // ============ RISK PROFILE MANAGEMENT ============

    function _updateRiskProfile(address _user, uint256 _creditScore, uint256 _confidence) internal {
        RiskProfile storage profile = riskProfiles[_user];

        // Update credit score with confidence weighting
        uint256 currentScore = profile.creditScore;
        uint256 newScore = (currentScore * (100 - _confidence) + _creditScore * _confidence) / 100;

        profile.creditScore = newScore;
        profile.lastAssessment = block.timestamp;
        profile.predictionCount++;

        // Calculate risk level (1-5 scale)
        if (newScore >= 750) profile.riskLevel = 1;
        else if (newScore >= 650) profile.riskLevel = 2;
        else if (newScore >= 550) profile.riskLevel = 3;
        else if (newScore >= 450) profile.riskLevel = 4;
        else profile.riskLevel = 5;

        emit RiskProfileUpdated(_user, newScore, profile.riskLevel);
    }

    function _comprehensiveRiskAssessment(address _user) internal {
        RiskProfile storage profile = riskProfiles[_user];

        // Assess various risk factors
        profile.riskFactors["loan_default"] = _assessLoanDefaultRisk(_user);
        profile.riskFactors["crop_failure"] = _assessCropFailureRisk(_user);
        profile.riskFactors["market_volatility"] = _assessMarketVolatilityRisk(_user);
        profile.riskFactors["weather_risk"] = _assessWeatherRisk(_user);

        profile.lastAssessment = block.timestamp;
    }

    function _assessLoanDefaultRisk(address _user) internal view returns (int256) {
        // Simplified risk assessment based on credit history
        RiskProfile memory profile = riskProfiles[_user];

        if (profile.predictionCount == 0) return 50; // Neutral risk

        // Lower risk for higher credit scores
        return int256(100 - (profile.creditScore * 100 / 850));
    }

    function _assessCropFailureRisk(address _user) internal view returns (int256) {
        // Get weather data for risk assessment
        (uint256 weatherData, , ) = oracle.getLatestData(
            DecentralizedOracle.DataType.Weather,
            "user_region", // Would be user-specific
            "risk_assessment"
        );

        // Higher risk with extreme weather
        return int256(weatherData % 100);
    }

    function _assessMarketVolatilityRisk(address _user) internal view returns (int256) {
        // Get market sentiment data
        (uint256 sentimentData, , ) = oracle.getLatestData(
            DecentralizedOracle.DataType.MarketSentiment,
            "agricultural_commodities",
            "volatility"
        );

        return int256(sentimentData % 100);
    }

    function _assessWeatherRisk(address _user) internal view returns (int256) {
        // Get IoT sensor data
        (uint256 iotData, , ) = oracle.getLatestData(
            DecentralizedOracle.DataType.IoT,
            "farm_sensors",
            "weather_risk"
        );

        return int256(iotData % 100);
    }

    // ============ VIEW FUNCTIONS ============

    function getPrediction(uint256 _predictionId) external view returns (Prediction memory) {
        return predictions[_predictionId];
    }

    function getRiskProfile(address _user) external view returns (
        uint256 creditScore,
        uint256 riskLevel,
        uint256 lastAssessment,
        uint256 predictionCount
    ) {
        RiskProfile storage profile = riskProfiles[_user];
        return (profile.creditScore, profile.riskLevel, profile.lastAssessment, profile.predictionCount);
    }

    function getRiskFactor(address _user, string memory _factor) external view returns (int256) {
        return riskProfiles[_user].riskFactors[_factor];
    }

    function getAIModel(bytes32 _modelId) external view returns (AIModel memory) {
        return aiModels[_modelId];
    }

    function getActiveModels() external view returns (bytes32[] memory) {
        return activeModels;
    }

    // ============ ADMIN FUNCTIONS ============

    function updateParameters(
        uint256 _minModelAccuracy,
        uint256 _predictionFee,
        uint256 _riskUpdateInterval
    ) external onlyOwner {
        minModelAccuracy = _minModelAccuracy;
        predictionFee = _predictionFee;
        riskUpdateInterval = _riskUpdateInterval;
    }

    function toggleModel(bytes32 _modelId, bool _active) external {
        AIModel storage model = aiModels[_modelId];
        require(model.maintainer == msg.sender || msg.sender == owner(), "Not authorized");

        model.active = _active;

        if (_active && !_isInArray(activeModels, _modelId)) {
            activeModels.push(_modelId);
        } else if (!_active) {
            _removeFromArray(activeModels, _modelId);
        }
    }

    function _isInArray(bytes32[] memory _array, bytes32 _value) internal pure returns (bool) {
        for (uint256 i = 0; i < _array.length; i++) {
            if (_array[i] == _value) return true;
        }
        return false;
    }

    function _removeFromArray(bytes32[] storage _array, bytes32 _value) internal {
        for (uint256 i = 0; i < _array.length; i++) {
            if (_array[i] == _value) {
                _array[i] = _array[_array.length - 1];
                _array.pop();
                break;
            }
        }
    }

    // Withdraw prediction fees
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    receive() external payable {}
}