'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import {
  Shield,
  Users,
  TrendingUp,
  AlertTriangle,
  Settings,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Activity,
  BarChart3,
  Database,
  Zap
} from 'lucide-react';

interface SystemMetrics {
  totalUsers: number;
  activeLoans: number;
  totalValueLocked: number;
  oracleFeeds: number;
  pendingDisputes: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

interface OracleFeed {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  lastUpdate: number;
  value: string;
  source: string;
}

interface Dispute {
  id: string;
  type: 'loan_default' | 'oracle_dispute' | 'identity_verification';
  status: 'pending' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
  description: string;
}

export default function AdminDashboard() {
  const { address, isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [oracleFeeds, setOracleFeeds] = useState<OracleFeed[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'oracles', label: 'Oracle Control', icon: Database },
    { id: 'disputes', label: 'Dispute Resolution', icon: AlertTriangle },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'system', label: 'System Settings', icon: Settings },
  ];

  useEffect(() => {
    if (isConnected) {
      loadDashboardData();
    }
  }, [isConnected]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Mock data - in production, fetch from API
      setMetrics({
        totalUsers: 15420,
        activeLoans: 2341,
        totalValueLocked: 12500000,
        oracleFeeds: 12,
        pendingDisputes: 8,
        systemHealth: 'healthy'
      });

      setOracleFeeds([
        {
          id: '1',
          name: 'Chainlink ETH/USD',
          status: 'active',
          lastUpdate: Date.now() - 300000, // 5 minutes ago
          value: '2,850.50',
          source: 'Chainlink'
        },
        {
          id: '2',
          name: 'Weather API - Nairobi',
          status: 'active',
          lastUpdate: Date.now() - 180000, // 3 minutes ago
          value: '24°C, 65% humidity',
          source: 'OpenWeather'
        },
        {
          id: '3',
          name: 'Corn Price Index',
          status: 'warning',
          lastUpdate: Date.now() - 900000, // 15 minutes ago
          value: '$4.25/bushel',
          source: 'Alphavantage'
        }
      ]);

      setDisputes([
        {
          id: '1',
          type: 'loan_default',
          status: 'pending',
          priority: 'high',
          createdAt: Date.now() - 3600000, // 1 hour ago
          description: 'Borrower failed to repay loan #1234 within grace period'
        },
        {
          id: '2',
          type: 'oracle_dispute',
          status: 'pending',
          priority: 'medium',
          createdAt: Date.now() - 7200000, // 2 hours ago
          description: 'Discrepancy in weather data between Chainlink and API3'
        }
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock admin check - in production, verify admin role
  const isAdmin = address && address.toLowerCase().startsWith('0x123');

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Admin Access Required
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Please connect your admin wallet to access the governance dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            You do not have admin privileges to access this dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Governance Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Monitor system health, manage oracles, and resolve disputes
          </p>
        </div>

        {/* System Health Indicator */}
        <div className="mb-6">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            metrics?.systemHealth === 'healthy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
            metrics?.systemHealth === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            <Activity className="w-4 h-4" />
            System Status: {metrics?.systemHealth === 'healthy' ? 'Healthy' :
                           metrics?.systemHealth === 'warning' ? 'Warning' : 'Critical'}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {metrics?.totalUsers.toLocaleString() || 'Loading...'}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Loans</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {metrics?.activeLoans.toLocaleString() || 'Loading...'}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">TVL</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${(metrics?.totalValueLocked || 0).toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Disputes</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {metrics?.pendingDisputes || 0}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'oracles' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Oracle Feed Management
                </h2>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                  Add Oracle Feed
                </button>
              </div>

              <div className="space-y-4">
                {oracleFeeds.map((feed) => (
                  <div key={feed.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{feed.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Source: {feed.source}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          feed.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          feed.status === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {feed.status}
                        </span>
                        <button className="text-gray-400 hover:text-gray-600">
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Current Value:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">{feed.value}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Last Update:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {new Date(feed.lastUpdate).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'disputes' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Dispute Resolution Center
              </h2>

              <div className="space-y-4">
                {disputes.map((dispute) => (
                  <div key={dispute.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            Dispute #{dispute.id}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            dispute.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            dispute.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            {dispute.priority} priority
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{dispute.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          dispute.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          dispute.status === 'resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {dispute.status}
                        </span>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors">
                          Review
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(dispute.createdAt).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        {dispute.type.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                User Management
              </h2>
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                  User Management Features
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  User verification, role management, and analytics coming soon.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                System Settings
              </h2>
              <div className="text-center py-8">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                  System Configuration
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Protocol parameters, risk settings, and maintenance tools coming soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}