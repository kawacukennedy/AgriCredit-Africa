import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Farm {
  id: string;
  userId: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    region: string;
  };
  landSizeM2: number;
  cropTypes: string[];
  primaryCrop?: string;
  plantingDate?: string;
  expectedHarvest?: string;
  iotSensors?: string[];
  satelliteData?: boolean;
  ndviHistory?: Array<{
    date: string;
    ndvi: number;
    source: 'sentinel' | 'planet' | 'mock';
  }>;
  carbonCredits?: number;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  updatedAt: string;
}

interface FarmsState {
  userFarms: { [id: string]: Farm };
  selectedFarm: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: FarmsState = {
  userFarms: {},
  selectedFarm: null,
  isLoading: false,
  error: null,
};

const farmsSlice = createSlice({
  name: 'farms',
  initialState,
  reducers: {
    setUserFarms: (state, action: PayloadAction<Farm[]>) => {
      const farmsMap: { [id: string]: Farm } = {};
      action.payload.forEach(farm => {
        farmsMap[farm.id] = farm;
      });
      state.userFarms = farmsMap;
    },
    selectFarm: (state, action: PayloadAction<string | null>) => {
      state.selectedFarm = action.payload;
    },
    addFarm: (state, action: PayloadAction<Farm>) => {
      state.userFarms[action.payload.id] = action.payload;
    },
    updateFarm: (state, action: PayloadAction<{ id: string; updates: Partial<Farm> }>) => {
      if (state.userFarms[action.payload.id]) {
        state.userFarms[action.payload.id] = {
          ...state.userFarms[action.payload.id],
          ...action.payload.updates,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    deleteFarm: (state, action: PayloadAction<string>) => {
      delete state.userFarms[action.payload];
      if (state.selectedFarm === action.payload) {
        state.selectedFarm = null;
      }
    },
    updateNDVIHistory: (state, action: PayloadAction<{ farmId: string; ndviData: FarmsState['userFarms'][string]['ndviHistory'] }>) => {
      if (state.userFarms[action.payload.farmId]) {
        state.userFarms[action.payload.farmId].ndviHistory = action.payload.ndviData;
        state.userFarms[action.payload.farmId].updatedAt = new Date().toISOString();
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
  setUserFarms,
  selectFarm,
  addFarm,
  updateFarm,
  deleteFarm,
  updateNDVIHistory,
  setLoading,
  setError,
  clearError,
} = farmsSlice.actions;

export default farmsSlice.reducer;