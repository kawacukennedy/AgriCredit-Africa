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
  RefreshCw,
  Award
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
    <div className="bg-[#121212] text-white min-h-screen">
      {/* Skip to main content link for accessibility */}
      <a
        href="#dashboard-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-agri-green text-white px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      {/* Hero Section */}
      <header className="bg-gradient-to-r from-[#1976D2] to-[#2196F3] text-white py-12" role="banner">
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
              <Card key={index} className="shadow-level1 border-0 bg-[#1E1E1E] border-[#424242]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-black text-white mb-1">
                        {stat.value}
                      </p>
                      <p className="text-sm text-[#BDBDBD]">{stat.label}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-[#1976D2] to-[#2196F3] rounded-xl flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center mt-3">
                    <Badge className="bg-[#1976D2]/20 text-[#2196F3] border-[#1976D2]/30 text-xs">
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
             <Card className="shadow-level2 border-0 bg-[#1E1E1E] border-[#424242]">
               <CardHeader>
                 <CardTitle className="flex items-center text-white">
                   <BarChart3 className="w-5 h-5 mr-2 text-[#2196F3]" />
                   Portfolio Performance
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="h-64 bg-gradient-to-br from-[#1E1E1E] to-[#242424] rounded-lg flex items-center justify-center border border-[#424242]">
                   <div className="text-center">
                     <PieChart className="w-12 h-12 text-[#2196F3] mx-auto mb-2" />
                     <p className="text-[#2196F3] font-medium">Portfolio Allocation Chart</p>
                     <p className="text-sm text-[#BDBDBD]">Interactive chart showing your investments</p>
                   </div>
                 </div>
               </CardContent>
             </Card>

             {/* Risk Heatmap */}
             <Card className="shadow-level2 border-0 bg-[#1E1E1E] border-[#424242]">
               <CardHeader>
                 <CardTitle className="flex items-center text-white">
                   <Target className="w-5 h-5 mr-2 text-[#FF9800]" />
                   Risk Heatmap
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-5 gap-1 mb-4">
                   {[
                     { risk: 'Very Low', color: 'bg-green-500', loans: 3 },
                     { risk: 'Low', color: 'bg-green-400', loans: 5 },
                     { risk: 'Medium', color: 'bg-yellow-400', loans: 2 },
                     { risk: 'High', color: 'bg-orange-400', loans: 1 },
                     { risk: 'Very High', color: 'bg-red-500', loans: 0 }
                   ].map((level, index) => (
                     <div key={index} className="text-center">
                       <div className={`h-16 ${level.color} rounded flex items-center justify-center text-white font-bold text-sm`}>
                         {level.loans}
                       </div>
                       <p className="text-xs text-[#BDBDBD] mt-1">{level.risk}</p>
                     </div>
                   ))}
                 </div>
                 <div className="flex justify-between text-sm text-[#BDBDBD]">
                   <span>11 Active Loans</span>
                   <span>Portfolio Risk: Low</span>
                 </div>
               </CardContent>
             </Card>

             {/* Recent Investments */}
             <Card className="shadow-level2 border-0 bg-[#1E1E1E] border-[#424242]">
               <CardHeader>
                 <CardTitle className="flex items-center text-white">
                   <DollarSign className="w-5 h-5 mr-2 text-[#2196F3]" />
                   Recent Investments
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-4">
                   {recentInvestments.map((investment) => (
                     <div key={investment.id} className="flex items-center justify-between p-4 border border-[#424242] rounded-lg hover:bg-[#242424] transition-colors">
                       <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            investment.risk === 'low' ? 'bg-[#00C853]/20' :
                            investment.risk === 'medium' ? 'bg-[#FFB300]/20' : 'bg-[#D32F2F]/20'
                          }`}>
                            <Users className={`w-5 h-5 ${
                              investment.risk === 'low' ? 'text-[#00C853]' :
                              investment.risk === 'medium' ? 'text-[#FFB300]' : 'text-[#D32F2F]'
                            }`} />
                         </div>
                         <div>
                           <h3 className="font-semibold text-white">{investment.borrower}</h3>
                           <p className="text-sm text-[#BDBDBD]">
                             ${investment.amount.toLocaleString()} • Due: {investment.dueDate}
                           </p>
                         </div>
                       </div>
                       <div className="text-right">
                         <div className="flex items-center space-x-2">
                           <Badge className={
                             investment.status === 'active' ? 'bg-[#1976D2]/20 text-[#2196F3] border-[#1976D2]/30' :
                             investment.status === 'completed' ? 'bg-[#00C853]/20 text-[#00C853] border-[#00C853]/30' :
                             'bg-[#616161]/20 text-[#BDBDBD] border-[#616161]/30'
                           }>
                             {investment.status}
                           </Badge>
                           <div className="text-sm">
                             <p className="font-semibold text-[#00C853]">+${investment.return.toFixed(2)}</p>
                             <p className="text-[#BDBDBD]">returns</p>
                           </div>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               </CardContent>
             </Card>

             {/* Loan NFT Marketplace */}
             <Card className="shadow-level2 border-0 bg-[#1E1E1E] border-[#424242]">
               <CardHeader>
                 <CardTitle className="flex items-center text-white">
                   <Award className="w-5 h-5 mr-2 text-[#9C27B0]" />
                   Loan NFT Marketplace
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-4">
                   {[
                     { id: 1, name: 'Prime Maize Loan NFT', borrower: 'Green Valley Farms', amount: 2500, apy: 12.5, rarity: 'Rare', price: 0.8 },
                     { id: 2, name: 'Cassava Yield NFT', borrower: 'Sustainable Agri Co', amount: 1800, apy: 15.2, rarity: 'Epic', price: 1.2 },
                     { id: 3, name: 'Rice Harvest Token', borrower: 'Eco Farmers Union', amount: 3200, apy: 10.8, rarity: 'Uncommon', price: 0.6 }
                   ].map((nft) => (
                     <div key={nft.id} className="flex items-center justify-between p-4 border border-[#424242] rounded-lg hover:bg-[#242424] transition-colors">
                       <div className="flex items-center space-x-4">
                         <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                           <Award className="w-6 h-6 text-white" />
                         </div>
                         <div>
                           <h3 className="font-semibold text-white">{nft.name}</h3>
                           <p className="text-sm text-[#BDBDBD]">
                             {nft.borrower} • ${nft.amount} • {nft.apy}% APY
                           </p>
                         </div>
                       </div>
                       <div className="text-right">
                         <Badge className="mb-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                           {nft.rarity}
                         </Badge>
                         <p className="text-sm font-semibold text-[#FFD700]">{nft.price} ETH</p>
                         <Button size="sm" className="mt-1 bg-[#9C27B0] hover:bg-[#7B1FA2]">
                           Buy NFT
                         </Button>
                       </div>
                     </div>
                   ))}
                 </div>
                 <div className="mt-4 text-center">
                   <Link href="/nft">
                     <Button variant="outline" className="border-[#9C27B0] text-[#9C27B0] hover:bg-[#9C27B0] hover:text-white">
                       View Full NFT Marketplace
                     </Button>
                   </Link>
                 </div>
               </CardContent>
             </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
             <Card className="shadow-level2 border-0 bg-[#1E1E1E] border-[#424242]">
               <CardHeader>
                 <CardTitle className="flex items-center text-white">
                   <Target className="w-5 h-5 mr-2 text-[#2196F3]" />
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
             <Card className="shadow-level2 border-0 bg-[#1E1E1E] border-[#424242]">
               <CardHeader>
                 <CardTitle className="flex items-center text-white">
                   <CheckCircle className="w-5 h-5 mr-2 text-[#00C853]" />
                   Portfolio Health
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-4">
                   <div>
                     <div className="flex justify-between text-sm mb-2">
                       <span className="text-[#BDBDBD]">Overall Health</span>
                       <span className="font-semibold text-[#00C853]">{portfolio.portfolioHealth}%</span>
                     </div>
                     <Progress value={portfolio.portfolioHealth} className="h-2 bg-[#424242]" />
                   </div>
                   <div className="grid grid-cols-2 gap-4 text-center">
                     <div>
                       <p className="text-2xl font-bold text-[#00C853]">{portfolio.averageReturn}%</p>
                       <p className="text-xs text-[#BDBDBD]">Avg Return</p>
                     </div>
                     <div>
                       <p className="text-2xl font-bold text-[#2196F3]">{portfolio.totalBorrowers}</p>
                       <p className="text-xs text-[#BDBDBD]">Borrowers</p>
                     </div>
                   </div>
                 </div>
               </CardContent>
             </Card>

             {/* Recent Alerts */}
             <Card className="shadow-level2 border-0 bg-[#1E1E1E] border-[#424242]">
               <CardHeader>
                 <CardTitle className="flex items-center text-white">
                   <Bell className="w-5 h-5 mr-2 text-[#2196F3]" />
                   Recent Alerts
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="space-y-3">
                   {alerts.map((alert) => {
                     const AlertIcon = alert.icon;
                     return (
                       <div key={alert.id} className="flex items-start space-x-3 p-3 bg-[#242424] rounded-lg">
                         <AlertIcon className={`w-5 h-5 mt-0.5 ${
                           alert.type === 'success' ? 'text-[#00C853]' :
                           alert.type === 'warning' ? 'text-[#FFB300]' : 'text-[#2196F3]'
                         }`} />
                         <div className="flex-1">
                           <h4 className="font-medium text-white text-sm">{alert.title}</h4>
                           <p className="text-xs text-[#BDBDBD]">{alert.message}</p>
                           <p className="text-xs text-[#616161] mt-1">{alert.time}</p>
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