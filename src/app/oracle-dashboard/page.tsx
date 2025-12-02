'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/hooks/useWallet';
import { TrendingUp, TrendingDown, Activity, Clock, Shield, RefreshCw } from 'lucide-react';

interface OracleFeed {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  lastUpdate: number;
  source: string;
  status: 'active' | 'inactive' | 'error';
  confidence: number;
}

export default function OracleDashboardPage() {
  const { address, isConnected } = useWallet();
  const [feeds, setFeeds] = useState<OracleFeed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (isConnected) {
      loadOracleFeeds();
    }
  }, [isConnected]);

  const loadOracleFeeds = async () => {
    setIsLoading(true);
    try {
      // Mock data - in production, fetch from API
      const mockFeeds: OracleFeed[] = [
        {
          id: '1',
          name: 'Maize Price',
          symbol: 'MAIZE',
          price: 285.50,
          change24h: 2.3,
          volume24h: 125000,
          lastUpdate: Date.now() - 5 * 60 * 1000, // 5 minutes ago
          source: 'Chainlink',
          status: 'active',
          confidence: 98.5
        },
        {
          id: '2',
          name: 'Wheat Price',
          symbol: 'WHEAT',
          price: 245.80,
          change24h: -1.2,
          volume24h: 89000,
          lastUpdate: Date.now() - 3 * 60 * 1000, // 3 minutes ago
          source: 'Chainlink',
          status: 'active',
          confidence: 97.8
        },
        {
          id: '3',
          name: 'Rice Price',
          symbol: 'RICE',
          price: 320.25,
          change24h: 0.8,
          volume24h: 156000,
          lastUpdate: Date.now() - 8 * 60 * 1000, // 8 minutes ago
          source: 'Chainlink',
          status: 'active',
          confidence: 99.1
        },
        {
          id: '4',
          name: 'Coffee Price',
          symbol: 'COFFEE',
          price: 185.90,
          change24h: 3.7,
          volume24h: 67000,
          lastUpdate: Date.now() - 12 * 60 * 1000, // 12 minutes ago
          source: 'Chainlink',
          status: 'active',
          confidence: 96.4
        },
        {
          id: '5',
          name: 'Fertilizer Index',
          symbol: 'FERT',
          price: 142.30,
          change24h: -0.5,
          volume24h: 45000,
          lastUpdate: Date.now() - 15 * 60 * 1000, // 15 minutes ago
          source: 'Tellor',
          status: 'active',
          confidence: 94.7
        },
        {
          id: '6',
          name: 'Weather Risk Index',
          symbol: 'WRI',
          price: 67.85,
          change24h: -2.1,
          volume24h: 23000,
          lastUpdate: Date.now() - 7 * 60 * 1000, // 7 minutes ago
          source: 'Tellor',
          status: 'active',
          confidence: 92.3
        }
      ];

      setFeeds(mockFeeds);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load oracle feeds:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'inactive': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'error': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;

    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Oracle Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Connect your wallet to view decentralized oracle price feeds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Oracle Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Real-time price feeds from decentralized oracles
              </p>
            </div>
            <div className="flex items-center gap-4">
              {lastUpdate && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </div>
              )}
              <button
                onClick={loadOracleFeeds}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Oracle Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Feeds</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {feeds.filter(f => f.status === 'active').length}
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Confidence</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(feeds.reduce((sum, f) => sum + f.confidence, 0) / feeds.length).toFixed(1)}%
                </p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Volume</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${(feeds.reduce((sum, f) => sum + f.volume24h, 0) / 1000).toFixed(0)}K
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sources</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Set(feeds.map(f => f.source)).size}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Oracle Feeds Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Price Feeds</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    24h Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Confidence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Last Update
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {feeds.map((feed) => (
                  <motion.tr
                    key={feed.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {feed.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {feed.symbol}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ${feed.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium flex items-center gap-1 ${
                        feed.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {feed.change24h >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {feed.change24h >= 0 ? '+' : ''}{feed.change24h.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        ${(feed.volume24h / 1000).toFixed(0)}K
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {feed.confidence.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {feed.source}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(feed.status)}`}>
                        {feed.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTimeAgo(feed.lastUpdate)}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Oracle Network Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Network Security
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Active Oracles:</span>
                <span className="font-medium">24</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Median Response Time:</span>
                <span className="font-medium">2.3s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Uptime:</span>
                <span className="font-medium text-green-600">99.97%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Data Freshness:</span>
                <span className="font-medium text-green-600">Excellent</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Maize price updated
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    2 minutes ago
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    New oracle joined network
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    15 minutes ago
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Price deviation detected
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    1 hour ago
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}