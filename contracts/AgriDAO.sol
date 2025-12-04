// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title AgriDAO - Advanced Agricultural DAO
 * @dev Decentralized autonomous organization for agricultural governance with
 * quadratic voting, conviction voting, and AI-assisted decision making
 */
contract AgriDAO is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    enum ProposalType { Standard, Emergency, Constitutional, Budget }
    enum ProposalStatus { Pending, Active, Succeeded, Failed, Executed, Cancelled }
    enum VoteType { Against, For, Abstain }

    struct Proposal {
        uint256 id;
        address proposer;
        ProposalType proposalType;
        string title;
        string description;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        uint256 startTime;
        uint256 endTime;
        uint256 executionTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        uint256 quadraticForVotes;
        uint256 quadraticAgainstVotes;
        ProposalStatus status;
        bool executed;
        mapping(address => Vote) votes;
        mapping(address => bool) hasVoted;
    }

    struct Vote {
        VoteType voteType;
        uint256 weight;
        uint256 quadraticWeight;
        uint256 timestamp;
        string reasoning; // IPFS hash of voting reasoning
    }

    struct Member {
        address memberAddress;
        uint256 votingPower;
        uint256 reputation;
        uint256 joinTime;
        bool active;
        MemberTier tier;
    }

    enum MemberTier { Observer, Contributor, Expert, Steward }

    struct ConvictionProposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 requestedAmount;
        address beneficiary;
        uint256 convictionScore;
        uint256 lastUpdate;
        bool active;
        mapping(address => uint256) stakedTokens;
        uint256 totalStaked;
        uint256 threshold;
    }

    // State variables
    IERC20Upgradeable public governanceToken;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => ConvictionProposal) public convictionProposals;
    mapping(address => Member) public members;

    uint256 public proposalCount;
    uint256 public convictionProposalCount;
    address[] public memberList;

    // Governance parameters
    uint256 public proposalThreshold = 100000 * 1e18; // 100k tokens to propose
    uint256 public quorumThreshold = 1000000 * 1e18; // 1M tokens for quorum
    uint256 public votingPeriod = 7 days;
    uint256 public executionDelay = 2 days;
    uint256 public emergencyVotingPeriod = 1 days;
    uint256 public convictionVotingPeriod = 30 days;

    // Conviction voting parameters
    uint256 public convictionGrowthRate = 2;
    uint256 public convictionHalfLife = 15 days;
    uint256 public convictionThresholdBase = 1000 * 1e18;

    // Treasury
    address public treasury;
    uint256 public treasuryBalance;

    // AI Oracle for decision support
    address public aiOracle;

    // Emergency controls
    bool public emergencyMode;
    address public emergencyGuardian;

    // Events
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, ProposalType proposalType, string title);
    event VoteCast(uint256 indexed proposalId, address indexed voter, VoteType voteType, uint256 weight, uint256 quadraticWeight);
    event ProposalExecuted(uint256 indexed proposalId);
    event MemberJoined(address indexed member, MemberTier tier);
    event ConvictionProposalCreated(uint256 indexed proposalId, address indexed proposer, string title);
    event TokensStakedOnConviction(uint256 indexed proposalId, address indexed staker, uint256 amount);
    event EmergencyModeActivated(address indexed activator);
    event EmergencyModeDeactivated(address indexed deactivator);

    function initialize(
        address _governanceToken,
        address _treasury,
        address _aiOracle,
        address _emergencyGuardian
    ) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        governanceToken = IERC20Upgradeable(_governanceToken);
        treasury = _treasury;
        aiOracle = _aiOracle;
        emergencyGuardian = _emergencyGuardian;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ============ MEMBERSHIP MANAGEMENT ============

    /**
     * @dev Allows users to join the DAO
     */
    function joinDAO(uint256 initialStake) external nonReentrant {
        require(!members[msg.sender].active, "Already a member");
        require(initialStake >= 100 * 1e18, "Minimum stake required");

        // Transfer stake to treasury
        governanceToken.safeTransferFrom(msg.sender, treasury, initialStake);

        // Create member
        Member storage member = members[msg.sender];
        member.memberAddress = msg.sender;
        member.votingPower = initialStake;
        member.reputation = 100; // Base reputation
        member.joinTime = block.timestamp;
        member.active = true;
        member.tier = MemberTier.Contributor;

        memberList.push(msg.sender);
        treasuryBalance += initialStake;

        emit MemberJoined(msg.sender, member.tier);
    }

    /**
     * @dev Updates member tier based on reputation and contributions
     */
    function updateMemberTier(address memberAddress) external {
        Member storage member = members[memberAddress];
        require(member.active, "Member not active");

        uint256 newReputation = _calculateReputation(memberAddress);
        MemberTier newTier;

        if (newReputation >= 1000) {
            newTier = MemberTier.Steward;
        } else if (newReputation >= 500) {
            newTier = MemberTier.Expert;
        } else if (newReputation >= 200) {
            newTier = MemberTier.Contributor;
        } else {
            newTier = MemberTier.Observer;
        }

        if (newTier != member.tier) {
            member.tier = newTier;
            member.reputation = newReputation;
        }
    }

    // ============ PROPOSAL CREATION ============

    /**
     * @dev Creates a standard proposal
     */
    function createProposal(
        ProposalType proposalType,
        string memory title,
        string memory description,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas
    ) external returns (uint256) {
        require(governanceToken.balanceOf(msg.sender) >= proposalThreshold, "Insufficient tokens to propose");

        proposalCount++;
        uint256 proposalId = proposalCount;

        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.proposalType = proposalType;
        proposal.title = title;
        proposal.description = description;
        proposal.targets = targets;
        proposal.values = values;
        proposal.calldatas = calldatas;
        proposal.startTime = block.timestamp;

        // Set voting period based on proposal type
        if (proposalType == ProposalType.Emergency) {
            proposal.endTime = block.timestamp + emergencyVotingPeriod;
        } else {
            proposal.endTime = block.timestamp + votingPeriod;
        }

        proposal.status = ProposalStatus.Active;

        emit ProposalCreated(proposalId, msg.sender, proposalType, title);
        return proposalId;
    }

    /**
     * @dev Creates a conviction voting proposal
     */
    function createConvictionProposal(
        string memory title,
        string memory description,
        uint256 requestedAmount,
        address beneficiary
    ) external returns (uint256) {
        require(members[msg.sender].active, "Not a DAO member");

        convictionProposalCount++;
        uint256 proposalId = convictionProposalCount;

        ConvictionProposal storage proposal = convictionProposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.title = title;
        proposal.description = description;
        proposal.requestedAmount = requestedAmount;
        proposal.beneficiary = beneficiary;
        proposal.active = true;
        proposal.lastUpdate = block.timestamp;
        proposal.threshold = _calculateConvictionThreshold(requestedAmount);

        emit ConvictionProposalCreated(proposalId, msg.sender, title);
        return proposalId;
    }

    // ============ VOTING FUNCTIONS ============

    /**
     * @dev Casts a quadratic vote on a proposal
     */
    function castQuadraticVote(
        uint256 proposalId,
        VoteType voteType,
        string memory reasoning
    ) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp >= proposal.startTime && block.timestamp <= proposal.endTime, "Voting not active");
        require(!proposal.hasVoted[msg.sender], "Already voted");

        uint256 votingPower = governanceToken.balanceOf(msg.sender);
        require(votingPower > 0, "No voting power");

        // Calculate quadratic voting weight (square root of voting power)
        uint256 quadraticWeight = Math.sqrt(votingPower * 1e18) / 1e9;

        Vote storage vote = proposal.votes[msg.sender];
        vote.voteType = voteType;
        vote.weight = votingPower;
        vote.quadraticWeight = quadraticWeight;
        vote.timestamp = block.timestamp;
        vote.reasoning = reasoning;

        proposal.hasVoted[msg.sender] = true;

        // Update vote counts
        if (voteType == VoteType.For) {
            proposal.forVotes += votingPower;
            proposal.quadraticForVotes += quadraticWeight;
        } else if (voteType == VoteType.Against) {
            proposal.againstVotes += votingPower;
            proposal.quadraticAgainstVotes += quadraticWeight;
        } else {
            proposal.abstainVotes += votingPower;
        }

        emit VoteCast(proposalId, msg.sender, voteType, votingPower, quadraticWeight);
    }

    /**
     * @dev Stakes tokens on a conviction proposal
     */
    function stakeOnConvictionProposal(uint256 proposalId, uint256 amount) external nonReentrant {
        ConvictionProposal storage proposal = convictionProposals[proposalId];
        require(proposal.active, "Proposal not active");
        require(amount > 0, "Amount must be greater than 0");

        uint256 voterBalance = governanceToken.balanceOf(msg.sender);
        require(voterBalance >= amount, "Insufficient balance");

        // Transfer tokens to this contract
        governanceToken.safeTransferFrom(msg.sender, address(this), amount);

        // Update staking
        proposal.stakedTokens[msg.sender] += amount;
        proposal.totalStaked += amount;

        // Update conviction score
        _updateConvictionScore(proposalId);

        emit TokensStakedOnConviction(proposalId, msg.sender, amount);
    }

    // ============ EXECUTION FUNCTIONS ============

    /**
     * @dev Executes a successful proposal
     */
    function executeProposal(uint256 proposalId) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.Active, "Proposal not active");
        require(block.timestamp > proposal.endTime, "Voting not ended");
        require(!proposal.executed, "Already executed");

        // Check if proposal succeeded
        bool succeeded = _hasProposalSucceeded(proposalId);
        require(succeeded, "Proposal did not succeed");

        proposal.status = ProposalStatus.Succeeded;
        proposal.executionTime = block.timestamp + executionDelay;

        // Queue for execution
        // In a real implementation, you'd use a timelock here
        _executeProposal(proposalId);
    }

    /**
     * @dev Executes a conviction proposal if threshold is met
     */
    function executeConvictionProposal(uint256 proposalId) external nonReentrant {
        ConvictionProposal storage proposal = convictionProposals[proposalId];
        require(proposal.active, "Proposal not active");
        require(proposal.convictionScore >= proposal.threshold, "Conviction threshold not met");

        proposal.active = false;

        // Transfer requested amount to beneficiary
        require(treasuryBalance >= proposal.requestedAmount, "Insufficient treasury funds");
        treasuryBalance -= proposal.requestedAmount;

        // Transfer tokens from treasury
        governanceToken.safeTransferFrom(treasury, proposal.beneficiary, proposal.requestedAmount);
    }

    // ============ EMERGENCY FUNCTIONS ============

    /**
     * @dev Activates emergency mode (only emergency guardian)
     */
    function activateEmergencyMode() external {
        require(msg.sender == emergencyGuardian || msg.sender == owner(), "Not authorized");
        require(!emergencyMode, "Already in emergency mode");

        emergencyMode = true;
        emit EmergencyModeActivated(msg.sender);
    }

    /**
     * @dev Deactivates emergency mode
     */
    function deactivateEmergencyMode() external {
        require(msg.sender == emergencyGuardian || msg.sender == owner(), "Not authorized");
        require(emergencyMode, "Not in emergency mode");

        emergencyMode = false;
        emit EmergencyModeDeactivated(msg.sender);
    }

    /**
     * @dev Emergency execution of proposal (bypasses normal voting)
     */
    function emergencyExecute(uint256 proposalId) external {
        require(emergencyMode, "Not in emergency mode");
        require(msg.sender == emergencyGuardian || msg.sender == owner(), "Not authorized");

        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Already executed");

        _executeProposal(proposalId);
    }

    // ============ INTERNAL FUNCTIONS ============

    function _hasProposalSucceeded(uint256 proposalId) internal view returns (bool) {
        Proposal storage proposal = proposals[proposalId];

        // Check quorum
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        if (totalVotes < quorumThreshold) {
            return false;
        }

        // Check majority
        if (proposal.proposalType == ProposalType.Constitutional) {
            // Constitutional changes require 2/3 majority
            return proposal.forVotes > (totalVotes * 2) / 3;
        } else {
            // Standard proposals require simple majority
            return proposal.forVotes > proposal.againstVotes;
        }
    }

    function _executeProposal(uint256 proposalId) internal {
        Proposal storage proposal = proposals[proposalId];

        // Execute the proposal actions
        for (uint256 i = 0; i < proposal.targets.length; i++) {
            (bool success,) = proposal.targets[i].call{value: proposal.values[i]}(proposal.calldatas[i]);
            require(success, "Proposal execution failed");
        }

        proposal.executed = true;
        proposal.status = ProposalStatus.Executed;

        emit ProposalExecuted(proposalId);
    }

    function _updateConvictionScore(uint256 proposalId) internal {
        ConvictionProposal storage proposal = convictionProposals[proposalId];

        uint256 timeSinceLastUpdate = block.timestamp - proposal.lastUpdate;
        if (timeSinceLastUpdate == 0) return;

        // Conviction grows with sqrt(time) * sqrt(staked tokens)
        uint256 timeFactor = Math.sqrt(timeSinceLastUpdate * convictionGrowthRate);
        uint256 stakeFactor = Math.sqrt(proposal.totalStaked);

        proposal.convictionScore = (proposal.convictionScore + timeFactor * stakeFactor) / 1e18;
        proposal.lastUpdate = block.timestamp;
    }

    function _calculateConvictionThreshold(uint256 amount) internal view returns (uint256) {
        // Threshold increases with requested amount
        return Math.max(amount / 100, convictionThresholdBase);
    }

    function _calculateReputation(address memberAddress) internal view returns (uint256) {
        Member storage member = members[memberAddress];
        if (!member.active) return 0;

        uint256 baseReputation = 100;
        uint256 votingPowerBonus = Math.sqrt(member.votingPower / 1e18);
        uint256 timeBonus = (block.timestamp - member.joinTime) / (365 days); // 1 point per year

        return baseReputation + votingPowerBonus + timeBonus;
    }

    // ============ VIEW FUNCTIONS ============

    function getProposal(uint256 proposalId) external view returns (
        address proposer,
        ProposalType proposalType,
        string memory title,
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        ProposalStatus status,
        bool executed
    ) {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.proposer,
            proposal.proposalType,
            proposal.title,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.abstainVotes,
            proposal.status,
            proposal.executed
        );
    }

    function getConvictionProposal(uint256 proposalId) external view returns (
        address proposer,
        string memory title,
        uint256 convictionScore,
        uint256 threshold,
        bool active
    ) {
        ConvictionProposal storage proposal = convictionProposals[proposalId];
        return (
            proposal.proposer,
            proposal.title,
            proposal.convictionScore,
            proposal.threshold,
            proposal.active
        );
    }

    function getMemberInfo(address memberAddress) external view returns (
        uint256 votingPower,
        uint256 reputation,
        MemberTier tier,
        bool active
    ) {
        Member storage member = members[memberAddress];
        return (
            member.votingPower,
            member.reputation,
            member.tier,
            member.active
        );
    }

    function hasVoted(uint256 proposalId, address voter) external view returns (bool) {
        return proposals[proposalId].hasVoted[voter];
    }

    // ============ ADMIN FUNCTIONS ============

    function setProposalThreshold(uint256 _threshold) external onlyOwner {
        proposalThreshold = _threshold;
    }

    function setQuorumThreshold(uint256 _threshold) external onlyOwner {
        quorumThreshold = _threshold;
    }

    function setVotingPeriod(uint256 _period) external onlyOwner {
        votingPeriod = _period;
    }

    function setAIOracle(address _aiOracle) external onlyOwner {
        aiOracle = _aiOracle;
    }

    function setEmergencyGuardian(address _guardian) external onlyOwner {
        emergencyGuardian = _guardian;
    }
}