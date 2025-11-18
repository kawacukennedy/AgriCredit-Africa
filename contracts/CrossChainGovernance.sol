// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./GovernanceDAO.sol";

contract CrossChainGovernance is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    struct CrossChainProposal {
        uint256 id;
        uint256 originChainId;
        address originContract;
        string description;
        bytes callData;
        address targetContract;
        uint256 value;
        uint256 startTime;
        uint256 endTime;
        uint256 totalVotes;
        mapping(uint256 => uint256) chainVotes; // chainId => votes
        mapping(bytes32 => bool) executedMessages; // Prevent replay attacks
        bool executed;
        ProposalStatus status;
    }

    struct ChainInfo {
        uint256 chainId;
        address governanceContract;
        uint256 votingPower; // Weight of this chain's votes
        bool active;
        uint256 lastProposalId;
    }

    struct BridgeMessage {
        uint256 proposalId;
        uint256 sourceChainId;
        uint256 targetChainId;
        address voter;
        uint256 votes;
        bytes signature;
        uint256 timestamp;
        bytes32 messageHash;
    }

    enum ProposalStatus {
        Pending,
        Active,
        Succeeded,
        Failed,
        Executed
    }

    // Cross-chain proposals
    mapping(uint256 => CrossChainProposal) public crossChainProposals;
    uint256 public nextProposalId = 1;

    // Connected chains
    mapping(uint256 => ChainInfo) public connectedChains;
    uint256[] public activeChainIds;

    // Bridge validators
    mapping(address => bool) public bridgeValidators;
    mapping(uint256 => mapping(address => bool)) public chainValidators; // chainId => validator => isValid

    // Voting parameters
    uint256 public votingPeriod = 7 days;
    uint256 public executionDelay = 2 days;
    uint256 public quorumThreshold = 60; // 60% of total voting power needed
    uint256 public totalVotingPower;

    // Message verification
    mapping(bytes32 => bool) public processedMessages;

    // Events
    event CrossChainProposalCreated(uint256 indexed proposalId, uint256 originChainId, string description);
    event ChainConnected(uint256 indexed chainId, address governanceContract, uint256 votingPower);
    event BridgeMessageReceived(uint256 indexed proposalId, uint256 sourceChainId, uint256 votes);
    event CrossChainProposalExecuted(uint256 indexed proposalId);
    event BridgeValidatorAdded(address indexed validator, uint256[] chainIds);
    event BridgeValidatorRemoved(address indexed validator);

    constructor() Ownable(msg.sender) {
        // Initialize with current chain
        _addChain(block.chainid, address(this), 100);
    }

    // ============ CHAIN MANAGEMENT ============

    function addChain(uint256 _chainId, address _governanceContract, uint256 _votingPower) external onlyOwner {
        require(_chainId != block.chainid, "Cannot add current chain");
        require(connectedChains[_chainId].governanceContract == address(0), "Chain already exists");

        _addChain(_chainId, _governanceContract, _votingPower);
    }

    function updateChainVotingPower(uint256 _chainId, uint256 _newVotingPower) external onlyOwner {
        require(connectedChains[_chainId].active, "Chain not active");

        ChainInfo storage chain = connectedChains[_chainId];
        totalVotingPower = totalVotingPower - chain.votingPower + _newVotingPower;
        chain.votingPower = _newVotingPower;
    }

    function removeChain(uint256 _chainId) external onlyOwner {
        require(connectedChains[_chainId].active, "Chain not active");

        ChainInfo storage chain = connectedChains[_chainId];
        chain.active = false;
        totalVotingPower -= chain.votingPower;

        // Remove from active chains
        for (uint256 i = 0; i < activeChainIds.length; i++) {
            if (activeChainIds[i] == _chainId) {
                activeChainIds[i] = activeChainIds[activeChainIds.length - 1];
                activeChainIds.pop();
                break;
            }
        }
    }

    function _addChain(uint256 _chainId, address _governanceContract, uint256 _votingPower) internal {
        connectedChains[_chainId] = ChainInfo({
            chainId: _chainId,
            governanceContract: _governanceContract,
            votingPower: _votingPower,
            active: true,
            lastProposalId: 0
        });

        activeChainIds.push(_chainId);
        totalVotingPower += _votingPower;

        emit ChainConnected(_chainId, _governanceContract, _votingPower);
    }

    // ============ BRIDGE VALIDATOR MANAGEMENT ============

    function addBridgeValidator(address _validator, uint256[] memory _chainIds) external onlyOwner {
        require(!bridgeValidators[_validator], "Already a validator");

        bridgeValidators[_validator] = true;

        for (uint256 i = 0; i < _chainIds.length; i++) {
            uint256 chainId = _chainIds[i];
            require(connectedChains[chainId].active, "Invalid chain ID");
            chainValidators[chainId][_validator] = true;
        }

        emit BridgeValidatorAdded(_validator, _chainIds);
    }

    function removeBridgeValidator(address _validator) external onlyOwner {
        require(bridgeValidators[_validator], "Not a validator");

        bridgeValidators[_validator] = false;

        // Remove from all chains
        for (uint256 i = 0; i < activeChainIds.length; i++) {
            chainValidators[activeChainIds[i]][_validator] = false;
        }

        emit BridgeValidatorRemoved(_validator);
    }

    // ============ CROSS-CHAIN PROPOSAL CREATION ============

    function createCrossChainProposal(
        string memory _description,
        bytes memory _callData,
        address _targetContract,
        uint256 _value
    ) external returns (uint256) {
        uint256 proposalId = nextProposalId++;

        CrossChainProposal storage proposal = crossChainProposals[proposalId];
        proposal.id = proposalId;
        proposal.originChainId = block.chainid;
        proposal.originContract = address(this);
        proposal.description = _description;
        proposal.callData = _callData;
        proposal.targetContract = _targetContract;
        proposal.value = _value;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + votingPeriod;
        proposal.status = ProposalStatus.Active;

        emit CrossChainProposalCreated(proposalId, block.chainid, _description);

        return proposalId;
    }

    // ============ CROSS-CHAIN VOTING ============

    function submitCrossChainVote(BridgeMessage memory _message) external {
        require(bridgeValidators[msg.sender], "Not a bridge validator");
        require(chainValidators[_message.sourceChainId][msg.sender], "Not authorized for this chain");
        require(!processedMessages[_message.messageHash], "Message already processed");
        require(_message.targetChainId == block.chainid, "Wrong target chain");

        // Verify message signature
        bytes32 messageHash = keccak256(abi.encode(
            _message.proposalId,
            _message.sourceChainId,
            _message.targetChainId,
            _message.voter,
            _message.votes,
            _message.timestamp
        ));

        require(messageHash == _message.messageHash, "Invalid message hash");

        address signer = ECDSA.recover(messageHash, _message.signature);
        require(signer == _message.voter, "Invalid signature");

        // Verify timestamp is recent (within 1 hour)
        require(block.timestamp - _message.timestamp <= 1 hours, "Message too old");

        CrossChainProposal storage proposal = crossChainProposals[_message.proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp <= proposal.endTime, "Voting ended");

        // Record the vote
        proposal.chainVotes[_message.sourceChainId] += _message.votes;
        proposal.totalVotes += _message.votes;

        processedMessages[_message.messageHash] = true;

        emit BridgeMessageReceived(_message.proposalId, _message.sourceChainId, _message.votes);
    }

    // ============ PROPOSAL EXECUTION ============

    function executeCrossChainProposal(uint256 _proposalId) external nonReentrant {
        CrossChainProposal storage proposal = crossChainProposals[_proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp > proposal.endTime, "Voting not ended");
        require(!proposal.executed, "Already executed");

        // Check if quorum reached
        uint256 quorumVotes = (totalVotingPower * quorumThreshold) / 100;
        require(proposal.totalVotes >= quorumVotes, "Quorum not reached");

        // Check if proposal succeeded (more votes for than against)
        // This is simplified - in reality, you'd track for/against votes separately
        proposal.status = ProposalStatus.Succeeded;

        // Execute after delay
        require(block.timestamp >= proposal.endTime + executionDelay, "Execution delay not passed");

        proposal.executed = true;
        proposal.status = ProposalStatus.Executed;

        // Execute the proposal
        if (proposal.targetContract != address(0)) {
            (bool success, ) = proposal.targetContract.call{value: proposal.value}(proposal.callData);
            require(success, "Proposal execution failed");
        }

        emit CrossChainProposalExecuted(_proposalId);
    }

    // ============ VIEW FUNCTIONS ============

    function getCrossChainProposal(uint256 _proposalId) external view returns (
        uint256 id,
        uint256 originChainId,
        string memory description,
        uint256 totalVotes,
        uint256 startTime,
        uint256 endTime,
        ProposalStatus status,
        bool executed
    ) {
        CrossChainProposal storage proposal = crossChainProposals[_proposalId];
        return (
            proposal.id,
            proposal.originChainId,
            proposal.description,
            proposal.totalVotes,
            proposal.startTime,
            proposal.endTime,
            proposal.status,
            proposal.executed
        );
    }

    function getChainVotes(uint256 _proposalId, uint256 _chainId) external view returns (uint256) {
        return crossChainProposals[_proposalId].chainVotes[_chainId];
    }

    function getActiveChains() external view returns (uint256[] memory) {
        return activeChainIds;
    }

    function getChainInfo(uint256 _chainId) external view returns (ChainInfo memory) {
        return connectedChains[_chainId];
    }

    function canExecuteProposal(uint256 _proposalId) external view returns (bool) {
        CrossChainProposal storage proposal = crossChainProposals[_proposalId];

        if (proposal.status != ProposalStatus.Active || proposal.executed) {
            return false;
        }

        if (block.timestamp <= proposal.endTime + executionDelay) {
            return false;
        }

        uint256 quorumVotes = (totalVotingPower * quorumThreshold) / 100;
        return proposal.totalVotes >= quorumVotes;
    }

    // ============ MESSAGE VERIFICATION HELPERS ============

    function createBridgeMessage(
        uint256 _proposalId,
        uint256 _targetChainId,
        uint256 _votes
    ) external view returns (BridgeMessage memory) {
        uint256 timestamp = block.timestamp;
        bytes32 messageHash = keccak256(abi.encode(
            _proposalId,
            block.chainid,
            _targetChainId,
            msg.sender,
            _votes,
            timestamp
        ));

        return BridgeMessage({
            proposalId: _proposalId,
            sourceChainId: block.chainid,
            targetChainId: _targetChainId,
            voter: msg.sender,
            votes: _votes,
            signature: "", // To be filled by signer
            timestamp: timestamp,
            messageHash: messageHash
        });
    }

    function verifyBridgeMessage(BridgeMessage memory _message) external view returns (bool) {
        if (processedMessages[_message.messageHash]) return false;
        if (_message.targetChainId != block.chainid) return false;
        if (block.timestamp - _message.timestamp > 1 hours) return false;

        bytes32 expectedHash = keccak256(abi.encode(
            _message.proposalId,
            _message.sourceChainId,
            _message.targetChainId,
            _message.voter,
            _message.votes,
            _message.timestamp
        ));

        if (expectedHash != _message.messageHash) return false;

        address signer = ECDSA.recover(_message.messageHash, _message.signature);
        return signer == _message.voter;
    }

    // ============ ADMIN FUNCTIONS ============

    function updateVotingParameters(
        uint256 _votingPeriod,
        uint256 _executionDelay,
        uint256 _quorumThreshold
    ) external onlyOwner {
        votingPeriod = _votingPeriod;
        executionDelay = _executionDelay;
        quorumThreshold = _quorumThreshold;
    }

    function emergencyPauseProposal(uint256 _proposalId) external onlyOwner {
        CrossChainProposal storage proposal = crossChainProposals[_proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");

        proposal.status = ProposalStatus.Failed;
    }

    function emergencyExecuteProposal(uint256 _proposalId) external onlyOwner {
        CrossChainProposal storage proposal = crossChainProposals[_proposalId];
        require(proposal.status == ProposalStatus.Succeeded, "Proposal not succeeded");
        require(!proposal.executed, "Already executed");

        proposal.executed = true;
        proposal.status = ProposalStatus.Executed;

        // Execute the proposal
        if (proposal.targetContract != address(0)) {
            (bool success, ) = proposal.targetContract.call{value: proposal.value}(proposal.callData);
            require(success, "Emergency execution failed");
        }

        emit CrossChainProposalExecuted(_proposalId);
    }
}