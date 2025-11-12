// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract GovernanceDAO is Ownable, ReentrancyGuard {
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

    constructor(address _governanceToken, address _treasury) Ownable(msg.sender) {
        governanceToken = IERC20(_governanceToken);
        treasury = _treasury;

        // Initialize emergency committee
        emergencyCommittee[msg.sender] = true;
    }

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
    ) external returns (uint256) {
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

    function getVotes(address account) public view returns (uint256) {
        address delegate = delegates[account];
        if (delegate == address(0)) {
            return governanceToken.balanceOf(account);
        }
        return governanceToken.balanceOf(delegate);
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
}