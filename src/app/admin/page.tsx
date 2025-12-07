'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { useGetLoansQuery } from '@/store/apiSlice';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Database,
  DollarSign,
  Eye,
  FileText,
  RefreshCw,
  Shield,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  Settings,
  AlertCircle,
  Server,
  Globe,
  Cpu,
  HardDrive,
  Search
} from 'lucide-react';

export default function AdminDashboard() {
  return (
    <AuthGuard>
      <AdminDashboardContent />
    </AuthGuard>
  );
}

function AdminDashboardContent() {
  const { t } = useTranslation();
  const { data: loans, isLoading } = useGetLoansQuery({});

  const stats = {
    totalLoans: loans?.length || 1250,
    activeLoans: loans?.filter((l: any) => l.status === 'funded' || l.status === 'active').length || 890,
    totalVolume: 2500000,
    defaultRate: 2.3,
    totalFarmers: 1250,
    totalInvestors: 340,
    carbonCredits: 50000,
    systemUptime: 99.8
  };

  const systemHealth = {
    api: { status: 'healthy', latency: 45, uptime: 99.9 },
    blockchain: { status: 'healthy', blocks: 125430, sync: 100 },
    ai: { status: 'healthy', models: 3, accuracy: 94.2 },
    database: { status: 'healthy', connections: 45, queries: 1250 },
    oracle: { status: 'warning', pending: 3, lastUpdate: '2 min ago' }
  };

  const handleOracleUpdate = () => {
    // Implement oracle update logic
    console.log('Triggering oracle update...');
  };

  const handleDisputeResolution = (loanId: string) => {
    // Implement dispute resolution logic
    console.log('Resolving dispute for loan:', loanId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-sky-teal/10 text-sky-teal border-sky-teal/20';
      case 'warning': return 'bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20';
      case 'error': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-gray/10 text-slate-gray border-slate-gray/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return AlertCircle;
      default: return Clock;
    }
  };

  return (
    <div className="min-h-screen bg-paper-white">

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-agri-green to-sky-teal text-white py-8">
        <div className="container">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-2">
                Admin Dashboard
              </h1>
              <p className="text-xl opacity-90">
                Monitor system health, manage loans, and oversee platform operations
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
              <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                <Settings className="w-4 h-4 mr-2" />
                System Settings
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray mb-1">
                    {stats.totalLoans.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-gray/60">Total Loans</p>
                </div>
                <div className="w-12 h-12 bg-agri-green/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-agri-green" />
                </div>
              </div>
              <div className="flex items-center mt-3">
                <Badge className="bg-sky-teal/10 text-sky-teal border-sky-teal/20 text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12%
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray mb-1">
                    ${stats.totalVolume.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-gray/60">Total Volume</p>
                </div>
                <div className="w-12 h-12 bg-sky-teal/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-sky-teal" />
                </div>
              </div>
              <div className="flex items-center mt-3">
                <Badge className="bg-agri-green/10 text-agri-green border-agri-green/20 text-xs">
                  +$450K this month
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray mb-1">
                    {stats.totalFarmers.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-gray/60">Active Farmers</p>
                </div>
                <div className="w-12 h-12 bg-harvest-gold/10 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-harvest-gold" />
                </div>
              </div>
              <div className="flex items-center mt-3">
                <Badge className="bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20 text-xs">
                  +85 this week
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray mb-1">
                    {stats.systemUptime}%
                  </p>
                  <p className="text-sm text-slate-gray/60">System Uptime</p>
                </div>
                <div className="w-12 h-12 bg-agri-green/10 rounded-xl flex items-center justify-center">
                  <Server className="w-6 h-6 text-agri-green" />
                </div>
              </div>
              <div className="flex items-center mt-3">
                <Badge className="bg-sky-teal/10 text-sky-teal border-sky-teal/20 text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Excellent
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {Object.entries(systemHealth).map(([service, health]) => {
            const StatusIcon = getStatusIcon(health.status);
            return (
              <Card key={service} className="shadow-level1 border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 bg-agri-green/10 rounded-lg flex items-center justify-center">
                      {service === 'api' && <Globe className="w-4 h-4 text-agri-green" />}
                      {service === 'blockchain' && <Database className="w-4 h-4 text-agri-green" />}
                      {service === 'ai' && <Cpu className="w-4 h-4 text-agri-green" />}
                      {service === 'database' && <HardDrive className="w-4 h-4 text-agri-green" />}
                      {service === 'oracle' && <Shield className="w-4 h-4 text-agri-green" />}
                    </div>
                    <Badge className={getStatusBadge(health.status)}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {health.status}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-slate-gray capitalize mb-2">{service}</h4>
                   <div className="space-y-1 text-xs text-slate-gray/60">
                     {service === 'api' && 'latency' in health && <div>Latency: {health.latency}ms</div>}
                     {service === 'blockchain' && 'blocks' in health && <div>Blocks: {health.blocks.toLocaleString()}</div>}
                     {service === 'ai' && 'accuracy' in health && <div>Accuracy: {health.accuracy}%</div>}
                     {service === 'database' && 'connections' in health && <div>Connections: {health.connections}</div>}
                     {service === 'oracle' && 'pending' in health && <div>Pending: {health.pending}</div>}
                   </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="loans">Loan Management</TabsTrigger>
            <TabsTrigger value="oracle">Oracle Control</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Recent Activity & Alerts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="shadow-level2 border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-gray">
                    <Activity className="w-5 h-5 mr-2 text-agri-green" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-agri-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-agri-green" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-gray">15 new loan applications</p>
                        <p className="text-xs text-slate-gray/60">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-sky-teal/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-4 h-4 text-sky-teal" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-gray">8 loans funded ($45,000)</p>
                        <p className="text-xs text-slate-gray/60">15 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-harvest-gold/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-harvest-gold" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-gray">3 repayments processed</p>
                        <p className="text-xs text-slate-gray/60">1 hour ago</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-agri-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-4 h-4 text-agri-green" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-gray">2 carbon credits minted</p>
                        <p className="text-xs text-slate-gray/60">3 hours ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-level2 border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-gray">
                    <AlertTriangle className="w-5 h-5 mr-2 text-harvest-gold" />
                    System Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-harvest-gold/5 border border-harvest-gold/20 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-harvest-gold mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-gray">Oracle Latency Spike</h4>
                          <p className="text-sm text-slate-gray/70">Response time increased by 45% in last hour</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge className="bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20 text-xs">
                              Medium Priority
                            </Badge>
                            <span className="text-xs text-slate-gray/60">5 min ago</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-gray/5 border border-slate-gray/20 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Clock className="w-5 h-5 text-slate-gray mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-gray">Pending KYC Reviews</h4>
                          <p className="text-sm text-slate-gray/70">12 farmer applications awaiting verification</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge className="bg-slate-gray/10 text-slate-gray border-slate-gray/20 text-xs">
                              Low Priority
                            </Badge>
                            <span className="text-xs text-slate-gray/60">2 hours ago</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-sky-teal/5 border border-sky-teal/20 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-sky-teal mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-gray">AI Model Updated</h4>
                          <p className="text-sm text-slate-gray/70">Credit scoring model retrained with new data</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge className="bg-sky-teal/10 text-sky-teal border-sky-teal/20 text-xs">
                              Info
                            </Badge>
                            <span className="text-xs text-slate-gray/60">1 day ago</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <BarChart3 className="w-5 h-5 mr-2 text-agri-green" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-gray/70">Default Rate</span>
                      <span className="text-sm font-medium text-slate-gray">{stats.defaultRate}%</span>
                    </div>
                    <Progress value={stats.defaultRate * 10} className="h-2" />
                    <p className="text-xs text-slate-gray/60">Target: {'<'}2.5%</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-gray/70">Repayment Rate</span>
                      <span className="text-sm font-medium text-agri-green">97.5%</span>
                    </div>
                    <Progress value={97.5} className="h-2" />
                    <p className="text-xs text-slate-gray/60">Above target</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-gray/70">Avg. Processing Time</span>
                      <span className="text-sm font-medium text-slate-gray">2.3 days</span>
                    </div>
                    <Progress value={75} className="h-2" />
                    <p className="text-xs text-slate-gray/60">Target: {'<'}3 days</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-gray/70">Carbon Credits Minted</span>
                      <span className="text-sm font-medium text-agri-green">{stats.carbonCredits.toLocaleString()}</span>
                    </div>
                    <Progress value={85} className="h-2" />
                    <p className="text-xs text-slate-gray/60">Monthly target</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loans" className="space-y-6">
            {/* Loan Filters and Search */}
            <Card className="shadow-level1 border-0">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search loans..."
                        className="pl-10 pr-4 py-2 border border-slate-gray/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-agri-green/20"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-gray/40 w-4 h-4" />
                    </div>
                    <select className="px-3 py-2 border border-slate-gray/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-agri-green/20">
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="funded">Funded</option>
                      <option value="active">Active</option>
                      <option value="repaid">Repaid</option>
                      <option value="defaulted">Defaulted</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-gray/60">
                      {stats.totalLoans} total loans
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loan List */}
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <FileText className="w-5 h-5 mr-2 text-agri-green" />
                  Loan Management ({stats.activeLoans} active)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="p-6 border border-slate-gray/10 rounded-xl animate-pulse">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="h-4 bg-slate-gray/10 rounded w-48"></div>
                            <div className="h-3 bg-slate-gray/10 rounded w-32"></div>
                          </div>
                          <div className="h-6 bg-slate-gray/10 rounded w-16"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {loans && loans.slice(0, 10).map((loan: any) => (
                      <div key={loan.id} className="p-6 border border-slate-gray/10 rounded-xl hover:shadow-level1 transition-all duration-200 group">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-agri-green to-sky-teal rounded-lg flex items-center justify-center">
                              <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-gray group-hover:text-agri-green transition-colors">
                                Loan #{loan.id}
                              </h3>
                              <p className="text-sm text-slate-gray/60">
                                ${loan.principal_cents ? loan.principal_cents / 100 : loan.amount || 0} •
                                AI Score: {loan.ai_score || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge className={
                              loan.status === 'funded' ? 'bg-sky-teal/10 text-sky-teal border-sky-teal/20' :
                              loan.status === 'pending' ? 'bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20' :
                              loan.status === 'repaid' ? 'bg-agri-green/10 text-agri-green border-agri-green/20' :
                              'bg-slate-gray/10 text-slate-gray border-slate-gray/20'
                            }>
                              {loan.status}
                            </Badge>
                            <Button size="sm" variant="outline" className="border-slate-gray/20 hover:border-agri-green hover:text-agri-green">
                              <Eye className="w-4 h-4 mr-2" />
                              Review
                            </Button>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-slate-gray/60">Borrower:</span>
                            <span className="ml-2 font-medium">John Doe</span>
                          </div>
                          <div>
                            <span className="text-slate-gray/60">Applied:</span>
                            <span className="ml-2 font-medium">Jan 15, 2024</span>
                          </div>
                          <div>
                            <span className="text-slate-gray/60">Risk Level:</span>
                            <Badge className="ml-2 bg-slate-gray/10 text-slate-gray border-slate-gray/20 text-xs">
                              Low
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="oracle" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Oracle Console */}
              <Card className="shadow-level2 border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-gray">
                    <Shield className="w-5 h-5 mr-2 text-agri-green" />
                    Oracle Console
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-gray/5 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-gray/70">Status</span>
                        <Badge className={getStatusBadge(systemHealth.oracle.status)}>
                          {systemHealth.oracle.status}
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold text-slate-gray">
                        {systemHealth.oracle.pending}
                      </div>
                      <div className="text-xs text-slate-gray/60">Pending Updates</div>
                    </div>

                    <div className="p-4 bg-slate-gray/5 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-gray/70">Last Update</span>
                        <span className="text-xs text-slate-gray/60">{systemHealth.oracle.lastUpdate}</span>
                      </div>
                      <div className="text-2xl font-bold text-slate-gray">
                        2.3s
                      </div>
                      <div className="text-xs text-slate-gray/60">Avg Latency</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-gray">Recent Oracle Activity</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between p-3 bg-slate-gray/5 rounded-lg">
                        <span>AI Score Update - Loan #1234</span>
                        <Badge className="bg-sky-teal/10 text-sky-teal border-sky-teal/20 text-xs">Success</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-gray/5 rounded-lg">
                        <span>Carbon Credit Verification</span>
                        <Badge className="bg-sky-teal/10 text-sky-teal border-sky-teal/20 text-xs">Success</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-gray/5 rounded-lg">
                        <span>Weather Data Feed</span>
                        <Badge className="bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20 text-xs">Pending</Badge>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full btn-primary" onClick={handleOracleUpdate}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Trigger Manual Update
                  </Button>
                </CardContent>
              </Card>

              {/* Data Feeds */}
              <Card className="shadow-level2 border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-gray">
                    <Database className="w-5 h-5 mr-2 text-agri-green" />
                    Data Feed Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'Satellite NDVI', status: 'healthy', lastUpdate: '1 min ago', frequency: 'Daily' },
                      { name: 'Weather Data', status: 'healthy', lastUpdate: '5 min ago', frequency: 'Hourly' },
                      { name: 'Market Prices', status: 'warning', lastUpdate: '2 hours ago', frequency: 'Daily' },
                      { name: 'IoT Sensors', status: 'healthy', lastUpdate: '30 sec ago', frequency: 'Real-time' },
                      { name: 'Carbon Registry', status: 'healthy', lastUpdate: '15 min ago', frequency: 'Weekly' }
                    ].map((feed, index) => {
                      const StatusIcon = getStatusIcon(feed.status);
                      return (
                        <div key={index} className="flex items-center justify-between p-4 border border-slate-gray/10 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              feed.status === 'healthy' ? 'bg-sky-teal/10' : 'bg-harvest-gold/10'
                            }`}>
                              <StatusIcon className={`w-4 h-4 ${
                                feed.status === 'healthy' ? 'text-sky-teal' : 'text-harvest-gold'
                              }`} />
                            </div>
                            <div>
                              <p className="font-medium text-slate-gray">{feed.name}</p>
                              <p className="text-xs text-slate-gray/60">
                                {feed.frequency} • Updated {feed.lastUpdate}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusBadge(feed.status)}>
                            {feed.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="disputes" className="space-y-6">
            {/* Dispute Filters */}
            <Card className="shadow-level1 border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <select className="px-3 py-2 border border-slate-gray/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-agri-green/20">
                      <option value="all">All Disputes</option>
                      <option value="urgent">Urgent</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <select className="px-3 py-2 border border-slate-gray/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-agri-green/20">
                      <option value="all">All Types</option>
                      <option value="payment">Payment</option>
                      <option value="verification">Verification</option>
                      <option value="contract">Contract</option>
                    </select>
                  </div>
                  <div className="text-sm text-slate-gray/60">
                    5 active disputes
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disputes List */}
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <AlertTriangle className="w-5 h-5 mr-2 text-harvest-gold" />
                  Dispute Resolution Center
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    {
                      id: '1234',
                      type: 'payment',
                      title: 'Loan Repayment Dispute',
                      description: 'Farmer claims payment was made but not recorded in system',
                      priority: 'urgent',
                      status: 'investigating',
                      submitted: '2 hours ago',
                      amount: 250,
                      parties: ['John Doe', 'System']
                    },
                    {
                      id: '5678',
                      type: 'verification',
                      title: 'Carbon Credit Verification',
                      description: 'Discrepancy in satellite data verification for carbon sequestration',
                      priority: 'medium',
                      status: 'evidence_review',
                      submitted: '1 day ago',
                      amount: null,
                      parties: ['Jane Smith', 'Oracle Service']
                    },
                    {
                      id: '9012',
                      type: 'contract',
                      title: 'Loan Terms Dispute',
                      description: 'Borrower disputes interest rate calculation',
                      priority: 'low',
                      status: 'pending',
                      submitted: '3 days ago',
                      amount: 1800,
                      parties: ['Michael Brown', 'Lending Protocol']
                    }
                  ].map((dispute) => (
                    <div key={dispute.id} className="p-6 border border-slate-gray/10 rounded-xl">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-gray">
                              {dispute.title} #{dispute.id}
                            </h3>
                            <Badge className={
                              dispute.priority === 'urgent' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                              dispute.priority === 'medium' ? 'bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20' :
                              'bg-slate-gray/10 text-slate-gray border-slate-gray/20'
                            }>
                              {dispute.priority}
                            </Badge>
                            <Badge className="bg-slate-gray/10 text-slate-gray border-slate-gray/20 capitalize">
                              {dispute.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-slate-gray/70 mb-3">{dispute.description}</p>
                          <div className="flex items-center space-x-6 text-sm text-slate-gray/60">
                            <span>Submitted: {dispute.submitted}</span>
                            {dispute.amount && <span>Amount: ${dispute.amount}</span>}
                            <span>Parties: {dispute.parties.join(', ')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-gray/20 hover:border-agri-green hover:text-agri-green"
                          onClick={() => handleDisputeResolution(dispute.id)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Review Evidence
                        </Button>
                        <Button size="sm" className="btn-primary">
                          Resolve Dispute
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Performance Charts */}
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
                      <p className="text-slate-gray/60">Performance charts</p>
                      <p className="text-sm text-slate-gray/50">Coming soon</p>
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
                      { country: 'Kenya', loans: 450, percentage: 36 },
                      { country: 'Nigeria', loans: 320, percentage: 26 },
                      { country: 'Ghana', loans: 180, percentage: 15 },
                      { country: 'Tanzania', loans: 120, percentage: 10 },
                      { country: 'Uganda', loans: 100, percentage: 8 },
                      { country: 'Others', loans: 80, percentage: 5 }
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
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Model Performance */}
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <Cpu className="w-5 h-5 mr-2 text-agri-green" />
                  AI Model Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}