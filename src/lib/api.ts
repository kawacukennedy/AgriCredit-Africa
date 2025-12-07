import { apiSlice } from '@/store/apiSlice';

export const api = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLoans: builder.query({
      query: () => '/loans',
    }),
    getLoanById: builder.query({
      query: (id) => `/loans/${id}`,
    }),
    createLoan: builder.mutation({
      query: (loan) => ({
        url: '/loans',
        method: 'POST',
        body: loan,
      }),
    }),
    getCarbonCredits: builder.query({
      query: () => '/carbon-credits',
    }),
    getNFTs: builder.query({
      query: () => '/nfts',
    }),
    getGovernanceProposals: builder.query({
      query: () => '/governance/proposals',
    }),
    voteOnProposal: builder.mutation({
      query: ({ id, vote }) => ({
        url: `/governance/proposals/${id}/vote`,
        method: 'POST',
        body: { vote },
      }),
    }),
    // Onboarding endpoints
    createDID: builder.mutation({
      query: (data) => ({
        url: '/onboarding/did/create',
        method: 'POST',
        body: data,
      }),
    }),
    submitKYC: builder.mutation({
      query: (kycData) => ({
        url: '/onboarding/kyc/verify',
        method: 'POST',
        body: { kyc_data: kycData },
      }),
    }),
    completeProfile: builder.mutation({
      query: (profileData) => ({
        url: '/onboarding/profile/complete',
        method: 'POST',
        body: profileData,
      }),
    }),
  }),
});

export const {
  useGetLoansQuery,
  useGetLoanByIdQuery,
  useCreateLoanMutation,
  useGetCarbonCreditsQuery,
  useGetNFTsQuery,
  useGetGovernanceProposalsQuery,
  useVoteOnProposalMutation,
  useCreateDIDMutation,
  useSubmitKYCMutation,
  useCompleteProfileMutation,
} = api;