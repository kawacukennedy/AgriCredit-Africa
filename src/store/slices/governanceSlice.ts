import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  type: 'protocol' | 'treasury' | 'partnership' | 'feature';
  status: 'draft' | 'active' | 'passed' | 'failed' | 'executed';
  startTime: string;
  endTime: string;
  votes: {
    for: number;
    against: number;
    abstain: number;
  };
  userVote?: 'for' | 'against' | 'abstain';
  quorum: number;
  threshold: number;
  createdAt: string;
  updatedAt: string;
}

interface GovernanceState {
  proposals: { [id: string]: Proposal };
  activeProposals: string[];
  userProposals: string[];
  treasury: {
    balance: number;
    allocations: Array<{
      id: string;
      amount: number;
      recipient: string;
      purpose: string;
      status: 'pending' | 'approved' | 'executed';
    }>;
  };
  userVotingPower: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: GovernanceState = {
  proposals: {},
  activeProposals: [],
  userProposals: [],
  treasury: {
    balance: 0,
    allocations: [],
  },
  userVotingPower: 0,
  isLoading: false,
  error: null,
};

const governanceSlice = createSlice({
  name: 'governance',
  initialState,
  reducers: {
    setProposals: (state, action: PayloadAction<Proposal[]>) => {
      const proposalsMap: { [id: string]: Proposal } = {};
      const activeIds: string[] = [];
      action.payload.forEach(proposal => {
        proposalsMap[proposal.id] = proposal;
        if (proposal.status === 'active') {
          activeIds.push(proposal.id);
        }
      });
      state.proposals = { ...state.proposals, ...proposalsMap };
      state.activeProposals = activeIds;
    },
    setUserProposals: (state, action: PayloadAction<string[]>) => {
      state.userProposals = action.payload;
    },
    addProposal: (state, action: PayloadAction<Proposal>) => {
      state.proposals[action.payload.id] = action.payload;
      if (action.payload.status === 'active') {
        state.activeProposals.push(action.payload.id);
      }
    },
    updateProposal: (state, action: PayloadAction<{ id: string; updates: Partial<Proposal> }>) => {
      if (state.proposals[action.payload.id]) {
        const updated = {
          ...state.proposals[action.payload.id],
          ...action.payload.updates,
          updatedAt: new Date().toISOString(),
        };
        state.proposals[action.payload.id] = updated;

        // Update active proposals list
        if (updated.status === 'active' && !state.activeProposals.includes(action.payload.id)) {
          state.activeProposals.push(action.payload.id);
        } else if (updated.status !== 'active' && state.activeProposals.includes(action.payload.id)) {
          state.activeProposals = state.activeProposals.filter(id => id !== action.payload.id);
        }
      }
    },
    castVote: (state, action: PayloadAction<{ proposalId: string; vote: 'for' | 'against' | 'abstain' }>) => {
      if (state.proposals[action.payload.proposalId]) {
        state.proposals[action.payload.proposalId].userVote = action.payload.vote;
        // Update vote counts (simplified - in real app this would come from blockchain)
        state.proposals[action.payload.proposalId].votes[action.payload.vote]++;
      }
    },
    setTreasuryBalance: (state, action: PayloadAction<number>) => {
      state.treasury.balance = action.payload;
    },
    setTreasuryAllocations: (state, action: PayloadAction<GovernanceState['treasury']['allocations']>) => {
      state.treasury.allocations = action.payload;
    },
    addTreasuryAllocation: (state, action: PayloadAction<GovernanceState['treasury']['allocations'][0]>) => {
      state.treasury.allocations.push(action.payload);
    },
    updateTreasuryAllocation: (state, action: PayloadAction<{ id: string; updates: Partial<GovernanceState['treasury']['allocations'][0]> }>) => {
      const index = state.treasury.allocations.findIndex(alloc => alloc.id === action.payload.id);
      if (index !== -1) {
        state.treasury.allocations[index] = {
          ...state.treasury.allocations[index],
          ...action.payload.updates,
        };
      }
    },
    setUserVotingPower: (state, action: PayloadAction<number>) => {
      state.userVotingPower = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setProposals,
  setUserProposals,
  addProposal,
  updateProposal,
  castVote,
  setTreasuryBalance,
  setTreasuryAllocations,
  addTreasuryAllocation,
  updateTreasuryAllocation,
  setUserVotingPower,
  setLoading,
  setError,
  clearError,
} = governanceSlice.actions;

export default governanceSlice.reducer;