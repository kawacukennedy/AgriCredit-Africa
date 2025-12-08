import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NFT {
  id: string;
  tokenId: string;
  contractAddress: string;
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  type: 'farm' | 'yield' | 'carbon' | 'equipment' | 'loan';
  owner: string;
  creator: string;
  price?: number;
  currency?: string;
  isListed: boolean;
  isLeased: boolean;
  leaseTerms?: {
    duration: number;
    price: number;
    lessee?: string;
  };
  farmData?: {
    farmId: string;
    location: {
      latitude: number;
      longitude: number;
    };
    landSize: number;
    cropType: string;
  };
  yieldData?: {
    expectedYield: number;
    harvestDate: string;
    quality: string;
  };
  carbonData?: {
    tonnes: number;
    vintage: string;
    project: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface NFTState {
  nfts: { [id: string]: NFT };
  userNFTs: string[];
  marketplace: {
    nfts: string[];
    filters: {
      type?: string;
      priceRange?: [number, number];
      rarity?: string;
    };
    pagination: {
      page: number;
      perPage: number;
      total: number;
    };
    isLoading: boolean;
  };
  selectedNFT: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: NFTState = {
  nfts: {},
  userNFTs: [],
  marketplace: {
    nfts: [],
    filters: {},
    pagination: {
      page: 1,
      perPage: 20,
      total: 0,
    },
    isLoading: false,
  },
  selectedNFT: null,
  isLoading: false,
  error: null,
};

const nftSlice = createSlice({
  name: 'nft',
  initialState,
  reducers: {
    setUserNFTs: (state, action: PayloadAction<NFT[]>) => {
      const nftsMap: { [id: string]: NFT } = {};
      const nftIds: string[] = [];
      action.payload.forEach(nft => {
        nftsMap[nft.id] = nft;
        nftIds.push(nft.id);
      });
      // Merge with existing NFTs
      state.nfts = { ...state.nfts, ...nftsMap };
      state.userNFTs = nftIds;
    },
    setMarketplaceNFTs: (state, action: PayloadAction<{ nfts: NFT[]; total: number; page: number }>) => {
      const nftIds = action.payload.nfts.map(nft => nft.id);
      action.payload.nfts.forEach(nft => {
        state.nfts[nft.id] = nft;
      });
      state.marketplace.nfts = nftIds;
      state.marketplace.pagination.total = action.payload.total;
      state.marketplace.pagination.page = action.payload.page;
      state.marketplace.isLoading = false;
    },
    setMarketplaceLoading: (state, action: PayloadAction<boolean>) => {
      state.marketplace.isLoading = action.payload;
    },
    setNFTFilters: (state, action: PayloadAction<Partial<NFTState['marketplace']['filters']>>) => {
      state.marketplace.filters = { ...state.marketplace.filters, ...action.payload };
    },
    selectNFT: (state, action: PayloadAction<string | null>) => {
      state.selectedNFT = action.payload;
    },
    addNFT: (state, action: PayloadAction<NFT>) => {
      state.nfts[action.payload.id] = action.payload;
      if (!state.userNFTs.includes(action.payload.id)) {
        state.userNFTs.push(action.payload.id);
      }
    },
    updateNFT: (state, action: PayloadAction<{ id: string; updates: Partial<NFT> }>) => {
      if (state.nfts[action.payload.id]) {
        state.nfts[action.payload.id] = {
          ...state.nfts[action.payload.id],
          ...action.payload.updates,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    removeNFT: (state, action: PayloadAction<string>) => {
      delete state.nfts[action.payload];
      state.userNFTs = state.userNFTs.filter(id => id !== action.payload);
      state.marketplace.nfts = state.marketplace.nfts.filter(id => id !== action.payload);
      if (state.selectedNFT === action.payload) {
        state.selectedNFT = null;
      }
    },
    listNFT: (state, action: PayloadAction<{ id: string; price: number; currency: string }>) => {
      if (state.nfts[action.payload.id]) {
        state.nfts[action.payload.id].isListed = true;
        state.nfts[action.payload.id].price = action.payload.price;
        state.nfts[action.payload.id].currency = action.payload.currency;
        state.nfts[action.payload.id].updatedAt = new Date().toISOString();
      }
    },
    unlistNFT: (state, action: PayloadAction<string>) => {
      if (state.nfts[action.payload]) {
        state.nfts[action.payload].isListed = false;
        state.nfts[action.payload].price = undefined;
        state.nfts[action.payload].currency = undefined;
        state.nfts[action.payload].updatedAt = new Date().toISOString();
      }
    },
    leaseNFT: (state, action: PayloadAction<{ id: string; lessee: string; duration: number; price: number }>) => {
      if (state.nfts[action.payload.id]) {
        state.nfts[action.payload.id].isLeased = true;
        state.nfts[action.payload.id].leaseTerms = {
          duration: action.payload.duration,
          price: action.payload.price,
          lessee: action.payload.lessee,
        };
        state.nfts[action.payload.id].updatedAt = new Date().toISOString();
      }
    },
    endLease: (state, action: PayloadAction<string>) => {
      if (state.nfts[action.payload]) {
        state.nfts[action.payload].isLeased = false;
        state.nfts[action.payload].leaseTerms = undefined;
        state.nfts[action.payload].updatedAt = new Date().toISOString();
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
  setUserNFTs,
  setMarketplaceNFTs,
  setMarketplaceLoading,
  setNFTFilters,
  selectNFT,
  addNFT,
  updateNFT,
  removeNFT,
  listNFT,
  unlistNFT,
  leaseNFT,
  endLease,
  setLoading,
  setError,
  clearError,
} = nftSlice.actions;

export default nftSlice.reducer;