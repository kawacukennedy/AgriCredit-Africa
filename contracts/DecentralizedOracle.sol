// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract DecentralizedOracle is Ownable, ReentrancyGuard {
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

    constructor() Ownable(msg.sender) {}

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
}</content>
</xai:function_call