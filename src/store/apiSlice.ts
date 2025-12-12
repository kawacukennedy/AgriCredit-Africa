import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Mock data for when backend is not available
const mockData = {
  loans: [
    {
      id: '1',
      amount: 2500,
      ai_score: 785,
      status: 'funded',
      farmer_name: 'John Doe',
      location: 'Nairobi, Kenya',
      crop_type: 'Maize',
      interest_rate: 8.5,
      term_days: 365,
      funded_amount: 875,
      created_at: '2024-01-15T00:00:00Z'
    },
    {
      id: '2',
      amount: 1800,
      ai_score: 742,
      status: 'active',
      farmer_name: 'Jane Smith',
      location: 'Lagos, Nigeria',
      crop_type: 'Cassava',
      interest_rate: 9.2,
      term_days: 270,
      funded_amount: 1800,
      created_at: '2024-01-20T00:00:00Z'
    }
  ],
  marketplace: {
    data: [
      {
        id: '1',
        amount: 2500,
        ai_score: 785,
        farmer: 'John Doe',
        location: 'Nairobi, Kenya',
        crop: 'Maize',
        interest_rate: 8.5,
        term_months: 12,
        funded_percentage: 35,
        risk_level: 'Low',
        farm_size: 5.2,
        ndvi: 0.78,
        description: 'Experienced maize farmer seeking capital for expansion'
      },
      {
        id: '2',
        amount: 1800,
        ai_score: 742,
        farmer: 'Sarah Johnson',
        location: 'Lagos, Nigeria',
        crop: 'Cassava',
        interest_rate: 9.2,
        term_months: 8,
        funded_percentage: 0,
        risk_level: 'Medium',
        farm_size: 3.8,
        ndvi: 0.72,
        description: 'Sustainable cassava farming with organic practices'
      }
    ]
  }
};

const baseQueryWithFallback = async (args: any, api: any, extraOptions: any) => {
  try {
    const result = await fetchBaseQuery({
      baseUrl: process.env.NEXT_PUBLIC_API_URL ||
        (isProduction
          ? 'https://agricredit-backend.vercel.app'
          : 'http://localhost:8000'),
      prepareHeaders: (headers, { getState }) => {
        const token = (getState() as any).auth.token;
        if (token) {
          headers.set('authorization', `Bearer ${token}`);
        }
        return headers;
      },
    })(args, api, extraOptions);

    return result;
  } catch (error) {
    // If backend is not available, return mock data based on the endpoint
    console.warn('Backend not available, using mock data for:', args.url);

    // Mock responses based on endpoint
    if (args.url?.includes('/loans') && args.method !== 'POST') {
      return {
        data: {
          data: mockData.loans,
          total: mockData.loans.length,
          success: true
        }
      };
    }

    if (args.url?.includes('/marketplace/listings')) {
      return {
        data: mockData.marketplace
      };
    }

    // For other endpoints, return empty success response
    return {
      data: {
        success: true,
        data: [],
        message: 'Mock data - backend not available'
      }
    };
  }
};

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production' ||
  process.env.VERCEL_ENV === 'production' ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' ||
  typeof window !== 'undefined' && window.location.hostname !== 'localhost';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ||
      (isProduction
        ? 'https://agricredit-backend.vercel.app'
        : 'http://localhost:8000'),
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    // Authentication endpoints
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    getCurrentUser: builder.query({
      query: () => '/auth/me',
    }),

    // Loan endpoints
    getLoans: builder.query({
      query: (params) => ({
        url: '/loans',
        params,
      }),
    }),
    getLoanById: builder.query({
      query: (id) => `/loans/${id}`,
    }),
    createLoan: builder.mutation({
      query: (loanData) => ({
        url: '/loans',
        method: 'POST',
        body: loanData,
      }),
    }),
    applyForLoan: builder.mutation({
      query: (loanData) => ({
        url: '/loans/apply',
        method: 'POST',
        body: loanData,
      }),
    }),
    fundLoan: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/loans/${id}/fund`,
        method: 'POST',
        body: data,
      }),
    }),

    // AI endpoints
    getCreditScore: builder.query({
      query: (params) => ({
        url: '/ai/credit-scoring',
        params,
      }),
    }),
    runCreditScoring: builder.mutation({
      query: (data) => ({
        url: '/ai/credit-scoring',
        method: 'POST',
        body: data,
      }),
    }),
    getYieldPrediction: builder.mutation({
      query: (data) => ({
        url: '/ai/yield-prediction',
        method: 'POST',
        body: data,
      }),
    }),
    getClimateAnalysis: builder.mutation({
      query: (data) => ({
        url: '/ai/climate-analysis',
        method: 'POST',
        body: data,
      }),
    }),

    // User endpoints
    getUserProfile: builder.query({
      query: () => '/auth/me',
    }),
    updateUserProfile: builder.mutation({
      query: (profileData) => ({
        url: '/auth/me',
        method: 'PUT',
        body: profileData,
      }),
    }),

    // Farms endpoints
    getUserFarms: builder.query({
      query: () => '/farms',
    }),
    createFarm: builder.mutation({
      query: (farmData) => ({
        url: '/farms',
        method: 'POST',
        body: farmData,
      }),
    }),
    updateFarm: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/farms/${id}`,
        method: 'PUT',
        body: updates,
      }),
    }),
    getFarmNDVI: builder.query({
      query: (farmId) => `/farms/${farmId}/ndvi`,
    }),

    // Carbon credits
    getCarbonCredits: builder.query({
      query: () => '/carbon-credits',
    }),
    getUserCarbonCredits: builder.query({
      query: () => '/carbon-credits/user',
    }),
    mintCarbonCredit: builder.mutation({
      query: (creditData) => ({
        url: '/carbon-credits/mint',
        method: 'POST',
        body: creditData,
      }),
    }),
    retireCarbonCredit: builder.mutation({
      query: (creditId) => ({
        url: `/carbon-credits/${creditId}/retire`,
        method: 'POST',
      }),
    }),

    // Marketplace
    getMarketplaceListings: builder.query({
      query: (params) => ({
        url: '/marketplace/listings',
        params,
      }),
    }),
    createMarketplaceListing: builder.mutation({
      query: (listingData) => ({
        url: '/marketplace/listings',
        method: 'POST',
        body: listingData,
      }),
    }),
    getMarketplaceLoans: builder.query({
      query: (params) => ({
        url: '/marketplace/loans',
        params,
      }),
    }),

    // IoT endpoints
    registerIoTDevice: builder.mutation({
      query: (deviceData) => ({
        url: '/iot/devices/register',
        method: 'POST',
        body: deviceData,
      }),
    }),
    getIoTDevices: builder.query({
      query: () => '/devices',
    }),
    getSensorData: builder.query({
      query: ({ deviceId, ...params }) => ({
        url: `/sensor-data/${deviceId}`,
        params,
      }),
    }),
    sendDeviceCommand: builder.mutation({
      query: ({ deviceId, ...data }) => ({
        url: `/iot/devices/${deviceId}/command`,
        method: 'POST',
        body: data,
      }),
    }),

    // Governance
    getGovernanceProposals: builder.query({
      query: () => '/governance/proposals',
    }),
    createProposal: builder.mutation({
      query: (proposalData) => ({
        url: '/governance/proposals',
        method: 'POST',
        body: proposalData,
      }),
    }),
    voteOnProposal: builder.mutation({
      query: ({ id, ...voteData }) => ({
        url: `/governance/proposals/${id}/vote`,
        method: 'POST',
        body: voteData,
      }),
    }),
    getTreasuryBalance: builder.query({
      query: () => '/governance/treasury',
    }),

    // NFT endpoints
    getNFTs: builder.query({
      query: () => '/nfts',
    }),
    getUserNFTs: builder.query({
      query: () => '/nfts/user',
    }),
    mintNFT: builder.mutation({
      query: (nftData) => ({
        url: '/nfts/mint',
        method: 'POST',
        body: nftData,
      }),
    }),
    listNFT: builder.mutation({
      query: ({ id, ...listingData }) => ({
        url: `/nfts/${id}/list`,
        method: 'POST',
        body: listingData,
      }),
    }),
    leaseNFT: builder.mutation({
      query: ({ id, ...leaseData }) => ({
        url: `/nfts/${id}/lease`,
        method: 'POST',
        body: leaseData,
      }),
    }),

    // Yield farming endpoints
    getYieldPools: builder.query({
      query: () => '/yield/pools',
    }),
    getUserYieldPositions: builder.query({
      query: () => '/yield/positions',
    }),
    stakeInPool: builder.mutation({
      query: ({ poolId, ...stakeData }) => ({
        url: `/yield/pools/${poolId}/stake`,
        method: 'POST',
        body: stakeData,
      }),
    }),
    unstakeFromPool: builder.mutation({
      query: ({ poolId, ...unstakeData }) => ({
        url: `/yield/pools/${poolId}/unstake`,
        method: 'POST',
        body: unstakeData,
      }),
    }),
    claimRewards: builder.mutation({
      query: (poolId) => ({
        url: `/yield/pools/${poolId}/claim`,
        method: 'POST',
      }),
    }),

    // Notifications
    getNotifications: builder.query({
      query: () => '/notifications',
    }),
    markNotificationRead: builder.mutation({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: 'PUT',
      }),
    }),

    // Investor endpoints
    getInvestorPortfolio: builder.query({
      query: () => '/investor/portfolio',
    }),

    // Oracle endpoints
    getOraclePrice: builder.query({
      query: (asset) => `/oracle/prices/${asset}`,
    }),
    getOracleWeather: builder.query({
      query: (location) => `/oracle/weather/${location}`,
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetCurrentUserQuery,
  useGetLoansQuery,
  useGetLoanByIdQuery,
  useCreateLoanMutation,
  useApplyForLoanMutation,
  useFundLoanMutation,
  useGetCreditScoreQuery,
  useRunCreditScoringMutation,
  useGetYieldPredictionMutation,
  useGetClimateAnalysisMutation,
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useGetUserFarmsQuery,
  useCreateFarmMutation,
  useUpdateFarmMutation,
  useGetFarmNDVIQuery,
  useGetCarbonCreditsQuery,
  useGetUserCarbonCreditsQuery,
  useMintCarbonCreditMutation,
  useRetireCarbonCreditMutation,
  useGetMarketplaceListingsQuery,
  useCreateMarketplaceListingMutation,
  useGetMarketplaceLoansQuery,
  useRegisterIoTDeviceMutation,
  useGetIoTDevicesQuery,
  useGetSensorDataQuery,
  useSendDeviceCommandMutation,
  useGetGovernanceProposalsQuery,
  useCreateProposalMutation,
  useVoteOnProposalMutation,
  useGetTreasuryBalanceQuery,
  useGetNFTsQuery,
  useGetUserNFTsQuery,
  useMintNFTMutation,
  useListNFTMutation,
  useLeaseNFTMutation,
  useGetYieldPoolsQuery,
  useGetUserYieldPositionsQuery,
  useStakeInPoolMutation,
  useUnstakeFromPoolMutation,
  useClaimRewardsMutation,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useGetInvestorPortfolioQuery,
  useGetOraclePriceQuery,
  useGetOracleWeatherQuery,
} = apiSlice;