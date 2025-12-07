'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  Shield,
  Database,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Globe,
  Cpu,
  HardDrive,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap
} from 'lucide-react';

export default function AdminOraclePage() {
  return (
    <AuthGuard>
      <AdminOracleContent />
    </AuthGuard>
  );
}

function AdminOracleContent() {
  const { t } = useTranslation();

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
      default: return Activity;
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
                Oracle Control Center
              </h1>
              <p className="text-xl opacity-90">
                Monitor and manage data feeds, oracle services, and system integrations
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <Link href="/admin">
                <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                  ← Back to Dashboard
                </Button>
              </Link>
              <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Status
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-8">
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

        {/* Oracle Performance Metrics */}
        <Card className="shadow-level2 border-0 mt-6">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-gray">
              <TrendingUp className="w-5 h-5 mr-2 text-agri-green" />
              Oracle Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-slate-gray/5 rounded-lg">
                <div className="text-3xl font-bold text-agri-green mb-2">99.8%</div>
                <div className="text-sm text-slate-gray/60">Uptime</div>
                <div className="text-xs text-sky-teal mt-1">Last 30 days</div>
              </div>
              <div className="text-center p-4 bg-slate-gray/5 rounded-lg">
                <div className="text-3xl font-bold text-agri-green mb-2">2.3s</div>
                <div className="text-sm text-slate-gray/60">Avg Response Time</div>
                <div className="text-xs text-sky-teal mt-1">-0.2s improvement</div>
              </div>
              <div className="text-center p-4 bg-slate-gray/5 rounded-lg">
                <div className="text-3xl font-bold text-agri-green mb-2">1,250</div>
                <div className="text-sm text-slate-gray/60">Updates Today</div>
                <div className="text-xs text-sky-teal mt-1">+8% from yesterday</div>
              </div>
              <div className="text-center p-4 bg-slate-gray/5 rounded-lg">
                <div className="text-3xl font-bold text-agri-green mb-2">0.01%</div>
                <div className="text-sm text-slate-gray/60">Error Rate</div>
                <div className="text-xs text-sky-teal mt-1">Well below target</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}