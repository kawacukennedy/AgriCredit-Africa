// Contract ABIs and addresses for AgriCredit DApp

export const CONTRACT_ADDRESSES = {
  // Replace with actual deployed contract addresses
  IdentityRegistry: '0x0000000000000000000000000000000000000000',
  LoanManager: '0x0000000000000000000000000000000000000000',
  MarketplaceEscrow: '0x0000000000000000000000000000000000000000',
  GovernanceDAO: '0x0000000000000000000000000000000000000000',
  CarbonToken: '0x0000000000000000000000000000000000000000',
  LiquidityPool: '0x0000000000000000000000000000000000000000',
  YieldToken: '0x0000000000000000000000000000000000000000',
  NFTFarming: '0x0000000000000000000000000000000000000000',
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
  "function propose(string _description) external returns (uint256)",
  "function vote(uint256 _proposalId, bool _support) external",
  "function executeProposal(uint256 _proposalId) external",
  "function getProposal(uint256 _proposalId) external view returns (uint256 id, address proposer, string description, uint256 forVotes, uint256 againstVotes, uint256 startTime, uint256 endTime, bool executed)",
];

export const CARBON_TOKEN_ABI = [
  "function mintCarbonTokens(address to, uint256 carbonAmount, string memory verificationProof) external",
  "function burnCarbonTokens(uint256 amount) external",
  "function getCarbonOffset(address user) external view returns (uint256)",
  "function totalCarbonOffset() external view returns (uint256)",
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
  "function mintFarmNFT(address farmer, string memory farmName, string memory location, uint256 size, string memory cropType, uint256 expectedYield, string memory metadataURI) external returns (uint256)",
  "function recordHarvest(uint256 tokenId, uint256 actualYield) external",
  "function getFarmNFT(uint256 tokenId) external view returns (tuple(uint256 id, address farmer, string farmName, string location, uint256 size, string cropType, uint256 expectedYield, uint256 plantingDate, uint256 harvestDate, string metadataURI, bool isActive))",
  "function getFarmerNFTs(address farmer) external view returns (uint256[] memory)",
];