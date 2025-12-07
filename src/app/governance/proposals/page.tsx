'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  Filter,
  ArrowLeft,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

export default function GovernanceProposalsPage() {
  return (
    <AuthGuard>
      <GovernanceProposalsContent />
    </AuthGuard>
  );
}

function GovernanceProposalsContent() {
  const { t } = useTranslation();

  // Mock proposals data
  const proposals = [
    {
      id: '1',
      title: 'Increase Maximum Loan Amount to $10,000',
      description: 'Proposal to raise the maximum loan amount from $5,000 to $10,000 to support larger farming operations.',
      status: 'active',
      category: 'Loan Parameters',
      proposer: 'Farmers Cooperative Alliance',
      submittedDate: '2024-12-01',
      votes: 1590,
      endDate: '2024-12-20'
    },
    {
      id: '2',
      title: 'Implement Dynamic Interest Rates',
      description: 'Introduce AI-driven dynamic interest rates based on risk assessment and market conditions.',
      status: 'active',
      category: 'Interest Rates',
      proposer: 'Risk Management Committee',
      submittedDate: '2024-11-28',
      votes: 1457,
      endDate: '2024-12-18'
    },
    {
      id: '3',
      title: 'Carbon Credit Integration Enhancement',
      description: 'Improve carbon credit calculation algorithms and add new verification methods.',
      status: 'passed',
      category: 'Carbon Credits',
      proposer: 'Sustainability Committee',
      submittedDate: '2024-11-15',
      votes: 2100,
      endDate: '2024-12-01'
    },
    {
      id: '4',
      title: 'Mobile App Development',
      description: 'Fund development of native mobile apps for iOS and Android platforms.',
      status: 'rejected',
      category: 'Technology',
      proposer: 'Tech Committee',
      submittedDate: '2024-11-10',
      votes: 890,
      endDate: '2024-11-25'
    },
    {
      id: '5',
      title: 'Regional Expansion Strategy',
      description: 'Strategic plan for expanding operations to West African markets.',
      status: 'draft',
      category: 'Expansion',
      proposer: 'Expansion Committee',
      submittedDate: '2024-12-10',
      votes: 0,
      endDate: null
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'bg-agri-green/10 text-agri-green border-agri-green/20';
      case 'passed': return 'bg-sky-teal/10 text-sky-teal border-sky-teal/20';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'draft': return 'bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20';
      default: return 'bg-slate-gray/10 text-slate-gray border-slate-gray/20';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Loan Parameters': 'bg-blue-100 text-blue-800',
      'Interest Rates': 'bg-green-100 text-green-800',
      'Carbon Credits': 'bg-emerald-100 text-emerald-800',
      'Technology': 'bg-purple-100 text-purple-800',
      'Expansion': 'bg-orange-100 text-orange-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-paper-white">

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

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-2">
                Governance Proposals
              </h1>
              <p className="text-xl opacity-90">
                View and create proposals to shape AgriCredit's future
              </p>
            </div>
            <Button className="btn-primary hidden md:flex">
              <Plus className="w-4 h-4 mr-2" />
              Create Proposal
            </Button>
          </div>
        </div>
      </section>

      <div className="container py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray mb-1">5</p>
                  <p className="text-sm text-slate-gray/60">Total Proposals</p>
                </div>
                <FileText className="w-8 h-8 text-agri-green" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray mb-1">2</p>
                  <p className="text-sm text-slate-gray/60">Active Proposals</p>
                </div>
                <Clock className="w-8 h-8 text-sky-teal" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray mb-1">1</p>
                  <p className="text-sm text-slate-gray/60">Passed This Month</p>
                </div>
                <CheckCircle className="w-8 h-8 text-agri-green" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray mb-1">85%</p>
                  <p className="text-sm text-slate-gray/60">Success Rate</p>
                </div>
                <TrendingUp className="w-8 h-8 text-harvest-gold" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="shadow-level1 border-0 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-gray/40 w-4 h-4" />
                  <Input
                    placeholder="Search proposals..."
                    className="pl-10"
                  />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="loan">Loan Parameters</SelectItem>
                    <SelectItem value="rates">Interest Rates</SelectItem>
                    <SelectItem value="carbon">Carbon Credits</SelectItem>
                    <SelectItem value="tech">Technology</SelectItem>
                    <SelectItem value="expansion">Expansion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="btn-primary md:hidden">
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Proposals List */}
        <div className="space-y-4">
          {proposals.map((proposal) => (
            <Card key={proposal.id} className="shadow-level1 border-0 hover:shadow-level2 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-gray hover:text-agri-green transition-colors cursor-pointer">
                        {proposal.title}
                      </h3>
                      <Badge className={getStatusBadge(proposal.status)}>
                        {proposal.status}
                      </Badge>
                      <Badge className={`text-xs ${getCategoryColor(proposal.category)}`}>
                        {proposal.category}
                      </Badge>
                    </div>
                    <p className="text-slate-gray/70 mb-3 line-clamp-2">{proposal.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-slate-gray/60">
                      <span>By: {proposal.proposer}</span>
                      <span>Submitted: {new Date(proposal.submittedDate).toLocaleDateString()}</span>
                      {proposal.endDate && (
                        <span>Ends: {new Date(proposal.endDate).toLocaleDateString()}</span>
                      )}
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {proposal.votes} votes
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link href={`/governance/proposals/${proposal.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                    {proposal.status === 'active' && (
                      <Link href={`/governance/vote/${proposal.id}`}>
                        <Button size="sm" className="btn-primary">
                          Vote
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Proposal CTA */}
        <Card className="shadow-level1 border-0 bg-gradient-to-r from-agri-green/5 to-sky-teal/5 border-agri-green/20 mt-8">
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-agri-green mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-gray mb-2">Have an idea to improve AgriCredit?</h3>
            <p className="text-slate-gray/70 mb-6 max-w-md mx-auto">
              Submit a governance proposal to help shape the future of decentralized agriculture finance.
            </p>
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create New Proposal
            </Button>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}