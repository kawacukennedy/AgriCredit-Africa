// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract GovernanceToken is Initializable, ERC20Upgradeable, ERC20VotesUpgradeable, OwnableUpgradeable, UUPSUpgradeable {

    // Token parameters
    uint256 public constant MAX_SUPPLY = 1000000000 * 10**18; // 1 billion tokens
    uint256 public constant INITIAL_SUPPLY = 100000000 * 10**18; // 100 million initial supply

    // Distribution parameters
    uint256 public constant TEAM_ALLOCATION = 20000000 * 10**18; // 20 million for team
    uint256 public constant COMMUNITY_ALLOCATION = 30000000 * 10**18; // 30 million for community
    uint256 public constant LIQUIDITY_ALLOCATION = 20000000 * 10**18; // 20 million for liquidity
    uint256 public constant REWARDS_ALLOCATION = 30000000 * 10**18; // 30 million for rewards

    // Vesting parameters
    struct VestingSchedule {
        address beneficiary;
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 duration;
        uint256 cliffDuration;
        bool revocable;
    }

    mapping(address => VestingSchedule) public vestingSchedules;
    address[] public vestees;

    // Governance parameters
    uint256 public proposalThreshold = 100000 * 10**18; // 100k tokens to propose
    uint256 public quorumThreshold = 1000000 * 10**18; // 1M tokens for quorum
    uint256 public votingPeriod = 7 days;
    uint256 public executionDelay = 2 days;

    // Delegation tracking
    mapping(address => address) public delegates;
    mapping(address => uint256) public delegatedPower;

    // Quadratic voting structures
    struct QuadraticProposal {
        uint256 proposalId;
        address proposer;
        string description;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        uint256 startTime;
        uint256 endTime;
        uint256 totalQuadraticVotes;
        uint256 totalLinearVotes;
        bool executed;
        bool canceled;
        mapping(address => QuadraticVote) votes;
    }

    struct QuadraticVote {
        uint256 linearVotes;    // Raw token votes
        uint256 quadraticVotes; // sqrt(linearVotes) for quadratic voting
        bool hasVoted;
        uint256 timestamp;
    }

    mapping(uint256 => QuadraticProposal) public quadraticProposals;
    uint256 public quadraticProposalCount;

    // Conviction voting (continuous approval voting)
    struct ConvictionProposal {
        uint256 proposalId;
        address proposer;
        string description;
        uint256 requestedAmount;
        address beneficiary;
        uint256 convictionScore;
        uint256 lastUpdate;
        bool active;
        mapping(address => uint256) stakedTokens;
        uint256 totalStaked;
    }

    mapping(uint256 => ConvictionProposal) public convictionProposals;
    uint256 public convictionProposalCount;

    // Parameters for conviction voting
    uint256 public convictionGrowthRate = 2; // Conviction grows with sqrt(time)
    uint256 public convictionHalfLife = 30 days; // Conviction half-life

    // Fee collection for treasury
    uint256 public collectedFees;
    address public treasury;

    // Emergency controls
    bool public mintingPaused;
    bool public transfersPaused;

    // Events
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    event VestingScheduleCreated(address indexed beneficiary, uint256 amount, uint256 duration);
    event TokensReleased(address indexed beneficiary, uint256 amount);
    event DelegationSet(address indexed delegator, address indexed delegatee);
    event TreasuryFeesCollected(uint256 amount);

    // Quadratic voting events
    event QuadraticProposalCreated(uint256 indexed proposalId, address indexed proposer, string description);
    event QuadraticVoteCast(uint256 indexed proposalId, address indexed voter, uint256 linearVotes, uint256 quadraticVotes);
    event QuadraticProposalExecuted(uint256 indexed proposalId);

    // Conviction voting events
    event ConvictionProposalCreated(uint256 indexed proposalId, address indexed proposer, string description, uint256 requestedAmount);
    event TokensStakedOnProposal(uint256 indexed proposalId, address indexed staker, uint256 amount);
    event TokensUnstakedFromProposal(uint256 indexed proposalId, address indexed staker, uint256 amount);
    event ConvictionProposalExecuted(uint256 indexed proposalId, address indexed beneficiary, uint256 amount);

    // Advanced delegation events
    event Delegated(address indexed delegator, address indexed delegatee, uint256 amount, uint256 duration);
    event Undelegated(address indexed delegator, address indexed delegatee, uint256 amount);

    function initialize(address _treasury) public initializer {
        __ERC20_init("AgriCredit Governance Token", "AGC");
        __ERC20Votes_init();
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();

        treasury = _treasury;

        // Mint initial supply
        _mint(address(this), INITIAL_SUPPLY);

        // Create vesting schedules
        _createVestingSchedule(owner(), TEAM_ALLOCATION, 2 * 365 days, 180 days, true);
        _createVestingSchedule(treasury, COMMUNITY_ALLOCATION, 365 days, 0, false);
    }

    // ============ QUADRATIC VOTING FUNCTIONS ============

    /**
     * @dev Creates a quadratic voting proposal
     */
    function createQuadraticProposal(
        string memory description,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas
    ) external returns (uint256) {
        require(getVotes(msg.sender) >= proposalThreshold, "Insufficient voting power");

        quadraticProposalCount++;
        uint256 proposalId = quadraticProposalCount;

        QuadraticProposal storage proposal = quadraticProposals[proposalId];
        proposal.proposalId = proposalId;
        proposal.proposer = msg.sender;
        proposal.description = description;
        proposal.targets = targets;
        proposal.values = values;
        proposal.calldatas = calldatas;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + votingPeriod;

        emit QuadraticProposalCreated(proposalId, msg.sender, description);
        return proposalId;
    }

    /**
     * @dev Casts a quadratic vote
     */
    function castQuadraticVote(uint256 proposalId, uint256 votes) external {
        QuadraticProposal storage proposal = quadraticProposals[proposalId];
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(!proposal.executed && !proposal.canceled, "Proposal not active");

        QuadraticVote storage existingVote = proposal.votes[msg.sender];
        require(!existingVote.hasVoted || existingVote.linearVotes != votes, "Same vote already cast");

        uint256 voterBalance = getVotes(msg.sender);
        require(votes <= voterBalance, "Insufficient voting power");

        // Remove previous vote if exists
        if (existingVote.hasVoted) {
            proposal.totalQuadraticVotes -= existingVote.quadraticVotes;
            proposal.totalLinearVotes -= existingVote.linearVotes;
        }

        // Calculate quadratic votes (square root of linear votes)
        uint256 quadraticVotes = Math.sqrt(votes * 1e18) / 1e9; // Scale appropriately

        // Update vote
        existingVote.linearVotes = votes;
        existingVote.quadraticVotes = quadraticVotes;
        existingVote.hasVoted = true;
        existingVote.timestamp = block.timestamp;

        // Update totals
        proposal.totalQuadraticVotes += quadraticVotes;
        proposal.totalLinearVotes += votes;

        emit QuadraticVoteCast(proposalId, msg.sender, votes, quadraticVotes);
    }

    /**
     * @dev Executes a quadratic proposal
     */
    function executeQuadraticProposal(uint256 proposalId) external {
        QuadraticProposal storage proposal = quadraticProposals[proposalId];
        require(block.timestamp > proposal.endTime, "Voting not ended");
        require(!proposal.executed && !proposal.canceled, "Proposal already executed or canceled");
        require(proposal.totalQuadraticVotes >= quorumThreshold, "Insufficient quadratic votes");

        proposal.executed = true;

        // Execute the proposal
        for (uint256 i = 0; i < proposal.targets.length; i++) {
            (bool success,) = proposal.targets[i].call{value: proposal.values[i]}(proposal.calldatas[i]);
            require(success, "Proposal execution failed");
        }

        emit QuadraticProposalExecuted(proposalId);
    }

    // ============ CONVICTION VOTING FUNCTIONS ============

    /**
     * @dev Creates a conviction voting proposal
     */
    function createConvictionProposal(
        string memory description,
        uint256 requestedAmount,
        address beneficiary
    ) external returns (uint256) {
        require(getVotes(msg.sender) >= proposalThreshold, "Insufficient voting power");

        convictionProposalCount++;
        uint256 proposalId = convictionProposalCount;

        ConvictionProposal storage proposal = convictionProposals[proposalId];
        proposal.proposalId = proposalId;
        proposal.proposer = msg.sender;
        proposal.description = description;
        proposal.requestedAmount = requestedAmount;
        proposal.beneficiary = beneficiary;
        proposal.active = true;
        proposal.lastUpdate = block.timestamp;

        emit ConvictionProposalCreated(proposalId, msg.sender, description, requestedAmount);
        return proposalId;
    }

    /**
     * @dev Stakes tokens on a conviction proposal
     */
    function stakeOnConvictionProposal(uint256 proposalId, uint256 amount) external {
        ConvictionProposal storage proposal = convictionProposals[proposalId];
        require(proposal.active, "Proposal not active");
        require(amount > 0, "Amount must be greater than 0");

        uint256 voterBalance = balanceOf(msg.sender);
        require(voterBalance >= amount, "Insufficient balance");

        // Transfer tokens to this contract
        _transfer(msg.sender, address(this), amount);

        // Update staking
        proposal.stakedTokens[msg.sender] += amount;
        proposal.totalStaked += amount;

        // Update conviction score
        _updateConvictionScore(proposalId);

        emit TokensStakedOnProposal(proposalId, msg.sender, amount);
    }

    /**
     * @dev Unstakes tokens from a conviction proposal
     */
    function unstakeFromConvictionProposal(uint256 proposalId, uint256 amount) external {
        ConvictionProposal storage proposal = convictionProposals[proposalId];
        require(proposal.stakedTokens[msg.sender] >= amount, "Insufficient staked amount");

        // Update staking
        proposal.stakedTokens[msg.sender] -= amount;
        proposal.totalStaked -= amount;

        // Transfer tokens back
        _transfer(address(this), msg.sender, amount);

        // Update conviction score
        _updateConvictionScore(proposalId);

        emit TokensUnstakedFromProposal(proposalId, msg.sender, amount);
    }

    /**
     * @dev Executes a conviction proposal if threshold is met
     */
    function executeConvictionProposal(uint256 proposalId) external {
        ConvictionProposal storage proposal = convictionProposals[proposalId];
        require(proposal.active, "Proposal not active");

        uint256 convictionThreshold = _calculateConvictionThreshold(proposal.requestedAmount);
        require(proposal.convictionScore >= convictionThreshold, "Conviction threshold not met");

        proposal.active = false;

        // Transfer requested amount to beneficiary
        _transfer(address(this), proposal.beneficiary, proposal.requestedAmount);

        emit ConvictionProposalExecuted(proposalId, proposal.beneficiary, proposal.requestedAmount);
    }

    // ============ ADVANCED DELEGATION FUNCTIONS ============

    /**
     * @dev Delegates voting power with time-weighted decay
     */
    function delegateWithDecay(address delegatee, uint256 duration) external {
        require(delegatee != address(0), "Cannot delegate to zero address");
        require(delegatee != msg.sender, "Cannot delegate to self");

        uint256 votingPower = getVotes(msg.sender);
        require(votingPower > 0, "No voting power to delegate");

        delegates[msg.sender] = delegatee;
        delegatedPower[delegatee] += votingPower;

        // In a real implementation, you'd track delegation duration and decay
        // For now, this is a simplified version

        emit Delegated(msg.sender, delegatee, votingPower, duration);
    }

    /**
     * @dev Undelegates voting power
     */
    function undelegate() external {
        address currentDelegate = delegates[msg.sender];
        require(currentDelegate != address(0), "Not delegated");

        uint256 votingPower = getVotes(msg.sender);
        delegatedPower[currentDelegate] -= votingPower;
        delegates[msg.sender] = address(0);

        emit Undelegated(msg.sender, currentDelegate, votingPower);
    }

    // ============ INTERNAL FUNCTIONS ============

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
        // Simplified formula: threshold = amount / 1000 (minimum 1000)
        return Math.max(amount / 1000, 1000 * 1e18);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ============ TOKEN MINTING & BURNING ============

    function mint(address _to, uint256 _amount) external onlyOwner {
        require(!mintingPaused, "Minting paused");
        require(totalSupply() + _amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(_to, _amount);
        emit TokensMinted(_to, _amount);
    }

    function burn(uint256 _amount) external {
        _burn(msg.sender, _amount);
        emit TokensBurned(msg.sender, _amount);
    }

    function burnFrom(address _account, uint256 _amount) external onlyOwner {
        _burn(_account, _amount);
        emit TokensBurned(_account, _amount);
    }

    // ============ VESTING SYSTEM ============

    function _createVestingSchedule(
        address _beneficiary,
        uint256 _amount,
        uint256 _duration,
        uint256 _cliffDuration,
        bool _revocable
    ) internal {
        require(_beneficiary != address(0), "Invalid beneficiary");
        require(_amount > 0, "Invalid amount");
        require(vestingSchedules[_beneficiary].totalAmount == 0, "Vesting already exists");

        vestingSchedules[_beneficiary] = VestingSchedule({
            beneficiary: _beneficiary,
            totalAmount: _amount,
            releasedAmount: 0,
            startTime: block.timestamp,
            duration: _duration,
            cliffDuration: _cliffDuration,
            revocable: _revocable
        });

        vestees.push(_beneficiary);
        emit VestingScheduleCreated(_beneficiary, _amount, _duration);
    }

    function releaseVestedTokens() external {
        VestingSchedule storage vesting = vestingSchedules[msg.sender];
        require(vesting.totalAmount > 0, "No vesting schedule");

        uint256 releasable = _calculateReleasableAmount(vesting);
        require(releasable > 0, "No tokens to release");

        vesting.releasedAmount += releasable;
        _transfer(address(this), msg.sender, releasable);

        emit TokensReleased(msg.sender, releasable);
    }

    function _calculateReleasableAmount(VestingSchedule memory _vesting) internal view returns (uint256) {
        if (block.timestamp < _vesting.startTime + _vesting.cliffDuration) {
            return 0;
        }

        uint256 timeFromStart = block.timestamp - _vesting.startTime;
        uint256 vestedAmount;

        if (timeFromStart >= _vesting.duration) {
            vestedAmount = _vesting.totalAmount;
        } else {
            vestedAmount = (_vesting.totalAmount * timeFromStart) / _vesting.duration;
        }

        return vestedAmount - _vesting.releasedAmount;
    }

    function revokeVesting(address _beneficiary) external onlyOwner {
        VestingSchedule storage vesting = vestingSchedules[_beneficiary];
        require(vesting.revocable, "Vesting not revocable");

        uint256 unreleased = vesting.totalAmount - vesting.releasedAmount;
        vesting.totalAmount = vesting.releasedAmount; // Effectively revoke remaining

        // Return unreleased tokens to treasury
        _transfer(address(this), treasury, unreleased);
    }

    // ============ DELEGATION SYSTEM ============

    function delegate(address _delegatee) external {
        require(_delegatee != address(0), "Cannot delegate to zero address");
        require(_delegatee != msg.sender, "Cannot delegate to self");

        address previousDelegate = delegates[msg.sender];
        delegates[msg.sender] = _delegatee;

        _moveDelegatedPower(previousDelegate, _delegatee, balanceOf(msg.sender));

        emit DelegationSet(msg.sender, _delegatee);
    }

    function _moveDelegatedPower(address _from, address _to, uint256 _amount) internal {
        if (_from != address(0)) {
            delegatedPower[_from] -= _amount;
        }
        if (_to != address(0)) {
            delegatedPower[_to] += _amount;
        }
    }

    function getVotingPower(address _account) public view returns (uint256) {
        return balanceOf(_account) + delegatedPower[_account];
    }

    function getTotalVotingPower() external view returns (uint256) {
        return totalSupply();
    }

    // ============ GOVERNANCE FUNCTIONS ============

    function canPropose(address _account) external view returns (bool) {
        return getVotingPower(_account) >= proposalThreshold;
    }

    function getQuorum() external view returns (uint256) {
        return quorumThreshold;
    }

    function getVotingPeriod() external view returns (uint256) {
        return votingPeriod;
    }

    function getExecutionDelay() external view returns (uint256) {
        return executionDelay;
    }

    // ============ TRANSFER HOOKS ============

    function _update(address _from, address _to, uint256 _value) internal override(ERC20Upgradeable, ERC20VotesUpgradeable) {
        require(!transfersPaused || msg.sender == owner(), "Transfers paused");

        super._update(_from, _to, _value);

        // Update delegation power
        if (_from != address(0)) {
            address fromDelegate = delegates[_from];
            if (fromDelegate != address(0)) {
                delegatedPower[fromDelegate] -= _value;
            }
        }

        if (_to != address(0)) {
            address toDelegate = delegates[_to];
            if (toDelegate != address(0)) {
                delegatedPower[toDelegate] += _value;
            }
        }
    }

    // ============ FEE COLLECTION ============

    function collectFees(uint256 _amount) external onlyOwner {
        require(collectedFees >= _amount, "Insufficient collected fees");

        collectedFees -= _amount;
        _transfer(address(this), treasury, _amount);

        emit TreasuryFeesCollected(_amount);
    }

    function addCollectedFees(uint256 _amount) external {
        // This would be called by other contracts to add fees
        collectedFees += _amount;
        _transfer(msg.sender, address(this), _amount);
    }

    // ============ VIEW FUNCTIONS ============

    function getVestingSchedule(address _beneficiary) external view returns (
        uint256 totalAmount,
        uint256 releasedAmount,
        uint256 startTime,
        uint256 duration,
        uint256 cliffDuration,
        bool revocable
    ) {
        VestingSchedule memory vesting = vestingSchedules[_beneficiary];
        return (
            vesting.totalAmount,
            vesting.releasedAmount,
            vesting.startTime,
            vesting.duration,
            vesting.cliffDuration,
            vesting.revocable
        );
    }

    function getReleasableAmount(address _beneficiary) external view returns (uint256) {
        VestingSchedule memory vesting = vestingSchedules[_beneficiary];
        return _calculateReleasableAmount(vesting);
    }

    function getVestees() external view returns (address[] memory) {
        return vestees;
    }

    function getDelegate(address _account) external view returns (address) {
        return delegates[_account];
    }

    function getDelegatedPower(address _account) external view returns (uint256) {
        return delegatedPower[_account];
    }

    // ============ ADMIN FUNCTIONS ============

    function setGovernanceParameters(
        uint256 _proposalThreshold,
        uint256 _quorumThreshold,
        uint256 _votingPeriod,
        uint256 _executionDelay
    ) external onlyOwner {
        proposalThreshold = _proposalThreshold;
        quorumThreshold = _quorumThreshold;
        votingPeriod = _votingPeriod;
        executionDelay = _executionDelay;
    }

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    function pauseMinting(bool _paused) external onlyOwner {
        mintingPaused = _paused;
    }

    function pauseTransfers(bool _paused) external onlyOwner {
        transfersPaused = _paused;
    }

    function createVestingSchedule(
        address _beneficiary,
        uint256 _amount,
        uint256 _duration,
        uint256 _cliffDuration,
        bool _revocable
    ) external onlyOwner {
        require(balanceOf(address(this)) >= _amount, "Insufficient contract balance");
        _createVestingSchedule(_beneficiary, _amount, _duration, _cliffDuration, _revocable);
    }

    // ============ CLOCK MODE (for testing) ============

    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }
}