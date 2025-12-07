// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title Insurance Pool
 * @dev Decentralized mutual insurance pool with parametric triggers and AI risk assessment
 */
contract InsurancePool is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    enum RiskCategory { Low, Medium, High, Extreme }
    enum ClaimStatus { Pending, Approved, Rejected, Paid }

    struct Pool {
        uint256 poolId;
        string name;
        string description;
        address premiumToken;
        RiskCategory riskCategory;
        uint256 totalPremiums;
        uint256 totalCoverage;
        uint256 lockedFunds;
        uint256 poolUtilization; // Percentage of funds that can be used
        bool active;
        mapping(address => Member) members;
        address[] memberList;
    }

    struct Member {
        uint256 contribution;
        uint256 coverageAmount;
        uint256 claimableAmount;
        uint256 lastContribution;
        bool active;
    }

    struct ParametricPolicy {
        uint256 policyId;
        uint256 poolId;
        address holder;
        uint256 coverageAmount;
        uint256 premiumPaid;
        string riskType; // "drought", "flood", "pest", "price_drop", etc.
        bytes triggerCondition; // Encoded trigger parameters
        uint256 triggerValue;
        bool isActive;
        uint256 expiryDate;
        ClaimStatus claimStatus;
        uint256 aiRiskScore; // AI-assessed risk score
    }

    struct Claim {
        uint256 claimId;
        uint256 policyId;
        address claimant;
        uint256 claimedAmount;
        string evidence; // IPFS hash of evidence
        uint256 aiConfidence; // AI confidence in claim validity
        ClaimStatus status;
        uint256 submittedAt;
        uint256 processedAt;
        mapping(address => bool) approvals; // Validator approvals
        uint256 approvalCount;
    }

    // State variables
    mapping(uint256 => Pool) public pools;
    mapping(uint256 => ParametricPolicy) public policies;
    mapping(uint256 => Claim) public claims;

    uint256 public poolCount;
    uint256 public policyCount;
    uint256 public claimCount;

    // Oracle for parametric triggers
    address public oracle;
    address public aiOracle;

    // Governance parameters
    uint256 public minContribution = 100 * 1e18; // Minimum contribution to join
    uint256 public claimApprovalThreshold = 3; // Number of approvals needed
    uint256 public maxPoolUtilization = 80; // Maximum 80% utilization
    uint256 public premiumFee = 200; // 2% platform fee in basis points

    // Events
    event PoolCreated(uint256 indexed poolId, string name, RiskCategory riskCategory);
    event MemberJoined(uint256 indexed poolId, address indexed member, uint256 contribution);
    event PolicyPurchased(uint256 indexed policyId, address indexed holder, uint256 coverageAmount);
    event ClaimSubmitted(uint256 indexed claimId, uint256 indexed policyId, uint256 amount);
    event ClaimProcessed(uint256 indexed claimId, ClaimStatus status, uint256 paidAmount);
    event ParametricTriggerExecuted(uint256 indexed policyId, uint256 triggerValue);
    event PoolFundsDistributed(uint256 indexed poolId, uint256 totalDistributed);

    function initialize(address _oracle, address _aiOracle) public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        oracle = _oracle;
        aiOracle = _aiOracle;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @dev Creates a new insurance pool
     */
    function createPool(
        string memory name,
        string memory description,
        address premiumToken,
        RiskCategory riskCategory,
        uint256 poolUtilization
    ) external onlyOwner returns (uint256) {
        require(poolUtilization <= 100, "Utilization cannot exceed 100%");

        poolCount++;
        uint256 poolId = poolCount;

        Pool storage pool = pools[poolId];
        pool.poolId = poolId;
        pool.name = name;
        pool.description = description;
        pool.premiumToken = premiumToken;
        pool.riskCategory = riskCategory;
        pool.poolUtilization = poolUtilization;
        pool.active = true;

        emit PoolCreated(poolId, name, riskCategory);
        return poolId;
    }

    /**
     * @dev Allows users to join an insurance pool
     */
    function joinPool(uint256 poolId, uint256 contribution) external nonReentrant {
        Pool storage pool = pools[poolId];
        require(pool.active, "Pool not active");
        require(contribution >= minContribution, "Contribution below minimum");

        // Transfer contribution
        IERC20(pool.premiumToken).safeTransferFrom(msg.sender, address(this), contribution);

        // Update member info
        Member storage member = pool.members[msg.sender];
        if (!member.active) {
            pool.memberList.push(msg.sender);
        }

        member.contribution += contribution;
        member.lastContribution = block.timestamp;
        member.active = true;

        pool.totalPremiums += contribution;

        emit MemberJoined(poolId, msg.sender, contribution);
    }

    /**
     * @dev Purchases parametric insurance policy
     */
    function purchaseParametricPolicy(
        uint256 poolId,
        uint256 coverageAmount,
        string memory riskType,
        bytes memory triggerCondition,
        uint256 triggerValue,
        uint256 duration
    ) external nonReentrant returns (uint256) {
        Pool storage pool = pools[poolId];
        require(pool.active, "Pool not active");
        require(pool.members[msg.sender].active, "Not a pool member");

        // Calculate premium based on risk and coverage
        uint256 premium = _calculatePremium(coverageAmount, pool.riskCategory, duration);

        // Check pool capacity
        uint256 maxCoverage = (pool.totalPremiums * pool.poolUtilization) / 100;
        require(pool.totalCoverage + coverageAmount <= maxCoverage, "Exceeds pool capacity");

        // Transfer premium
        IERC20(pool.premiumToken).safeTransferFrom(msg.sender, address(this), premium);

        // Create policy
        policyCount++;
        uint256 policyId = policyCount;

        ParametricPolicy storage policy = policies[policyId];
        policy.policyId = policyId;
        policy.poolId = poolId;
        policy.holder = msg.sender;
        policy.coverageAmount = coverageAmount;
        policy.premiumPaid = premium;
        policy.riskType = riskType;
        policy.triggerCondition = triggerCondition;
        policy.triggerValue = triggerValue;
        policy.isActive = true;
        policy.expiryDate = block.timestamp + duration;

        // Get AI risk assessment
        policy.aiRiskScore = _getAIRiskAssessment(riskType, coverageAmount, triggerValue);

        pool.totalCoverage += coverageAmount;

        emit PolicyPurchased(policyId, msg.sender, coverageAmount);
        return policyId;
    }

    /**
     * @dev Submits a claim for parametric policy
     */
    function submitClaim(
        uint256 policyId,
        uint256 claimedAmount,
        string memory evidence
    ) external returns (uint256) {
        ParametricPolicy storage policy = policies[policyId];
        require(policy.holder == msg.sender, "Not policy holder");
        require(policy.isActive, "Policy not active");
        require(block.timestamp <= policy.expiryDate, "Policy expired");
        require(claimedAmount <= policy.coverageAmount, "Claim exceeds coverage");

        claimCount++;
        uint256 claimId = claimCount;

        Claim storage claim = claims[claimId];
        claim.claimId = claimId;
        claim.policyId = policyId;
        claim.claimant = msg.sender;
        claim.claimedAmount = claimedAmount;
        claim.evidence = evidence;
        claim.status = ClaimStatus.Pending;
        claim.submittedAt = block.timestamp;

        // Get AI confidence score
        claim.aiConfidence = _assessClaimValidity(policyId, evidence);

        emit ClaimSubmitted(claimId, policyId, claimedAmount);
        return claimId;
    }

    /**
     * @dev Approves a claim (called by validators)
     */
    function approveClaim(uint256 claimId) external {
        Claim storage claim = claims[claimId];
        require(claim.status == ClaimStatus.Pending, "Claim not pending");
        require(!claim.approvals[msg.sender], "Already approved");

        // Check if sender is a validator (pool member with sufficient stake)
        Pool storage pool = pools[policies[claim.policyId].poolId];
        require(pool.members[msg.sender].active, "Not a pool member");

        claim.approvals[msg.sender] = true;
        claim.approvalCount++;

        // Auto-approve if threshold reached and AI confidence is high
        if (claim.approvalCount >= claimApprovalThreshold && claim.aiConfidence >= 80) {
            _processClaim(claimId, ClaimStatus.Approved);
        }
    }

    /**
     * @dev Executes parametric trigger (called by oracle)
     */
    function executeParametricTrigger(
        uint256 policyId,
        uint256 triggerValue
    ) external {
        require(msg.sender == oracle, "Only oracle can execute triggers");

        ParametricPolicy storage policy = policies[policyId];
        require(policy.isActive, "Policy not active");

        // Check if trigger condition is met
        bool triggerMet = _evaluateTrigger(policy.triggerCondition, triggerValue, policy.triggerValue);

        if (triggerMet) {
            // Auto-claim full coverage
            uint256 claimId = _createAutomaticClaim(policyId, policy.coverageAmount);
            _processClaim(claimId, ClaimStatus.Approved);

            policy.isActive = false;

            emit ParametricTriggerExecuted(policyId, triggerValue);
        }
    }

    /**
     * @dev Distributes pool funds to members (periodic distribution)
     */
    function distributePoolFunds(uint256 poolId) external {
        Pool storage pool = pools[poolId];
        require(pool.active, "Pool not active");

        uint256 totalDistributable = pool.totalPremiums - pool.lockedFunds;
        require(totalDistributable > 0, "No funds to distribute");

        uint256 totalContributions = pool.totalPremiums;
        uint256 platformFeeAmount = (totalDistributable * premiumFee) / 10000;

        // Distribute to members based on contribution
        for (uint256 i = 0; i < pool.memberList.length; i++) {
            address member = pool.memberList[i];
            Member storage memberInfo = pool.members[member];

            if (memberInfo.active) {
                uint256 memberShare = (totalDistributable * memberInfo.contribution) / totalContributions;
                memberInfo.claimableAmount += memberShare;
            }
        }

        // Collect platform fee
        IERC20(pool.premiumToken).safeTransfer(owner(), platformFeeAmount);

        emit PoolFundsDistributed(poolId, totalDistributable - platformFeeAmount);
    }

    /**
     * @dev Allows members to claim their distributable funds
     */
    function claimMemberFunds(uint256 poolId) external nonReentrant {
        Pool storage pool = pools[poolId];
        Member storage member = pool.members[msg.sender];
        require(member.active, "Not a pool member");
        require(member.claimableAmount > 0, "No funds to claim");

        uint256 amount = member.claimableAmount;
        member.claimableAmount = 0;

        IERC20(pool.premiumToken).safeTransfer(msg.sender, amount);
    }

    // ============ INTERNAL FUNCTIONS ============

    function _calculatePremium(
        uint256 coverageAmount,
        RiskCategory riskCategory,
        uint256 duration
    ) internal pure returns (uint256) {
        // Base premium rate per year
        uint256 baseRate;
        if (riskCategory == RiskCategory.Low) baseRate = 20; // 2%
        else if (riskCategory == RiskCategory.Medium) baseRate = 50; // 5%
        else if (riskCategory == RiskCategory.High) baseRate = 100; // 10%
        else baseRate = 200; // 20% for extreme risk

        // Calculate annual premium
        uint256 annualPremium = (coverageAmount * baseRate) / 10000;

        // Adjust for duration (in seconds)
        uint256 durationYears = duration / 365 days;
        return (annualPremium * durationYears) / 1e18;
    }

    function _getAIRiskAssessment(
        string memory riskType,
        uint256 coverageAmount,
        uint256 triggerValue
    ) internal pure returns (uint256) {
        // Simplified AI risk assessment
        // In a real implementation, this would call an AI oracle
        bytes32 riskHash = keccak256(abi.encodePacked(riskType, coverageAmount, triggerValue));
        return uint256(riskHash) % 100; // 0-99 risk score
    }

    function _assessClaimValidity(uint256 policyId, string memory evidence) internal pure returns (uint256) {
        // Simplified claim assessment
        // In a real implementation, this would use AI to analyze evidence
        bytes32 evidenceHash = keccak256(abi.encodePacked(policyId, evidence));
        return 70 + (uint256(evidenceHash) % 30); // 70-99 confidence score
    }

    function _evaluateTrigger(
        bytes memory triggerCondition,
        uint256 actualValue,
        uint256 thresholdValue
    ) internal pure returns (bool) {
        // Simplified trigger evaluation
        // In a real implementation, this would decode and evaluate complex conditions
        return actualValue >= thresholdValue;
    }

    function _createAutomaticClaim(uint256 policyId, uint256 amount) internal returns (uint256) {
        claimCount++;
        uint256 claimId = claimCount;

        Claim storage claim = claims[claimId];
        claim.claimId = claimId;
        claim.policyId = policyId;
        claim.claimant = policies[policyId].holder;
        claim.claimedAmount = amount;
        claim.evidence = "Automatic parametric trigger";
        claim.aiConfidence = 100; // Full confidence for parametric triggers
        claim.status = ClaimStatus.Pending;
        claim.submittedAt = block.timestamp;

        return claimId;
    }

    function _processClaim(uint256 claimId, ClaimStatus status) internal {
        Claim storage claim = claims[claimId];
        ParametricPolicy storage policy = policies[claim.policyId];
        Pool storage pool = pools[policy.poolId];

        claim.status = status;
        claim.processedAt = block.timestamp;

        if (status == ClaimStatus.Approved) {
            // Pay out claim
            require(pool.totalPremiums >= claim.claimedAmount, "Insufficient pool funds");

            IERC20(pool.premiumToken).safeTransfer(claim.claimant, claim.claimedAmount);
            pool.lockedFunds += claim.claimedAmount;
            policy.claimStatus = ClaimStatus.Paid;
        }

        emit ClaimProcessed(claimId, status, claim.claimedAmount);
    }

    // ============ ADMIN FUNCTIONS ============

    function setOracle(address _oracle) external onlyOwner {
        oracle = _oracle;
    }

    function setAIOracle(address _aiOracle) external onlyOwner {
        aiOracle = _aiOracle;
    }

    function setMinContribution(uint256 _minContribution) external onlyOwner {
        minContribution = _minContribution;
    }

    function setClaimApprovalThreshold(uint256 _threshold) external onlyOwner {
        claimApprovalThreshold = _threshold;
    }

    // ============ VIEW FUNCTIONS ============

    function getPoolInfo(uint256 poolId) external view returns (
        string memory name,
        uint256 totalPremiums,
        uint256 totalCoverage,
        uint256 memberCount,
        bool active
    ) {
        Pool storage pool = pools[poolId];
        return (
            pool.name,
            pool.totalPremiums,
            pool.totalCoverage,
            pool.memberList.length,
            pool.active
        );
    }

    function getMemberInfo(uint256 poolId, address member) external view returns (
        uint256 contribution,
        uint256 coverageAmount,
        uint256 claimableAmount,
        bool active
    ) {
        Member storage memberInfo = pools[poolId].members[member];
        return (
            memberInfo.contribution,
            memberInfo.coverageAmount,
            memberInfo.claimableAmount,
            memberInfo.active
        );
    }

    function getPolicyInfo(uint256 policyId) external view returns (
        address holder,
        uint256 coverageAmount,
        string memory riskType,
        bool isActive,
        uint256 aiRiskScore
    ) {
        ParametricPolicy storage policy = policies[policyId];
        return (
            policy.holder,
            policy.coverageAmount,
            policy.riskType,
            policy.isActive,
            policy.aiRiskScore
        );
    }
}