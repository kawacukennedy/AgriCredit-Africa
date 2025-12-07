'use client';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CreditScoreWidget } from '@/components/dashboard/credit-score-widget';
import { LoanList } from '@/components/dashboard/loan-list';
import { FarmMap } from '@/components/dashboard/farm-map';
import { CarbonWidget } from '@/components/dashboard/carbon-widget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Leaf,
  BarChart3,
  Plus,
  ArrowRight,
  Bell,
  Settings,
  User
} from 'lucide-react';

export default function FarmerDashboard() {
  const { t } = useTranslation();

  return (
    <AuthGuard>
      <FarmerDashboardContent />
    </AuthGuard>
  );
}

function FarmerDashboardContent() {
  const { t } = useTranslation();

  // Mock data for alerts and quick stats
  const alerts = [
    {
      id: 1,
      type: 'success',
      title: 'Loan Approved',
      message: 'Your $2,500 loan application has been approved',
      time: '2 hours ago',
      icon: CheckCircle
    },
    {
      id: 2,
      type: 'warning',
      title: 'Payment Due',
      message: 'Next payment of $125 due in 3 days',
      time: '1 day ago',
      icon: AlertTriangle
    },
    {
      id: 3,
      type: 'info',
      title: 'Carbon Credits Earned',
      message: 'You earned 8 new CARBT tokens this month',
      time: '3 days ago',
      icon: Leaf
    }
  ];

  const quickStats = [
    { label: 'Total Loans', value: '$12,500', change: '+15%', icon: DollarSign },
    { label: 'Active Loans', value: '2', change: '0%', icon: BarChart3 },
    { label: 'Carbon Credits', value: '150', change: '+8%', icon: Leaf },
    { label: 'Farm Health', value: '92%', change: '+2%', icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-paper-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-agri-green to-sky-teal text-white py-12">
        <div className="container">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-2">
                Welcome back, Farmer! 🌾
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
      </section>

      <div className="container py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat, index) => (
            <Card key={index} className="shadow-level1 border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-black text-slate-gray mb-1">{stat.value}</p>
                    <p className="text-sm text-slate-gray/60">{stat.label}</p>
                  </div>
                  <div className="w-12 h-12 bg-agri-green/10 rounded-xl flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-agri-green" />
                  </div>
                </div>
                <div className="flex items-center mt-3">
                  <Badge className="bg-sky-teal/10 text-sky-teal border-sky-teal/20 text-xs">
                    {stat.change}
                  </Badge>
                  <span className="text-xs text-slate-gray/60 ml-2">vs last month</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <Card className="mb-8 shadow-level1 border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-slate-gray">
                <Bell className="w-5 h-5 mr-2 text-agri-green" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert) => {
                  const AlertIcon = alert.icon;
                  return (
                    <div key={alert.id} className="flex items-start space-x-4 p-4 bg-slate-gray/5 rounded-lg">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        alert.type === 'success' ? 'bg-sky-teal/10' :
                        alert.type === 'warning' ? 'bg-harvest-gold/10' :
                        'bg-blue-50'
                      }`}>
                        <AlertIcon className={`w-5 h-5 ${
                          alert.type === 'success' ? 'text-sky-teal' :
                          alert.type === 'warning' ? 'text-harvest-gold' :
                          'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-gray mb-1">{alert.title}</h4>
                        <p className="text-sm text-slate-gray/70 mb-2">{alert.message}</p>
                        <p className="text-xs text-slate-gray/50">{alert.time}</p>
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
            <Card className="shadow-level2 border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-slate-gray">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/apply">
                  <Button className="w-full btn-primary justify-start">
                    <Plus className="w-4 h-4 mr-2" />
                    Apply for Loan
                  </Button>
                </Link>
                <Link href="/marketplace">
                  <Button variant="outline" className="w-full border-slate-gray/20 hover:border-harvest-gold hover:text-harvest-gold justify-start">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Browse Marketplace
                  </Button>
                </Link>
                <Link href="/carbon">
                  <Button variant="outline" className="w-full border-slate-gray/20 hover:border-agri-green hover:text-agri-green justify-start">
                    <Leaf className="w-4 h-4 mr-2" />
                    Trade Carbon Credits
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" className="w-full border-slate-gray/20 hover:border-slate-gray hover:text-slate-gray justify-start">
                    <User className="w-4 h-4 mr-2" />
                    Update Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}