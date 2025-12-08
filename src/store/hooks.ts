import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Auth hooks
export const useAuth = () => useAppSelector(state => state.auth);

// UI hooks
export const useUI = () => useAppSelector(state => state.ui);

// Loans hooks
export const useLoans = () => useAppSelector(state => state.loans);

// Farms hooks
export const useFarms = () => useAppSelector(state => state.farms);

// Carbon hooks
export const useCarbon = () => useAppSelector(state => state.carbon);

// Governance hooks
export const useGovernance = () => useAppSelector(state => state.governance);

// Marketplace hooks
export const useMarketplace = () => useAppSelector(state => state.marketplace);

// NFT hooks
export const useNFT = () => useAppSelector(state => state.nft);

// Yield hooks
export const useYield = () => useAppSelector(state => state.yield);