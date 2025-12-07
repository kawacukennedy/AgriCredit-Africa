import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    prepareHeaders: (headers, { getState }) => {
      // Add auth token if available
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

    // Carbon credits
    getCarbonCredits: builder.query({
      query: () => '/carbon-credits',
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

    // NFT endpoints
    getNFTs: builder.query({
      query: () => '/nfts',
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
  useGetCarbonCreditsQuery,
  useGetMarketplaceListingsQuery,
  useCreateMarketplaceListingMutation,
  useRegisterIoTDeviceMutation,
  useGetIoTDevicesQuery,
  useGetSensorDataQuery,
  useSendDeviceCommandMutation,
  useGetGovernanceProposalsQuery,
  useCreateProposalMutation,
  useVoteOnProposalMutation,
  useGetNFTsQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useGetOraclePriceQuery,
  useGetOracleWeatherQuery,
} = apiSlice;