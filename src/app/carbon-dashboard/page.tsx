'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Leaf,
  TrendingUp,
  DollarSign,
  Activity,
  Award,
  Zap,
  BarChart3,
  RefreshCw,
  Plus,
  Minus,
  Target,
  Globe,
  TreePine,
  Car,
  Home,
  Zap as Lightning
} from 'lucide-react';
import { CustomLineChart, CustomBarChart, CustomAreaChart } from '@/components/charts';
import {
  getCarbonDashboard,
  submitClimateData,
  generateCarbonCredit,
  stakeCarbonTokens,
  claimStakingRewards,
  retireCarbonCredits,
  getMarketAnalytics,
  getCarbonCredits,
  CarbonCredit,
  connectWebSocket,
  onWebSocketMessage,
  disconnectWebSocket
} from '@/lib/api';
import { useWallet } from '@/hooks/useWallet';

export default function CarbonDashboard() {
  const { address, isConnected } = useWallet();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [marketData, setMarketData] = useState<any>(null);
  const [carbonCredits, setCarbonCredits] = useState<CarbonCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [showRetireModal, setShowRetireModal] = useState(false);
  const [showClimateModal, setShowClimateModal] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('');
  const [retireCreditId, setRetireCreditId] = useState('');
  const [climateData, setClimateData] = useState({
    satellite_data: {},
    iot_sensors: {},
    location: '',
    area_hectares: ''
  });
  const [isStaking, setIsStaking] = useState(false);
  const [isRetiring, setIsRetiring] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }
    loadDashboardData();

    // Connect to WebSocket for real-time carbon updates
    connectWebSocket(1, 'carbon_dashboard'); // Using dummy user ID

    // Listen for carbon-related updates
    onWebSocketMessage('carbon_update', (data: any) => {
      console.log('Received carbon update:', data);
      // Refresh data when carbon updates are received
      loadDashboardData();
    });

    return () => {
      disconnectWebSocket();
    };
  }, [isConnected, address]);

  const loadDashboardData = async () => {
    if (!address) return;

    try {
      setLoading(true);
      const [dashboard, market, credits] = await Promise.allSettled([
        getCarbonDashboard(address),
        getMarketAnalytics(),
        getCarbonCredits()
      ]);

      if (dashboard.status === 'fulfilled') {
        setDashboardData(dashboard.value);
      }
      if (market.status === 'fulfilled') {
        setMarketData(market.value);
      }
      if (credits.status === 'fulfilled') {
        setCarbonCredits(credits.value);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStakeTokens = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsStaking(true);
    try {
      const result = await stakeCarbonTokens(address, parseFloat(stakeAmount));
      if (result.success) {
        alert('Tokens staked successfully!');
        setShowStakeModal(false);
        setStakeAmount('');
        loadDashboardData();
      } else {
        alert(`Staking failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Staking failed:', error);
      alert('Staking failed. Please try again.');
    } finally {
      setIsStaking(false);
    }
  };

  const handleClaimRewards = async () => {
    try {
      const result = await claimStakingRewards(address);
      if (result.success) {
        alert(`Rewards claimed: ${result.rewards_claimed} CARBT`);
        loadDashboardData();
      } else {
        alert(`Claiming failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Claiming rewards failed:', error);
      alert('Claiming rewards failed. Please try again.');
    }
  };

  const handleRetireCredit = async () => {
    if (!retireCreditId) {
      alert('Please enter a credit ID');
      return;
    }

    setIsRetiring(true);
    try {
      const result = await retireCarbonCredits(address, parseInt(retireCreditId));
      if (result.success) {
        alert('Carbon credit retired successfully!');
        setShowRetireModal(false);
        setRetireCreditId('');
        loadDashboardData();
      } else {
        alert(`Retirement failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Retirement failed:', error);
      alert('Retirement failed. Please try again.');
    } finally {
      setIsRetiring(false);
    }
  };

  const handleSubmitClimateData = async () => {
    if (!climateData.location || !climateData.area_hectares) {
      alert('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await submitClimateData({
        satellite_data: climateData.satellite_data,
        iot_sensors: climateData.iot_sensors,
        location: climateData.location,
        area_hectares: parseFloat(climateData.area_hectares)
      });

      if (result.success) {
        alert('Climate data submitted successfully! Analysis in progress...');
        setShowClimateModal(false);
        setClimateData({
          satellite_data: {},
          iot_sensors: {},
          location: '',
          area_hectares: ''
        });
        loadDashboardData();
      } else {
        alert(`Climate data submission failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Climate data submission failed:', error);
      alert('Climate data submission failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCredit = async (analysisId: number) => {
    setIsGenerating(true);
    try {
      const result = await generateCarbonCredit(analysisId);
      if (result.success) {
        alert(`Carbon credit generated successfully! Amount: ${result.amount}`);
        loadDashboardData();
      } else {
        alert(`Credit generation failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Credit generation failed:', error);
      alert('Credit generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Connecting to wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Leaf className="w-8 h-8 text-teal-600" />
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Carbon Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              {lastUpdate && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Updated {lastUpdate.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={loadDashboardData}
                disabled={loading}
                className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowStakeModal(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Stake
                </button>
                <button
                  onClick={() => setShowRetireModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <Award className="w-4 h-4" />
                  Retire
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'portfolio', label: 'Portfolio', icon: Target },
              { id: 'marketplace', label: 'Marketplace', icon: Globe },
              { id: 'nfts', label: 'Carbon NFTs', icon: Award },
              { id: 'staking', label: 'Staking', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="container mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Impact Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <TreePine className="w-5 h-5 text-teal-600" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">CO2 Sequestered</h3>
                  </div>
                  {loading ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-teal-600">
                        {dashboardData?.total_co2_sequestered?.toFixed(1) || '0'} tons
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total environmental impact</p>
                    </>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">CARBT Balance</h3>
                  </div>
                  {loading ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-green-600">
                        {dashboardData?.total_carbon_tokens?.toFixed(0) || '0'}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Available tokens</p>
                    </>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Staking Rewards</h3>
                  </div>
                  {loading ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-blue-600">
                        {dashboardData?.staking_info?.rewards?.toFixed(2) || '0'}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Pending rewards</p>
                    </>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Impact Score</h3>
                  </div>
                  {loading ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-purple-600">
                        {dashboardData?.environmental_impact?.impact_score || 0}%
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Sustainability rating</p>
                    </>
                  )}
                </motion.div>
              </div>

              {/* Environmental Impact Visualization */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-8"
              >
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Environmental Impact</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <TreePine className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardData?.environmental_impact?.trees_equivalent?.toFixed(0) || 0}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Trees equivalent</p>
                  </div>
                  <div className="text-center">
                    <Car className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">
                      {dashboardData?.environmental_impact?.cars_off_road?.toFixed(1) || 0}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Cars off road/year</p>
                  </div>
                  <div className="text-center">
                    <Home className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">
                      {dashboardData?.environmental_impact?.homes_electricity?.toFixed(0) || 0}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Homes powered/year</p>
                  </div>
                  <div className="text-center">
                    <Lightning className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">
                      {dashboardData?.total_co2_sequestered?.toFixed(1) || 0}t
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">CO2 sequestered</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

            {activeTab === 'portfolio' && (
              <motion.div
                key="portfolio"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Portfolio Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Portfolio Value</h3>
                    </div>
                    <div className="text-3xl font-bold text-green-600">
                      ${(dashboardData?.portfolio_value || 0).toFixed(2)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total value in USD</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">24h Change</h3>
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                      +{(dashboardData?.portfolio_change_24h || 0).toFixed(2)}%
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Performance today</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-purple-600" />
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Risk Score</h3>
                    </div>
                    <div className="text-3xl font-bold text-purple-600">
                      {dashboardData?.risk_score || 0}/100
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Portfolio risk level</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-5 h-5 text-teal-600" />
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Total Credits</h3>
                    </div>
                    <div className="text-3xl font-bold text-teal-600">
                      {carbonCredits.length}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Carbon credits owned</p>
                  </motion.div>
                </div>

                {/* Carbon Credits Portfolio */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Carbon Credits Portfolio</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowClimateModal(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Generate
                      </button>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Trade
                      </button>
                    </div>
                  </div>

                  {carbonCredits.length > 0 ? (
                    <div className="space-y-4">
                      {carbonCredits.map((credit) => (
                        <div key={credit.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Award className="w-5 h-5 text-green-600" />
                                <span className="font-medium text-gray-800 dark:text-white">
                                  Credit #{credit.id}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  credit.transaction_type === 'minted' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                  credit.transaction_type === 'transferred' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                }`}>
                                  {credit.transaction_type}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Amount:</span>
                                  <span className="ml-1 font-medium">{credit.amount} CARBT</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Value:</span>
                                  <span className="ml-1 font-medium text-green-600">${(credit.amount * (marketData?.current_price || 2.45)).toFixed(2)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Status:</span>
                                  <span className="ml-1 font-medium text-teal-600">Active</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Date:</span>
                                  <span className="ml-1 font-medium">{new Date(credit.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm">
                                Trade
                              </button>
                              <button
                                onClick={() => setShowRetireModal(true)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                              >
                                Retire
                              </button>
                            </div>
                          </div>

                          {credit.verification_proof && (
                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <details>
                                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Verification Details
                                </summary>
                                <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                  {JSON.stringify(credit.verification_proof, null, 2)}
                                </pre>
                              </details>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-xl font-medium text-gray-800 dark:text-white mb-2">No Carbon Credits Yet</h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        Start building your carbon portfolio by submitting climate data to generate verified carbon credits.
                      </p>
                      <button
                        onClick={() => setShowClimateModal(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg transition-colors font-medium"
                      >
                        Generate Your First Carbon Credits
                      </button>
                    </div>
                  )}
                </div>

                {/* Portfolio Analytics */}
                {carbonCredits.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Asset Allocation</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Carbon Credits</span>
                          <span className="text-sm font-medium">100%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="bg-teal-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Performance Metrics</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">+12.5%</div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">7-Day Return</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">+8.3%</div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">30-Day Return</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

          {activeTab === 'staking' && (
            <motion.div
              key="staking"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Staking Overview</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Staked CARBT:</span>
                      <span className="font-medium">{dashboardData?.staking_info?.staked?.toFixed(2) || '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Pending Rewards:</span>
                      <span className="font-medium text-green-600">{dashboardData?.staking_info?.rewards?.toFixed(2) || '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">APY:</span>
                      <span className="font-medium">5%</span>
                    </div>
                  </div>
                  <button
                    onClick={handleClaimRewards}
                    disabled={!dashboardData?.staking_info?.rewards || dashboardData.staking_info.rewards <= 0}
                    className="w-full mt-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Claim Rewards
                  </button>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Staking Calculator</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Stake Amount (CARBT)
                      </label>
                      <input
                        type="number"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                        placeholder="Enter amount to stake"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>Estimated annual rewards: {(parseFloat(stakeAmount || '0') * 0.05).toFixed(2)} CARBT</p>
                    </div>
                    <button
                      onClick={handleStakeTokens}
                      disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) <= 0}
                      className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      {isStaking ? 'Staking...' : 'Stake Tokens'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

           {activeTab === 'marketplace' && (
             <motion.div
               key="marketplace"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               className="space-y-6"
             >
               {/* Market Analytics */}
               <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                 <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Carbon Market Analytics</h3>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <div className="text-center">
                     <div className="text-2xl font-bold text-teal-600 mb-2">
                       ${marketData?.current_price?.toFixed(2) || '0.00'}
                     </div>
                     <p className="text-sm text-gray-600 dark:text-gray-400">CARBT Price</p>
                   </div>
                   <div className="text-center">
                     <div className="text-2xl font-bold text-green-600 mb-2">
                       {marketData?.total_supply?.toFixed(0) || '0'}
                     </div>
                     <p className="text-sm text-gray-600 dark:text-gray-400">Total Supply</p>
                   </div>
                   <div className="text-center">
                     <div className="text-2xl font-bold text-blue-600 mb-2">
                       {marketData?.trading_volume_24h?.toFixed(0) || '0'}
                     </div>
                     <p className="text-sm text-gray-600 dark:text-gray-400">24h Volume</p>
                   </div>
                   <div className="text-center">
                     <div className="text-2xl font-bold text-purple-600 mb-2">
                       {marketData?.price_change_24h ? (marketData.price_change_24h > 0 ? '+' : '') + marketData.price_change_24h.toFixed(2) : '0.00'}%
                     </div>
                     <p className="text-sm text-gray-600 dark:text-gray-400">24h Change</p>
                   </div>
                 </div>
               </div>

               {/* Trading Interface */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Buy/Sell Panel */}
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                   <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Trade CARBT</h3>
                   <div className="space-y-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Order Type
                       </label>
                       <div className="flex gap-2">
                         <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium">
                           Buy
                         </button>
                         <button className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium">
                           Sell
                         </button>
                       </div>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Amount (CARBT)
                       </label>
                       <input
                         type="number"
                         className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                         placeholder="Enter amount"
                         min="0"
                         step="0.01"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                         Price (USD)
                       </label>
                       <input
                         type="number"
                         className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                         placeholder="Enter price"
                         min="0"
                         step="0.01"
                       />
                     </div>
                     <div className="text-sm text-gray-600 dark:text-gray-400">
                       Total: $0.00
                     </div>
                     <button className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-lg transition-colors font-medium">
                       Place Buy Order
                     </button>
                   </div>
                 </div>

                 {/* Order Book */}
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                   <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Order Book</h3>
                   <div className="space-y-4">
                     <div>
                       <h4 className="text-sm font-medium text-green-600 mb-2">Buy Orders</h4>
                       <div className="space-y-1 max-h-40 overflow-y-auto">
                         <div className="flex justify-between text-sm">
                           <span>100 CARBT</span>
                           <span className="text-green-600">$2.45</span>
                         </div>
                         <div className="flex justify-between text-sm">
                           <span>250 CARBT</span>
                           <span className="text-green-600">$2.42</span>
                         </div>
                         <div className="flex justify-between text-sm">
                           <span>500 CARBT</span>
                           <span className="text-green-600">$2.40</span>
                         </div>
                       </div>
                     </div>
                     <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                       <h4 className="text-sm font-medium text-red-600 mb-2">Sell Orders</h4>
                       <div className="space-y-1 max-h-40 overflow-y-auto">
                         <div className="flex justify-between text-sm">
                           <span>150 CARBT</span>
                           <span className="text-red-600">$2.48</span>
                         </div>
                         <div className="flex justify-between text-sm">
                           <span>300 CARBT</span>
                           <span className="text-red-600">$2.50</span>
                         </div>
                         <div className="flex justify-between text-sm">
                           <span>200 CARBT</span>
                           <span className="text-red-600">$2.52</span>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Recent Trades */}
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                   <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Trades</h3>
                   <div className="space-y-2 max-h-80 overflow-y-auto">
                     <div className="flex justify-between items-center text-sm">
                       <div>
                         <span className="text-green-600 font-medium">BUY</span>
                         <span className="ml-2">50 CARBT</span>
                       </div>
                       <div className="text-right">
                         <div className="text-green-600">$2.46</div>
                         <div className="text-xs text-gray-500">2 min ago</div>
                       </div>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                       <div>
                         <span className="text-red-600 font-medium">SELL</span>
                         <span className="ml-2">75 CARBT</span>
                       </div>
                       <div className="text-right">
                         <div className="text-red-600">$2.44</div>
                         <div className="text-xs text-gray-500">5 min ago</div>
                       </div>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                       <div>
                         <span className="text-green-600 font-medium">BUY</span>
                         <span className="ml-2">100 CARBT</span>
                       </div>
                       <div className="text-right">
                         <div className="text-green-600">$2.47</div>
                         <div className="text-xs text-gray-500">8 min ago</div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             </motion.div>
           )}

           {activeTab === 'nfts' && (
             <motion.div
               key="nfts"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               className="space-y-6"
             >
               {/* Carbon Credit NFTs */}
               <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                 <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Carbon Credit NFTs</h3>
                   <button className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                     <Plus className="w-4 h-4" />
                     Mint NFT
                   </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {/* Sample NFT Cards */}
                   <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow">
                     <div className="aspect-square bg-gradient-to-br from-green-400 to-teal-600 rounded-lg mb-4 flex items-center justify-center">
                       <Award className="w-12 h-12 text-white" />
                     </div>
                     <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Carbon Credit #001</h4>
                     <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">100 CARBT - Verified sequestration</p>
                     <div className="flex justify-between items-center">
                       <span className="text-sm font-medium text-teal-600">$245.00</span>
                       <button className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm">
                         List
                       </button>
                     </div>
                   </div>

                   <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow">
                     <div className="aspect-square bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg mb-4 flex items-center justify-center">
                       <Award className="w-12 h-12 text-white" />
                     </div>
                     <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Carbon Credit #002</h4>
                     <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">250 CARBT - Forest restoration</p>
                     <div className="flex justify-between items-center">
                       <span className="text-sm font-medium text-teal-600">$612.50</span>
                       <button className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm">
                         List
                       </button>
                     </div>
                   </div>

                   <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow">
                     <div className="aspect-square bg-gradient-to-br from-yellow-400 to-orange-600 rounded-lg mb-4 flex items-center justify-center">
                       <Award className="w-12 h-12 text-white" />
                     </div>
                     <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Carbon Credit #003</h4>
                     <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">150 CARBT - Renewable energy</p>
                     <div className="flex justify-between items-center">
                       <span className="text-sm font-medium text-teal-600">$367.50</span>
                       <button className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm">
                         List
                       </button>
                     </div>
                   </div>
                 </div>

                 {/* NFT Marketplace */}
                 <div className="mt-8">
                   <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">NFT Marketplace</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                       <h5 className="font-medium text-gray-800 dark:text-white mb-2">Listed NFTs</h5>
                       <div className="space-y-2">
                         <div className="flex justify-between text-sm">
                           <span>Credit #004 - 200 CARBT</span>
                           <span className="text-teal-600">$490.00</span>
                         </div>
                         <div className="flex justify-between text-sm">
                           <span>Credit #005 - 300 CARBT</span>
                           <span className="text-teal-600">$735.00</span>
                         </div>
                       </div>
                     </div>
                     <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                       <h5 className="font-medium text-gray-800 dark:text-white mb-2">Recent Sales</h5>
                       <div className="space-y-2">
                         <div className="flex justify-between text-sm">
                           <span>Credit #001 sold</span>
                           <span className="text-green-600">$245.00</span>
                         </div>
                         <div className="flex justify-between text-sm">
                           <span>Credit #002 sold</span>
                           <span className="text-green-600">$612.50</span>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             </motion.div>
           )}
        </AnimatePresence>

        {/* Stake Modal */}
        <AnimatePresence>
          {showStakeModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => setShowStakeModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Stake CARBT Tokens</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Amount to Stake
                    </label>
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      placeholder="Enter CARBT amount"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Available balance: {dashboardData?.total_carbon_tokens?.toFixed(2) || '0'} CARBT
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowStakeModal(false)}
                      className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleStakeTokens}
                      disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) <= 0}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      {isStaking ? 'Staking...' : 'Stake'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Retire Modal */}
        <AnimatePresence>
          {showRetireModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => setShowRetireModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Retire Carbon Credits</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Credit ID
                    </label>
                    <input
                      type="number"
                      value={retireCreditId}
                      onChange={(e) => setRetireCreditId(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      placeholder="Enter credit ID"
                      min="1"
                    />
                  </div>
                  <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900 p-3 rounded-lg">
                    <strong>Important:</strong> Retiring carbon credits permanently removes them from circulation and demonstrates your commitment to environmental impact.
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowRetireModal(false)}
                      className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRetireCredit}
                      disabled={isRetiring || !retireCreditId}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      {isRetiring ? 'Retiring...' : 'Retire Credit'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Climate Data Modal */}
        <AnimatePresence>
          {showClimateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => setShowClimateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-lg w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Submit Climate Data</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={climateData.location}
                      onChange={(e) => setClimateData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      placeholder="e.g., Nairobi, Kenya"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Area (Hectares)
                    </label>
                    <input
                      type="number"
                      value={climateData.area_hectares}
                      onChange={(e) => setClimateData(prev => ({ ...prev, area_hectares: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      placeholder="Enter area in hectares"
                      min="0"
                      step="0.1"
                    />
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Data Sources</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Climate data will be automatically collected from satellite imagery and IoT sensors in your area.
                      This analysis will determine your carbon sequestration potential.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowClimateModal(false)}
                      className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmitClimateData}
                      disabled={isGenerating || !climateData.location || !climateData.area_hectares}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      {isGenerating ? 'Submitting...' : 'Submit Data'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}