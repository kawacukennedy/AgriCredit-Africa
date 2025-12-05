export interface User {
  id: string;
  name: string;
  email: string;
  walletAddress: string;
  did?: string;
  role: 'farmer' | 'lender' | 'admin';
}

export interface Loan {
  id: string;
  farmerId: string;
  amount: number;
  interestRate: number;
  term: number;
  status: 'pending' | 'funded' | 'active' | 'repaid' | 'defaulted';
  createdAt: string;
  fundedAt?: string;
  repaidAt?: string;
}

export interface CarbonCredit {
  id: string;
  ownerId: string;
  amount: number;
  price: number;
  type: string;
  location: string;
  verified: boolean;
}

export interface NFT {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  farmingReward: number;
  ownerId?: string;
}

export interface GovernanceProposal {
  id: string;
  title: string;
  description: string;
  type: string;
  status: 'pending' | 'active' | 'passed' | 'rejected';
  votesFor: number;
  votesAgainst: number;
  endDate: string;
  createdBy: string;
}

export interface FarmData {
  location: string;
  size: number;
  crops: string[];
  yield: number;
  carbonFootprint: number;
}

export interface CreditScore {
  score: number;
  factors: {
    repaymentHistory: number;
    farmSize: number;
    yieldHistory: number;
    carbonCredits: number;
  };
}

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}