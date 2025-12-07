// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts-upgradeable/metatx/ERC2771ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract GovernanceDAO is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, ERC2771ContextUpgradeable, UUPSUpgradeable {
    using ECDSA for bytes32;

    enum ProposalType {
        PARAMETER_CHANGE,
        FUND_ALLOCATION,
        CONTRACT_UPGRADE,
        EMERGENCY_ACTION,
        TREASURY_TRANSFER
    }

    enum ProposalStatus {
        PENDING,
        ACTIVE,
        SUCCEEDED,
        DEFEATED,
        EXECUTED,
        CANCELLED
    }

    struct Proposal {
        uint256 id;
        address proposer;
        ProposalType proposalType;
        string description;
        bytes callData;
        address targetContract;
        uint256 value;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        uint256 startTime;
        uint256 endTime;
        ProposalStatus status;
        mapping(address => Vote) votes;
        uint256 executionTime;
        bool emergency;
    }

    struct Vote {
        bool hasVoted;
        bool support;
        uint256 weight;
        uint256 timestamp;
    }

    struct ProposalCore {
        uint256 id;
        address proposer;
        ProposalType proposalType;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        uint256 startTime;
        uint256 endTime;
        ProposalStatus status;
        bool emergency;
    }

    // Governance parameters
    IERC20 public governanceToken;
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;

    // Governance settings
    uint256 public votingPeriod = 7 days;
    uint256 public votingDelay = 1 days;
    uint256 public proposalThreshold = 1000 * 10**18; // 1000 tokens to propose
    uint256 public quorumThreshold = 10000 * 10**18; // 10k tokens for quorum
    uint256 public timelockPeriod = 2 days; // Time lock for execution

    // Emergency governance
    uint256 public emergencyThreshold = 50000 * 10**18; // 50k tokens for emergency
    uint256 public emergencyVotingPeriod = 1 days;
    mapping(address => bool) public emergencyCommittee;

    // Delegation
    mapping(address => address) public delegates;
    mapping(address => uint256) public nonces;

    // Delegation chains
    struct DelegationNode {
        address delegate;
        uint256 weight; // Voting weight allocated to this delegate
        uint256 depth; // Depth in delegation chain
        bool active;
    }

    mapping(address => DelegationNode[]) public delegationChains;
    mapping(address => mapping(address => uint256)) public delegationWeights; // delegator => delegate => weight

    // Gasless voting
    struct GaslessVote {
        uint256 proposalId;
        bool support;
        uint256 weight;
        uint256 nonce;
        uint256 deadline;
        bytes signature;
    }

    mapping(bytes32 => bool) public executedGaslessVotes;

    // ZK-Rollup Integration
    struct ZKProof {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
        uint256[1] input;
    }

    struct PrivateVote {
        uint256 proposalId;
        bool support;
        uint256 weight;
        bytes32 commitment;
        ZKProof proof;
    }

    mapping(bytes32 => bool) public verifiedZKProofs;
    address public zkVerifier; // ZK proof verification contract

    // Time-weighted Governance
    struct TokenLock {
        uint256 amount;
        uint256 lockTime;
        uint256 lockDuration;
        bool active;
    }

    mapping(address => TokenLock[]) public tokenLocks;
    mapping(address => uint256) public totalLockedTokens;
    uint256 public maxLockDuration = 365 days; // Maximum lock period
    uint256 public timeWeightMultiplier = 2; // Multiplier for time-weighted voting

    // Quadratic Voting
    struct QuadraticVote {
        uint256 proposalId;
        uint256 creditsUsed;
        bool support;
        uint256 timestamp;
    }

    mapping(address => QuadraticVote[]) public quadraticVotes;
    mapping(uint256 => uint256) public quadraticVotingCredits; // proposalId => total credits used
    uint256 public quadraticCreditPrice = 1e16; // 0.01 ETH per credit
    uint256 public maxQuadraticCredits = 100; // Max credits per voter

    // Proposal Templates
    struct ProposalTemplate {
        string name;
        string description;
        ProposalType proposalType;
        bytes templateCallData;
        bool active;
    }

    mapping(uint256 => ProposalTemplate) public proposalTemplates;
    uint256 public templateCount;

    // Multi-sig Execution
    struct MultiSigExecution {
        uint256 proposalId;
        address[] signers;
        uint256 requiredSignatures;
        mapping(address => bool) hasSigned;
        uint256 signatureCount;
        bool executed;
    }

    mapping(uint256 => MultiSigExecution) public multiSigExecutions;
    mapping(address => bool) public multiSigSigners;
    uint256 public requiredMultiSigSignatures = 3;

    // Treasury
    address public treasury;
    uint256 public treasuryBalance;

    // Security
    mapping(address => uint256) public lastProposalTime;
    uint256 public proposalCooldown = 1 hours;

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        ProposalType proposalType,
        string description,
        uint256 startTime,
        uint256 endTime,
        bool emergency
    );
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight, uint256 timestamp);
    event ProposalExecuted(uint256 indexed proposalId, bool success);
    event ProposalCancelled(uint256 indexed proposalId);
    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);
    event TreasuryTransfer(address indexed to, uint256 amount);
    event EmergencyDeclared(uint256 indexed proposalId);
    event ZKVoteCast(bytes32 indexed commitment, uint256 indexed proposalId, uint256 weight);
    event TokensLocked(address indexed user, uint256 amount, uint256 duration);
    event TokensUnlocked(address indexed user, uint256 amount);
    event QuadraticVoteCast(uint256 indexed proposalId, address indexed voter, uint256 credits, bool support);
    event ProposalTemplateCreated(uint256 indexed templateId, string name);
    event MultiSigSigned(uint256 indexed proposalId, address indexed signer);
    event MultiSigExecuted(uint256 indexed proposalId);

    function initialize(
        address _governanceToken,
        address _treasury,
        address trustedForwarder,
        address _zkVerifier
    ) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        // __ERC2771Context_init(trustedForwarder); // TODO: Check correct initialization
        __UUPSUpgradeable_init();

        governanceToken = IERC20(_governanceToken);
        treasury = _treasury;
        zkVerifier = _zkVerifier;

        // Initialize emergency committee
        emergencyCommittee[msg.sender] = true;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    modifier onlyEmergencyCommittee() {
        require(emergencyCommittee[msg.sender], "Not emergency committee member");
        _;
    }

    modifier proposalExists(uint256 proposalId) {
        require(proposalId > 0 && proposalId <= proposalCount, "Proposal does not exist");
        _;
    }

    modifier onlyProposer(uint256 proposalId) {
        require(proposals[proposalId].proposer == msg.sender, "Not proposal creator");
        _;
    }

    function propose(
        ProposalType _proposalType,
        string memory _description,
        address _targetContract,
        bytes memory _callData,
        uint256 _value,
        bool _emergency
    ) public returns (uint256) {
        uint256 proposerBalance = getVotes(msg.sender);
        uint256 threshold = _emergency ? emergencyThreshold : proposalThreshold;

        require(proposerBalance >= threshold, "Insufficient voting power to propose");
        require(block.timestamp >= lastProposalTime[msg.sender] + proposalCooldown, "Proposal cooldown active");

        if (_emergency) {
            require(emergencyCommittee[msg.sender], "Only emergency committee can create emergency proposals");
        }

        proposalCount++;
        Proposal storage proposal = proposals[proposalCount];
        proposal.id = proposalCount;
        proposal.proposer = msg.sender;
        proposal.proposalType = _proposalType;
        proposal.description = _description;
        proposal.callData = _callData;
        proposal.targetContract = _targetContract;
        proposal.value = _value;
        proposal.startTime = block.timestamp + (_emergency ? 0 : votingDelay);
        proposal.endTime = proposal.startTime + (_emergency ? emergencyVotingPeriod : votingPeriod);
        proposal.status = ProposalStatus.PENDING;
        proposal.emergency = _emergency;

        if (!_emergency) {
            proposal.status = ProposalStatus.ACTIVE;
        }

        lastProposalTime[msg.sender] = block.timestamp;

        emit ProposalCreated(
            proposalCount,
            msg.sender,
            _proposalType,
            _description,
            proposal.startTime,
            proposal.endTime,
            _emergency
        );

        if (_emergency) {
            emit EmergencyDeclared(proposalCount);
        }

        return proposalCount;
    }

    function vote(uint256 _proposalId, bool _support) external proposalExists(_proposalId) {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.status == ProposalStatus.ACTIVE, "Proposal not active");
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(!proposal.votes[msg.sender].hasVoted, "Already voted");

        uint256 weight = getVotes(msg.sender);
        require(weight > 0, "No voting power");

        proposal.votes[msg.sender] = Vote({
            hasVoted: true,
            support: _support,
            weight: weight,
            timestamp: block.timestamp
        });

        if (_support) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }

        emit VoteCast(_proposalId, msg.sender, _support, weight, block.timestamp);
    }

    function abstain(uint256 _proposalId) external proposalExists(_proposalId) {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.status == ProposalStatus.ACTIVE, "Proposal not active");
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(!proposal.votes[msg.sender].hasVoted, "Already voted");

        uint256 weight = getVotes(msg.sender);
        require(weight > 0, "No voting power");

        proposal.votes[msg.sender] = Vote({
            hasVoted: true,
            support: false,
            weight: weight,
            timestamp: block.timestamp
        });

        proposal.abstainVotes += weight;

        emit VoteCast(_proposalId, msg.sender, false, weight, block.timestamp);
    }

    // Quadratic Voting
    function castQuadraticVote(uint256 _proposalId, uint256 _credits, bool _support) external payable proposalExists(_proposalId) {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.status == ProposalStatus.ACTIVE, "Proposal not active");
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(!proposal.votes[msg.sender].hasVoted, "Already voted");
        require(_credits > 0 && _credits <= maxQuadraticCredits, "Invalid credit amount");

        uint256 cost = _credits * quadraticCreditPrice;
        require(msg.value >= cost, "Insufficient payment");

        // Refund excess
        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }

        // Calculate voting power (square root of credits for quadratic voting)
        uint256 votingPower = Math.sqrt(_credits * 1e18); // Scale up for precision

        proposal.votes[msg.sender] = Vote({
            hasVoted: true,
            support: _support,
            weight: votingPower,
            timestamp: block.timestamp
        });

        if (_support) {
            proposal.forVotes += votingPower;
        } else {
            proposal.againstVotes += votingPower;
        }

        quadraticVotes[msg.sender].push(QuadraticVote({
            proposalId: _proposalId,
            creditsUsed: _credits,
            support: _support,
            timestamp: block.timestamp
        }));

        quadraticVotingCredits[_proposalId] += _credits;

        emit QuadraticVoteCast(_proposalId, msg.sender, _credits, _support);
        emit VoteCast(_proposalId, msg.sender, _support, votingPower, block.timestamp);
    }

    // Gasless voting functions
    function castGaslessVote(GaslessVote memory voteData) external {
        require(block.timestamp <= voteData.deadline, "Vote deadline passed");

        // Create vote hash
        bytes32 voteHash = keccak256(abi.encode(
            voteData.proposalId,
            voteData.support,
            voteData.weight,
            voteData.nonce,
            voteData.deadline
        ));

        require(!executedGaslessVotes[voteHash], "Vote already executed");

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", voteHash));
        address signer = ECDSA.recover(messageHash, voteData.signature);
        require(signer != address(0), "Invalid signature");

        // Verify voting power
        require(voteData.weight <= getVotes(signer), "Insufficient voting power");

        // Mark as executed
        executedGaslessVotes[voteHash] = true;

        // Cast the vote
        _castVote(voteData.proposalId, signer, voteData.support, voteData.weight);

        emit GaslessVoteCast(voteHash, signer, voteData.proposalId, voteData.support, voteData.weight);
    }

    // ZK-Rollup Private Voting
    function castZKVote(PrivateVote memory zkVote) external {
        require(zkVerifier != address(0), "ZK verifier not set");
        require(!verifiedZKProofs[zkVote.commitment], "ZK proof already used");

        // Verify ZK proof (simplified - in practice, call external verifier)
        require(_verifyZKProof(zkVote.proof, zkVote.commitment), "Invalid ZK proof");

        // Mark proof as used
        verifiedZKProofs[zkVote.commitment] = true;

        // Cast the private vote
        _castPrivateVote(zkVote.proposalId, zkVote.support, zkVote.weight);

        emit ZKVoteCast(zkVote.commitment, zkVote.proposalId, zkVote.weight);
    }

    function _verifyZKProof(ZKProof memory proof, bytes32 commitment) internal view returns (bool) {
        // Simplified ZK verification - in practice, this would call an external verifier contract
        // For demonstration, we'll do a basic check
        return proof.input[0] != 0; // Placeholder verification
    }

    function _castPrivateVote(uint256 _proposalId, bool support, uint256 weight) internal {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.status == ProposalStatus.ACTIVE, "Proposal not active");

        // Use a pseudo-random voter address based on commitment for privacy
        bytes32 pseudoVoter = keccak256(abi.encodePacked(_proposalId, support, weight, block.timestamp));
        address voterAddress = address(uint160(uint256(pseudoVoter)));

        require(!proposal.votes[voterAddress].hasVoted, "Already voted");

        proposal.votes[voterAddress] = Vote({
            hasVoted: true,
            support: support,
            weight: weight,
            timestamp: block.timestamp
        });

        if (support) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }

        emit VoteCast(_proposalId, voterAddress, support, weight, block.timestamp);
    }

    function _castVote(uint256 _proposalId, address voter, bool support, uint256 weight) internal {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.status == ProposalStatus.ACTIVE, "Proposal not active");
        require(!proposal.votes[voter].hasVoted, "Already voted");

        proposal.votes[voter] = Vote({
            hasVoted: true,
            support: support,
            weight: weight,
            timestamp: block.timestamp
        });

        if (support) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }

        emit VoteCast(_proposalId, voter, support, weight, block.timestamp);
    }

    function executeProposal(uint256 _proposalId) external proposalExists(_proposalId) nonReentrant {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.status == ProposalStatus.ACTIVE, "Proposal not active");
        require(block.timestamp > proposal.endTime, "Voting not ended");

        // Check if proposal passed
        bool passed = proposal.forVotes > proposal.againstVotes;
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;

        if (passed && totalVotes >= quorumThreshold) {
            proposal.status = ProposalStatus.SUCCEEDED;
            proposal.executionTime = block.timestamp + timelockPeriod;
        } else {
            proposal.status = ProposalStatus.DEFEATED;
            emit ProposalExecuted(_proposalId, false);
            return;
        }

        // Execute after timelock
        require(block.timestamp >= proposal.executionTime, "Timelock not expired");

        proposal.status = ProposalStatus.EXECUTED;

        bool success = _executeProposal(proposal);
        emit ProposalExecuted(_proposalId, success);
    }

    function cancelProposal(uint256 _proposalId) external proposalExists(_proposalId) onlyProposer(_proposalId) {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.status == ProposalStatus.PENDING || proposal.status == ProposalStatus.ACTIVE, "Cannot cancel");

        proposal.status = ProposalStatus.CANCELLED;
        emit ProposalCancelled(_proposalId);
    }

    function _executeProposal(Proposal storage proposal) internal returns (bool) {
        if (proposal.targetContract == address(0)) {
            return true; // No execution needed
        }

        if (proposal.proposalType == ProposalType.TREASURY_TRANSFER) {
            require(treasuryBalance >= proposal.value, "Insufficient treasury balance");
            treasuryBalance -= proposal.value;

            (bool success,) = proposal.targetContract.call{value: proposal.value}("");
            if (success) {
                emit TreasuryTransfer(proposal.targetContract, proposal.value);
            }
            return success;
        }

        // Execute arbitrary call
        (bool success,) = proposal.targetContract.call{value: proposal.value}(proposal.callData);
        return success;
    }

    // Delegation functions
    function delegate(address delegatee) external {
        require(delegatee != address(0), "Cannot delegate to zero address");
        require(delegatee != msg.sender, "Cannot delegate to self");

        address currentDelegate = delegates[msg.sender];
        delegates[msg.sender] = delegatee;

        emit DelegateChanged(msg.sender, currentDelegate, delegatee);
    }

    // Enhanced delegation with chains and weights
    function delegateWithWeight(address delegatee, uint256 weight) external {
        require(delegatee != address(0), "Cannot delegate to zero address");
        require(delegatee != msg.sender, "Cannot delegate to self");
        require(weight > 0 && weight <= 100, "Weight must be 1-100");

        // Check if delegatee is already in chain
        DelegationNode[] storage chain = delegationChains[msg.sender];
        bool found = false;

        for (uint256 i = 0; i < chain.length; i++) {
            if (chain[i].delegate == delegatee) {
                chain[i].weight = weight;
                chain[i].active = true;
                found = true;
                break;
            }
        }

        if (!found) {
            // Add new delegation
            uint256 depth = _calculateDelegationDepth(delegatee);
            require(depth < 5, "Delegation chain too deep"); // Max 5 levels

            chain.push(DelegationNode({
                delegate: delegatee,
                weight: weight,
                depth: depth,
                active: true
            }));
        }

        delegationWeights[msg.sender][delegatee] = weight;

        emit WeightedDelegation(msg.sender, delegatee, weight);
    }

    function removeDelegation(address delegatee) external {
        DelegationNode[] storage chain = delegationChains[msg.sender];

        for (uint256 i = 0; i < chain.length; i++) {
            if (chain[i].delegate == delegatee) {
                chain[i].active = false;
                delegationWeights[msg.sender][delegatee] = 0;
                emit DelegationRemoved(msg.sender, delegatee);
                break;
            }
        }
    }

    function _calculateDelegationDepth(address delegatee) internal view returns (uint256) {
        address current = delegatee;
        uint256 depth = 0;

        while (current != address(0) && depth < 10) { // Prevent infinite loops
            current = delegates[current];
            if (current == msg.sender) {
                revert("Circular delegation detected");
            }
            depth++;
        }

        return depth;
    }

    function getVotes(address account) public view returns (uint256) {
        address delegate = delegates[account];
        uint256 balance = delegate == address(0) ? governanceToken.balanceOf(account) : governanceToken.balanceOf(delegate);

        // Enhanced quadratic voting with delegation chains
        uint256 baseVotes = Math.sqrt(balance);

        // Add votes from delegation chains
        uint256 chainVotes = _calculateDelegationChainVotes(account);

        // Add time-weighted votes from locked tokens
        uint256 timeWeightedVotes = _calculateTimeWeightedLockedVotes(account);

        return baseVotes + chainVotes + timeWeightedVotes;
    }

    function _calculateDelegationChainVotes(address account) internal view returns (uint256) {
        DelegationNode[] memory chain = delegationChains[account];
        uint256 totalChainVotes = 0;

        for (uint256 i = 0; i < chain.length; i++) {
            if (chain[i].active) {
                // Calculate votes based on depth and weight
                uint256 depthMultiplier = 100 - (chain[i].depth * 10); // Reduce weight by 10% per level
                if (depthMultiplier > 0) {
                    totalChainVotes += (chain[i].weight * depthMultiplier) / 100;
                }
            }
        }

        return totalChainVotes;
    }

    // Time-weighted Governance - Token Locking
    function lockTokens(uint256 amount, uint256 duration) external {
        require(amount > 0, "Amount must be positive");
        require(duration > 0 && duration <= maxLockDuration, "Invalid lock duration");
        require(governanceToken.balanceOf(msg.sender) >= amount, "Insufficient balance");

        // Transfer tokens to contract
        require(governanceToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        tokenLocks[msg.sender].push(TokenLock({
            amount: amount,
            lockTime: block.timestamp,
            lockDuration: duration,
            active: true
        }));

        totalLockedTokens[msg.sender] += amount;

        emit TokensLocked(msg.sender, amount, duration);
    }

    function unlockTokens(uint256 lockIndex) external {
        require(lockIndex < tokenLocks[msg.sender].length, "Invalid lock index");

        TokenLock storage lock = tokenLocks[msg.sender][lockIndex];
        require(lock.active, "Lock not active");
        require(block.timestamp >= lock.lockTime + lock.lockDuration, "Lock period not expired");

        // Transfer tokens back
        require(governanceToken.transfer(msg.sender, lock.amount), "Transfer failed");

        totalLockedTokens[msg.sender] -= lock.amount;
        lock.active = false;

        emit TokensUnlocked(msg.sender, lock.amount);
    }

    function getTimeWeightedVotes(address account) public view returns (uint256) {
        uint256 baseVotes = getVotes(account);
        uint256 lockedVotes = _calculateTimeWeightedLockedVotes(account);

        return baseVotes + lockedVotes;
    }

    function _calculateTimeWeightedLockedVotes(address account) internal view returns (uint256) {
        TokenLock[] memory locks = tokenLocks[account];
        uint256 weightedVotes = 0;

        for (uint256 i = 0; i < locks.length; i++) {
            if (locks[i].active) {
                uint256 timeHeld = block.timestamp - locks[i].lockTime;
                uint256 timeWeight = (timeHeld * timeWeightMultiplier) / locks[i].lockDuration;
                timeWeight = Math.min(timeWeight, timeWeightMultiplier); // Cap at multiplier

                weightedVotes += (locks[i].amount * timeWeight) / 1e18; // Normalize
            }
        }

        return weightedVotes;
    }

    // View functions
    function getProposal(uint256 _proposalId) external view proposalExists(_proposalId) returns (ProposalCore memory) {
        Proposal storage proposal = proposals[_proposalId];
        return ProposalCore({
            id: proposal.id,
            proposer: proposal.proposer,
            proposalType: proposal.proposalType,
            description: proposal.description,
            forVotes: proposal.forVotes,
            againstVotes: proposal.againstVotes,
            abstainVotes: proposal.abstainVotes,
            startTime: proposal.startTime,
            endTime: proposal.endTime,
            status: proposal.status,
            emergency: proposal.emergency
        });
    }

    function getVote(uint256 _proposalId, address _voter) external view proposalExists(_proposalId) returns (Vote memory) {
        return proposals[_proposalId].votes[_voter];
    }

    function hasVoted(uint256 _proposalId, address _voter) external view proposalExists(_proposalId) returns (bool) {
        return proposals[_proposalId].votes[_voter].hasVoted;
    }

    function getProposalState(uint256 _proposalId) external view proposalExists(_proposalId) returns (ProposalStatus) {
        Proposal storage proposal = proposals[_proposalId];
        if (proposal.status != ProposalStatus.ACTIVE) {
            return proposal.status;
        }

        if (block.timestamp <= proposal.endTime) {
            return ProposalStatus.ACTIVE;
        }

        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        if (proposal.forVotes > proposal.againstVotes && totalVotes >= quorumThreshold) {
            return ProposalStatus.SUCCEEDED;
        }

        return ProposalStatus.DEFEATED;
    }

    function getTokenLocks(address account) external view returns (TokenLock[] memory) {
        return tokenLocks[account];
    }

    function getLockedTokenBalance(address account) external view returns (uint256) {
        return totalLockedTokens[account];
    }

    function isZKProofVerified(bytes32 commitment) external view returns (bool) {
        return verifiedZKProofs[commitment];
    }

    // Proposal Templates
    function createProposalTemplate(
        string memory _name,
        string memory _description,
        ProposalType _proposalType,
        bytes memory _templateCallData
    ) external onlyOwner returns (uint256) {
        templateCount++;
        proposalTemplates[templateCount] = ProposalTemplate({
            name: _name,
            description: _description,
            proposalType: _proposalType,
            templateCallData: _templateCallData,
            active: true
        });

        emit ProposalTemplateCreated(templateCount, _name);
        return templateCount;
    }

    function proposeFromTemplate(
        uint256 _templateId,
        address _targetContract,
        uint256 _value,
        bool _emergency
    ) external returns (uint256) {
        require(proposalTemplates[_templateId].active, "Template not active");

        ProposalTemplate memory template = proposalTemplates[_templateId];

        return propose(
            template.proposalType,
            template.description,
            _targetContract,
            template.templateCallData,
            _value,
            _emergency
        );
    }

    function deactivateProposalTemplate(uint256 _templateId) external onlyOwner {
        proposalTemplates[_templateId].active = false;
    }

    // Multi-sig Execution
    function enableMultiSigExecution(uint256 _proposalId, address[] memory _signers, uint256 _requiredSignatures) external onlyOwner proposalExists(_proposalId) {
        require(_signers.length >= _requiredSignatures, "Invalid signature requirements");

        MultiSigExecution storage multiSig = multiSigExecutions[_proposalId];
        multiSig.proposalId = _proposalId;
        multiSig.signers = _signers;
        multiSig.requiredSignatures = _requiredSignatures;
        multiSig.executed = false;

        for (uint256 i = 0; i < _signers.length; i++) {
            multiSigSigners[_signers[i]] = true;
        }
    }

    function signMultiSigExecution(uint256 _proposalId) external {
        MultiSigExecution storage multiSig = multiSigExecutions[_proposalId];
        require(multiSig.proposalId == _proposalId, "Multi-sig not enabled");
        require(multiSigSigners[msg.sender], "Not authorized signer");
        require(!multiSig.hasSigned[msg.sender], "Already signed");
        require(!multiSig.executed, "Already executed");

        multiSig.hasSigned[msg.sender] = true;
        multiSig.signatureCount++;

        emit MultiSigSigned(_proposalId, msg.sender);

        // Auto-execute if threshold reached
        if (multiSig.signatureCount >= multiSig.requiredSignatures) {
            _executeMultiSigProposal(_proposalId);
        }
    }

    function _executeMultiSigProposal(uint256 _proposalId) internal {
        MultiSigExecution storage multiSig = multiSigExecutions[_proposalId];
        require(!multiSig.executed, "Already executed");

        Proposal storage proposal = proposals[_proposalId];
        require(proposal.status == ProposalStatus.SUCCEEDED, "Proposal not succeeded");

        proposal.status = ProposalStatus.EXECUTED;
        proposal.executionTime = block.timestamp;

        bool success = _executeProposal(proposal);
        multiSig.executed = true;

        emit MultiSigExecuted(_proposalId);
        emit ProposalExecuted(_proposalId, success);
    }

    // Administrative functions
    function addEmergencyCommitteeMember(address member) external onlyOwner {
        emergencyCommittee[member] = true;
    }

    function removeEmergencyCommitteeMember(address member) external onlyOwner {
        emergencyCommittee[member] = false;
    }

    function updateGovernanceParameters(
        uint256 _votingPeriod,
        uint256 _votingDelay,
        uint256 _proposalThreshold,
        uint256 _quorumThreshold,
        uint256 _timelockPeriod,
        uint256 _emergencyThreshold,
        uint256 _emergencyVotingPeriod,
        uint256 _proposalCooldown
    ) external onlyOwner {
        votingPeriod = _votingPeriod;
        votingDelay = _votingDelay;
        proposalThreshold = _proposalThreshold;
        quorumThreshold = _quorumThreshold;
        timelockPeriod = _timelockPeriod;
        emergencyThreshold = _emergencyThreshold;
        emergencyVotingPeriod = _emergencyVotingPeriod;
        proposalCooldown = _proposalCooldown;
    }

    function updateZKVerifier(address _zkVerifier) external onlyOwner {
        zkVerifier = _zkVerifier;
    }

    function updateTimeWeightedParameters(
        uint256 _maxLockDuration,
        uint256 _timeWeightMultiplier
    ) external onlyOwner {
        maxLockDuration = _maxLockDuration;
        timeWeightMultiplier = _timeWeightMultiplier;
    }

    function depositToTreasury() external payable {
        treasuryBalance += msg.value;
    }

    function withdrawFromTreasury(address payable to, uint256 amount) external onlyOwner {
        require(treasuryBalance >= amount, "Insufficient treasury balance");
        treasuryBalance -= amount;
        to.transfer(amount);
    }

    // Emergency functions
    function emergencyExecute(uint256 _proposalId) external onlyEmergencyCommittee proposalExists(_proposalId) {
        Proposal storage proposal = proposals[_proposalId];
        require(proposal.emergency, "Not an emergency proposal");
        require(proposal.status == ProposalStatus.SUCCEEDED, "Proposal not succeeded");

        proposal.status = ProposalStatus.EXECUTED;
        proposal.executionTime = block.timestamp;

        bool success = _executeProposal(proposal);
        emit ProposalExecuted(_proposalId, success);
    }

    // Receive function for treasury deposits
    receive() external payable {
        treasuryBalance += msg.value;
    }

    // ============ ERC2771 OVERRIDE FUNCTIONS ============

    function _msgSender() internal view override(ContextUpgradeable, ERC2771ContextUpgradeable) returns (address) {
        return ERC2771ContextUpgradeable._msgSender();
    }

    function _msgData() internal view override(ContextUpgradeable, ERC2771ContextUpgradeable) returns (bytes calldata) {
        return ERC2771ContextUpgradeable._msgData();
    }

    // ============ ADDITIONAL EVENTS ============

    event WeightedDelegation(address indexed delegator, address indexed delegatee, uint256 weight);
    event DelegationRemoved(address indexed delegator, address indexed delegatee);
    event GaslessVoteCast(bytes32 indexed voteHash, address indexed voter, uint256 indexed proposalId, bool support, uint256 weight);
}