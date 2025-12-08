import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Loan {
  id: string;
  borrowerId: string;
  borrowerWallet: string;
  farmId: string;
  principalCents: number;
  termDays: number;
  interestRate: number;
  aiScore: number;
  aiReportCid?: string;
  status: 'requested' | 'funded' | 'disbursed' | 'repaid' | 'defaulted' | 'liquidated';
  createdAt: string;
  updatedAt: string;
  fundedAmount?: number;
  repaymentSchedule?: any[];
  nftTokenId?: string;
}

interface LoansState {
  requests: { [id: string]: Loan };
  marketplace: {
    loans: string[];
    filters: {
      region?: string;
      crop?: string;
      scoreRange?: [number, number];
      amountRange?: [number, number];
    };
    pagination: {
      page: number;
      perPage: number;
      total: number;
    };
    isLoading: boolean;
  };
  userLoans: string[];
  fundedLoans: string[];
  selectedLoan: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: LoansState = {
  requests: {},
  marketplace: {
    loans: [],
    filters: {},
    pagination: {
      page: 1,
      perPage: 20,
      total: 0,
    },
    isLoading: false,
  },
  userLoans: [],
  fundedLoans: [],
  selectedLoan: null,
  isLoading: false,
  error: null,
};

const loansSlice = createSlice({
  name: 'loans',
  initialState,
  reducers: {
    setLoanFilters: (state, action: PayloadAction<Partial<LoansState['marketplace']['filters']>>) => {
      state.marketplace.filters = { ...state.marketplace.filters, ...action.payload };
    },
    setMarketplaceLoans: (state, action: PayloadAction<{ loans: Loan[]; total: number; page: number }>) => {
      const loanIds = action.payload.loans.map(loan => loan.id);
      action.payload.loans.forEach(loan => {
        state.requests[loan.id] = loan;
      });
      state.marketplace.loans = loanIds;
      state.marketplace.pagination.total = action.payload.total;
      state.marketplace.pagination.page = action.payload.page;
      state.marketplace.isLoading = false;
    },
    setMarketplaceLoading: (state, action: PayloadAction<boolean>) => {
      state.marketplace.isLoading = action.payload;
    },
    setUserLoans: (state, action: PayloadAction<string[]>) => {
      state.userLoans = action.payload;
    },
    setFundedLoans: (state, action: PayloadAction<string[]>) => {
      state.fundedLoans = action.payload;
    },
    selectLoan: (state, action: PayloadAction<string | null>) => {
      state.selectedLoan = action.payload;
    },
    updateLoanStatus: (state, action: PayloadAction<{ loanId: string; status: Loan['status'] }>) => {
      if (state.requests[action.payload.loanId]) {
        state.requests[action.payload.loanId].status = action.payload.status;
        state.requests[action.payload.loanId].updatedAt = new Date().toISOString();
      }
    },
    addLoan: (state, action: PayloadAction<Loan>) => {
      state.requests[action.payload.id] = action.payload;
    },
    updateLoan: (state, action: PayloadAction<{ id: string; updates: Partial<Loan> }>) => {
      if (state.requests[action.payload.id]) {
        state.requests[action.payload.id] = {
          ...state.requests[action.payload.id],
          ...action.payload.updates,
          updatedAt: new Date().toISOString(),
        };
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
  setLoanFilters,
  setMarketplaceLoans,
  setMarketplaceLoading,
  setUserLoans,
  setFundedLoans,
  selectLoan,
  updateLoanStatus,
  addLoan,
  updateLoan,
  setLoading,
  setError,
  clearError,
} = loansSlice.actions;

export default loansSlice.reducer;