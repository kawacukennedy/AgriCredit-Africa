'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useGetGovernanceProposalsQuery, useVoteOnProposalMutation } from '@/store/apiSlice';

export default function GovernancePage() {
  const { t } = useTranslation();
  const [voteOnProposal, { isLoading: voting }] = useVoteOnProposalMutation();
  const { data: proposals, isLoading } = useGetGovernanceProposalsQuery({});

  const handleVote = async (proposalId: string, vote: boolean) => {
    try {
      await voteOnProposal({
        id: proposalId,
        vote: vote,
        amount: 100 // Mock voting power
      }).unwrap();
      // Refresh data or show success message
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  // Mock proposals if API doesn't return data
  const mockProposals = [
    {
      id: '1',
      title: 'Increase Carbon Credit Rewards',
      description: 'Proposal to boost rewards for verified carbon sequestration activities by 15%.',
      status: 'Active',
      votesFor: 1250,
      votesAgainst: 320,
      endDate: '2025-01-15',
      type: 'Parameter Change',
    },
    {
      id: '2',
      title: 'Add New Crop Types to Yield Prediction',
      description: 'Include maize and cassava in the AI yield prediction model.',
      status: 'Passed',
      votesFor: 2100,
      votesAgainst: 150,
      endDate: '2024-12-20',
      type: 'Feature Addition',
    },
    {
      id: '3',
      title: 'Reduce Loan Interest Rates',
      description: 'Lower base interest rates for smallholder farmers by 2%.',
      status: 'Pending',
      votesFor: 0,
      votesAgainst: 0,
      endDate: '2025-02-01',
      type: 'Economic Parameter',
    },
  ];

  const displayProposals = proposals || mockProposals;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-gray">
            {t('navigation.governance')}
          </h1>
          <Button>
            Create Proposal
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Governance Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Proposals:</span>
                  <span className="font-bold">{displayProposals.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Proposals:</span>
                  <span className="font-bold">
                    {displayProposals.filter((p: any) => p.status === 'Active').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Your Voting Power:</span>
                  <span className="font-bold">1,250 AGRI</span>
                </div>
                <div className="flex justify-between">
                  <span>Quorum Required:</span>
                  <span className="font-bold">10%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Proposals</CardTitle>
              <CardDescription>
                Vote on active proposals to shape the platform's future.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border rounded-lg p-4 animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                      <div className="h-8 bg-muted rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {displayProposals.map((proposal: any) => (
                    <div key={proposal.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{proposal.title}</h3>
                          <p className="text-sm text-muted-foreground">{proposal.description}</p>
                        </div>
                        <Badge variant={
                          proposal.status === 'Active' ? 'default' :
                          proposal.status === 'Passed' ? 'default' :
                          'secondary'
                        }>
                          {proposal.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm mb-3">
                        <span>Type: {proposal.type}</span>
                        <span>Ends: {proposal.endDate}</span>
                      </div>
                      {proposal.status === 'Active' && (
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>For: {proposal.votesFor}</span>
                            <span>Against: {proposal.votesAgainst}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-agri-green h-2 rounded-full"
                              style={{
                                width: `${proposal.votesFor + proposal.votesAgainst > 0 ?
                                  (proposal.votesFor / (proposal.votesFor + proposal.votesAgainst)) * 100 : 0}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                      {proposal.status === 'Active' && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVote(proposal.id, true)}
                            disabled={voting}
                          >
                            Vote For
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVote(proposal.id, false)}
                            disabled={voting}
                          >
                            Vote Against
                          </Button>
                          <Button size="sm" variant="ghost">
                            View Details
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Voting History</CardTitle>
            <CardDescription>
              Track your participation in governance decisions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 border rounded">
                <div>
                  <div className="font-medium">Increase Carbon Credit Rewards</div>
                  <div className="text-sm text-muted-foreground">Voted For • 250 AGRI</div>
                </div>
                <Badge>Passed</Badge>
              </div>
              <div className="flex justify-between items-center p-3 border rounded">
                <div>
                  <div className="font-medium">Add New Crop Types</div>
                  <div className="text-sm text-muted-foreground">Voted For • 180 AGRI</div>
                </div>
                <Badge variant="secondary">Passed</Badge>
              </div>
              <div className="flex justify-between items-center p-3 border rounded">
                <div>
                  <div className="font-medium">Platform Fee Adjustment</div>
                  <div className="text-sm text-muted-foreground">Voted Against • 320 AGRI</div>
                </div>
                <Badge variant="destructive">Rejected</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}