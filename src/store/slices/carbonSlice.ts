import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CarbonCredit {
  id: string;
  farmId: string;
  periodStart: string;
  periodEnd: string;
  tonnes: number;
  tokenId?: string;
  mintedTx?: string;
  status: 'pending' | 'minted' | 'listed' | 'sold' | 'retired';
  pricePerTonne?: number;
  createdAt: string;
  updatedAt: string;
}

interface CarbonState {
  credits: { [id: string]: CarbonCredit };
  userCredits: string[];
  marketplace: {
    credits: string[];
    filters: {
      region?: string;
      priceRange?: [number, number];
      vintage?: string;
    };
    pagination: {
      page: number;
      perPage: number;
      total: number;
    };
    isLoading: boolean;
  };
  balance: {
    totalTonnes: number;
    availableTonnes: number;
    retiredTonnes: number;
    value: number;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: CarbonState = {
  credits: {},
  userCredits: [],
  marketplace: {
    credits: [],
    filters: {},
    pagination: {
      page: 1,
      perPage: 20,
      total: 0,
    },
    isLoading: false,
  },
  balance: {
    totalTonnes: 0,
    availableTonnes: 0,
    retiredTonnes: 0,
    value: 0,
  },
  isLoading: false,
  error: null,
};

const carbonSlice = createSlice({
  name: 'carbon',
  initialState,
  reducers: {
    setUserCredits: (state, action: PayloadAction<CarbonCredit[]>) => {
      const creditsMap: { [id: string]: CarbonCredit } = {};
      const creditIds: string[] = [];
      action.payload.forEach(credit => {
        creditsMap[credit.id] = credit;
        creditIds.push(credit.id);
      });
      // Merge with existing credits
      state.credits = { ...state.credits, ...creditsMap };
      state.userCredits = creditIds;
    },
    setMarketplaceCredits: (state, action: PayloadAction<{ credits: CarbonCredit[]; total: number; page: number }>) => {
      const creditIds = action.payload.credits.map(credit => credit.id);
      action.payload.credits.forEach(credit => {
        state.credits[credit.id] = credit;
      });
      state.marketplace.credits = creditIds;
      state.marketplace.pagination.total = action.payload.total;
      state.marketplace.pagination.page = action.payload.page;
      state.marketplace.isLoading = false;
    },
    setMarketplaceLoading: (state, action: PayloadAction<boolean>) => {
      state.marketplace.isLoading = action.payload;
    },
    setCarbonFilters: (state, action: PayloadAction<Partial<CarbonState['marketplace']['filters']>>) => {
      state.marketplace.filters = { ...state.marketplace.filters, ...action.payload };
    },
    updateCarbonBalance: (state, action: PayloadAction<Partial<CarbonState['balance']>>) => {
      state.balance = { ...state.balance, ...action.payload };
    },
    addCarbonCredit: (state, action: PayloadAction<CarbonCredit>) => {
      state.credits[action.payload.id] = action.payload;
      if (!state.userCredits.includes(action.payload.id)) {
        state.userCredits.push(action.payload.id);
      }
    },
    updateCarbonCredit: (state, action: PayloadAction<{ id: string; updates: Partial<CarbonCredit> }>) => {
      if (state.credits[action.payload.id]) {
        state.credits[action.payload.id] = {
          ...state.credits[action.payload.id],
          ...action.payload.updates,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    retireCarbonCredit: (state, action: PayloadAction<string>) => {
      if (state.credits[action.payload]) {
        state.credits[action.payload].status = 'retired';
        state.credits[action.payload].updatedAt = new Date().toISOString();
        // Update balance
        const tonnes = state.credits[action.payload].tonnes;
        state.balance.retiredTonnes += tonnes;
        state.balance.availableTonnes -= tonnes;
      }
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
  setUserCredits,
  setMarketplaceCredits,
  setMarketplaceLoading,
  setCarbonFilters,
  updateCarbonBalance,
  addCarbonCredit,
  updateCarbonCredit,
  retireCarbonCredit,
  setLoading,
  setError,
  clearError,
} = carbonSlice.actions;

export default carbonSlice.reducer;