// Contract ABIs and addresses for AgriCredit DApp

export const CONTRACT_ADDRESSES = {
  // Mock deployed contract addresses for development
  IdentityRegistry: '0x1234567890123456789012345678901234567890',
  LoanManager: '0x2345678901234567890123456789012345678901',
  MarketplaceEscrow: '0x3456789012345678901234567890123456789012',
  GovernanceDAO: '0x4567890123456789012345678901234567890123',
  CarbonToken: '0x5678901234567890123456789012345678901234',
  LiquidityPool: '0x6789012345678901234567890123456789012345',
  YieldToken: '0x7890123456789012345678901234567890123456',
  NFTFarming: '0x8901234567890123456789012345678901234567',
  AgriCredit: '0x9012345678901234567890123456789012345678',
  // New enhanced contracts
  AIPredictor: '0xabcdef123456789012345678901234567890abcd',
  DynamicNFT: '0xbcdef123456789012345678901234567890abcde',
  CrossChainGovernance: '0xcdef123456789012345678901234567890abcdef',
  AdvancedInsurance: '0xdef123456789012345678901234567890abcdef1',
  YieldVault: '0xef123456789012345678901234567890abcdef12',
  DecentralizedOracle: '0xf123456789012345678901234567890abcdef123',
  ParametricInsurance: '0x123456789012345678901234567890abcdef1234',
};

export const IDENTITY_REGISTRY_ABI = [
  "function createIdentity(string _did, address _user) external",
  "function updateReputation(address _user, uint256 _newScore) external",
  "function getIdentity(address _user) external view returns (tuple(string did, address wallet, uint256 reputationScore, bool isVerified, uint256 createdAt, uint256 lastUpdated))",
  "function isIdentityVerified(address _user) external view returns (bool)",
  "function getReputationScore(address _user) external view returns (uint256)",
];

export const LOAN_MANAGER_ABI = [
  "function createLoan(address _borrower, uint256 _amount, uint256 _interestRate, uint256 _duration) external returns (uint256)",
  "function repayLoan(uint256 _loanId, uint256 _amount) external",
  "function calculateTotalOwed(uint256 _loanId) external view returns (uint256)",
  "function getLoan(uint256 _loanId) external view returns (tuple(uint256 id, address borrower, uint256 amount, uint256 interestRate, uint256 duration, uint256 startTime, uint256 repaidAmount, bool isActive, bool isRepaid))",
  "function getUserLoans(address _user) external view returns (uint256[] memory)",
];

export const MARKETPLACE_ESCROW_ABI = [
  "function createEscrow(address _seller, uint256 _amount, address _token) external returns (uint256)",
  "function fundEscrow(uint256 _escrowId) external",
  "function confirmDelivery(uint256 _escrowId, string memory _proof) external",
  "function completeEscrow(uint256 _escrowId) external",
  "function cancelEscrow(uint256 _escrowId) external",
  "function getEscrow(uint256 _escrowId) external view returns (tuple(uint256 id, address buyer, address seller, uint256 amount, address token, uint8 status, uint256 createdAt, uint256 deliveredAt, string deliveryProof))",
];

export const GOVERNANCE_DAO_ABI = [
  // Basic governance functions
  "function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) external returns (uint256)",
  "function vote(uint256 proposalId, bool support) external",
  "function executeProposal(uint256 proposalId) external",
  "function getProposal(uint256 proposalId) external view returns (tuple(uint256 id, address proposer, uint8 proposalType, string description, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, uint256 startTime, uint256 endTime, uint8 status, bool emergency))",

  // ZK-Rollup functions
  "function castZKVote(tuple(uint256 proposalId, bool support, uint256 weight, bytes32 commitment, tuple(uint256[2] a, uint256[2][2] b, uint256[2] c, uint256[1] input) proof) zkVote) external",

  // Time-weighted governance
  "function lockTokens(uint256 amount, uint256 duration) external",
  "function unlockTokens(uint256 lockIndex) external",
  "function getTimeWeightedVotes(address account) external view returns (uint256)",
  "function getTokenLocks(address account) external view returns (tuple(uint256 amount, uint256 lockTime, uint256 lockDuration, bool active)[])",

  // Delegation functions
  "function delegate(address delegatee) external",
  "function delegateWithWeight(address delegatee, uint256 weight) external",
  "function getVotes(address account) external view returns (uint256)",

  // Gasless voting
  "function castGaslessVote(tuple(uint256 proposalId, bool support, uint256 weight, uint256 nonce, uint256 deadline, bytes signature) voteData) external",
];

export const CARBON_TOKEN_ABI = [
  // ERC20 functions
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",

  // Carbon specific functions
  "function mintCarbonCredit(address farmer, uint256 co2Amount, string methodology, string location, uint256 aiConfidence, string aiProof) external returns (uint256)",
  "function retireCarbonCredits(uint256 creditId) external",
  "function burnCarbonTokens(uint256 amount) external",

  // Staking functions
  "function stakeTokens(uint256 amount) external",
  "function unstakeTokens(uint256 amount) external",
  "function claimRewards() external",
  "function getStakingInfo(address user) external view returns (uint256 staked, uint256 rewards, uint256 totalAccumulated)",

  // Bridge validator functions
  "function addBridgeValidator(address validator) external payable",
  "function removeBridgeValidator() external",
  "function approveBridgeRequest(uint256 bridgeId) external",
  "function initiateBridge(uint256 amount, uint256 targetChainId, address targetContract) external returns (uint256)",
  "function completeBridge(uint256 bridgeId, bytes proof) external",
  "function getBridgeValidators() external view returns (address[])",
  "function getBridgeRequestApprovals(uint256 bridgeId) external view returns (uint256 approvals, uint256 required)",

  // Soulbound credits
  "function getSoulboundCredits(address owner) external view returns (uint256[])",
  "function getSoulboundCreditCarbon(uint256 tokenId) external view returns (uint256)",
];

export const LIQUIDITY_POOL_ABI = [
  "function createPool(address token, uint256 interestRate) external",
  "function addLiquidity(address token, uint256 amount) external",
  "function removeLiquidity(address token, uint256 amount) external",
  "function issueLoan(address borrower, address token, uint256 amount) external",
  "function repayLoan(address borrower, address token, uint256 amount) external",
  "function getPoolInfo(address token) external view returns (uint256 totalLiquidity, uint256 totalBorrowed, uint256 availableLiquidity, uint256 interestRate, bool active)",
];

export const YIELD_TOKEN_ABI = [
  "function deposit(uint256 amount) external",
  "function withdraw(uint256 amount) external",
  "function claimYield() external",
  "function calculatePendingYield(address user) external view returns (uint256)",
  "function getPosition(address user) external view returns (uint256 amount, uint256 depositTime, uint256 lastClaimTime, uint256 pendingYield, uint256 totalAccumulated)",
];

export const NFT_FARMING_ABI = [
  // Basic NFT functions
  "function mintFarmNFT(address farmer, string farmName, string location, uint256 size, string cropType, uint256 expectedYield, string metadataURI, string initialSupplyChainData) external returns (uint256)",
  "function recordHarvest(uint256 tokenId, uint256 actualYield, string harvestProof) external",
  "function getFarmNFT(uint256 tokenId) external view returns (tuple(uint256 id, address farmer, string farmName, string location, uint256 size, string cropType, uint256 expectedYield, uint256 plantingDate, uint256 harvestDate, string metadataURI, bool isActive, uint256 qualityScore, string supplyChainData, uint256[] batchIds))",
  "function getFarmerNFTs(address farmer) external view returns (uint256[])",

  // Enhanced staking functions
  "function stakeNFT(uint256 tokenId) external",
  "function unstakeNFT(uint256 tokenId) external",
  "function claimStakingRewards() external",
  "function getStakingInfo(address staker) external view returns (uint256 stakedCount, uint256 pendingRewards, uint256 totalAccumulated)",

  // Bridge validator functions
  "function addBridgeValidator(address validator) external payable",
  "function removeBridgeValidator() external",
  "function initiateCrossChainTransfer(uint256 tokenId, address to, string destinationChain) external",
  "function approveCrossChainTransfer(uint256 tokenId, address recipient) external",
  "function getCrossChainValidators(uint256 tokenId) external view returns (address[])",

  // Fractional ownership
  "function fractionalizeNFT(uint256 tokenId, uint256 totalShares, string shareName, string shareSymbol) external",
  "function getFractionalToken(uint256 tokenId) external view returns (address)",
];

export const AGRI_CREDIT_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function name() external view returns (string memory)",
  "function symbol() external view returns (string memory)",
  "function decimals() external view returns (uint8)",
];

export const AI_PREDICTOR_ABI = [
  "function predictCreditScore(address user, bytes userData) external payable returns (uint256)",
  "function predictYield(uint256 farmSize, string cropType, string location, uint256 plantingDate) external payable returns (uint256)",
  "function assessRisk(address user, string riskType) external returns (uint256)",
  "function getPrediction(uint256 predictionId) external view returns (tuple(uint256 id, address user, string dataType, bytes inputData, int256 prediction, uint256 confidence, uint256 timestamp, address modelUsed, bool verified))",
  "function getRiskProfile(address user) external view returns (uint256 creditScore, uint256 riskLevel, uint256 lastAssessment, uint256 predictionCount)",
  "function getRiskFactor(address user, string factor) external view returns (int256)",
];

export const DYNAMIC_NFT_ABI = [
  "function mintDynamicNFT(address to, string baseURI, uint256 initialYield, string cropType) external returns (uint256)",
  "function updateNFTAttributes(uint256 tokenId) external",
  "function evolveNFT(uint256 tokenId) external",
  "function recordYield(uint256 tokenId, uint256 actualYield) external",
  "function getNFTAttributes(uint256 tokenId) external view returns (uint256 level, uint256 experience, uint256 health, uint256 yield, uint256 rarity, string currentStage, uint256 lastUpdate)",
  "function getNFTTrait(uint256 tokenId, string traitName) external view returns (uint256)",
  "function canEvolve(uint256 tokenId) external view returns (bool)",
];

export const CROSS_CHAIN_GOVERNANCE_ABI = [
  "function createCrossChainProposal(string description, bytes callData, address targetContract, uint256 value) external returns (uint256)",
  "function submitCrossChainVote(tuple(uint256 proposalId, uint256 sourceChainId, uint256 targetChainId, address voter, uint256 votes, bytes signature, uint256 timestamp, bytes32 messageHash) message) external",
  "function executeCrossChainProposal(uint256 proposalId) external",
  "function getCrossChainProposal(uint256 proposalId) external view returns (uint256 id, uint256 originChainId, string description, uint256 totalVotes, uint256 startTime, uint256 endTime, uint8 status, bool executed)",
  "function addChain(uint256 chainId, address governanceContract, uint256 votingPower) external",
  "function addBridgeValidator(address validator, uint256[] chainIds) external",
];

export const ADVANCED_INSURANCE_ABI = [
  "function createCatastropheBond(string catastropheType, string region, uint256 coverageAmount, uint256 premium, uint256 triggerThreshold, uint256 maturityDays) external returns (uint256)",
  "function investInCatastropheBond(uint256 bondId, uint256 amount) external payable",
  "function triggerCatastropheBond(uint256 bondId) external",
  "function createParametricOption(string underlyingAsset, uint256 strikePrice, uint256 premium, uint256 notionalAmount, bool isCall, uint256 expirationDays) external payable returns (uint256)",
  "function exerciseParametricOption(uint256 optionId) external",
  "function contributeToPool(uint256 poolId, uint256 amount) external payable",
  "function getCatastropheBond(uint256 bondId) external view returns (uint256 id, string catastropheType, string region, uint256 coverageAmount, uint256 totalInvested, bool active, bool triggered, uint256 maturityDate)",
  "function getParametricOption(uint256 optionId) external view returns (uint256 id, address buyer, string underlyingAsset, uint256 strikePrice, uint256 notionalAmount, bool isCall, uint256 expirationDate, bool exercised, uint256 payoutAmount)",
];

export const YIELD_VAULT_ABI = [
  "function createStrategy(string name, string description, uint256[] allocationPercentages, address[] protocols, uint256 minDeposit, uint256 lockPeriod, uint256 apy) external returns (uint256)",
  "function deposit(uint256 strategyId, uint256 amount, bool autoCompound) external",
  "function withdraw(uint256 strategyId, uint256 shares) external",
  "function claimRewards(uint256 strategyId) external",
  "function autoCompound(uint256 strategyId) external",
  "function updateAutoCompoundSettings(uint256 minRewardThreshold, uint256 maxSlippage, uint256 compoundFrequency, bool reinvestRewards) external",
  "function getStrategyInfo(uint256 strategyId) external view returns (string name, string description, uint256 totalDeposits, uint256 totalShares, uint256 apy, bool active)",
  "function getUserPosition(uint256 strategyId, address user) external view returns (uint256 shares, uint256 depositAmount, uint256 depositTime, uint256 lockExpiry, uint256 pendingRewards, bool autoCompound)",
];

export const DECENTRALIZED_ORACLE_ABI = [
  "function registerOracleNode() external payable",
  "function submitData(uint8 dataType, string location, string parameters, uint256 value, uint256 confidence) external returns (bytes32)",
  "function getLatestData(uint8 dataType, string location, string parameters) external view returns (uint256 value, uint256 confidence, uint256 timestamp)",
  "function getOracleNode(address node) external view returns (tuple(address nodeAddress, uint256 reputation, uint256 totalSubmissions, uint256 successfulSubmissions, bool active, uint256 stakeAmount, uint256 lastSubmissionTime))",
  "function getNodeReputation(address node) external view returns (uint256)",
];

export const PARAMETRIC_INSURANCE_ABI = [
  "function createPolicy(string riskType, uint256 coverageAmount, uint256 premium, uint256 triggerValue, uint256 expiryDate) external payable returns (uint256)",
  "function triggerPayout(uint256 policyId) external",
  "function claimPayout(uint256 policyId) external",
  "function getPolicy(uint256 policyId) external view returns (tuple(uint256 id, address holder, string riskType, uint256 coverageAmount, uint256 premium, uint256 triggerValue, uint256 expiryDate, bool active, bool triggered, uint256 payoutAmount))",
];