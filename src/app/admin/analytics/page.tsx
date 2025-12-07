'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart,
  Activity,
  Users,
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  Globe,
  Cpu,
  HardDrive,
  Shield,
  Leaf,
  Zap
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  return (
    <AuthGuard>
      <AdminAnalyticsContent />
    </AuthGuard>
  );
}

function AdminAnalyticsContent() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-paper-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-agri-green to-sky-teal text-white py-8">
        <div className="container">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-xl opacity-90">
                Comprehensive insights into platform performance, user behavior, and financial metrics
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <Link href="/admin">
                <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                  ← Back to Dashboard
                </Button>
              </Link>
              <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-8">
        {/* Key Performance Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray mb-1">
                    $2.5M
                  </p>
                  <p className="text-sm text-slate-gray/60">Total Volume</p>
                </div>
                <div className="w-12 h-12 bg-agri-green/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-agri-green" />
                </div>
              </div>
              <div className="flex items-center mt-3">
                <Badge className="bg-sky-teal/10 text-sky-teal border-sky-teal/20 text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +15.2%
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray mb-1">
                    1,250
                  </p>
                  <p className="text-sm text-slate-gray/60">Active Farmers</p>
                </div>
                <div className="w-12 h-12 bg-sky-teal/10 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-sky-teal" />
                </div>
              </div>
              <div className="flex items-center mt-3">
                <Badge className="bg-agri-green/10 text-agri-green border-agri-green/20 text-xs">
                  +8.5%
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray mb-1">
                    94.2%
                  </p>
                  <p className="text-sm text-slate-gray/60">Repayment Rate</p>
                </div>
                <div className="w-12 h-12 bg-harvest-gold/10 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-harvest-gold" />
                </div>
              </div>
              <div className="flex items-center mt-3">
                <Badge className="bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20 text-xs">
                  Above target
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray mb-1">
                    50,000
                  </p>
                  <p className="text-sm text-slate-gray/60">Carbon Credits</p>
                </div>
                <div className="w-12 h-12 bg-agri-green/10 rounded-xl flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-agri-green" />
                </div>
              </div>
              <div className="flex items-center mt-3">
                <Badge className="bg-sky-teal/10 text-sky-teal border-sky-teal/20 text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12.3%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analytics */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Loan Performance Trends */}
          <Card className="shadow-level2 border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-gray">
                <TrendingUp className="w-5 h-5 mr-2 text-agri-green" />
                Loan Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-slate-gray/5 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-slate-gray/40 mx-auto mb-2" />
                  <p className="text-slate-gray/60">Performance trends chart</p>
                  <p className="text-sm text-slate-gray/50">Monthly loan volume and repayment rates</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Geographic Distribution */}
          <Card className="shadow-level2 border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-gray">
                <Globe className="w-5 h-5 mr-2 text-agri-green" />
                Geographic Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { country: 'Kenya', loans: 450, percentage: 36, growth: '+15%' },
                  { country: 'Nigeria', loans: 320, percentage: 26, growth: '+22%' },
                  { country: 'Ghana', loans: 180, percentage: 15, growth: '+8%' },
                  { country: 'Tanzania', loans: 120, percentage: 10, growth: '+12%' },
                  { country: 'Uganda', loans: 100, percentage: 8, growth: '+18%' },
                  { country: 'Others', loans: 80, percentage: 5, growth: '+5%' }
                ].map((region, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-agri-green rounded-full"></div>
                      <span className="text-sm font-medium text-slate-gray">{region.country}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-slate-gray/60">{region.loans} loans</span>
                      <div className="w-16 bg-slate-gray/10 rounded-full h-2">
                        <div
                          className="bg-agri-green h-2 rounded-full"
                          style={{ width: `${region.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-gray w-8">{region.percentage}%</span>
                      <Badge className="bg-sky-teal/10 text-sky-teal border-sky-teal/20 text-xs">
                        {region.growth}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Model Performance */}
        <Card className="shadow-level2 border-0 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-gray">
              <Cpu className="w-5 h-5 mr-2 text-agri-green" />
              AI Model Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-slate-gray/5 rounded-lg">
                <div className="text-3xl font-bold text-agri-green mb-2">94.2%</div>
                <div className="text-sm text-slate-gray/60">Credit Scoring Accuracy</div>
                <div className="text-xs text-sky-teal mt-1">+2.1% from last month</div>
              </div>
              <div className="text-center p-4 bg-slate-gray/5 rounded-lg">
                <div className="text-3xl font-bold text-agri-green mb-2">2.3s</div>
                <div className="text-sm text-slate-gray/60">Average Response Time</div>
                <div className="text-xs text-sky-teal mt-1">-0.5s improvement</div>
              </div>
              <div className="text-center p-4 bg-slate-gray/5 rounded-lg">
                <div className="text-3xl font-bold text-agri-green mb-2">1,250</div>
                <div className="text-sm text-slate-gray/60">Predictions Today</div>
                <div className="text-xs text-sky-teal mt-1">+15% from yesterday</div>
              </div>
              <div className="text-center p-4 bg-slate-gray/5 rounded-lg">
                <div className="text-3xl font-bold text-agri-green mb-2">0.01%</div>
                <div className="text-sm text-slate-gray/60">Error Rate</div>
                <div className="text-xs text-sky-teal mt-1">Well below target</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Performance Metrics */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* API Performance */}
          <Card className="shadow-level1 border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-gray">
                <Globe className="w-4 h-4 mr-2 text-agri-green" />
                API Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-gray/70">Response Time</span>
                  <span className="text-sm font-medium text-slate-gray">45ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-gray/70">Uptime</span>
                  <span className="text-sm font-medium text-agri-green">99.9%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-gray/70">Requests/Hour</span>
                  <span className="text-sm font-medium text-slate-gray">12,450</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blockchain Metrics */}
          <Card className="shadow-level1 border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-gray">
                <HardDrive className="w-4 h-4 mr-2 text-agri-green" />
                Blockchain Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-gray/70">Block Height</span>
                  <span className="text-sm font-medium text-slate-gray">125,430</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-gray/70">Sync Status</span>
                  <span className="text-sm font-medium text-agri-green">100%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-gray/70">Gas Used (24h)</span>
                  <span className="text-sm font-medium text-slate-gray">2.3M</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Oracle Health */}
          <Card className="shadow-level1 border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-gray">
                <Shield className="w-4 h-4 mr-2 text-agri-green" />
                Oracle Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-gray/70">Data Feeds</span>
                  <span className="text-sm font-medium text-agri-green">5/5 Active</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-gray/70">Update Frequency</span>
                  <span className="text-sm font-medium text-slate-gray">Real-time</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-gray/70">Accuracy</span>
                  <span className="text-sm font-medium text-sky-teal">99.8%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Summary */}
        <Card className="shadow-level2 border-0 mt-6">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-gray">
              <Activity className="w-5 h-5 mr-2 text-agri-green" />
              Recent Platform Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-agri-green mb-1">156</div>
                <div className="text-sm text-slate-gray/60">Loans Funded Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-sky-teal mb-1">$89,450</div>
                <div className="text-sm text-slate-gray/60">Volume Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-harvest-gold mb-1">23</div>
                <div className="text-sm text-slate-gray/60">New Farmers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-agri-green mb-1">1,247</div>
                <div className="text-sm text-slate-gray/60">Carbon Credits Minted</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}