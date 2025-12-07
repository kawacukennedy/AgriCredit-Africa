// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract CrossChainMessenger is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    using ECDSA for bytes32;

    enum MessageType {
        TokenTransfer,
        GovernanceProposal,
        OracleData,
        InsuranceClaim,
        NFTBridge,
        StakingUpdate
    }

    enum MessageStatus {
        Pending,
        Delivered,
        Failed,
        Expired
    }

    struct CrossChainMessage {
        uint256 messageId;
        uint256 sourceChainId;
        uint256 targetChainId;
        address sourceContract;
        address targetContract;
        MessageType messageType;
        bytes payload;
        uint256 value;
        address sender;
        uint256 timestamp;
        uint256 expiry;
        MessageStatus status;
        bytes32 messageHash;
        uint256 confirmations;
        mapping(address => bool) validators;
    }

    struct ChainConfig {
        uint256 chainId;
        address messengerContract;
        uint256 requiredConfirmations;
        uint256 messageFee;
        bool active;
        uint256 totalMessages;
        uint256 successfulDeliveries;
    }

    struct MessageValidator {
        address validator;
        uint256 chainId;
        uint256 reputation;
        bool active;
        uint256 processedMessages;
    }

    // Messages
    mapping(uint256 => CrossChainMessage) public messages;
    uint256 public nextMessageId = 1;

    // Chain configurations
    mapping(uint256 => ChainConfig) public chainConfigs;
    uint256[] public supportedChains;

    // Validators
    mapping(address => MessageValidator) public validators;
    address[] public activeValidators;

    // Message routing
    mapping(bytes32 => uint256) public messageHashes; // messageHash => messageId

    // Security parameters
    uint256 public messageExpiry = 7 days;
    uint256 public minValidators = 3;
    uint256 public maxMessageValue = 100 ether;

    // Fee collection
    uint256 public collectedFees;
    address public feeRecipient;

    // Events
    event MessageSent(uint256 indexed messageId, uint256 sourceChainId, uint256 targetChainId, MessageType messageType);
    event MessageDelivered(uint256 indexed messageId, uint256 targetChainId);
    event MessageFailed(uint256 indexed messageId, string reason);
    event MessageValidated(uint256 indexed messageId, address indexed validator);
    event ChainAdded(uint256 indexed chainId, address messengerContract);
    event ValidatorAdded(address indexed validator, uint256 indexed chainId);
    event FeesCollected(address indexed recipient, uint256 amount);

    function initialize(address _feeRecipient) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        feeRecipient = _feeRecipient;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ============ CHAIN MANAGEMENT ============

    function addChain(
        uint256 _chainId,
        address _messengerContract,
        uint256 _requiredConfirmations,
        uint256 _messageFee
    ) external onlyOwner {
        require(chainConfigs[_chainId].messengerContract == address(0), "Chain already exists");
        require(_requiredConfirmations >= minValidators, "Insufficient confirmations");

        chainConfigs[_chainId] = ChainConfig({
            chainId: _chainId,
            messengerContract: _messengerContract,
            requiredConfirmations: _requiredConfirmations,
            messageFee: _messageFee,
            active: true,
            totalMessages: 0,
            successfulDeliveries: 0
        });

        supportedChains.push(_chainId);

        emit ChainAdded(_chainId, _messengerContract);
    }

    function updateChainConfig(
        uint256 _chainId,
        uint256 _requiredConfirmations,
        uint256 _messageFee,
        bool _active
    ) external onlyOwner {
        ChainConfig storage config = chainConfigs[_chainId];
        require(config.messengerContract != address(0), "Chain not found");

        config.requiredConfirmations = _requiredConfirmations;
        config.messageFee = _messageFee;
        config.active = _active;
    }

    // ============ VALIDATOR MANAGEMENT ============

    function addValidator(address _validator, uint256 _chainId) external onlyOwner {
        require(!validators[_validator].active, "Validator already exists");
        require(chainConfigs[_chainId].active, "Chain not active");

        validators[_validator] = MessageValidator({
            validator: _validator,
            chainId: _chainId,
            reputation: 100, // Start with 100 reputation
            active: true,
            processedMessages: 0
        });

        activeValidators.push(_validator);

        emit ValidatorAdded(_validator, _chainId);
    }

    function removeValidator(address _validator) external onlyOwner {
        require(validators[_validator].active, "Validator not active");

        validators[_validator].active = false;

        // Remove from active validators array
        for (uint256 i = 0; i < activeValidators.length; i++) {
            if (activeValidators[i] == _validator) {
                activeValidators[i] = activeValidators[activeValidators.length - 1];
                activeValidators.pop();
                break;
            }
        }
    }

    // ============ MESSAGE SENDING ============

    function sendMessage(
        uint256 _targetChainId,
        address _targetContract,
        MessageType _messageType,
        bytes memory _payload
    ) external payable returns (uint256) {
        ChainConfig memory targetChain = chainConfigs[_targetChainId];
        require(targetChain.active, "Target chain not active");
        require(msg.value >= targetChain.messageFee, "Insufficient fee");
        require(msg.value <= maxMessageValue, "Message value too high");

        uint256 messageId = nextMessageId++;
        bytes32 messageHash = keccak256(abi.encodePacked(
            messageId,
            block.chainid,
            _targetChainId,
            _targetContract,
            _messageType,
            _payload,
            msg.value,
            msg.sender,
            block.timestamp
        ));

        CrossChainMessage storage message = messages[messageId];
        message.messageId = messageId;
        message.sourceChainId = block.chainid;
        message.targetChainId = _targetChainId;
        message.sourceContract = address(this);
        message.targetContract = _targetContract;
        message.messageType = _messageType;
        message.payload = _payload;
        message.value = msg.value;
        message.sender = msg.sender;
        message.timestamp = block.timestamp;
        message.expiry = block.timestamp + messageExpiry;
        message.status = MessageStatus.Pending;
        message.messageHash = messageHash;

        messageHashes[messageHash] = messageId;
        chainConfigs[_targetChainId].totalMessages++;

        // Collect fee
        collectedFees += msg.value;

        emit MessageSent(messageId, block.chainid, _targetChainId, _messageType);
        return messageId;
    }

    // ============ MESSAGE VALIDATION & DELIVERY ============

    function validateMessage(uint256 _messageId, bytes memory _signature) external {
        require(validators[msg.sender].active, "Not an active validator");

        CrossChainMessage storage message = messages[_messageId];
        require(message.status == MessageStatus.Pending, "Message not pending");
        require(block.timestamp <= message.expiry, "Message expired");
        require(!message.validators[msg.sender], "Already validated");

        // Verify signature
        bytes32 ethSignedMessageHash = message.messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(_signature);
        require(signer == msg.sender, "Invalid signature");

        message.validators[msg.sender] = true;
        message.confirmations++;

        validators[msg.sender].processedMessages++;

        emit MessageValidated(_messageId, msg.sender);

        // Check if message can be delivered
        ChainConfig memory targetChain = chainConfigs[message.targetChainId];
        if (message.confirmations >= targetChain.requiredConfirmations) {
            _deliverMessage(_messageId);
        }
    }

    function _deliverMessage(uint256 _messageId) internal {
        CrossChainMessage storage message = messages[_messageId];
        require(message.status == MessageStatus.Pending, "Message not pending");

        // Attempt to execute the message on target contract
        (bool success, ) = message.targetContract.call{value: message.value}(message.payload);

        if (success) {
            message.status = MessageStatus.Delivered;
            chainConfigs[message.targetChainId].successfulDeliveries++;

            emit MessageDelivered(_messageId, message.targetChainId);
        } else {
            message.status = MessageStatus.Failed;

            emit MessageFailed(_messageId, "Execution failed");
        }
    }

    // ============ MESSAGE RETRIEVAL ============

    function retryMessage(uint256 _messageId) external {
        CrossChainMessage storage message = messages[_messageId];
        require(message.status == MessageStatus.Failed, "Message not failed");
        require(message.sender == msg.sender, "Not the sender");
        require(block.timestamp <= message.expiry, "Message expired");

        message.status = MessageStatus.Pending;
        message.confirmations = 0;

        // Clear validators
        for (uint256 i = 0; i < activeValidators.length; i++) {
            message.validators[activeValidators[i]] = false;
        }
    }

    // ============ FEE MANAGEMENT ============

    function collectFees() external onlyOwner {
        require(collectedFees > 0, "No fees to collect");

        uint256 amount = collectedFees;
        collectedFees = 0;

        payable(feeRecipient).transfer(amount);

        emit FeesCollected(feeRecipient, amount);
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }

    // ============ VIEW FUNCTIONS ============

    function getMessage(uint256 _messageId) external view returns (
        uint256 messageId,
        uint256 sourceChainId,
        uint256 targetChainId,
        MessageType messageType,
        address sender,
        uint256 timestamp,
        MessageStatus status,
        uint256 confirmations
    ) {
        CrossChainMessage storage message = messages[_messageId];
        return (
            message.messageId,
            message.sourceChainId,
            message.targetChainId,
            message.messageType,
            message.sender,
            message.timestamp,
            message.status,
            message.confirmations
        );
    }

    function getChainConfig(uint256 _chainId) external view returns (ChainConfig memory) {
        return chainConfigs[_chainId];
    }

    function getSupportedChains() external view returns (uint256[] memory) {
        return supportedChains;
    }

    function getActiveValidators() external view returns (address[] memory) {
        return activeValidators;
    }

    function canDeliverMessage(uint256 _messageId) external view returns (bool) {
        CrossChainMessage storage message = messages[_messageId];
        ChainConfig memory targetChain = chainConfigs[message.targetChainId];

        return message.status == MessageStatus.Pending &&
               message.confirmations >= targetChain.requiredConfirmations &&
               block.timestamp <= message.expiry;
    }

    function getMessageHash(uint256 _messageId) external view returns (bytes32) {
        return messages[_messageId].messageHash;
    }

    // ============ ADMIN FUNCTIONS ============

    function setMessageParameters(
        uint256 _messageExpiry,
        uint256 _minValidators,
        uint256 _maxMessageValue
    ) external onlyOwner {
        messageExpiry = _messageExpiry;
        minValidators = _minValidators;
        maxMessageValue = _maxMessageValue;
    }

    function emergencyPauseMessage(uint256 _messageId) external onlyOwner {
        CrossChainMessage storage message = messages[_messageId];
        require(message.status == MessageStatus.Pending, "Message not pending");

        message.status = MessageStatus.Failed;
    }

    function emergencyExecuteMessage(uint256 _messageId) external onlyOwner {
        CrossChainMessage storage message = messages[_messageId];
        require(message.status == MessageStatus.Failed, "Message not failed");

        _deliverMessage(_messageId);
    }
}