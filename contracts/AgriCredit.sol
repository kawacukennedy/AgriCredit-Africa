// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

contract AgriCredit is Initializable, ERC20Upgradeable, ERC20BurnableUpgradeable, ERC20PausableUpgradeable, OwnableUpgradeable, AccessControlUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

    uint256 public constant MAX_SUPPLY = 1000000000 * 10**18; // 1 billion tokens
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18; // 1 million tokens

    // Enhanced tokenomics
    struct VestingSchedule {
        address beneficiary;
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 duration;
        uint256 cliffDuration;
        bool revocable;
        bool revoked;
    }

    struct StakingPosition {
        uint256 amount;
        uint256 startTime;
        uint256 lockPeriod;
        uint256 rewardDebt;
        bool autoCompound;
    }

    mapping(address => bool) public blacklisted;
    mapping(address => uint256) public lastTransferTime;
    mapping(address => uint256) public transferLimits;
    mapping(uint256 => VestingSchedule) public vestingSchedules;
    mapping(address => StakingPosition) public stakingPositions;

    uint256 public globalTransferLimit = 100000 * 10**18; // 100k tokens per day per address
    uint256 public constant TRANSFER_COOLDOWN = 1 hours;

    // Staking parameters
    uint256 public stakingRewardRate = 800; // 8% APY in basis points
    uint256 public totalStaked;
    uint256 public rewardPerTokenStored;
    uint256 public lastRewardUpdate;

    // Vesting
    uint256 public nextVestingId = 1;
    uint256 public totalVested;

    // Governance integration
    address public governanceContract;
    uint256 public proposalThreshold = 100000 * 10**18; // 100k tokens to propose

    event Blacklisted(address indexed account);
    event Unblacklisted(address indexed account);
    event TransferLimitUpdated(address indexed account, uint256 limit);
    event TokensBurned(address indexed burner, uint256 amount);

    function initialize(address _governanceContract) public initializer {
        __ERC20_init("AgriCredit Token", "AGRC");
        __ERC20Burnable_init();
        __ERC20Pausable_init();
        __Ownable_init(msg.sender);
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _mint(msg.sender, INITIAL_SUPPLY);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(GOVERNANCE_ROLE, _governanceContract);

        governanceContract = _governanceContract;
        lastRewardUpdate = block.timestamp;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }

    function burn(uint256 amount) public override {
        super.burn(amount);
        emit TokensBurned(msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) public override onlyRole(BURNER_ROLE) {
        super.burnFrom(account, amount);
        emit TokensBurned(account, amount);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function blacklist(address account) public onlyOwner {
        blacklisted[account] = true;
        emit Blacklisted(account);
    }

    function unblacklist(address account) public onlyOwner {
        blacklisted[account] = false;
        emit Unblacklisted(account);
    }

    function setTransferLimit(address account, uint256 limit) public onlyOwner {
        transferLimits[account] = limit;
        emit TransferLimitUpdated(account, limit);
    }

    function setGlobalTransferLimit(uint256 limit) public onlyOwner {
        globalTransferLimit = limit;
    }

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Pausable) {
        require(!blacklisted[from], "Sender is blacklisted");
        require(!blacklisted[to], "Recipient is blacklisted");

        // Check transfer limits
        if (from != address(0)) { // Not minting
            uint256 limit = transferLimits[from] > 0 ? transferLimits[from] : globalTransferLimit;
            require(value <= limit, "Transfer amount exceeds limit");

            // Check cooldown
            require(block.timestamp >= lastTransferTime[from] + TRANSFER_COOLDOWN, "Transfer cooldown active");
            lastTransferTime[from] = block.timestamp;
        }

        super._update(from, to, value);
    }

    function transferWithMemo(address to, uint256 amount, string memory memo) public returns (bool) {
        _transfer(msg.sender, to, amount);
        // In practice, emit an event with memo
        return true;
    }

    function batchTransfer(address[] memory recipients, uint256[] memory amounts) public nonReentrant {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(recipients.length <= 100, "Too many recipients");

        for (uint256 i = 0; i < recipients.length; i++) {
            _transfer(msg.sender, recipients[i], amounts[i]);
        }
    }

    function emergencyWithdraw(address token, uint256 amount) public onlyOwner {
        require(token != address(this), "Cannot withdraw native token");
        IERC20(token).transfer(owner(), amount);
    }

    function getTransferLimit(address account) public view returns (uint256) {
        return transferLimits[account] > 0 ? transferLimits[account] : globalTransferLimit;
    }

    function isBlacklisted(address account) public view returns (bool) {
        return blacklisted[account];
    }

    function getRemainingTransferLimit(address account) public view returns (uint256) {
        uint256 limit = getTransferLimit(account);
        if (block.timestamp < lastTransferTime[account] + TRANSFER_COOLDOWN) {
            return 0;
        }
        return limit;
    }

    // ============ ADVANCED TOKENOMICS FUNCTIONS ============

    // Vesting Functions
    function createVestingSchedule(
        address beneficiary,
        uint256 amount,
        uint256 startTime,
        uint256 duration,
        uint256 cliffDuration,
        bool revocable
    ) external onlyRole(GOVERNANCE_ROLE) returns (uint256) {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(amount > 0, "Invalid amount");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        require(duration > 0, "Invalid duration");
        require(cliffDuration <= duration, "Cliff cannot exceed duration");

        uint256 vestingId = nextVestingId++;
        vestingSchedules[vestingId] = VestingSchedule({
            beneficiary: beneficiary,
            totalAmount: amount,
            releasedAmount: 0,
            startTime: startTime,
            duration: duration,
            cliffDuration: cliffDuration,
            revocable: revocable,
            revoked: false
        });

        totalVested += amount;
        _mint(address(this), amount); // Mint to contract for vesting

        emit VestingScheduleCreated(vestingId, beneficiary, amount);
        return vestingId;
    }

    function releaseVestedTokens(uint256 vestingId) external nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[vestingId];
        require(schedule.beneficiary == msg.sender, "Not the beneficiary");
        require(!schedule.revoked, "Schedule revoked");

        uint256 releasable = vestedAmount(vestingId) - schedule.releasedAmount;
        require(releasable > 0, "No tokens to release");

        schedule.releasedAmount += releasable;
        totalVested -= releasable;

        _transfer(address(this), msg.sender, releasable);

        emit VestedTokensReleased(vestingId, msg.sender, releasable);
    }

    function vestedAmount(uint256 vestingId) public view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[vestingId];

        if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
            return 0;
        }

        if (block.timestamp >= schedule.startTime + schedule.duration) {
            return schedule.totalAmount;
        }

        uint256 timeElapsed = block.timestamp - schedule.startTime;
        return (schedule.totalAmount * timeElapsed) / schedule.duration;
    }

    function revokeVesting(uint256 vestingId) external onlyRole(GOVERNANCE_ROLE) {
        VestingSchedule storage schedule = vestingSchedules[vestingId];
        require(schedule.revocable, "Not revocable");
        require(!schedule.revoked, "Already revoked");

        schedule.revoked = true;
        uint256 unreleased = schedule.totalAmount - schedule.releasedAmount;
        totalVested -= unreleased;

        _burn(address(this), unreleased);

        emit VestingRevoked(vestingId, schedule.beneficiary, unreleased);
    }

    // Staking Functions
    function stakeTokens(uint256 amount, uint256 lockPeriod, bool autoCompound) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        require(lockPeriod >= 30 days && lockPeriod <= 365 days, "Invalid lock period");

        _updateRewards(msg.sender);

        StakingPosition storage position = stakingPositions[msg.sender];
        require(position.amount == 0, "Already staking"); // Simplified - one position per user

        position.amount = amount;
        position.startTime = block.timestamp;
        position.lockPeriod = lockPeriod;
        position.autoCompound = autoCompound;
        position.rewardDebt = (amount * rewardPerTokenStored) / 1e18;

        totalStaked += amount;
        _transfer(msg.sender, address(this), amount);

        emit TokensStaked(msg.sender, amount, lockPeriod);
    }

    function unstakeTokens() external nonReentrant {
        StakingPosition storage position = stakingPositions[msg.sender];
        require(position.amount > 0, "No staking position");
        require(block.timestamp >= position.startTime + position.lockPeriod, "Still locked");

        _updateRewards(msg.sender);

        uint256 amount = position.amount;
        uint256 rewards = position.rewardDebt;

        totalStaked -= amount;
        position.amount = 0;

        _transfer(address(this), msg.sender, amount);
        if (rewards > 0) {
            _mint(msg.sender, rewards);
        }

        emit TokensUnstaked(msg.sender, amount, rewards);
    }

    function claimStakingRewards() external nonReentrant {
        _updateRewards(msg.sender);

        StakingPosition storage position = stakingPositions[msg.sender];
        uint256 rewards = position.rewardDebt;

        if (rewards > 0) {
            position.rewardDebt = 0;
            _mint(msg.sender, rewards);
            emit StakingRewardsClaimed(msg.sender, rewards);
        }
    }

    function _updateRewards(address user) internal {
        uint256 timeElapsed = block.timestamp - lastRewardUpdate;
        if (timeElapsed > 0 && totalStaked > 0) {
            uint256 reward = (totalStaked * stakingRewardRate * timeElapsed) / (365 days * 10000);
            rewardPerTokenStored += (reward * 1e18) / totalStaked;
        }
        lastRewardUpdate = block.timestamp;

        if (user != address(0)) {
            StakingPosition storage position = stakingPositions[user];
            if (position.amount > 0) {
                uint256 pending = (position.amount * rewardPerTokenStored) / 1e18 - position.rewardDebt;
                position.rewardDebt += pending;
            }
        }
    }

    function getStakingInfo(address user) external view returns (
        uint256 stakedAmount,
        uint256 lockPeriod,
        uint256 endTime,
        uint256 pendingRewards
    ) {
        StakingPosition memory position = stakingPositions[user];
        uint256 pending = 0;

        if (position.amount > 0) {
            uint256 currentRewardPerToken = rewardPerTokenStored;
            uint256 timeElapsed = block.timestamp - lastRewardUpdate;
            if (timeElapsed > 0 && totalStaked > 0) {
                uint256 reward = (totalStaked * stakingRewardRate * timeElapsed) / (365 days * 10000);
                currentRewardPerToken += (reward * 1e18) / totalStaked;
            }
            pending = (position.amount * currentRewardPerToken) / 1e18 - position.rewardDebt;
        }

        return (
            position.amount,
            position.lockPeriod,
            position.startTime + position.lockPeriod,
            pending
        );
    }

    // Governance Integration
    function delegateVotingPower(address delegate) external {
        // Simplified delegation - in practice, integrate with governance contract
        require(governanceContract != address(0), "Governance not set");
        // Call governance contract to delegate
        emit VotingPowerDelegated(msg.sender, delegate);
    }

    function getVotingPower(address account) external view returns (uint256) {
        uint256 baseBalance = balanceOf(account);
        uint256 stakedBonus = stakingPositions[account].amount;

        // Additional bonuses can be added here
        return baseBalance + stakedBonus;
    }

    function canPropose(address account) external view returns (bool) {
        return getVotingPower(account) >= proposalThreshold;
    }

    // Emergency functions
    function emergencyPause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
        emit EmergencyPaused(msg.sender);
    }

    function emergencyUnpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
        emit EmergencyUnpaused(msg.sender);
    }

    // Admin functions
    function setStakingRewardRate(uint256 newRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newRate <= 5000, "Rate too high"); // Max 50%
        _updateRewards(address(0));
        stakingRewardRate = newRate;
        emit StakingRewardRateUpdated(newRate);
    }

    function setProposalThreshold(uint256 threshold) external onlyRole(GOVERNANCE_ROLE) {
        proposalThreshold = threshold;
        emit ProposalThresholdUpdated(threshold);
    }

    function setGovernanceContract(address _governance) external onlyRole(DEFAULT_ADMIN_ROLE) {
        governanceContract = _governance;
        _grantRole(GOVERNANCE_ROLE, _governance);
        emit GovernanceContractUpdated(_governance);
    }

    // Events
    event VestingScheduleCreated(uint256 indexed vestingId, address indexed beneficiary, uint256 amount);
    event VestedTokensReleased(uint256 indexed vestingId, address indexed beneficiary, uint256 amount);
    event VestingRevoked(uint256 indexed vestingId, address indexed beneficiary, uint256 amount);
    event TokensStaked(address indexed user, uint256 amount, uint256 lockPeriod);
    event TokensUnstaked(address indexed user, uint256 amount, uint256 rewards);
    event StakingRewardsClaimed(address indexed user, uint256 amount);
    event StakingRewardRateUpdated(uint256 newRate);
    event VotingPowerDelegated(address indexed delegator, address indexed delegate);
    event ProposalThresholdUpdated(uint256 threshold);
    event GovernanceContractUpdated(address indexed governance);
    event EmergencyPaused(address indexed by);
    event EmergencyUnpaused(address indexed by);
}