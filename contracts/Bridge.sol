// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract Bridge is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;

    struct BridgeTransaction {
        uint256 id;
        address sender;
        address recipient;
        address token;
        uint256 amount;
        uint256 sourceChainId;
        uint256 targetChainId;
        uint256 timestamp;
        bytes32 txHash;
        Status status;
        uint256 confirmations;
        address[] validators;
    }

    struct TokenConfig {
        address tokenAddress;
        uint256 minAmount;
        uint256 maxAmount;
        uint256 fee; // in basis points
        bool active;
        uint256 dailyLimit;
        uint256 dailyTransferred;
        uint256 lastResetTime;
    }

    struct ChainConfig {
        uint256 chainId;
        address bridgeContract;
        uint256 requiredConfirmations;
        bool active;
        uint256 totalTransferred;
        uint256 totalFees;
    }

    enum Status { Pending, Confirmed, Completed, Failed }

    // Bridge transactions
    mapping(uint256 => BridgeTransaction) public transactions;
    uint256 public nextTxId = 1;

    // Token configurations
    mapping(address => TokenConfig) public tokenConfigs;

    // Chain configurations
    mapping(uint256 => ChainConfig) public chainConfigs;
    uint256[] public supportedChains;

    // Validators
    mapping(address => bool) public validators;
    address[] public validatorList;

    // Protocol parameters
    uint256 public confirmationThreshold = 3;
    uint256 public maxValidators = 10;
    uint256 public dailyResetTime = 24 hours;
    uint256 public emergencyPauseDelay = 24 hours;

    // Fee collection
    uint256 public collectedFees;
    address public feeRecipient;

    // Emergency controls
    bool public emergencyPaused;
    uint256 public emergencyPauseTime;

    // Events
    event BridgeTransactionInitiated(uint256 indexed txId, address indexed sender, address token, uint256 amount, uint256 targetChainId);
    event BridgeTransactionConfirmed(uint256 indexed txId, address indexed validator);
    event BridgeTransactionCompleted(uint256 indexed txId, address indexed recipient, uint256 amount);
    event TokenLocked(address indexed token, address indexed sender, uint256 amount);
    event TokenMinted(address indexed token, address indexed recipient, uint256 amount);
    event ChainAdded(uint256 indexed chainId, address bridgeContract);
    event ValidatorAdded(address indexed validator);
    event ValidatorRemoved(address indexed validator);
    event EmergencyPaused(uint256 timestamp);
    event EmergencyUnpaused();

    function initialize(address _feeRecipient) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        feeRecipient = _feeRecipient;
        validators[msg.sender] = true;
        validatorList.push(msg.sender);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ============ CHAIN MANAGEMENT ============

    function addChain(
        uint256 _chainId,
        address _bridgeContract,
        uint256 _requiredConfirmations
    ) external onlyOwner {
        require(chainConfigs[_chainId].bridgeContract == address(0), "Chain already exists");
        require(_requiredConfirmations <= validatorList.length, "Too many confirmations required");

        chainConfigs[_chainId] = ChainConfig({
            chainId: _chainId,
            bridgeContract: _bridgeContract,
            requiredConfirmations: _requiredConfirmations,
            active: true,
            totalTransferred: 0,
            totalFees: 0
        });

        supportedChains.push(_chainId);

        emit ChainAdded(_chainId, _bridgeContract);
    }

    function updateChainConfig(
        uint256 _chainId,
        uint256 _requiredConfirmations,
        bool _active
    ) external onlyOwner {
        ChainConfig storage config = chainConfigs[_chainId];
        require(config.bridgeContract != address(0), "Chain not found");

        config.requiredConfirmations = _requiredConfirmations;
        config.active = _active;
    }

    // ============ TOKEN MANAGEMENT ============

    function addToken(
        address _token,
        uint256 _minAmount,
        uint256 _maxAmount,
        uint256 _fee,
        uint256 _dailyLimit
    ) external onlyOwner {
        require(tokenConfigs[_token].tokenAddress == address(0), "Token already configured");

        tokenConfigs[_token] = TokenConfig({
            tokenAddress: _token,
            minAmount: _minAmount,
            maxAmount: _maxAmount,
            fee: _fee,
            active: true,
            dailyLimit: _dailyLimit,
            dailyTransferred: 0,
            lastResetTime: block.timestamp
        });
    }

    function updateTokenConfig(
        address _token,
        uint256 _minAmount,
        uint256 _maxAmount,
        uint256 _fee,
        uint256 _dailyLimit,
        bool _active
    ) external onlyOwner {
        TokenConfig storage config = tokenConfigs[_token];
        require(config.tokenAddress != address(0), "Token not configured");

        config.minAmount = _minAmount;
        config.maxAmount = _maxAmount;
        config.fee = _fee;
        config.dailyLimit = _dailyLimit;
        config.active = _active;
    }

    function _resetDailyLimit(address _token) internal {
        TokenConfig storage config = tokenConfigs[_token];
        if (block.timestamp >= config.lastResetTime + dailyResetTime) {
            config.dailyTransferred = 0;
            config.lastResetTime = block.timestamp;
        }
    }

    // ============ VALIDATOR MANAGEMENT ============

    function addValidator(address _validator) external onlyOwner {
        require(!validators[_validator], "Already a validator");
        require(validatorList.length < maxValidators, "Max validators reached");

        validators[_validator] = true;
        validatorList.push(_validator);

        emit ValidatorAdded(_validator);
    }

    function removeValidator(address _validator) external onlyOwner {
        require(validators[_validator], "Not a validator");

        validators[_validator] = false;

        // Remove from array
        for (uint256 i = 0; i < validatorList.length; i++) {
            if (validatorList[i] == _validator) {
                validatorList[i] = validatorList[validatorList.length - 1];
                validatorList.pop();
                break;
            }
        }

        emit ValidatorRemoved(_validator);
    }

    // ============ BRIDGE OPERATIONS ============

    function bridgeTokens(
        address _token,
        uint256 _amount,
        uint256 _targetChainId,
        address _recipient
    ) external nonReentrant returns (uint256) {
        require(!emergencyPaused, "Bridge paused");
        require(chainConfigs[_targetChainId].active, "Target chain not supported");

        TokenConfig storage tokenConfig = tokenConfigs[_token];
        require(tokenConfig.active, "Token not supported");
        require(_amount >= tokenConfig.minAmount, "Amount too small");
        require(_amount <= tokenConfig.maxAmount, "Amount too large");

        // Reset daily limit if needed
        _resetDailyLimit(_token);
        require(tokenConfig.dailyTransferred + _amount <= tokenConfig.dailyLimit, "Daily limit exceeded");

        // Calculate fee
        uint256 fee = (_amount * tokenConfig.fee) / 10000;
        uint256 netAmount = _amount - fee;

        // Transfer tokens from user
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        // Create bridge transaction
        uint256 txId = nextTxId++;
        bytes32 txHash = keccak256(abi.encodePacked(
            txId,
            msg.sender,
            _recipient,
            _token,
            netAmount,
            block.chainid,
            _targetChainId,
            block.timestamp
        ));

        BridgeTransaction storage tx = transactions[txId];
        tx.id = txId;
        tx.sender = msg.sender;
        tx.recipient = _recipient;
        tx.token = _token;
        tx.amount = netAmount;
        tx.sourceChainId = block.chainid;
        tx.targetChainId = _targetChainId;
        tx.timestamp = block.timestamp;
        tx.txHash = txHash;
        tx.status = Status.Pending;

        // Update counters
        tokenConfig.dailyTransferred += _amount;
        collectedFees += fee;

        emit BridgeTransactionInitiated(txId, msg.sender, _token, netAmount, _targetChainId);
        emit TokenLocked(_token, msg.sender, _amount);

        return txId;
    }

    function confirmTransaction(uint256 _txId, bytes memory _signature) public {
        require(validators[msg.sender], "Not a validator");

        BridgeTransaction storage tx = transactions[_txId];
        require(tx.status == Status.Pending, "Transaction not pending");
        require(block.timestamp <= tx.timestamp + 1 hours, "Transaction expired");

        // Check if validator already confirmed
        for (uint256 i = 0; i < tx.validators.length; i++) {
            require(tx.validators[i] != msg.sender, "Already confirmed");
        }

        // Verify signature
        bytes32 ethSignedMessageHash = tx.txHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(_signature);
        require(signer == msg.sender, "Invalid signature");

        tx.validators.push(msg.sender);
        tx.confirmations++;

        emit BridgeTransactionConfirmed(_txId, msg.sender);

        // Check if transaction can be completed
        ChainConfig storage chainConfig = chainConfigs[tx.targetChainId];
        if (tx.confirmations >= chainConfig.requiredConfirmations) {
            _completeTransaction(_txId);
        }
    }

    function _completeTransaction(uint256 _txId) internal {
        BridgeTransaction storage tx = transactions[_txId];
        tx.status = Status.Completed;

        // Update chain statistics
        ChainConfig storage chainConfig = chainConfigs[tx.targetChainId];
        chainConfig.totalTransferred += tx.amount;

        // In a real implementation, this would trigger cross-chain communication
        // For now, we'll simulate completion on the same chain for testing

        // Mint/burn tokens on target chain (simplified)
        if (tx.targetChainId == block.chainid) {
            // Same chain - just transfer
            IERC20(tx.token).safeTransfer(tx.recipient, tx.amount);
            emit TokenMinted(tx.token, tx.recipient, tx.amount);
        }

        emit BridgeTransactionCompleted(_txId, tx.recipient, tx.amount);
    }

    function mintTokens(uint256 _txId) external {
        // This would be called by the target chain bridge
        BridgeTransaction storage tx = transactions[_txId];
        require(tx.status == Status.Confirmed, "Transaction not confirmed");
        require(tx.targetChainId == block.chainid, "Wrong chain");

        tx.status = Status.Completed;

        // Mint wrapped tokens (simplified - would use a wrapped token contract)
        IERC20(tx.token).safeTransfer(tx.recipient, tx.amount);

        emit TokenMinted(tx.token, tx.recipient, tx.amount);
        emit BridgeTransactionCompleted(_txId, tx.recipient, tx.amount);
    }

    // ============ BATCH OPERATIONS ============

    function batchConfirmTransactions(uint256[] memory _txIds, bytes[] memory _signatures) external {
        require(_txIds.length == _signatures.length, "Mismatched arrays");

        for (uint256 i = 0; i < _txIds.length; i++) {
            confirmTransaction(_txIds[i], _signatures[i]);
        }
    }

    // ============ VIEW FUNCTIONS ============

    function getTransaction(uint256 _txId) external view returns (BridgeTransaction memory) {
        return transactions[_txId];
    }

    function getTokenConfig(address _token) external view returns (TokenConfig memory) {
        return tokenConfigs[_token];
    }

    function getChainConfig(uint256 _chainId) external view returns (ChainConfig memory) {
        return chainConfigs[_chainId];
    }

    function getSupportedChains() external view returns (uint256[] memory) {
        return supportedChains;
    }

    function getValidators() external view returns (address[] memory) {
        return validatorList;
    }

    function canConfirmTransaction(uint256 _txId, address _validator) external view returns (bool) {
        BridgeTransaction storage tx = transactions[_txId];
        if (tx.status != Status.Pending) return false;
        if (!validators[_validator]) return false;
        if (block.timestamp > tx.timestamp + 1 hours) return false;

        // Check if validator already confirmed
        for (uint256 i = 0; i < tx.validators.length; i++) {
            if (tx.validators[i] == _validator) return false;
        }

        return true;
    }

    function getPendingTransactions() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i < nextTxId; i++) {
            if (transactions[i].status == Status.Pending) {
                count++;
            }
        }

        uint256[] memory pendingTxs = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i < nextTxId; i++) {
            if (transactions[i].status == Status.Pending) {
                pendingTxs[index] = i;
                index++;
            }
        }

        return pendingTxs;
    }

    // ============ ADMIN FUNCTIONS ============

    function setProtocolParameters(
        uint256 _confirmationThreshold,
        uint256 _maxValidators,
        uint256 _dailyResetTime,
        uint256 _emergencyPauseDelay
    ) external onlyOwner {
        confirmationThreshold = _confirmationThreshold;
        maxValidators = _maxValidators;
        dailyResetTime = _dailyResetTime;
        emergencyPauseDelay = _emergencyPauseDelay;
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }

    function emergencyPause() external onlyOwner {
        emergencyPaused = true;
        emergencyPauseTime = block.timestamp;

        emit EmergencyPaused(block.timestamp);
    }

    function emergencyUnpause() external onlyOwner {
        require(block.timestamp >= emergencyPauseTime + emergencyPauseDelay, "Emergency delay not passed");
        emergencyPaused = false;

        emit EmergencyUnpaused();
    }

    function collectFees(uint256 _amount) external onlyOwner {
        require(collectedFees >= _amount, "Insufficient fees");

        collectedFees -= _amount;
        payable(feeRecipient).transfer(_amount);
    }

    // ============ EMERGENCY FUNCTIONS ============

    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        require(emergencyPaused, "Not in emergency mode");

        IERC20(_token).safeTransfer(owner(), _amount);
    }

    function cancelTransaction(uint256 _txId) external onlyOwner {
        BridgeTransaction storage tx = transactions[_txId];
        require(tx.status == Status.Pending, "Transaction not pending");

        tx.status = Status.Failed;

        // Refund tokens to sender
        IERC20(tx.token).safeTransfer(tx.sender, tx.amount);
    }
}