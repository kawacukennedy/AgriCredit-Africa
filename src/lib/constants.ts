export const APP_NAME = 'AgriCredit';
export const APP_VERSION = '1.0.0';

export const SUPPORTED_LANGUAGES = ['en', 'fr', 'sw', 'ha'] as const;
export const DEFAULT_LANGUAGE = 'en';

export const BLOCKCHAIN_NETWORKS = {
  mainnet: 1,
  polygon: 137,
  bsc: 56,
} as const;

export const CONTRACT_ADDRESSES = {
  lendingProtocol: '0x...',
  carbonToken: '0x...',
  governance: '0x...',
} as const;

export const API_ENDPOINTS = {
  base: process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000',
  loans: '/api/loans',
  carbon: '/api/carbon',
  governance: '/api/governance',
} as const;

export const THEME_COLORS = {
  primary: '#22c55e', // agri-green
  secondary: '#3b82f6', // agri-blue
  accent: '#f59e0b', // agri-yellow
} as const;

export const LOAN_STATUS = {
  pending: 'pending',
  funded: 'funded',
  active: 'active',
  repaid: 'repaid',
  defaulted: 'defaulted',
} as const;

export const NFT_RARITY = {
  common: 'common',
  rare: 'rare',
  epic: 'epic',
  legendary: 'legendary',
} as const;