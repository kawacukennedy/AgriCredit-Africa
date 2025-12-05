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
} = api;