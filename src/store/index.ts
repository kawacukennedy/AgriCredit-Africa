import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { apiSlice } from './apiSlice';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import loansReducer from './slices/loansSlice';
import farmsReducer from './slices/farmsSlice';
import carbonReducer from './slices/carbonSlice';
import governanceReducer from './slices/governanceSlice';
import marketplaceReducer from './slices/marketplaceSlice';
import nftReducer from './slices/nftSlice';
import yieldReducer from './slices/yieldSlice';

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
    ui: uiReducer,
    loans: loansReducer,
    farms: farmsReducer,
    carbon: carbonReducer,
    governance: governanceReducer,
    marketplace: marketplaceReducer,
    nft: nftReducer,
    yield: yieldReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;