'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { useGetGovernanceProposalsQuery, useVoteOnProposalMutation } from '@/store/apiSlice';
import {
  Vote,
  Users,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Eye,
  BarChart3,
  DollarSign,
  Shield,
  Target,
  Info,
  ArrowRight,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

export default function GovernancePage() {
  const { t } = useTranslation();
  const [selectedProposal, setSelectedProposal] = useState(null);
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

  // Mock comprehensive governance data
  const governanceStats = {
    totalProposals: 47,
    activeProposals: 5,
    passedProposals: 32,
    rejectedProposals: 10,
    totalVotingPower: 2500000,
    userVotingPower: 1250,
    quorumRequired: 10,
    treasuryBalance: 500000
  };

  const mockProposals = [
    {
      id: '1',
      title: 'Increase Carbon Credit Rewards by 15%',
      description: 'Proposal to boost rewards for verified carbon sequestration activities by 15% to incentivize more sustainable farming practices.',
      status: 'Active',
      type: 'Parameter Change',
      category: 'Environmental',
      proposer: 'GreenDAO Initiative',
      votesFor: 1250000,
      votesAgainst: 320000,
      totalVotes: 1570000,
      quorumReached: true,
      endDate: '2025-01-15T23:59:59Z',
      executionDate: null,
      impact: 'High',
      tags: ['carbon', 'rewards', 'sustainability'],
      details: {
        currentValue: '10%',
        proposedValue: '11.5%',
        affectedUsers: 'All carbon credit holders',
        implementation: 'Automatic adjustment in reward calculation algorithm'
      }
    },
    {
      id: '2',
      title: 'Add Maize and Cassava to Yield Prediction Model',
      description: 'Include maize and cassava crop types in the AI yield prediction model to provide more accurate forecasts for East African farmers.',
      status: 'Passed',
      type: 'Feature Addition',
      category: 'Technology',
      proposer: 'AI Enhancement Committee',
      votesFor: 2100000,
      votesAgainst: 150000,
      totalVotes: 2250000,
      quorumReached: true,
      endDate: '2024-12-20T23:59:59Z',
      executionDate: '2024-12-25T10:00:00Z',
      impact: 'Medium',
      tags: ['ai', 'crops', 'prediction'],
      details: {
        cropsToAdd: ['Maize', 'Cassava'],
        dataRequirements: 'Historical yield data from partner cooperatives',
        timeline: '3 months for model training and validation'
      }
    },
    {
      id: '3',
      title: 'Reduce Base Loan Interest Rates by 2%',
      description: 'Lower base interest rates for smallholder farmers by 2% to improve access to credit during the planting season.',
      status: 'Pending',
      type: 'Economic Parameter',
      category: 'Finance',
      proposer: 'Farmers Rights Coalition',
      votesFor: 0,
      votesAgainst: 0,
      totalVotes: 0,
      quorumReached: false,
      endDate: '2025-02-01T23:59:59Z',
      executionDate: null,
      impact: 'High',
      tags: ['interest', 'loans', 'farmers'],
      details: {
        currentRate: '12-18%',
        proposedRate: '10-16%',
        eligibility: 'Farmers with credit score > 600',
        funding: 'Covered by protocol treasury'
      }
    },
    {
      id: '4',
      title: 'Implement Quadratic Voting for Major Decisions',
      description: 'Replace simple majority voting with quadratic voting for proposals affecting more than 50% of users.',
      status: 'Active',
      type: 'Governance Reform',
      category: 'Governance',
      proposer: 'Democratic Governance WG',
      votesFor: 890000,
      votesAgainst: 456000,
      totalVotes: 1346000,
      quorumReached: true,
      endDate: '2025-01-20T23:59:59Z',
      executionDate: null,
      impact: 'High',
      tags: ['voting', 'governance', 'democracy'],
      details: {
        votingSystem: 'Quadratic Voting',
        threshold: 'Proposals affecting >50% of users',
        implementation: 'Smart contract upgrade required'
      }
    }
  ];

  const displayProposals = proposals || mockProposals;

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Clock };
      case 'passed':
        return { color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle };
      case 'rejected':
        return { color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle };
      case 'pending':
        return { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: AlertTriangle };
      default:
        return { color: 'bg-slate-gray/10 text-slate-gray border-slate-gray/20', icon: FileText };
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'low': return 'bg-green-500/10 text-green-600 border-green-500/20';
      default: return 'bg-slate-gray/10 text-slate-gray border-slate-gray/20';
    }
  };

  const calculateTimeLeft = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  return (
    <div className="min-h-screen bg-paper-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-agri-green to-sky-teal text-white py-12">
        <div className="container">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              DAO Governance
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Participate in decentralized decision-making to shape the future of agricultural finance
            </p>
          </div>
        </div>
      </section>

      <div className="container py-8">
        {/* Governance Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray">{governanceStats.totalProposals}</p>
                  <p className="text-sm text-slate-gray/60">Total Proposals</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray">{governanceStats.activeProposals}</p>
                  <p className="text-sm text-slate-gray/60">Active Proposals</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Vote className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray">{governanceStats.userVotingPower.toLocaleString()}</p>
                  <p className="text-sm text-slate-gray/60">Your Voting Power</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray">${governanceStats.treasuryBalance.toLocaleString()}</p>
                  <p className="text-sm text-slate-gray/60">Treasury Balance</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="proposals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="proposals" className="flex items-center space-x-2">
              <Vote className="w-4 h-4" />
              <span>Proposals</span>
            </TabsTrigger>
            <TabsTrigger value="treasury" className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>Treasury</span>
            </TabsTrigger>
            <TabsTrigger value="delegation" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Delegation</span>
            </TabsTrigger>
          </TabsList>

          {/* Proposals Tab */}
          <TabsContent value="proposals" className="space-y-6">
            {/* Create Proposal Button */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-gray mb-2">Active Proposals</h2>
                <p className="text-slate-gray/70">Vote on proposals that will shape the platform's future</p>
              </div>
              <Button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Proposal
              </Button>
            </div>

            {/* Proposals List */}
            <div className="space-y-6">
              {displayProposals.map((proposal: any) => {
                const statusConfig = getStatusConfig(proposal.status);
                const StatusIcon = statusConfig.icon;
                const forPercentage = proposal.totalVotes > 0 ? (proposal.votesFor / proposal.totalVotes) * 100 : 0;

                return (
                  <Card key={proposal.id} className="shadow-level2 border-0 overflow-hidden hover:shadow-level3 transition-all duration-300">
                    <div className={`h-1 bg-gradient-to-r ${
                      proposal.category === 'Environmental' ? 'from-green-500 to-emerald-500' :
                      proposal.category === 'Technology' ? 'from-blue-500 to-cyan-500' :
                      proposal.category === 'Finance' ? 'from-amber-500 to-orange-500' :
                      'from-purple-500 to-pink-500'
                    }`}></div>

                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-bold text-slate-gray">{proposal.title}</h3>
                            <Badge className={getImpactColor(proposal.impact)}>
                              {proposal.impact} Impact
                            </Badge>
                          </div>
                          <p className="text-slate-gray/70 mb-3">{proposal.description}</p>

                          <div className="flex items-center space-x-4 text-sm text-slate-gray/60 mb-4">
                            <span>By {proposal.proposer}</span>
                            <span>•</span>
                            <span>{proposal.category}</span>
                            <span>•</span>
                            <span>{calculateTimeLeft(proposal.endDate)}</span>
                          </div>

                          <div className="flex flex-wrap gap-1 mb-4">
                            {proposal.tags.map((tag: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs border-slate-gray/20">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Badge className={`${statusConfig.color} flex items-center space-x-1`}>
                            <StatusIcon className="w-3 h-3" />
                            <span>{proposal.status}</span>
                          </Badge>
                        </div>
                      </div>

                      {/* Voting Progress */}
                      {proposal.status === 'Active' && (
                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-slate-gray">Voting Progress</span>
                            <span className="text-sm text-slate-gray/60">
                              {proposal.votesFor.toLocaleString()} For • {proposal.votesAgainst.toLocaleString()} Against
                            </span>
                          </div>
                          <Progress value={forPercentage} className="h-3 mb-2" />
                          <div className="flex justify-between text-xs text-slate-gray/60">
                            <span>{Math.round(forPercentage)}% in favor</span>
                            <span>Quorum: {proposal.quorumReached ? '✓ Reached' : '✗ Required'}</span>
                          </div>
                        </div>
                      )}

                      {/* Proposal Details */}
                      <div className="bg-slate-gray/5 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-slate-gray mb-2">Proposal Details</h4>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          {Object.entries(proposal.details).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-slate-gray/70 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                              <span className="font-medium">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          {proposal.status === 'Active' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleVote(proposal.id, true)}
                                disabled={voting}
                                className="border-slate-gray/20 hover:border-green-500 hover:text-green-600"
                              >
                                <ThumbsUp className="w-4 h-4 mr-2" />
                                Vote For
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleVote(proposal.id, false)}
                                disabled={voting}
                                className="border-slate-gray/20 hover:border-red-500 hover:text-red-500"
                              >
                                <ThumbsDown className="w-4 h-4 mr-2" />
                                Vote Against
                              </Button>
                            </>
                          )}
                          <Button variant="outline" size="sm" className="border-slate-gray/20 hover:border-agri-green hover:text-agri-green">
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </div>

                        <div className="text-sm text-slate-gray/60">
                          {proposal.totalVotes.toLocaleString()} total votes
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Treasury Tab */}
          <TabsContent value="treasury" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-level2 border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-gray">
                    <DollarSign className="w-5 h-5 mr-2 text-agri-green" />
                    Treasury Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-black text-slate-gray mb-2">
                      ${governanceStats.treasuryBalance.toLocaleString()}
                    </div>
                    <p className="text-slate-gray/60">Total Treasury Balance</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-gray/5 rounded-lg">
                      <span className="text-slate-gray/70">Monthly Revenue</span>
                      <span className="font-semibold text-green-600">+$45,000</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-gray/5 rounded-lg">
                      <span className="text-slate-gray/70">Protocol Fees</span>
                      <span className="font-semibold">$12,500</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-gray/5 rounded-lg">
                      <span className="text-slate-gray/70">Carbon Credits</span>
                      <span className="font-semibold">$8,750</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-gray/5 rounded-lg">
                      <span className="text-slate-gray/70">Yield Farming</span>
                      <span className="font-semibold">$23,750</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-level2 border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-gray">
                    <Target className="w-5 h-5 mr-2 text-agri-green" />
                    Treasury Proposals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border border-slate-gray/20 rounded-lg">
                      <h4 className="font-semibold text-slate-gray mb-2">Development Fund</h4>
                      <p className="text-sm text-slate-gray/70 mb-3">Allocate $50K for new feature development</p>
                      <div className="flex justify-between items-center">
                        <Badge className="bg-blue-500/10 text-blue-600">Under Discussion</Badge>
                        <span className="text-sm font-medium">$50,000</span>
                      </div>
                    </div>

                    <div className="p-4 border border-slate-gray/20 rounded-lg">
                      <h4 className="font-semibold text-slate-gray mb-2">Farmer Grants</h4>
                      <p className="text-sm text-slate-gray/70 mb-3">Support program for smallholder farmers</p>
                      <div className="flex justify-between items-center">
                        <Badge className="bg-green-500/10 text-green-600">Approved</Badge>
                        <span className="text-sm font-medium">$25,000</span>
                      </div>
                    </div>

                    <div className="p-4 border border-slate-gray/20 rounded-lg">
                      <h4 className="font-semibold text-slate-gray mb-2">Liquidity Mining</h4>
                      <p className="text-sm text-slate-gray/70 mb-3">Incentives for liquidity providers</p>
                      <div className="flex justify-between items-center">
                        <Badge className="bg-amber-500/10 text-amber-600">Voting</Badge>
                        <span className="text-sm font-medium">$100,000</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Delegation Tab */}
          <TabsContent value="delegation" className="space-y-6">
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <Users className="w-5 h-5 mr-2 text-agri-green" />
                  Voting Power Delegation
                </CardTitle>
                <CardDescription>
                  Delegate your voting power to trusted community members or organizations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-800 mb-1">About Delegation</h4>
                      <p className="text-sm text-blue-700">
                        Delegation allows you to lend your voting power to trusted delegates while maintaining the ability to revoke it at any time.
                        This helps ensure active participation in governance decisions.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-slate-gray mb-4">Your Current Delegation</h4>
                    <div className="p-4 bg-slate-gray/5 rounded-lg">
                      <p className="text-slate-gray/70">You haven't delegated your voting power yet.</p>
                      <Button className="mt-3 btn-primary" size="sm">
                        Delegate Voting Power
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-gray mb-4">Popular Delegates</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-gray/5 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-gray">GreenDAO Initiative</p>
                          <p className="text-sm text-slate-gray/60">Environmental focus</p>
                        </div>
                        <Button variant="outline" size="sm">Delegate</Button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-gray/5 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-gray">Farmers Rights Coalition</p>
                          <p className="text-sm text-slate-gray/60">Farmer advocacy</p>
                        </div>
                        <Button variant="outline" size="sm">Delegate</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}