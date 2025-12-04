'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/hooks/useWallet';
import { contractInteractions } from '@/lib/contractInteractions';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';
import { TrendingUp, DollarSign, Clock, Award, Plus, Minus, BarChart3, Target, Zap, Layers } from 'lucide-react';
import { CustomLineChart } from '@/components/charts';

interface Position {
  amount: string;
  depositTime: number;
  lastClaimTime: number;
  pendingYield: string;
  totalAccumulated: string;
}

interface FarmingPool {
  id: string;
  name: string;
  token: string;
  apy: number;
  totalStaked: string;
  userStaked: string;
  rewards: string;
  risk: 'Low' | 'Medium' | 'High';
  lockPeriod: number; // days
  description: string;
}

export default function YieldFarmingPage() {
  const { address, isConnected } = useWallet();
  const [position, setPosition] = useState<Position | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pools');
  const [selectedPool, setSelectedPool] = useState<string>('agc-pool');
  const [pools, setPools] = useState<FarmingPool[]>([]);
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Mock data for yield performance chart
  const yieldData = [
    { day: '1', yield: 0.02 },
    { day: '2', yield: 0.05 },
    { day: '3', yield: 0.08 },
    { day: '4', yield: 0.12 },
    { day: '5', yield: 0.18 },
    { day: '6', yield: 0.25 },
    { day: '7', yield: 0.32 },
    { day: '8', yield: 0.41 },
    { day: '9', yield: 0.52 },
    { day: '10', yield: 0.65 },
    { day: '11', yield: 0.78 },
    { day: '12', yield: 0.93 },
    { day: '13', yield: 1.08 },
    { day: '14', yield: 1.25 },
  ];

  useEffect(() => {
    if (isConnected && address) {
      loadPosition();
      loadPools();
    }
  }, [isConnected, address]);

  const loadPools = () => {
    // Mock pool data
    const mockPools: FarmingPool[] = [
      {
        id: 'agc-pool',
        name: 'AgriCredit Token Pool',
        token: 'AGC',
        apy: 12.5,
        totalStaked: '1250000',
        userStaked: '2500',
        rewards: '125.50',
        risk: 'Low',
        lockPeriod: 0,
        description: 'Stake AGC tokens to earn yield from protocol fees'
      },
      {
        id: 'carb-pool',
        name: 'Carbon Token Pool',
        token: 'CARBT',
        apy: 8.5,
        totalStaked: '750000',
        userStaked: '1500',
        rewards: '87.25',
        risk: 'Low',
        lockPeriod: 30,
        description: 'Stake CARBT tokens for sustainability rewards and carbon credits'
      },
      {
        id: 'lp-pool',
        name: 'AGC-CARBT LP Pool',
        token: 'AGC/CARBT LP',
        apy: 18.2,
        totalStaked: '500000',
        userStaked: '800',
        rewards: '95.40',
        risk: 'Medium',
        lockPeriod: 60,
        description: 'Provide liquidity and earn trading fees plus additional rewards'
      },
      {
        id: 'nft-pool',
        name: 'NFT Staking Pool',
        token: 'Farm NFTs',
        apy: 15.8,
        totalStaked: '250',
        userStaked: '2',
        rewards: '45.20',
        risk: 'High',
        lockPeriod: 90,
        description: 'Stake tokenized farm assets for enhanced yields and governance power'
      }
    ];
    setPools(mockPools);
  };

  const loadPosition = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      const pos = await contractInteractions.getPosition(address);
      setPosition({
        amount: pos.amount.toString(),
        depositTime: pos.depositTime.toNumber(),
        lastClaimTime: pos.lastClaimTime.toNumber(),
        pendingYield: pos.pendingYield.toString(),
        totalAccumulated: pos.totalAccumulated.toString()
      });
    } catch (error) {
      console.error('Failed to load position:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount) return;

    setIsLoading(true);
    try {
      await contractInteractions.deposit(depositAmount);
      alert('Deposit successful!');
      setShowDeposit(false);
      setDepositAmount('');
      loadPosition();
    } catch (error) {
      console.error('Deposit failed:', error);
      alert('Deposit failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount) return;

    setIsLoading(true);
    try {
      await contractInteractions.withdraw(withdrawAmount);
      alert('Withdrawal successful!');
      setWithdrawAmount('');
      loadPosition();
    } catch (error) {
      console.error('Withdrawal failed:', error);
      alert('Withdrawal failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimYield = async () => {
    setIsLoading(true);
    try {
      await contractInteractions.claimYield();
      alert('Yield claimed successfully!');
      loadPosition();
    } catch (error) {
      console.error('Claim failed:', error);
      alert('Claim failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Please connect your wallet to access yield farming.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Yield Farming</h1>
            <button
              onClick={() => setShowDeposit(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Deposit Tokens
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex">
              {[
                { id: 'pools', label: 'Farming Pools', icon: Layers },
                { id: 'portfolio', label: 'My Portfolio', icon: Target },
                { id: 'analytics', label: 'Analytics', icon: BarChart3 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
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

        {/* Tab Content */}
        {activeTab === 'pools' && (
          <>
            {/* Pool Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Active Pools</h3>
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {pools.length}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Available for farming</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Total Value Locked</h3>
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  ${(pools.reduce((sum, pool) => sum + parseInt(pool.totalStaked), 0) / 1000).toFixed(0)}K
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Across all pools</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Avg. APY</h3>
                </div>
                <div className="text-3xl font-bold text-purple-600">
                  {(pools.reduce((sum, pool) => sum + pool.apy, 0) / pools.length).toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Average yield</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">My Rewards</h3>
                </div>
                <div className="text-3xl font-bold text-orange-600">
                  {pools.reduce((sum, pool) => sum + parseFloat(pool.rewards), 0).toFixed(2)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total pending</p>
              </motion.div>
            </div>

            {/* Pool Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {pools.map((pool, index) => (
                <motion.div
                  key={pool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-2 transition-all cursor-pointer ${
                    selectedPool === pool.id
                      ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedPool(pool.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${
                        pool.risk === 'Low' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' :
                        pool.risk === 'Medium' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400' :
                        'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                      }`}>
                        {pool.token.split(' ')[0].slice(0, 3).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white">{pool.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{pool.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{pool.apy}%</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">APY</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Total Staked</div>
                      <div className="font-medium text-gray-800 dark:text-white">
                        {(parseInt(pool.totalStaked) / 1000).toFixed(0)}K {pool.token}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Your Stake</div>
                      <div className="font-medium text-gray-800 dark:text-white">
                        {pool.userStaked} {pool.token}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        pool.risk === 'Low' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        pool.risk === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {pool.risk} Risk
                      </span>
                      {pool.lockPeriod > 0 && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {pool.lockPeriod} days lock
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-green-600 font-medium">
                        +{pool.rewards} pending
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Selected Pool Actions */}
            {selectedPool && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                      {pools.find(p => p.id === selectedPool)?.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Manage your position in this farming pool
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeposit(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Deposit
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2">
                      <Minus className="w-4 h-4" />
                      Withdraw
                    </button>
                    <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Claim Rewards
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                      {pools.find(p => p.id === selectedPool)?.userStaked}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Your Staked Amount</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {pools.find(p => p.id === selectedPool)?.rewards}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Pending Rewards</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {pools.find(p => p.id === selectedPool)?.apy}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Current APY</div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}

        {activeTab === 'portfolio' && (
          <>
            {/* Portfolio Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Total Staked</h3>
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {pools.reduce((sum, pool) => sum + parseFloat(pool.userStaked), 0).toFixed(2)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Across all pools</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Total Rewards</h3>
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {pools.reduce((sum, pool) => sum + parseFloat(pool.rewards), 0).toFixed(2)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending claims</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Portfolio APY</h3>
                </div>
                <div className="text-3xl font-bold text-purple-600">
                  {(pools.reduce((sum, pool) => sum + (pool.apy * parseFloat(pool.userStaked)), 0) /
                    pools.reduce((sum, pool) => sum + parseFloat(pool.userStaked), 0) || 0).toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Weighted average</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Active Positions</h3>
                </div>
                <div className="text-3xl font-bold text-orange-600">
                  {pools.filter(p => parseFloat(p.userStaked) > 0).length}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pools with stake</p>
              </motion.div>
            </div>

            {/* Portfolio Breakdown */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-8">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Portfolio Breakdown</h3>
              <div className="space-y-4">
                {pools.filter(p => parseFloat(p.userStaked) > 0).map((pool, index) => (
                  <motion.div
                    key={pool.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                        pool.risk === 'Low' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' :
                        pool.risk === 'Medium' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400' :
                        'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                      }`}>
                        {pool.token.split(' ')[0].slice(0, 3).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-white">{pool.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{pool.apy}% APY • {pool.risk} Risk</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-800 dark:text-white">{pool.userStaked} {pool.token}</div>
                      <div className="text-sm text-green-600">+{pool.rewards} rewards</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Performance Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Pool Performance Comparison</h3>
                <div className="space-y-3">
                  {pools.map((pool) => (
                    <div key={pool.id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{pool.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-teal-600 h-2 rounded-full"
                            style={{ width: `${(pool.apy / 20) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-teal-600 w-12">{pool.apy}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Risk vs Reward Analysis</h3>
                <div className="space-y-4">
                  {pools.map((pool) => (
                    <div key={pool.id} className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        pool.risk === 'Low' ? 'bg-green-500' :
                        pool.risk === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">{pool.name}</span>
                      <span className="text-sm font-medium text-gray-800 dark:text-white">{pool.apy}% APY</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Performance Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
            >
              <CustomLineChart
                data={yieldData}
                dataKey="yield"
                xAxisKey="day"
                title="Yield Performance (Last 14 Days)"
                color="#10b981"
                height={300}
                xAxisFormatter={(value) => `Day ${value}`}
                tooltipFormatter={(value) => [`${value} AGC`, 'Yield']}
              />
            </motion.div>
          </motion.div>
        )}



        {/* Deposit Modal */}
        {showDeposit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Deposit Tokens</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount (AGC)
                  </label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter amount to deposit"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-blue-800 dark:text-blue-200">Current APY:</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">12.5%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-800 dark:text-blue-200">Est. daily yield:</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {depositAmount ? (parseFloat(depositAmount) * 0.125 / 365).toFixed(4) : '0.0000'} AGC
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowDeposit(false);
                      setDepositAmount('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeposit}
                    disabled={isLoading || !depositAmount}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Depositing...' : 'Deposit'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}