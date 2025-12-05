import { Loan, CarbonCredit, NFT, GovernanceProposal, User } from './types';

export const mockLoans: Loan[] = [
  {
    id: '1',
    farmerId: 'farmer1',
    amount: 2500,
    interestRate: 8.5,
    term: 12,
    status: 'active',
    createdAt: '2024-01-15',
    fundedAt: '2024-01-20',
  },
  {
    id: '2',
    farmerId: 'farmer2',
    amount: 1500,
    interestRate: 9.0,
    term: 6,
    status: 'repaid',
    createdAt: '2024-02-01',
    fundedAt: '2024-02-05',
    repaidAt: '2024-08-05',
  },
];

export const mockCarbonCredits: CarbonCredit[] = [
  {
    id: '1',
    ownerId: 'farmer1',
    amount: 100,
    price: 25.50,
    type: 'Voluntary Carbon Credit',
    location: 'Kenya',
    verified: true,
  },
  {
    id: '2',
    ownerId: 'farmer2',
    amount: 75,
    price: 28.00,
    type: 'Nature-based Credit',
    location: 'Tanzania',
    verified: true,
  },
];

export const mockNFTs: NFT[] = [
  {
    id: '1',
    name: 'Golden Harvest NFT',
    description: 'Exclusive NFT for top yield farmers',
    rarity: 'legendary',
    farmingReward: 500,
    ownerId: 'farmer1',
  },
  {
    id: '2',
    name: 'Carbon Guardian',
    description: 'NFT for carbon sequestration champions',
    rarity: 'epic',
    farmingReward: 300,
  },
];

export const mockProposals: GovernanceProposal[] = [
  {
    id: '1',
    title: 'Increase Carbon Credit Rewards',
    description: 'Proposal to boost rewards for verified carbon sequestration activities by 15%.',
    status: 'active',
    votesFor: 1250,
    votesAgainst: 320,
    endDate: '2025-01-15',
    createdBy: 'user1',
    type: 'Parameter Change',
  },
  {
    id: '2',
    title: 'Add New Crop Types',
    description: 'Include maize and cassava in the AI yield prediction model.',
    status: 'passed',
    votesFor: 2100,
    votesAgainst: 150,
    endDate: '2024-12-20',
    createdBy: 'user2',
    type: 'Feature Addition',
  },
];

export const mockUser: User = {
  id: 'farmer1',
  name: 'John Farmer',
  email: 'john.farmer@example.com',
  walletAddress: '0x1234567890abcdef',
  did: 'did:agricredit:0x1234567890abcdef',
  role: 'farmer',
};

export const mockFarmData = {
  location: 'Nairobi, Kenya',
  size: 5.2,
  crops: ['Maize', 'Beans', 'Tomatoes'],
  yield: 1200,
  carbonFootprint: 2.3,
};

export const mockCreditScore = {
  score: 785,
  factors: {
    repaymentHistory: 95,
    farmSize: 80,
    yieldHistory: 85,
    carbonCredits: 90,
  },
};