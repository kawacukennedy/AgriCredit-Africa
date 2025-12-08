import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface YieldPool {
  id: string;
  name: string;
  type: 'liquidity' | 'staking' | 'farming';
  tokenA: string;
  tokenB?: string;
  apr: number;
  tvl: number;
  userBalance: number;
  userRewards: number;
  rewardsToken: string;
  isActive: boolean;
  lockPeriod?: number;
  minimumStake?: number;
  createdAt: string;
  updatedAt: string;
}

interface YieldPosition {
  id: string;
  poolId: string;
  userId: string;
  amount: number;
  rewards: number;
  startTime: string;
  endTime?: string;
  status: 'active' | 'unstaked' | 'locked';
  lockEndTime?: string;
}

interface YieldState {
  pools: { [id: string]: YieldPool };
  userPositions: { [poolId: string]: YieldPosition };
  activePools: string[];
  userPools: string[];
  totalValueLocked: number;
  totalRewards: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: YieldState = {
  pools: {},
  userPositions: {},
  activePools: [],
  userPools: [],
  totalValueLocked: 0,
  totalRewards: 0,
  isLoading: false,
  error: null,
};

const yieldSlice = createSlice({
  name: 'yield',
  initialState,
  reducers: {
    setPools: (state, action: PayloadAction<YieldPool[]>) => {
      const poolsMap: { [id: string]: YieldPool } = {};
      const activeIds: string[] = [];
      action.payload.forEach(pool => {
        poolsMap[pool.id] = pool;
        if (pool.isActive) {
          activeIds.push(pool.id);
        }
      });
      state.pools = { ...state.pools, ...poolsMap };
      state.activePools = activeIds;
    },
    setUserPositions: (state, action: PayloadAction<{ [poolId: string]: YieldPosition }>) => {
      state.userPositions = { ...state.userPositions, ...action.payload };
      // Update user pools list
      state.userPools = Object.keys(action.payload);
    },
    addPool: (state, action: PayloadAction<YieldPool>) => {
      state.pools[action.payload.id] = action.payload;
      if (action.payload.isActive) {
        state.activePools.push(action.payload.id);
      }
    },
    updatePool: (state, action: PayloadAction<{ id: string; updates: Partial<YieldPool> }>) => {
      if (state.pools[action.payload.id]) {
        const updated = {
          ...state.pools[action.payload.id],
          ...action.payload.updates,
          updatedAt: new Date().toISOString(),
        };
        state.pools[action.payload.id] = updated;

        // Update active pools list
        if (updated.isActive && !state.activePools.includes(action.payload.id)) {
          state.activePools.push(action.payload.id);
        } else if (!updated.isActive && state.activePools.includes(action.payload.id)) {
          state.activePools = state.activePools.filter(id => id !== action.payload.id);
        }
      }
    },
    stakeInPool: (state, action: PayloadAction<{ poolId: string; amount: number; lockPeriod?: number }>) => {
      if (state.pools[action.payload.poolId]) {
        const position: YieldPosition = {
          id: `${action.payload.poolId}-${Date.now()}`,
          poolId: action.payload.poolId,
          userId: '', // Would be set from auth state
          amount: action.payload.amount,
          rewards: 0,
          startTime: new Date().toISOString(),
          status: action.payload.lockPeriod ? 'locked' : 'active',
          lockEndTime: action.payload.lockPeriod
            ? new Date(Date.now() + action.payload.lockPeriod * 24 * 60 * 60 * 1000).toISOString()
            : undefined,
        };
        state.userPositions[action.payload.poolId] = position;
        if (!state.userPools.includes(action.payload.poolId)) {
          state.userPools.push(action.payload.poolId);
        }
      }
    },
    unstakeFromPool: (state, action: PayloadAction<string>) => {
      if (state.userPositions[action.payload]) {
        state.userPositions[action.payload].status = 'unstaked';
        state.userPositions[action.payload].endTime = new Date().toISOString();
      }
    },
    claimRewards: (state, action: PayloadAction<string>) => {
      if (state.userPositions[action.payload]) {
        // Reset rewards after claiming
        state.userPositions[action.payload].rewards = 0;
      }
    },
    updatePoolStats: (state, action: PayloadAction<{ poolId: string; tvl: number; apr: number }>) => {
      if (state.pools[action.payload.poolId]) {
        state.pools[action.payload.poolId].tvl = action.payload.tvl;
        state.pools[action.payload.poolId].apr = action.payload.apr;
        state.pools[action.payload.poolId].updatedAt = new Date().toISOString();
      }
    },
    updateUserPosition: (state, action: PayloadAction<{ poolId: string; rewards: number; balance: number }>) => {
      if (state.userPositions[action.payload.poolId]) {
        state.userPositions[action.payload.poolId].rewards = action.payload.rewards;
        state.pools[action.payload.poolId].userBalance = action.payload.balance;
      }
    },
    setTotalValueLocked: (state, action: PayloadAction<number>) => {
      state.totalValueLocked = action.payload;
    },
    setTotalRewards: (state, action: PayloadAction<number>) => {
      state.totalRewards = action.payload;
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
  setPools,
  setUserPositions,
  addPool,
  updatePool,
  stakeInPool,
  unstakeFromPool,
  claimRewards,
  updatePoolStats,
  updateUserPosition,
  setTotalValueLocked,
  setTotalRewards,
  setLoading,
  setError,
  clearError,
} = yieldSlice.actions;

export default yieldSlice.reducer;