import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface MarketplaceListing {
  id: string;
  sellerId: string;
  type: 'produce' | 'equipment' | 'carbon' | 'nft' | 'loan';
  title: string;
  description: string;
  priceCents: number;
  currency: string;
  quantity?: number;
  unit?: string;
  images?: string[];
  location?: {
    latitude: number;
    longitude: number;
    address: string;
    region: string;
  };
  metadata: { [key: string]: any };
  status: 'active' | 'sold' | 'cancelled' | 'expired';
  createdAt: string;
  updatedAt: string;
}

interface MarketplaceState {
  listings: { [id: string]: MarketplaceListing };
  filteredListings: string[];
  userListings: string[];
  filters: {
    type?: string;
    category?: string;
    priceRange?: [number, number];
    location?: string;
    searchQuery?: string;
  };
  pagination: {
    page: number;
    perPage: number;
    total: number;
  };
  sortBy: 'newest' | 'price_low' | 'price_high' | 'relevance';
  isLoading: boolean;
  error: string | null;
}

const initialState: MarketplaceState = {
  listings: {},
  filteredListings: [],
  userListings: [],
  filters: {},
  pagination: {
    page: 1,
    perPage: 20,
    total: 0,
  },
  sortBy: 'newest',
  isLoading: false,
  error: null,
};

const marketplaceSlice = createSlice({
  name: 'marketplace',
  initialState,
  reducers: {
    setListings: (state, action: PayloadAction<{ listings: MarketplaceListing[]; total: number; page: number }>) => {
      const listingsMap: { [id: string]: MarketplaceListing } = {};
      const listingIds: string[] = [];
      action.payload.listings.forEach(listing => {
        listingsMap[listing.id] = listing;
        listingIds.push(listing.id);
      });
      // Merge with existing listings
      state.listings = { ...state.listings, ...listingsMap };
      state.filteredListings = listingIds;
      state.pagination.total = action.payload.total;
      state.pagination.page = action.payload.page;
      state.isLoading = false;
    },
    setUserListings: (state, action: PayloadAction<MarketplaceListing[]>) => {
      const listingIds: string[] = [];
      action.payload.forEach(listing => {
        state.listings[listing.id] = listing;
        listingIds.push(listing.id);
      });
      state.userListings = listingIds;
    },
    setFilters: (state, action: PayloadAction<Partial<MarketplaceState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setSortBy: (state, action: PayloadAction<MarketplaceState['sortBy']>) => {
      state.sortBy = action.payload;
    },
    setPagination: (state, action: PayloadAction<Partial<MarketplaceState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    addListing: (state, action: PayloadAction<MarketplaceListing>) => {
      state.listings[action.payload.id] = action.payload;
      state.userListings.push(action.payload.id);
    },
    updateListing: (state, action: PayloadAction<{ id: string; updates: Partial<MarketplaceListing> }>) => {
      if (state.listings[action.payload.id]) {
        state.listings[action.payload.id] = {
          ...state.listings[action.payload.id],
          ...action.payload.updates,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    removeListing: (state, action: PayloadAction<string>) => {
      delete state.listings[action.payload];
      state.filteredListings = state.filteredListings.filter(id => id !== action.payload);
      state.userListings = state.userListings.filter(id => id !== action.payload);
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
  setListings,
  setUserListings,
  setFilters,
  clearFilters,
  setSortBy,
  setPagination,
  addListing,
  updateListing,
  removeListing,
  setLoading,
  setError,
  clearError,
} = marketplaceSlice.actions;

export default marketplaceSlice.reducer;