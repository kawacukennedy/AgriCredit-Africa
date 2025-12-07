'use client';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  Vote,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

export default function GovernanceVotePage() {
  return (
    <AuthGuard>
      <GovernanceVoteContent />
    </AuthGuard>
  );
}

function GovernanceVoteContent() {
  const { t } = useTranslation();

  // Mock governance proposals
  const proposals = [
    {
      id: '1',
      title: 'Increase Maximum Loan Amount to $10,000',
      description: 'Proposal to raise the maximum loan amount from $5,000 to $10,000 to support larger farming operations.',
      status: 'active',
      votesFor: 1250,
      votesAgainst: 340,
      totalVotes: 1590,
      endDate: '2024-12-20',
      proposer: 'Farmers Cooperative Alliance',
      category: 'Loan Parameters'
    },
    {
      id: '2',
      title: 'Implement Dynamic Interest Rates',
      description: 'Introduce AI-driven dynamic interest rates based on risk assessment and market conditions.',
      status: 'active',
      votesFor: 890,
      votesAgainst: 567,
      totalVotes: 1457,
      endDate: '2024-12-18',
      proposer: 'Risk Management Committee',
      category: 'Interest Rates'
    },
    {
      id: '3',
      title: 'Expand to New African Markets',
      description: 'Proposal to expand AgriCredit services to additional African countries starting with Tanzania and Uganda.',
      status: 'passed',
      votesFor: 2100,
      votesAgainst: 234,
      totalVotes: 2334,
      endDate: '2024-12-10',
      proposer: 'Expansion Committee',
      category: 'Market Expansion'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'bg-agri-green/10 text-agri-green border-agri-green/20';
      case 'passed': return 'bg-sky-teal/10 text-sky-teal border-sky-teal/20';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-gray/10 text-slate-gray border-slate-gray/20';
    }
  };

  return (
    <div className="min-h-screen bg-paper-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-agri-green to-sky-teal text-white py-12">
        <div className="container">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/governance">
              <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Governance
              </Button>
            </Link>
          </div>

          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              Governance Voting
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Participate in platform governance and help shape the future of AgriCredit Africa
            </p>
          </div>
        </div>
      </section>

      <div className="container py-8">
        {/* Voting Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray mb-1">3</p>
                  <p className="text-sm text-slate-gray/60">Active Proposals</p>
                </div>
                <Vote className="w-8 h-8 text-agri-green" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray mb-1">2,450</p>
                  <p className="text-sm text-slate-gray/60">Total Votes Cast</p>
                </div>
                <Users className="w-8 h-8 text-sky-teal" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray mb-1">85%</p>
                  <p className="text-sm text-slate-gray/60">Participation Rate</p>
                </div>
                <TrendingUp className="w-8 h-8 text-harvest-gold" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray mb-1">12</p>
                  <p className="text-sm text-slate-gray/60">Proposals Passed</p>
                </div>
                <CheckCircle className="w-8 h-8 text-agri-green" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Proposals */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-gray">Active Proposals</h2>

          {proposals.filter(p => p.status === 'active').map((proposal) => (
            <Card key={proposal.id} className="shadow-level2 border-0">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <CardTitle className="text-slate-gray">{proposal.title}</CardTitle>
                      <Badge className={getStatusBadge(proposal.status)}>
                        {proposal.status}
                      </Badge>
                    </div>
                    <p className="text-slate-gray/70 mb-3">{proposal.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-slate-gray/60">
                      <span>Proposed by: {proposal.proposer}</span>
                      <span>Category: {proposal.category}</span>
                      <span>Ends: {new Date(proposal.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Voting Progress */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-gray">Voting Progress</span>
                    <span className="text-sm text-slate-gray/60">{proposal.totalVotes} votes</span>
                  </div>
                  <div className="flex space-x-2">
                    <div className="flex-1 bg-red-100 rounded-full h-3">
                      <div
                        className="bg-red-500 h-3 rounded-full"
                        style={{ width: `${(proposal.votesAgainst / proposal.totalVotes) * 100}%` }}
                      />
                    </div>
                    <div className="flex-1 bg-agri-green/20 rounded-full h-3">
                      <div
                        className="bg-agri-green h-3 rounded-full"
                        style={{ width: `${(proposal.votesFor / proposal.totalVotes) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-gray/60 mt-1">
                    <span>Against: {proposal.votesAgainst}</span>
                    <span>For: {proposal.votesFor}</span>
                  </div>
                </div>

                {/* Voting Actions */}
                <div className="flex space-x-3">
                  <Button className="flex-1 btn-primary">
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Vote For ({proposal.votesFor})
                  </Button>
                  <Button variant="outline" className="flex-1 border-red-200 hover:border-red-300 hover:text-red-600">
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    Vote Against ({proposal.votesAgainst})
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Results */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-slate-gray mb-6">Recent Results</h2>

          {proposals.filter(p => p.status !== 'active').map((proposal) => (
            <Card key={proposal.id} className="shadow-level1 border-0 mb-4">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-gray mb-1">{proposal.title}</h3>
                    <p className="text-sm text-slate-gray/60">{proposal.description}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusBadge(proposal.status)}>
                      {proposal.status}
                    </Badge>
                    <p className="text-xs text-slate-gray/60 mt-1">
                      {proposal.votesFor} - {proposal.votesAgainst}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}