// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract DecentralizedOracle is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    using ECDSA for bytes32;

    enum DataType { Weather, CropHealth, Price, MarketSentiment, IoT }

    struct OracleNode {
        address nodeAddress;
        uint256 reputation;
        uint256 totalSubmissions;
        uint256 successfulSubmissions;
        bool active;
        uint256 stakeAmount;
        uint256 lastSubmissionTime;
    }

    struct DataFeed {
        DataType dataType;
        string location;
        string parameters; // JSON string with additional parameters
        uint256 timestamp;
        uint256 value;
        uint256 confidence; // 0-100
        address submittedBy;
        uint256 validations;
        uint256 totalReputation;
        bool finalized;
    }

    struct Validation {
        address validator;
        uint256 value;
        uint256 timestamp;
        uint256 reputation;
    }

    // Oracle nodes
    mapping(address => OracleNode) public oracleNodes;
    address[] public activeNodes;

    // Data feeds
    mapping(bytes32 => DataFeed) public dataFeeds;
    mapping(bytes32 => Validation[]) public feedValidations;

    // Advanced AI Oracle features
    struct AIModel {
        string name;
        string version;
        bytes32 modelHash;
        uint256 accuracy;
        uint256 lastUpdated;
        address maintainer;
        bool active;
        uint256 totalPredictions;
        uint256 successfulPredictions;
    }

    struct Prediction {
        bytes32 feedId;
        uint256 predictedValue;
        uint256 confidence;
        uint256 timestamp;
        address modelUsed;
        bool validated;
        uint256 actualValue;
    }

    struct CrossChainOracle {
        uint256 chainId;
        address remoteOracle;
        uint256 trustScore;
        bool active;
        uint256 lastSyncTime;
    }

    // AI Models
    mapping(bytes32 => AIModel) public aiModels;
    bytes32[] public activeModels;

    // Predictions
    mapping(bytes32 => Prediction[]) public modelPredictions;

    // Cross-chain oracles
    mapping(uint256 => CrossChainOracle) public crossChainOracles;
    uint256[] public supportedChains;

    // Enhanced reputation system
    uint256 public minStakeAmount = 1000 * 10**18; // 1000 tokens
    uint256 public slashingPenalty = 100; // 1% penalty
    uint256 public reputationThreshold = 50; // Minimum reputation to participate

    // AI Oracle parameters
    uint256 public predictionReward = 10 * 10**18; // 10 tokens per prediction
    uint256 public validationReward = 5 * 10**18; // 5 tokens per validation
    address public rewardToken;

    // Staking
    mapping(address => uint256) public nodeStakes;
    uint256 public totalStaked;
    uint256 public minStakeAmount = 1000 * 10**18; // 1000 tokens
    uint256 public slashingPenalty = 100; // 1% penalty for bad submissions

    // Reputation system
    uint256 public maxReputation = 1000;
    uint256 public minReputation = 100;

    // Consensus parameters
    uint256 public consensusThreshold = 70; // 70% agreement required
    uint256 public minValidations = 3;
    uint256 public validationPeriod = 1 hours;

    // Events
    event OracleNodeRegistered(address indexed node, uint256 stakeAmount);
    event OracleNodeSlashed(address indexed node, uint256 penalty);
    event DataSubmitted(bytes32 indexed feedId, address indexed submitter, DataType dataType, uint256 value);
    event DataValidated(bytes32 indexed feedId, address indexed validator, uint256 value);
    event DataFinalized(bytes32 indexed feedId, uint256 finalValue, uint256 confidence);
    event NodeSlashed(address indexed node, uint256 amount);

    function initialize(address _rewardToken) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        rewardToken = _rewardToken;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ============ ORACLE NODE MANAGEMENT ============

    function registerOracleNode() external payable nonReentrant {
        require(msg.value >= minStakeAmount, "Insufficient stake");
        require(!oracleNodes[msg.sender].active, "Already registered");

        oracleNodes[msg.sender] = OracleNode({
            nodeAddress: msg.sender,
            reputation: 500, // Start with neutral reputation
            totalSubmissions: 0,
            successfulSubmissions: 0,
            active: true,
            stakeAmount: msg.value,
            lastSubmissionTime: 0
        });

        nodeStakes[msg.sender] = msg.value;
        totalStaked += msg.value;
        activeNodes.push(msg.sender);

        emit OracleNodeRegistered(msg.sender, msg.value);
    }

    function unregisterOracleNode() external nonReentrant {
        OracleNode storage node = oracleNodes[msg.sender];
        require(node.active, "Not registered");
        require(node.stakeAmount > 0, "No stake to withdraw");

        uint256 stakeAmount = node.stakeAmount;
        node.active = false;
        node.stakeAmount = 0;
        nodeStakes[msg.sender] = 0;
        totalStaked -= stakeAmount;

        // Remove from active nodes
        for (uint256 i = 0; i < activeNodes.length; i++) {
            if (activeNodes[i] == msg.sender) {
                activeNodes[i] = activeNodes[activeNodes.length - 1];
                activeNodes.pop();
                break;
            }
        }

        payable(msg.sender).transfer(stakeAmount);
    }

    // ============ DATA SUBMISSION ============

    function submitData(
        DataType _dataType,
        string memory _location,
        string memory _parameters,
        uint256 _value,
        uint256 _confidence
    ) external returns (bytes32) {
        OracleNode storage node = oracleNodes[msg.sender];
        require(node.active, "Not an active oracle node");
        require(_confidence <= 100, "Invalid confidence");
        require(block.timestamp >= node.lastSubmissionTime + 5 minutes, "Submission cooldown");

        bytes32 feedId = keccak256(abi.encodePacked(
            _dataType,
            _location,
            _parameters,
            block.timestamp / 1 hours // Group by hour
        ));

        // Check if feed already exists
        if (dataFeeds[feedId].submittedBy == address(0)) {
            // New feed
            dataFeeds[feedId] = DataFeed({
                dataType: _dataType,
                location: _location,
                parameters: _parameters,
                timestamp: block.timestamp,
                value: _value,
                confidence: _confidence,
                submittedBy: msg.sender,
                validations: 0,
                totalReputation: node.reputation,
                finalized: false
            });
        } else {
            // Additional submission - treat as validation
            _validateData(feedId, _value);
            return feedId;
        }

        node.totalSubmissions++;
        node.lastSubmissionTime = block.timestamp;

        emit DataSubmitted(feedId, msg.sender, _dataType, _value);
        return feedId;
    }

    function _validateData(bytes32 _feedId, uint256 _value) internal {
        DataFeed storage feed = dataFeeds[_feedId];
        OracleNode storage validator = oracleNodes[msg.sender];

        require(validator.active, "Not an active validator");
        require(!_hasValidated(_feedId, msg.sender), "Already validated");

        Validation memory validation = Validation({
            validator: msg.sender,
            value: _value,
            timestamp: block.timestamp,
            reputation: validator.reputation
        });

        feedValidations[_feedId].push(validation);
        feed.validations++;
        feed.totalReputation += validator.reputation;

        validator.totalSubmissions++;

        emit DataValidated(_feedId, msg.sender, _value);

        // Check if consensus reached
        if (feed.validations >= minValidations && block.timestamp >= feed.timestamp + validationPeriod) {
            _finalizeDataFeed(_feedId);
        }
    }

    function _hasValidated(bytes32 _feedId, address _validator) internal view returns (bool) {
        Validation[] memory validations = feedValidations[_feedId];
        for (uint256 i = 0; i < validations.length; i++) {
            if (validations[i].validator == _validator) {
                return true;
            }
        }
        return false;
    }

    function _finalizeDataFeed(bytes32 _feedId) internal {
        DataFeed storage feed = dataFeeds[_feedId];
        Validation[] memory validations = feedValidations[_feedId];

        // Calculate weighted average based on reputation
        uint256 weightedSum = feed.value * oracleNodes[feed.submittedBy].reputation;
        uint256 totalWeight = oracleNodes[feed.submittedBy].reputation;

        for (uint256 i = 0; i < validations.length; i++) {
            weightedSum += validations[i].value * validations[i].reputation;
            totalWeight += validations[i].reputation;
        }

        uint256 finalValue = weightedSum / totalWeight;

        // Calculate confidence based on agreement
        uint256 agreementScore = _calculateAgreementScore(_feedId, finalValue);
        uint256 finalConfidence = Math.min(agreementScore, 100);

        feed.value = finalValue;
        feed.confidence = finalConfidence;
        feed.finalized = true;

        // Update reputations
        _updateReputations(_feedId, finalValue);

        emit DataFinalized(_feedId, finalValue, finalConfidence);
    }

    function _calculateAgreementScore(bytes32 _feedId, uint256 _finalValue) internal view returns (uint256) {
        Validation[] memory validations = feedValidations[_feedId];
        uint256 agreeingValidations = 0;

        // Count validations within 5% of final value
        uint256 tolerance = _finalValue / 20; // 5%

        for (uint256 i = 0; i < validations.length; i++) {
            if (validations[i].value >= _finalValue - tolerance &&
                validations[i].value <= _finalValue + tolerance) {
                agreeingValidations++;
            }
        }

        return (agreeingValidations * 100) / validations.length;
    }

    function _updateReputations(bytes32 _feedId, uint256 _finalValue) internal {
        DataFeed memory feed = dataFeeds[_feedId];
        Validation[] memory validations = feedValidations[_feedId];

        // Update submitter reputation
        OracleNode storage submitter = oracleNodes[feed.submittedBy];
        if (_isAccurate(feed.value, _finalValue)) {
            submitter.successfulSubmissions++;
            submitter.reputation = Math.min(submitter.reputation + 10, maxReputation);
        } else {
            submitter.reputation = Math.max(submitter.reputation - 20, minReputation);
        }

        // Update validator reputations
        for (uint256 i = 0; i < validations.length; i++) {
            OracleNode storage validator = oracleNodes[validations[i].validator];
            if (_isAccurate(validations[i].value, _finalValue)) {
                validator.successfulSubmissions++;
                validator.reputation = Math.min(validator.reputation + 5, maxReputation);
            } else {
                validator.reputation = Math.max(validator.reputation - 10, minReputation);
                // Slash stake for bad validations
                _slashNode(validator.nodeAddress, slashingPenalty);
            }
        }
    }

    function _isAccurate(uint256 _submittedValue, uint256 _finalValue) internal pure returns (bool) {
        uint256 tolerance = _finalValue / 10; // 10% tolerance
        return _submittedValue >= _finalValue - tolerance && _submittedValue <= _finalValue + tolerance;
    }

    function _slashNode(address _node, uint256 _percentage) internal {
        OracleNode storage node = oracleNodes[_node];
        uint256 slashAmount = (node.stakeAmount * _percentage) / 10000;

        if (slashAmount > 0) {
            node.stakeAmount -= slashAmount;
            nodeStakes[_node] -= slashAmount;
            totalStaked -= slashAmount;

            emit NodeSlashed(_node, slashAmount);
        }
    }

    // ============ QUERY FUNCTIONS ============

    function getDataFeed(bytes32 _feedId) external view returns (DataFeed memory) {
        return dataFeeds[_feedId];
    }

    function getDataValidations(bytes32 _feedId) external view returns (Validation[] memory) {
        return feedValidations[_feedId];
    }

    function getLatestData(DataType _dataType, string memory _location, string memory _parameters)
        external
        view
        returns (uint256 value, uint256 confidence, uint256 timestamp)
    {
        bytes32 feedId = keccak256(abi.encodePacked(
            _dataType,
            _location,
            _parameters,
            block.timestamp / 1 hours
        ));

        DataFeed memory feed = dataFeeds[feedId];
        if (feed.finalized) {
            return (feed.value, feed.confidence, feed.timestamp);
        }

        // Try previous hour
        feedId = keccak256(abi.encodePacked(
            _dataType,
            _location,
            _parameters,
            (block.timestamp / 1 hours) - 1
        ));

        feed = dataFeeds[feedId];
        if (feed.finalized) {
            return (feed.value, feed.confidence, feed.timestamp);
        }

        return (0, 0, 0);
    }

    function getOracleNode(address _node) external view returns (OracleNode memory) {
        return oracleNodes[_node];
    }

    function getActiveNodes() external view returns (address[] memory) {
        return activeNodes;
    }

    function getNodeReputation(address _node) external view returns (uint256) {
        return oracleNodes[_node].reputation;
    }

    // ============ ADMIN FUNCTIONS ============

    function updateConsensusParameters(
        uint256 _consensusThreshold,
        uint256 _minValidations,
        uint256 _validationPeriod
    ) external onlyOwner {
        consensusThreshold = _consensusThreshold;
        minValidations = _minValidations;
        validationPeriod = _validationPeriod;
    }

    function updateStakingParameters(
        uint256 _minStakeAmount,
        uint256 _slashingPenalty
    ) external onlyOwner {
        minStakeAmount = _minStakeAmount;
        slashingPenalty = _slashingPenalty;
    }

    function updateReputationParameters(
        uint256 _maxReputation,
        uint256 _minReputation
    ) external onlyOwner {
        maxReputation = _maxReputation;
        minReputation = _minReputation;
    }

    function emergencyPause() external onlyOwner {
        // Implementation for emergency pause
    }

    function emergencyUnpause() external onlyOwner {
        // Implementation for emergency unpause
    }

    // ============ ADVANCED AI ORACLE FUNCTIONS ============

    function registerAIModel(
        string memory name,
        string memory version,
        bytes32 modelHash,
        uint256 initialAccuracy
    ) external returns (bytes32) {
        require(oracleNodes[msg.sender].active, "Not an active oracle node");

        bytes32 modelId = keccak256(abi.encodePacked(name, version, msg.sender));

        aiModels[modelId] = AIModel({
            name: name,
            version: version,
            modelHash: modelHash,
            accuracy: initialAccuracy,
            lastUpdated: block.timestamp,
            maintainer: msg.sender,
            active: true,
            totalPredictions: 0,
            successfulPredictions: 0
        });

        activeModels.push(modelId);

        emit AIModelRegistered(modelId, name, version, msg.sender);
        return modelId;
    }

    function submitAIPrediction(
        bytes32 modelId,
        DataType dataType,
        string memory location,
        string memory parameters,
        uint256 predictedValue,
        uint256 confidence
    ) external nonReentrant {
        require(aiModels[modelId].active, "Model not active");
        require(aiModels[modelId].maintainer == msg.sender, "Not model maintainer");
        require(oracleNodes[msg.sender].active, "Not an active oracle node");

        bytes32 feedId = keccak256(abi.encodePacked(
            dataType,
            location,
            parameters,
            block.timestamp / 1 hours
        ));

        Prediction memory prediction = Prediction({
            feedId: feedId,
            predictedValue: predictedValue,
            confidence: confidence,
            timestamp: block.timestamp,
            modelUsed: msg.sender,
            validated: false,
            actualValue: 0
        });

        modelPredictions[modelId].push(prediction);
        aiModels[modelId].totalPredictions++;

        // Reward for prediction
        _mintReward(msg.sender, predictionReward);

        emit AIPredictionSubmitted(modelId, feedId, predictedValue, confidence);
    }

    function validateAIPrediction(bytes32 modelId, uint256 predictionIndex, uint256 actualValue) external {
        require(oracleNodes[msg.sender].active, "Not an active validator");

        Prediction storage prediction = modelPredictions[modelId][predictionIndex];
        require(!prediction.validated, "Already validated");

        prediction.validated = true;
        prediction.actualValue = actualValue;

        // Calculate accuracy
        uint256 accuracy = _calculatePredictionAccuracy(prediction.predictedValue, actualValue);
        AIModel storage model = aiModels[modelId];

        // Update model accuracy
        model.accuracy = (model.accuracy * model.totalPredictions + accuracy) / (model.totalPredictions + 1);

        if (accuracy >= 80) { // 80% accuracy threshold
            model.successfulPredictions++;
        }

        // Reward validator
        _mintReward(msg.sender, validationReward);

        emit AIPredictionValidated(modelId, predictionIndex, accuracy);
    }

    function _calculatePredictionAccuracy(uint256 predicted, uint256 actual) internal pure returns (uint256) {
        if (predicted == 0 && actual == 0) return 100;

        uint256 diff = predicted > actual ? predicted - actual : actual - predicted;
        uint256 maxVal = predicted > actual ? predicted : actual;

        return 100 - (diff * 100 / maxVal);
    }

    function _mintReward(address recipient, uint256 amount) internal {
        // Simplified reward minting - in practice, would check reward token balance
        // IERC20(rewardToken).transfer(recipient, amount);
        emit RewardMinted(recipient, amount);
    }

    // Cross-chain oracle functions
    function addCrossChainOracle(uint256 chainId, address remoteOracle) external onlyOwner {
        crossChainOracles[chainId] = CrossChainOracle({
            chainId: chainId,
            remoteOracle: remoteOracle,
            trustScore: 100, // Start with full trust
            active: true,
            lastSyncTime: block.timestamp
        });

        supportedChains.push(chainId);

        emit CrossChainOracleAdded(chainId, remoteOracle);
    }

    function syncCrossChainData(uint256 chainId, bytes32 feedId, uint256 value, uint256 confidence) external {
        require(crossChainOracles[chainId].active, "Chain not supported");
        require(oracleNodes[msg.sender].active, "Not authorized");

        CrossChainOracle storage remoteOracle = crossChainOracles[chainId];

        // Update trust score based on data consistency
        DataFeed storage localFeed = dataFeeds[feedId];
        if (localFeed.finalized) {
            uint256 consistency = _calculateDataConsistency(localFeed.value, value);
            remoteOracle.trustScore = (remoteOracle.trustScore * 9 + consistency) / 10; // Weighted average
        }

        remoteOracle.lastSyncTime = block.timestamp;

        emit CrossChainDataSynced(chainId, feedId, value, confidence);
    }

    function _calculateDataConsistency(uint256 localValue, uint256 remoteValue) internal pure returns (uint256) {
        if (localValue == remoteValue) return 100;

        uint256 diff = localValue > remoteValue ? localValue - remoteValue : remoteValue - localValue;
        uint256 avg = (localValue + remoteValue) / 2;

        return 100 - (diff * 100 / avg);
    }

    function getAIModel(bytes32 modelId) external view returns (AIModel memory) {
        return aiModels[modelId];
    }

    function getModelPredictions(bytes32 modelId) external view returns (Prediction[] memory) {
        return modelPredictions[modelId];
    }

    function getCrossChainOracle(uint256 chainId) external view returns (CrossChainOracle memory) {
        return crossChainOracles[chainId];
    }

    function getSupportedChains() external view returns (uint256[] memory) {
        return supportedChains;
    }

    // Enhanced reputation calculation
    function calculateNodeReputation(address node) external view returns (uint256) {
        OracleNode memory oracleNode = oracleNodes[node];

        if (oracleNode.totalSubmissions == 0) return minReputation;

        uint256 successRate = (oracleNode.successfulSubmissions * 100) / oracleNode.totalSubmissions;
        uint256 stakeMultiplier = oracleNode.stakeAmount / minStakeAmount;

        uint256 reputation = (successRate * stakeMultiplier) / 100;

        return Math.min(reputation, maxReputation);
    }

    // Admin functions for AI features
    function updateAIParameters(uint256 _predictionReward, uint256 _validationReward) external onlyOwner {
        predictionReward = _predictionReward;
        validationReward = _validationReward;
    }

    function deactivateAIModel(bytes32 modelId) external {
        require(aiModels[modelId].maintainer == msg.sender || msg.sender == owner(), "Not authorized");

        aiModels[modelId].active = false;

        emit AIModelDeactivated(modelId);
    }

    function setRewardToken(address _token) external onlyOwner {
        rewardToken = _token;
        emit RewardTokenSet(_token);
    }

    // Additional events
    event AIModelRegistered(bytes32 indexed modelId, string name, string version, address maintainer);
    event AIPredictionSubmitted(bytes32 indexed modelId, bytes32 indexed feedId, uint256 predictedValue, uint256 confidence);
    event AIPredictionValidated(bytes32 indexed modelId, uint256 predictionIndex, uint256 accuracy);
    event RewardMinted(address indexed recipient, uint256 amount);
    event CrossChainOracleAdded(uint256 indexed chainId, address indexed remoteOracle);
    event CrossChainDataSynced(uint256 indexed chainId, bytes32 indexed feedId, uint256 value, uint256 confidence);
    event AIModelDeactivated(bytes32 indexed modelId);
    event RewardTokenSet(address indexed token);
}</content>
</xai:function_call