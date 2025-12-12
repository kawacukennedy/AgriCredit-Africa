'use client';

import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Bell,
  Settings,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  Users,
  Target,
  Plus,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import { useGetCurrentUserQuery, useGetInvestorPortfolioQuery, useGetNotificationsQuery } from '@/store/apiSlice';

export default function InvestorDashboard() {
  const { t } = useTranslation();

  return (
    <AuthGuard>
      <InvestorDashboardContent />
    </AuthGuard>
  );
}

function InvestorDashboardContent() {
  const { t } = useTranslation();

  const { data: userData } = useGetCurrentUserQuery();
  const { data: portfolioData } = useGetInvestorPortfolioQuery();
  const { data: notificationsData } = useGetNotificationsQuery();

  // Process real data with fallbacks
  const user = userData?.data || { name: 'Investor', role: 'investor' };

  const portfolio = portfolioData?.data || {
    totalInvested: 25000,
    totalReturns: 3250,
    activeLoans: 12,
    totalBorrowers: 45,
    averageReturn: 13.2,
    portfolioHealth: 94
  };

  const notifications = notificationsData?.data || [];

  // Mock data for alerts
  const alerts = notifications.length > 0 ? notifications.slice(0, 3).map((notif: any) => ({
    id: notif.id,
    type: notif.type || 'info',
    title: notif.title,
    message: notif.message,
    time: notif.created_at ? new Date(notif.created_at).toLocaleString() : 'Recently',
    icon: notif.type === 'success' ? CheckCircle : notif.type === 'warning' ? AlertTriangle : TrendingUp
  })) : [
    {
      id: 1,
      type: 'success',
      title: 'Welcome to AgriCredit!',
      message: 'Your investment portfolio is now active',
      time: 'Just now',
      icon: CheckCircle
    }
  ];

  const portfolioStats = [
    { label: 'Total Invested', value: `$${portfolio.totalInvested.toLocaleString()}`, change: '+8.5%', icon: DollarSign },
    { label: 'Total Returns', value: `$${portfolio.totalReturns.toLocaleString()}`, change: '+12.3%', icon: TrendingUp },
    { label: 'Active Loans', value: portfolio.activeLoans.toString(), change: '+2', icon: BarChart3 },
    { label: 'Portfolio Health', value: `${portfolio.portfolioHealth}%`, change: '+1.2%', icon: Target }
  ];

  const recentInvestments = [
    {
      id: 1,
      borrower: 'Green Valley Farms',
      amount: 2500,
      return: 312.50,
      status: 'active',
      dueDate: '2024-03-15',
      risk: 'low'
    },
    {
      id: 2,
      borrower: 'Sustainable Agri Co',
      amount: 5000,
      return: 650.00,
      status: 'active',
      dueDate: '2024-04-20',
      risk: 'medium'
    },
    {
      id: 3,
      borrower: 'Eco Farmers Union',
      amount: 1800,
      return: 234.00,
      status: 'completed',
      dueDate: '2024-01-10',
      risk: 'low'
    }
  ];

  return (
    <div className="bg-paper-white">
      {/* Skip to main content link for accessibility */}
      <a
        href="#dashboard-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-agri-green text-white px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      {/* Hero Section */}
      <header className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-12" role="banner">
        <div className="container">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-2">
                Welcome back, {user.name || 'Investor'}! 📈
              </h1>
              <p className="text-xl opacity-90">
                Your investment portfolio overview
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
              <Link href="/settings">
                <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8" id="dashboard-content">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {portfolioStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="shadow-level1 border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-black text-slate-gray mb-1">
                        {stat.value}
                      </p>
                      <p className="text-sm text-slate-gray/60">{stat.label}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center mt-3">
                    <Badge className="bg-sky-teal/10 text-sky-teal border-sky-teal/20 text-xs">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {stat.change}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Portfolio Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Portfolio Performance Chart */}
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                  Portfolio Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <PieChart className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                    <p className="text-blue-600 font-medium">Portfolio Allocation Chart</p>
                    <p className="text-sm text-slate-gray/60">Interactive chart showing your investments</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Investments */}
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                  Recent Investments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentInvestments.map((investment) => (
                    <div key={investment.id} className="flex items-center justify-between p-4 border border-slate-gray/10 rounded-lg hover:bg-slate-gray/5 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          investment.risk === 'low' ? 'bg-green-100' :
                          investment.risk === 'medium' ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          <Users className={`w-5 h-5 ${
                            investment.risk === 'low' ? 'text-green-600' :
                            investment.risk === 'medium' ? 'text-yellow-600' : 'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-gray">{investment.borrower}</h3>
                          <p className="text-sm text-slate-gray/60">
                            ${investment.amount.toLocaleString()} • Due: {investment.dueDate}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <Badge className={
                            investment.status === 'active' ? 'bg-sky-teal/10 text-sky-teal' :
                            investment.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                            'bg-slate-gray/10 text-slate-gray'
                          }>
                            {investment.status}
                          </Badge>
                          <div className="text-sm">
                            <p className="font-semibold text-green-600">+${investment.return.toFixed(2)}</p>
                            <p className="text-slate-gray/60">returns</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <Target className="w-5 h-5 mr-2 text-blue-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/marketplace">
                  <Button className="w-full btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Invest in New Loans
                  </Button>
                </Link>
                <Link href="/portfolio">
                  <Button variant="outline" className="w-full border-slate-gray/20 hover:border-blue-500 hover:text-blue-600">
                    <Eye className="w-4 h-4 mr-2" />
                    View Full Portfolio
                  </Button>
                </Link>
                <Link href="/carbon">
                  <Button variant="outline" className="w-full border-slate-gray/20 hover:border-green-500 hover:text-green-600">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Carbon Investments
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Portfolio Health */}
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Portfolio Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-gray/70">Overall Health</span>
                      <span className="font-semibold text-green-600">{portfolio.portfolioHealth}%</span>
                    </div>
                    <Progress value={portfolio.portfolioHealth} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">{portfolio.averageReturn}%</p>
                      <p className="text-xs text-slate-gray/60">Avg Return</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{portfolio.totalBorrowers}</p>
                      <p className="text-xs text-slate-gray/60">Borrowers</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Alerts */}
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <Bell className="w-5 h-5 mr-2 text-blue-600" />
                  Recent Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.map((alert) => {
                    const AlertIcon = alert.icon;
                    return (
                      <div key={alert.id} className="flex items-start space-x-3 p-3 bg-slate-gray/5 rounded-lg">
                        <AlertIcon className={`w-5 h-5 mt-0.5 ${
                          alert.type === 'success' ? 'text-green-600' :
                          alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                        }`} />
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-gray text-sm">{alert.title}</h4>
                          <p className="text-xs text-slate-gray/60">{alert.message}</p>
                          <p className="text-xs text-slate-gray/50 mt-1">{alert.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}