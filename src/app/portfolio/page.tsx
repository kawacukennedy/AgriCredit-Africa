'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Shield,
  Zap,
  Award
} from 'lucide-react';

export default function PortfolioPage() {
  return (
    <AuthGuard>
      <PortfolioContent />
    </AuthGuard>
  );
}

function PortfolioContent() {
  const { t } = useTranslation();

  // Comprehensive mock data
  const portfolio = {
    summary: {
      totalValue: 45250,
      totalInvested: 38750,
      totalReturn: 6500,
      totalReturnPercent: 16.8,
      activeLoans: 12,
      repaidLoans: 8,
      defaultedLoans: 1,
      expectedAPY: 12.5,
      monthlyIncome: 425
    },
    riskDistribution: [
      { risk: 'Low', amount: 18500, percentage: 40.8, color: 'bg-sky-teal' },
      { risk: 'Medium', amount: 19800, percentage: 43.7, color: 'bg-harvest-gold' },
      { risk: 'High', amount: 6950, percentage: 15.5, color: 'bg-red-500' }
    ],
    loans: [
      {
        id: '1',
        farmer: 'John Doe',
        location: 'Nairobi, Kenya',
        amount: 2500,
        currentValue: 2750,
        return: 250,
        returnPercent: 10.0,
        status: 'active',
        riskLevel: 'Low',
        maturityDate: '2024-08-15',
        nextPayment: '2024-03-15',
        paymentProgress: 65,
        crop: 'Maize',
        aiScore: 785
      },
      {
        id: '2',
        farmer: 'Jane Smith',
        location: 'Lagos, Nigeria',
        amount: 1800,
        currentValue: 1980,
        return: 180,
        returnPercent: 10.0,
        status: 'active',
        riskLevel: 'Medium',
        maturityDate: '2024-07-20',
        nextPayment: '2024-03-20',
        paymentProgress: 45,
        crop: 'Cassava',
        aiScore: 742
      },
      {
        id: '3',
        farmer: 'Michael Brown',
        location: 'Accra, Ghana',
        amount: 3200,
        currentValue: 3520,
        return: 320,
        returnPercent: 10.0,
        status: 'repaid',
        riskLevel: 'Low',
        maturityDate: '2024-02-10',
        nextPayment: null,
        paymentProgress: 100,
        crop: 'Rice',
        aiScore: 812
      },
      {
        id: '4',
        farmer: 'Sarah Johnson',
        location: 'Kampala, Uganda',
        amount: 1200,
        currentValue: 1320,
        return: 120,
        returnPercent: 10.0,
        status: 'active',
        riskLevel: 'High',
        maturityDate: '2024-09-30',
        nextPayment: '2024-03-30',
        paymentProgress: 25,
        crop: 'Coffee',
        aiScore: 678
      }
    ],
    transactions: [
      { id: '1', type: 'investment', amount: 2500, description: 'Funded loan for John Doe', date: '2024-01-15', status: 'completed' },
      { id: '2', type: 'return', amount: 275, description: 'Monthly payment from Jane Smith', date: '2024-02-15', status: 'completed' },
      { id: '3', type: 'return', amount: 330, description: 'Loan repayment from Michael Brown', date: '2024-02-10', status: 'completed' },
      { id: '4', type: 'investment', amount: 1200, description: 'Funded loan for Sarah Johnson', date: '2024-02-20', status: 'completed' },
      { id: '5', type: 'return', amount: 250, description: 'Monthly payment from John Doe', date: '2024-02-28', status: 'pending' }
    ]
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'bg-sky-teal/10 text-sky-teal border-sky-teal/20';
      case 'medium': return 'bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20';
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-gray/10 text-slate-gray border-slate-gray/20';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-agri-green/10 text-agri-green border-agri-green/20';
      case 'repaid': return 'bg-sky-teal/10 text-sky-teal border-sky-teal/20';
      case 'defaulted': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-gray/10 text-slate-gray border-slate-gray/20';
    }
  };

  return (
    <div className="min-h-screen bg-paper-white">

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-agri-green to-sky-teal text-white py-12">
        <div className="container">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-2">
                Investment Portfolio
              </h1>
              <p className="text-xl opacity-90">
                Track your impact investments and returns across African agriculture
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
              <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                <ExternalLink className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-8">
        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray mb-1">
                    ${portfolio.summary.totalValue.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-gray/60">Portfolio Value</p>
                </div>
                <div className="w-12 h-12 bg-agri-green/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-agri-green" />
                </div>
              </div>
              <div className="flex items-center mt-3">
                <Badge className="bg-sky-teal/10 text-sky-teal border-sky-teal/20 text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{portfolio.summary.totalReturnPercent}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray mb-1">
                    +${portfolio.summary.totalReturn.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-gray/60">Total Returns</p>
                </div>
                <div className="w-12 h-12 bg-sky-teal/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-sky-teal" />
                </div>
              </div>
              <div className="flex items-center mt-3">
                <Badge className="bg-agri-green/10 text-agri-green border-agri-green/20 text-xs">
                  ${portfolio.summary.monthlyIncome}/month
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray mb-1">
                    {portfolio.summary.activeLoans}
                  </p>
                  <p className="text-sm text-slate-gray/60">Active Loans</p>
                </div>
                <div className="w-12 h-12 bg-harvest-gold/10 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-harvest-gold" />
                </div>
              </div>
              <div className="flex items-center mt-3">
                <Badge className="bg-slate-gray/10 text-slate-gray border-slate-gray/20 text-xs">
                  {portfolio.summary.repaidLoans} repaid
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray mb-1">
                    {portfolio.summary.expectedAPY}%
                  </p>
                  <p className="text-sm text-slate-gray/60">Expected APY</p>
                </div>
                <div className="w-12 h-12 bg-agri-green/10 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-agri-green" />
                </div>
              </div>
              <div className="flex items-center mt-3">
                <Badge className="bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20 text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  High yield
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="loans" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="loans">Loan Portfolio</TabsTrigger>
            <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
            <TabsTrigger value="nfts">Loan NFTs</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="loans" className="space-y-6">
            {/* Active Loans */}
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <BarChart3 className="w-5 h-5 mr-2 text-agri-green" />
                  Active Investments ({portfolio.summary.activeLoans})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {portfolio.loans.filter(loan => loan.status === 'active').map((loan) => (
                    <div key={loan.id} className="p-6 border border-slate-gray/10 rounded-xl hover:shadow-level1 transition-all duration-200 group">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-agri-green to-sky-teal rounded-lg flex items-center justify-center">
                            <Award className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-gray group-hover:text-agri-green transition-colors">
                              {loan.farmer}
                            </h3>
                            <p className="text-sm text-slate-gray/60">{loan.location} • {loan.crop} Farming</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getRiskBadgeColor(loan.riskLevel)}>
                            {loan.aiScore} Score • {loan.riskLevel}
                          </Badge>
                          <Badge className={getStatusBadgeColor(loan.status)}>
                            {loan.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-slate-gray/60 mb-1">Invested Amount</p>
                          <p className="font-semibold text-slate-gray">${loan.amount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-gray/60 mb-1">Current Value</p>
                          <p className="font-semibold text-agri-green">${loan.currentValue}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-gray/60 mb-1">Return</p>
                          <p className="font-semibold text-sky-teal">+${loan.return} ({loan.returnPercent}%)</p>
                        </div>
                      </div>

                      {loan.status === 'active' && (
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-slate-gray">Payment Progress</span>
                            <span className="text-sm text-slate-gray/60">{loan.paymentProgress}%</span>
                          </div>
                          <Progress value={loan.paymentProgress} className="h-2" />
                          <p className="text-xs text-slate-gray/60 mt-1">
                            Next payment: {loan.nextPayment ? new Date(loan.nextPayment).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Link href={`/loan/${loan.id}`}>
                          <Button variant="outline" size="sm" className="border-slate-gray/20 hover:border-agri-green hover:text-agri-green">
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" className="border-slate-gray/20 hover:border-harvest-gold hover:text-harvest-gold">
                          <ArrowUpRight className="w-4 h-4 mr-2" />
                          Sell NFT
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Repaid Loans */}
            <Card className="shadow-level1 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <CheckCircle className="w-5 h-5 mr-2 text-sky-teal" />
                  Completed Investments ({portfolio.summary.repaidLoans})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {portfolio.loans.filter(loan => loan.status === 'repaid').map((loan) => (
                    <div key={loan.id} className="p-4 border border-slate-gray/10 rounded-lg bg-slate-gray/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-sky-teal/10 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-sky-teal" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-gray">{loan.farmer}</p>
                            <p className="text-sm text-slate-gray/60">{loan.location}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-agri-green">+${loan.return}</p>
                          <p className="text-xs text-slate-gray/60">Total return</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk" className="space-y-6">
            {/* Risk Distribution */}
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <Shield className="w-5 h-5 mr-2 text-agri-green" />
                  Risk Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {portfolio.riskDistribution.map((risk, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-gray">{risk.risk} Risk</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-slate-gray/60">${risk.amount.toLocaleString()}</span>
                          <span className="text-sm font-medium text-slate-gray">{risk.percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-gray/10 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${risk.color}`}
                          style={{ width: `${risk.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Risk Management
                  </h4>
                  <p className="text-sm text-blue-700">
                    Your portfolio maintains a balanced risk profile with {portfolio.riskDistribution[0].percentage}% in low-risk investments.
                    Consider diversifying further to optimize returns while managing risk.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Risk Heatmap Placeholder */}
            <Card className="shadow-level1 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <PieChart className="w-5 h-5 mr-2 text-agri-green" />
                  Geographic Risk Heatmap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-slate-gray/5 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <PieChart className="w-12 h-12 text-slate-gray/40 mx-auto mb-2" />
                    <p className="text-slate-gray/60">Interactive risk heatmap coming soon</p>
                    <p className="text-sm text-slate-gray/50">Visual representation of geographic risk distribution</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nfts" className="space-y-6">
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <Award className="w-5 h-5 mr-2 text-agri-green" />
                  Loan NFTs ({portfolio.loans.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {portfolio.loans.map((loan) => (
                    <div key={loan.id} className="border border-slate-gray/20 rounded-xl overflow-hidden hover:shadow-level2 transition-all duration-200 group">
                      <div className="aspect-square bg-gradient-to-br from-agri-green/10 to-sky-teal/10 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <Award className="w-12 h-12 text-agri-green mx-auto mb-2" />
                            <p className="text-sm font-medium text-slate-gray">{loan.farmer}</p>
                            <p className="text-xs text-slate-gray/60">{loan.crop} Loan NFT</p>
                          </div>
                        </div>
                        <div className="absolute top-3 right-3">
                          <Badge className={getRiskBadgeColor(loan.riskLevel)}>
                            {loan.riskLevel}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-gray/60">Value</span>
                            <span className="font-medium text-slate-gray">${loan.currentValue}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-gray/60">Return</span>
                            <span className="font-medium text-agri-green">+{loan.returnPercent}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-gray/60">AI Score</span>
                            <span className="font-medium text-slate-gray">{loan.aiScore}</span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" className="flex-1 border-slate-gray/20 hover:border-agri-green hover:text-agri-green">
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" className="flex-1 btn-primary">
                            <ArrowUpRight className="w-3 h-3 mr-1" />
                            Sell
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <Activity className="w-5 h-5 mr-2 text-agri-green" />
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {portfolio.transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border border-slate-gray/10 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          transaction.type === 'investment' ? 'bg-agri-green/10' :
                          transaction.type === 'return' ? 'bg-sky-teal/10' :
                          'bg-slate-gray/10'
                        }`}>
                          {transaction.type === 'investment' ? (
                            <ArrowDownRight className="w-5 h-5 text-agri-green" />
                          ) : transaction.type === 'return' ? (
                            <ArrowUpRight className="w-5 h-5 text-sky-teal" />
                          ) : (
                            <Activity className="w-5 h-5 text-slate-gray" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-gray">{transaction.description}</p>
                          <p className="text-sm text-slate-gray/60">
                            {new Date(transaction.date).toLocaleDateString()} • {transaction.status}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'return' ? 'text-agri-green' : 'text-slate-gray'
                        }`}>
                          {transaction.type === 'return' ? '+' : '-'}${transaction.amount}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}