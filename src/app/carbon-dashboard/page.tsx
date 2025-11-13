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
              { id: 'staking', label: 'Staking', icon: TrendingUp },
              { id: 'market', label: 'Market', icon: Globe }
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
               <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                 <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Carbon Credits Portfolio</h3>
                   <button
                     onClick={() => setShowClimateModal(true)}
                     className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                   >
                     <Plus className="w-4 h-4" />
                     Submit Climate Data
                   </button>
                 </div>

                 {carbonCredits.length > 0 ? (
                   <div className="space-y-4">
                     {carbonCredits.map((credit) => (
                       <div key={credit.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                         <div className="flex justify-between items-start mb-3">
                           <div>
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
                             <p className="text-sm text-gray-600 dark:text-gray-400">
                               Amount: {credit.amount} CARBT
                             </p>
                           </div>
                           <div className="text-right">
                             <div className="text-sm text-gray-500 dark:text-gray-400">
                               {new Date(credit.created_at).toLocaleDateString()}
                             </div>
                             {credit.transaction_hash && (
                               <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                 TX: {credit.transaction_hash.slice(0, 10)}...
                               </div>
                             )}
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
                   <div className="text-center py-8">
                     <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                     <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-2">No Carbon Credits Yet</h4>
                     <p className="text-gray-600 dark:text-gray-400 mb-4">
                       Start by submitting climate data to generate your first carbon credits.
                     </p>
                     <button
                       onClick={() => setShowClimateModal(true)}
                       className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
                     >
                       Generate Carbon Credits
                     </button>
                   </div>
                 )}
               </div>
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

          {activeTab === 'market' && (
            <motion.div
              key="market"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Carbon Market Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-teal-600 mb-2">
                      {marketData?.total_supply?.toFixed(0) || '0'}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total CARBT Supply</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {marketData?.total_staked?.toFixed(0) || '0'}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Staked</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {marketData?.staking_ratio ? (marketData.staking_ratio * 100).toFixed(1) : '0'}%
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Staking Ratio</p>
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