'use client';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Wallet,
  Users,
  Calendar,
  ExternalLink,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';

export default function GovernanceTreasuryPage() {
  return (
    <AuthGuard>
      <GovernanceTreasuryContent />
    </AuthGuard>
  );
}

function GovernanceTreasuryContent() {
  const { t } = useTranslation();

  // Mock treasury data
  const treasuryData = {
    totalBalance: 1250000,
    monthlyIncome: 45000,
    monthlyExpenses: 32000,
    netGrowth: 13000,
    assets: [
      { name: 'Stablecoins (USDC)', amount: 750000, percentage: 60, change: 2.5 },
      { name: 'Native Token (AGRT)', amount: 250000, percentage: 20, change: 15.8 },
      { name: 'Liquidity Pool Tokens', amount: 150000, percentage: 12, change: -3.2 },
      { name: 'Carbon Credits', amount: 100000, percentage: 8, change: 8.1 }
    ],
    recentTransactions: [
      {
        id: '1',
        type: 'income',
        description: 'Loan Interest Payments',
        amount: 8500,
        date: '2024-12-15',
        status: 'completed'
      },
      {
        id: '2',
        type: 'expense',
        description: 'AI Infrastructure Costs',
        amount: 12000,
        date: '2024-12-14',
        status: 'completed'
      },
      {
        id: '3',
        type: 'income',
        description: 'Carbon Credit Sales',
        amount: 5600,
        date: '2024-12-13',
        status: 'completed'
      },
      {
        id: '4',
        type: 'expense',
        description: 'Marketing Campaign',
        amount: 8000,
        date: '2024-12-12',
        status: 'pending'
      }
    ],
    proposals: [
      {
        id: 'treasury-1',
        title: 'Q1 2025 Budget Allocation',
        description: 'Allocate treasury funds for platform development and expansion',
        requestedAmount: 150000,
        status: 'active',
        votes: 1250,
        deadline: '2024-12-20'
      },
      {
        id: 'treasury-2',
        title: 'Emergency Fund Establishment',
        description: 'Create a 200k emergency fund for platform stability',
        requestedAmount: 200000,
        status: 'passed',
        votes: 2100,
        deadline: '2024-12-10'
      }
    ]
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
              Treasury Management
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Transparent financial management and fund allocation for AgriCredit Africa
            </p>
          </div>
        </div>
      </section>

      <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          {/* Treasury Overview */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card className="shadow-level1 border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-black text-slate-gray mb-1">
                      {formatCurrency(treasuryData.totalBalance)}
                    </p>
                    <p className="text-sm text-slate-gray/60">Total Balance</p>
                  </div>
                  <Wallet className="w-8 h-8 text-agri-green" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-level1 border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-black text-green-600 mb-1">
                      +{formatCurrency(treasuryData.monthlyIncome)}
                    </p>
                    <p className="text-sm text-slate-gray/60">Monthly Income</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-level1 border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-black text-red-600 mb-1">
                      -{formatCurrency(treasuryData.monthlyExpenses)}
                    </p>
                    <p className="text-sm text-slate-gray/60">Monthly Expenses</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-level1 border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-black text-sky-teal mb-1">
                      {formatCurrency(treasuryData.netGrowth)}
                    </p>
                    <p className="text-sm text-slate-gray/60">Net Growth</p>
                  </div>
                  <Target className="w-8 h-8 text-sky-teal" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Asset Allocation */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-level2 border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-gray">
                    <PieChart className="w-5 h-5 mr-2 text-agri-green" />
                    Asset Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {treasuryData.assets.map((asset, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-gray">{asset.name}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-slate-gray/60">{asset.percentage}%</span>
                            <Badge className={
                              asset.change > 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }>
                              {asset.change > 0 ? '+' : ''}{asset.change}%
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress value={asset.percentage} className="flex-1 h-2" />
                          <span className="text-sm font-medium text-slate-gray min-w-20 text-right">
                            {formatCurrency(asset.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card className="shadow-level2 border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-gray">
                    <BarChart3 className="w-5 h-5 mr-2 text-agri-green" />
                    Recent Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {treasuryData.recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border border-slate-gray/10 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.type === 'income'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {transaction.type === 'income' ? (
                              <TrendingUp className="w-5 h-5" />
                            ) : (
                              <TrendingDown className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-gray">{transaction.description}</p>
                            <p className="text-sm text-slate-gray/60">{transaction.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                          <Badge variant="secondary" className={
                            transaction.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }>
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Treasury Proposals */}
              <Card className="shadow-level2 border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-gray">
                    <DollarSign className="w-5 h-5 mr-2 text-agri-green" />
                    Treasury Proposals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {treasuryData.proposals.map((proposal) => (
                    <div key={proposal.id} className="p-4 border border-slate-gray/10 rounded-lg">
                      <h4 className="font-semibold text-slate-gray mb-2">{proposal.title}</h4>
                      <p className="text-sm text-slate-gray/70 mb-3">{proposal.description}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-gray/60">Requested:</span>
                          <span className="font-medium">{formatCurrency(proposal.requestedAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-gray/60">Votes:</span>
                          <span className="font-medium">{proposal.votes.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-gray/60">Deadline:</span>
                          <span className="font-medium">{new Date(proposal.deadline).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center space-x-2">
                        <Badge className={
                          proposal.status === 'active'
                            ? 'bg-agri-green/10 text-agri-green border-agri-green/20'
                            : 'bg-sky-teal/10 text-sky-teal border-sky-teal/20'
                        }>
                          {proposal.status}
                        </Badge>
                        {proposal.status === 'active' && (
                          <Button size="sm" className="flex-1">
                            Vote
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Treasury Actions */}
              <Card className="shadow-level1 border-0">
                <CardHeader>
                  <CardTitle className="text-slate-gray">Treasury Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Treasury Proposal
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Export Financial Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Blockchain
                  </Button>
                </CardContent>
              </Card>

              {/* Treasury Health */}
              <Card className="shadow-level1 border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-gray">
                    <CheckCircle className="w-5 h-5 mr-2 text-agri-green" />
                    Treasury Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-gray/70">Liquidity Ratio</span>
                      <span className="text-sm font-medium text-green-600">98.5%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-gray/70">Diversification</span>
                      <span className="text-sm font-medium text-green-600">85.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-gray/70">Risk Score</span>
                      <span className="text-sm font-medium text-green-600">Low</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}