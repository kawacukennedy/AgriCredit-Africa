'use client';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  Code,
  Server,
  CheckCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  Copy,
  Download,
  Globe,
  Shield,
  Zap
} from 'lucide-react';

export default function ApiPage() {
  const { t } = useTranslation();

  const apiEndpoints = [
    {
      method: 'GET',
      path: '/api/v1/loans',
      description: 'Retrieve loan listings and marketplace data',
      status: 'operational'
    },
    {
      method: 'POST',
      path: '/api/v1/loans',
      description: 'Create a new loan application',
      status: 'operational'
    },
    {
      method: 'GET',
      path: '/api/v1/loans/{id}',
      description: 'Get detailed loan information',
      status: 'operational'
    },
    {
      method: 'POST',
      path: '/api/v1/loans/{id}/fund',
      description: 'Fund a loan application',
      status: 'operational'
    },
    {
      method: 'GET',
      path: '/api/v1/portfolio',
      description: 'Retrieve user investment portfolio',
      status: 'operational'
    },
    {
      method: 'GET',
      path: '/api/v1/carbon/credits',
      description: 'Get carbon credit balances and history',
      status: 'operational'
    },
    {
      method: 'POST',
      path: '/api/v1/auth/login',
      description: 'Authenticate user with wallet signature',
      status: 'operational'
    }
  ];

  const systemStatus = {
    api: { status: 'operational', uptime: '99.9%', latency: '45ms' },
    database: { status: 'operational', uptime: '99.8%', latency: '12ms' },
    blockchain: { status: 'operational', uptime: '99.7%', latency: '2.3s' },
    ai: { status: 'operational', uptime: '99.5%', latency: '850ms' },
    storage: { status: 'operational', uptime: '99.9%', latency: '67ms' }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-agri-green/10 text-agri-green border-agri-green/20';
      case 'degraded': return 'bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20';
      case 'outage': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-gray/10 text-slate-gray border-slate-gray/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return CheckCircle;
      case 'degraded': return AlertTriangle;
      case 'outage': return AlertTriangle;
      default: return Clock;
    }
  };

  return (
    <div className="min-h-screen bg-paper-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-agri-green to-sky-teal text-white py-12">
        <div className="container">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              API Documentation
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Integrate with AgriCredit's REST API and real-time services
            </p>
          </div>
        </div>
      </section>

      <div className="container py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="status">System Status</TabsTrigger>
            <TabsTrigger value="sdks">SDKs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* API Overview */}
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <Globe className="w-5 h-5 mr-2 text-agri-green" />
                  API Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-slate-gray mb-3">Base URL</h3>
                    <div className="flex items-center space-x-2">
                      <code className="bg-slate-gray/10 px-3 py-2 rounded font-mono text-sm">
                        https://api.agricredit.africa/v1
                      </code>
                      <Button variant="ghost" size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-gray mb-3">Authentication</h3>
                    <p className="text-slate-gray/70 text-sm">
                      JWT tokens with wallet-based authentication (EIP-4361)
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-gray mb-3">Rate Limits</h3>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-slate-gray/5 p-3 rounded-lg">
                      <p className="font-medium text-slate-gray">Authenticated Users</p>
                      <p className="text-slate-gray/60">150 requests/minute</p>
                    </div>
                    <div className="bg-slate-gray/5 p-3 rounded-lg">
                      <p className="font-medium text-slate-gray">Anonymous Users</p>
                      <p className="text-slate-gray/60">30 requests/minute</p>
                    </div>
                    <div className="bg-slate-gray/5 p-3 rounded-lg">
                      <p className="font-medium text-slate-gray">WebSocket</p>
                      <p className="text-slate-gray/60">100 messages/minute</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-gray mb-3">Response Format</h3>
                  <div className="bg-slate-gray/5 p-4 rounded-lg">
                    <pre className="text-sm text-slate-gray overflow-x-auto">
{`{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-12-10T10:00:00Z",
    "requestId": "req_123456"
  }
}`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Start */}
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <Zap className="w-5 h-5 mr-2 text-agri-green" />
                  Quick Start
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-agri-green/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-agri-green font-semibold text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-gray">Get API Key</h4>
                      <p className="text-slate-gray/70 text-sm">Register for an API key in your dashboard settings.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-agri-green/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-agri-green font-semibold text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-gray">Authenticate</h4>
                      <p className="text-slate-gray/70 text-sm">Use wallet signature to authenticate and receive JWT token.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-agri-green/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-agri-green font-semibold text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-gray">Make Requests</h4>
                      <p className="text-slate-gray/70 text-sm">Include JWT token in Authorization header for API calls.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="endpoints" className="space-y-6">
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <Code className="w-5 h-5 mr-2 text-agri-green" />
                  API Endpoints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {apiEndpoints.map((endpoint, index) => (
                    <div key={index} className="border border-slate-gray/10 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <Badge className={
                            endpoint.method === 'GET' ? 'bg-sky-teal/10 text-sky-teal' :
                            endpoint.method === 'POST' ? 'bg-agri-green/10 text-agri-green' :
                            'bg-slate-gray/10 text-slate-gray'
                          }>
                            {endpoint.method}
                          </Badge>
                          <code className="font-mono text-sm text-slate-gray">{endpoint.path}</code>
                        </div>
                        <Badge className={getStatusBadge(endpoint.status)}>
                          {endpoint.status}
                        </Badge>
                      </div>
                      <p className="text-slate-gray/70 text-sm">{endpoint.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status" className="space-y-6">
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <Server className="w-5 h-5 mr-2 text-agri-green" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(systemStatus).map(([service, status]) => {
                    const StatusIcon = getStatusIcon(status.status);
                    return (
                      <div key={service} className="flex items-center justify-between p-4 border border-slate-gray/10 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <StatusIcon className={`w-5 h-5 ${
                            status.status === 'operational' ? 'text-agri-green' :
                            status.status === 'degraded' ? 'text-harvest-gold' :
                            'text-red-500'
                          }`} />
                          <div>
                            <p className="font-medium text-slate-gray capitalize">{service}</p>
                            <p className="text-sm text-slate-gray/60">
                              Uptime: {status.uptime} • Latency: {status.latency}
                            </p>
                          </div>
                        </div>
                        <Badge className={getStatusBadge(status.status)}>
                          {status.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sdks" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-level2 border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-gray">
                    <Code className="w-5 h-5 mr-2 text-agri-green" />
                    JavaScript SDK
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-gray/70 mb-4">
                    Official JavaScript SDK for web applications and Node.js.
                  </p>
                  <div className="space-y-3">
                    <div className="bg-slate-gray/5 p-3 rounded font-mono text-sm">
                      npm install @agricredit/sdk
                    </div>
                    <Button variant="outline" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Download SDK
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-level2 border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-gray">
                    <Shield className="w-5 h-5 mr-2 text-agri-green" />
                    Python SDK
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-gray/70 mb-4">
                    Python SDK for AI integrations and backend services.
                  </p>
                  <div className="space-y-3">
                    <div className="bg-slate-gray/5 p-3 rounded font-mono text-sm">
                      pip install agricredit-sdk
                    </div>
                    <Button variant="outline" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Download SDK
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}