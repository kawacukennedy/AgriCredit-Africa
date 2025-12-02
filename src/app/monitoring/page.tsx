'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import {
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  Server,
  Database,
  Cpu,
  HardDrive,
  Zap,
  Eye,
  Lock,
  Unlock,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Globe,
  BarChart3
} from 'lucide-react';
import { BarChart, LineChart } from '@/components/charts';

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: number;
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'offline';
  uptime: number;
  responseTime: number;
  lastChecked: number;
}

interface SecurityAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: number;
  source: string;
  resolved: boolean;
}

interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: number;
  ip: string;
  status: 'success' | 'failed' | 'warning';
}

export default function MonitoringPage() {
  const { address, isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState('overview');
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: 45,
    memory: 62,
    disk: 78,
    network: 23,
    uptime: 99.9
  });
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected) {
      loadMonitoringData();
    }
  }, [isConnected]);

  const loadMonitoringData = async () => {
    setLoading(true);
    try {
      // Mock data - in production, fetch from monitoring API
      const mockServices: ServiceStatus[] = [
        {
          name: 'Backend API',
          status: 'healthy',
          uptime: 99.8,
          responseTime: 145,
          lastChecked: Date.now() - 30000
        },
        {
          name: 'Database',
          status: 'healthy',
          uptime: 99.9,
          responseTime: 12,
          lastChecked: Date.now() - 30000
        },
        {
          name: 'Blockchain Node',
          status: 'warning',
          uptime: 98.5,
          responseTime: 2340,
          lastChecked: Date.now() - 30000
        },
        {
          name: 'IPFS Gateway',
          status: 'healthy',
          uptime: 99.7,
          responseTime: 567,
          lastChecked: Date.now() - 30000
        },
        {
          name: 'IoT Gateway',
          status: 'healthy',
          uptime: 99.6,
          responseTime: 89,
          lastChecked: Date.now() - 30000
        }
      ];

      const mockAlerts: SecurityAlert[] = [
        {
          id: '1',
          type: 'warning',
          title: 'Unusual Login Pattern',
          description: 'Multiple failed login attempts from IP 192.168.1.100',
          timestamp: Date.now() - 3600000,
          source: 'Authentication Service',
          resolved: false
        },
        {
          id: '2',
          type: 'info',
          title: 'System Update Completed',
          description: 'Security patches applied successfully',
          timestamp: Date.now() - 7200000,
          source: 'System Maintenance',
          resolved: true
        },
        {
          id: '3',
          type: 'critical',
          title: 'Database Connection Pool Exhausted',
          description: 'High database load detected, connection pool at 95% capacity',
          timestamp: Date.now() - 1800000,
          source: 'Database Monitor',
          resolved: false
        }
      ];

      const mockAuditLogs: AuditLog[] = [
        {
          id: '1',
          action: 'User Login',
          user: '0x742d...44e',
          timestamp: Date.now() - 300000,
          ip: '192.168.1.50',
          status: 'success'
        },
        {
          id: '2',
          action: 'Contract Deployment',
          user: '0x8ba1...A72',
          timestamp: Date.now() - 600000,
          ip: '192.168.1.75',
          status: 'success'
        },
        {
          id: '3',
          action: 'Failed Login Attempt',
          user: 'unknown',
          timestamp: Date.now() - 900000,
          ip: '192.168.1.100',
          status: 'failed'
        },
        {
          id: '4',
          action: 'Data Export',
          user: '0x9c2d...789',
          timestamp: Date.now() - 1200000,
          ip: '192.168.1.25',
          status: 'success'
        }
      ];

      setServices(mockServices);
      setAlerts(mockAlerts);
      setAuditLogs(mockAuditLogs);
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'error': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'offline': return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      case 'offline': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'warning': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'info': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default: return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getAuditStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            System Monitoring
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Connect your wallet to access system monitoring and security dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Monitoring</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Real-time monitoring, security alerts, and system health dashboard
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'services', label: 'Services', icon: Server },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'audit', label: 'Audit Logs', icon: Eye }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* System Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">CPU Usage</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemMetrics.cpu}%</p>
                  </div>
                  <Cpu className="w-8 h-8 text-blue-600" />
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${systemMetrics.cpu}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Memory Usage</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemMetrics.memory}%</p>
                  </div>
                  <HardDrive className="w-8 h-8 text-green-600" />
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${systemMetrics.memory}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Disk Usage</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemMetrics.disk}%</p>
                  </div>
                  <Database className="w-8 h-8 text-purple-600" />
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${systemMetrics.disk}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Uptime</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{systemMetrics.uptime}%</p>
                  </div>
                  <Activity className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${systemMetrics.uptime}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Status Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Service Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => (
                  <div key={service.name} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getStatusColor(service.status)}`}>
                        {getStatusIcon(service.status)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{service.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {service.uptime}% uptime • {service.responseTime}ms
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(service.status)}`}>
                        {service.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Recent Alerts</h2>
              <div className="space-y-4">
                {alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className={`p-4 border-l-4 rounded-lg ${getAlertColor(alert.type)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={`w-5 h-5 ${
                          alert.type === 'critical' ? 'text-red-600' :
                          alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                        }`} />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{alert.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{alert.description}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {alert.source} • {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {alert.resolved ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Resolved
                          </span>
                        ) : (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            alert.type === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            alert.type === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Service Health Dashboard</h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Uptime
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Response Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Last Checked
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {services.map((service) => (
                      <tr key={service.name}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Server className="w-5 h-5 text-gray-400 mr-3" />
                            <span className="font-medium text-gray-900 dark:text-white">{service.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                            {getStatusIcon(service.status)}
                            <span className="ml-1">{service.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {service.uptime}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {service.responseTime}ms
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(service.lastChecked).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Response Time Trends</h3>
                <div className="h-64">
                  <LineChart
                    data={[
                      { time: '00:00', backend: 145, database: 12, blockchain: 2340 },
                      { time: '04:00', backend: 132, database: 15, blockchain: 2100 },
                      { time: '08:00', backend: 158, database: 18, blockchain: 2450 },
                      { time: '12:00', backend: 142, database: 14, blockchain: 2200 },
                      { time: '16:00', backend: 165, database: 16, blockchain: 2350 },
                      { time: '20:00', backend: 138, database: 13, blockchain: 2150 },
                    ]}
                    xKey="time"
                    yKey="backend"
                    color="#10B981"
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Service Uptime</h3>
                <div className="h-64">
                  <BarChart
                    data={services.map(service => ({
                      service: service.name.split(' ')[0],
                      uptime: service.uptime,
                      color: service.status === 'healthy' ? '#10B981' :
                             service.status === 'warning' ? '#F59E0B' : '#EF4444'
                    }))}
                    xKey="service"
                    yKey="uptime"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Security Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Alerts</p>
                    <p className="text-2xl font-bold text-red-600">{alerts.filter(a => !a.resolved).length}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Security Score</p>
                    <p className="text-2xl font-bold text-green-600">92%</p>
                  </div>
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed Logins (24h)</p>
                    <p className="text-2xl font-bold text-yellow-600">3</p>
                  </div>
                  <Lock className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
            </div>

            {/* Security Alerts */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Security Alerts</h2>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`p-4 border-l-4 rounded-lg ${getAlertColor(alert.type)}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={`w-5 h-5 ${
                          alert.type === 'critical' ? 'text-red-600' :
                          alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                        }`} />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{alert.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{alert.description}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {alert.source} • {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {alert.resolved ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Resolved
                          </span>
                        ) : (
                          <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Audit Logs</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900 dark:text-white">{log.action}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {log.user}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          log.status === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          log.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {log.ip}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}