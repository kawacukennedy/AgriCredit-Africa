'use client';

import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CreditScoreWidget } from '@/components/dashboard/credit-score-widget';
import { LoanList } from '@/components/dashboard/loan-list';
import { CarbonWidget } from '@/components/dashboard/carbon-widget';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Settings, CheckCircle, AlertTriangle, Leaf, DollarSign, BarChart3, TrendingUp, Plus, User, Tractor, MapPin, Users } from 'lucide-react';
import { useGetCurrentUserQuery, useGetLoansQuery, useGetUserCarbonCreditsQuery, useGetNotificationsQuery } from '@/store/apiSlice';
import dynamic from 'next/dynamic';

const FarmMap = dynamic(() => import('@/components/dashboard/farm-map'), {
  ssr: false,
  loading: () => <div className="h-64 bg-[#1E1E1E] rounded-lg animate-pulse" />
});

export default function FarmerDashboard() {
  const { t } = useTranslation();

  return (
    <AuthGuard>
      <Suspense fallback={<div>Loading...</div>}>
        <FarmerDashboardContent />
      </Suspense>
    </AuthGuard>
  );
}

function FarmerDashboardContent() {
  const { t } = useTranslation();

  const { data: userData } = useGetCurrentUserQuery();
  const { data: loansData } = useGetLoansQuery({ status: 'active' });
  const { data: carbonData } = useGetUserCarbonCreditsQuery();
  const { data: notificationsData } = useGetNotificationsQuery();

  // Process real data with fallbacks
  const user = userData?.data || { name: 'Farmer', role: 'farmer' };

  const loans = loansData?.data || [];
  const totalLoanAmount = loans.reduce((sum, loan) => sum + (loan.amount_cents || 0), 0) / 100;
  const activeLoansCount = loans.length;

  const carbonCredits = carbonData?.data?.balance || 0;

  const notifications = notificationsData?.data || [];

  // Mock data for alerts (notifications) - using real notifications if available
  const alerts = notifications.length > 0 ? notifications.slice(0, 3).map((notif: any) => ({
    id: notif.id,
    type: notif.type || 'info',
    title: notif.title,
    message: notif.message,
    time: notif.created_at ? new Date(notif.created_at).toLocaleString() : 'Recently',
    icon: notif.type === 'success' ? CheckCircle : notif.type === 'warning' ? AlertTriangle : Leaf
  })) : [
    {
      id: 1,
      type: 'success',
      title: 'Welcome to AgriCredit!',
      message: 'Your farming account has been successfully set up',
      time: 'Just now',
      icon: CheckCircle
    }
  ];

  const quickStats = [
    { label: 'Total Loans', value: `$${totalLoanAmount.toLocaleString()}`, change: '+15%', icon: DollarSign },
    { label: 'Active Loans', value: activeLoansCount.toString(), change: '0%', icon: BarChart3 },
    { label: 'Carbon Credits', value: carbonCredits.toString(), change: '+8%', icon: Leaf },
    { label: 'Farm Health', value: '92%', change: '+2%', icon: TrendingUp }
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
      <header className="bg-gradient-to-r from-[#4CAF50] to-[#00C853] text-white py-12" role="banner">
        <div className="container">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-2">
                Welcome back, {user.name || 'Farmer'}! 🌾
              </h1>
              <p className="text-xl opacity-90">
                Here's your farming finance overview
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </Button>
              <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main id="dashboard-content" className="container py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat, index) => (
            <Card key={index} className="shadow-level1 border-0 bg-[#1E1E1E] border-[#424242]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-black text-white mb-1">{stat.value}</p>
                    <p className="text-sm text-[#BDBDBD]">{stat.label}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-[#4CAF50] to-[#00C853] rounded-xl flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex items-center mt-3">
                  <Badge className="bg-[#00C853]/20 text-[#00C853] border-[#00C853]/30 text-xs">
                    {stat.change}
                  </Badge>
                  <span className="text-xs text-[#BDBDBD] ml-2">vs last month</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <Card className="mb-8 shadow-level1 border-0 bg-[#1E1E1E] border-[#424242]">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-white">
                <Bell className="w-5 h-5 mr-2 text-[#00C853]" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert) => {
                  const AlertIcon = alert.icon;
                  return (
                    <div key={alert.id} className="flex items-start space-x-4 p-4 bg-[#242424] rounded-lg">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        alert.type === 'success' ? 'bg-[#00C853]/20' :
                        alert.type === 'warning' ? 'bg-[#FFB300]/20' :
                        'bg-[#2196F3]/20'
                      }`}>
                        <AlertIcon className={`w-5 h-5 ${
                          alert.type === 'success' ? 'text-[#00C853]' :
                          alert.type === 'warning' ? 'text-[#FFB300]' :
                          'text-[#2196F3]'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1">{alert.title}</h4>
                        <p className="text-sm text-[#BDBDBD] mb-2">{alert.message}</p>
                        <p className="text-xs text-[#616161]">{alert.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="xl:col-span-2 space-y-8">
            <CreditScoreWidget />
            <LoanList />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <FarmMap />
            <CarbonWidget />

            {/* Quick Actions */}
            <Card className="shadow-level2 border-0 bg-[#1E1E1E] border-[#424242]">
              <CardHeader className="pb-4">
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/apply">
                  <Button className="w-full bg-gradient-to-r from-[#4CAF50] to-[#00C853] hover:from-[#4CAF50]/90 hover:to-[#00C853]/90 text-white justify-start">
                    <Plus className="w-4 h-4 mr-2" />
                    Apply for Loan
                  </Button>
                </Link>
                <Link href="/cooperative-lending">
                  <Button variant="outline" className="w-full border-[#424242] hover:border-[#00C853] hover:text-[#00C853] text-white justify-start bg-[#242424]">
                    <Users className="w-4 h-4 mr-2" />
                    Cooperative Lending
                  </Button>
                </Link>
                <Link href="/marketplace">
                  <Button variant="outline" className="w-full border-[#424242] hover:border-[#00C853] hover:text-[#00C853] text-white justify-start bg-[#242424]">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Browse Marketplace
                  </Button>
                </Link>
                <Link href="/carbon">
                  <Button variant="outline" className="w-full border-[#424242] hover:border-[#4CAF50] hover:text-[#4CAF50] text-white justify-start bg-[#242424]">
                    <Leaf className="w-4 h-4 mr-2" />
                    Trade Carbon Credits
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" className="w-full border-[#424242] hover:border-[#BDBDBD] hover:text-[#BDBDBD] text-white justify-start bg-[#242424]">
                    <User className="w-4 h-4 mr-2" />
                    Update Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}