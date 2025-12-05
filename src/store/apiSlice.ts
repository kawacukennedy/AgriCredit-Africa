import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.agricredit.africa/v1',
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
    fundLoan: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/loans/${id}/fund`,
        method: 'POST',
        body: data,
      }),
    }),
    // User endpoints
    getUserProfile: builder.query({
      query: () => '/users/profile',
    }),
    updateUserProfile: builder.mutation({
      query: (profileData) => ({
        url: '/users/profile',
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
        url: '/marketplace',
        params,
      }),
    }),
  }),
});

export const {
  useGetLoansQuery,
  useGetLoanByIdQuery,
  useCreateLoanMutation,
  useFundLoanMutation,
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useGetCarbonCreditsQuery,
  useGetMarketplaceListingsQuery,
} = apiSlice;