'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/hooks/useWallet';
import { contractInteractions } from '@/lib/contractInteractions';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';
import { Droplets, TrendingUp, DollarSign, Users, Plus, Minus, BarChart3, Target, Award, Layers } from 'lucide-react';

interface PoolInfo {
  totalLiquidity: string;
  totalBorrowed: string;
  availableLiquidity: string;
  interestRate: number;
  active: boolean;
}

interface StakingPosition {
  poolId: string;
  stakedAmount: string;
  rewards: string;
  apy: number;
  lockPeriod: number;
  startTime: number;
}

export default function LiquidityPoolPage() {
  const { address, isConnected } = useWallet();
  const [pools, setPools] = useState<{[key: string]: PoolInfo}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pools');
  const [stakingPositions, setStakingPositions] = useState<StakingPosition[]>([]);
  const [showAddLiquidity, setShowAddLiquidity] = useState(false);
  const [showStakeLP, setShowStakeLP] = useState(false);
  const [selectedToken, setSelectedToken] = useState('');
  const [selectedPoolForStaking, setSelectedPoolForStaking] = useState<string>('');
  const [liquidityAmount, setLiquidityAmount] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');

  const tokens = [
    { address: CONTRACT_ADDRESSES.AgriCredit, symbol: 'AGC', name: 'AgriCredit Token' },
    { address: CONTRACT_ADDRESSES.CarbonToken, symbol: 'CARBT', name: 'Carbon Token' },
  ];

  useEffect(() => {
    if (isConnected) {
      loadPoolInfo();
      loadStakingPositions();
    }
  }, [isConnected]);

  const loadStakingPositions = () => {
    // Mock staking positions
    const mockPositions: StakingPosition[] = [
      {
        poolId: CONTRACT_ADDRESSES.AgriCredit,
        stakedAmount: '500',
        rewards: '25.50',
        apy: 15.2,
        lockPeriod: 30,
        startTime: Date.now() - 86400000 * 15
      },
      {
        poolId: CONTRACT_ADDRESSES.CarbonToken,
        stakedAmount: '300',
        rewards: '18.75',
        apy: 12.8,
        lockPeriod: 60,
        startTime: Date.now() - 86400000 * 25
      }
    ];
    setStakingPositions(mockPositions);
  };

  const loadPoolInfo = async () => {
    setIsLoading(true);
    try {
      const poolPromises = tokens.map(async (token) => {
        const info = await contractInteractions.getPoolInfo(token.address);
        return {
          token: token.address,
          info: {
            totalLiquidity: info.totalLiquidity.toString(),
            totalBorrowed: info.totalBorrowed.toString(),
            availableLiquidity: info.availableLiquidity.toString(),
            interestRate: info.interestRate.toNumber(),
            active: info.active
          }
        };
      });

      const poolResults = await Promise.all(poolPromises);
      const poolData: {[key: string]: PoolInfo} = {};

      poolResults.forEach(result => {
        poolData[result.token] = result.info;
      });

      setPools(poolData);
    } catch (error) {
      console.error('Failed to load pool info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLiquidity = async () => {
    if (!selectedToken || !liquidityAmount) return;

    setIsLoading(true);
    try {
      await contractInteractions.addLiquidity(selectedToken, liquidityAmount);
      alert('Liquidity added successfully!');
      setShowAddLiquidity(false);
      setLiquidityAmount('');
      loadPoolInfo();
    } catch (error) {
      console.error('Failed to add liquidity:', error);
      alert('Failed to add liquidity. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLiquidity = async (tokenAddress: string, amount: string) => {
    setIsLoading(true);
    try {
      await contractInteractions.removeLiquidity(tokenAddress, amount);
      alert('Liquidity removed successfully!');
      loadPoolInfo();
    } catch (error) {
      console.error('Failed to remove liquidity:', error);
      alert('Failed to remove liquidity. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStakeLP = async () => {
    if (!selectedPoolForStaking || !stakeAmount) return;

    setIsLoading(true);
    try {
      await contractInteractions.stakeLP(selectedPoolForStaking, stakeAmount);
      alert('LP tokens staked successfully!');
      setShowStakeLP(false);
      setStakeAmount('');
      setSelectedPoolForStaking('');
      loadStakingPositions();
    } catch (error) {
      console.error('Failed to stake LP tokens:', error);
      alert('Failed to stake LP tokens. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimStakingRewards = async (poolId: string) => {
    setIsLoading(true);
    try {
      await contractInteractions.claimStakingRewards(poolId);
      alert('Staking rewards claimed successfully!');
      loadStakingPositions();
    } catch (error) {
      console.error('Failed to claim staking rewards:', error);
      alert('Failed to claim staking rewards. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getTokenInfo = (address: string) => {
    return tokens.find(t => t.address === address);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Please connect your wallet to access liquidity pools.
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
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Liquidity Pools</h1>
            <button
              onClick={() => setShowAddLiquidity(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Liquidity
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
                { id: 'pools', label: 'Liquidity Pools', icon: Droplets },
                { id: 'staking', label: 'LP Staking', icon: Target },
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
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Total Liquidity</h3>
            </div>
            <div className="text-3xl font-bold text-blue-600">
              ${Object.values(pools).reduce((sum, pool) => sum + parseFloat(pool.totalLiquidity), 0).toFixed(2)}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Active Pools</h3>
            </div>
            <div className="text-3xl font-bold text-green-600">
              {Object.values(pools).filter(pool => pool.active).length}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Avg. APY</h3>
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {Object.values(pools).length > 0
                ? (Object.values(pools).reduce((sum, pool) => sum + pool.interestRate, 0) / Object.values(pools).length / 100).toFixed(1)
                : '0.0'}%
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Your Position</h3>
            </div>
            <div className="text-3xl font-bold text-orange-600">
              2 Pools
            </div>
          </motion.div>
        </div>

        {/* Pool Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tokens.map((token, index) => {
            const pool = pools[token.address];
            const tokenInfo = getTokenInfo(token.address);

            return (
              <motion.div
                key={token.address}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{token.symbol[0]}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {token.symbol} Pool
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{token.name}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    pool?.active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {pool?.active ? 'Active' : 'Inactive'}
                  </div>
                </div>

                {pool && (
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total Liquidity:</span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {parseFloat(pool.totalLiquidity).toFixed(2)} {token.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Available:</span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {parseFloat(pool.availableLiquidity).toFixed(2)} {token.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Borrowed:</span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {parseFloat(pool.totalBorrowed).toFixed(2)} {token.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Interest Rate:</span>
                      <span className="font-medium text-green-600">
                        {(pool.interestRate / 100).toFixed(1)}% APY
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedToken(token.address);
                      setShowAddLiquidity(true);
                    }}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                  <button
                    onClick={() => handleRemoveLiquidity(token.address, '100')}
                    className="flex-1 border border-red-300 text-red-600 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 transition-colors text-sm flex items-center justify-center gap-1"
                  >
                    <Minus className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

            {/* Pool Performance Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mt-8"
            >
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Pool Performance
              </h3>
              <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">Performance chart would display here</p>
              </div>
            </motion.div>
          </>
        )}

        {activeTab === 'staking' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Staking Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Total Staked</h3>
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {stakingPositions.reduce((sum, pos) => sum + parseFloat(pos.stakedAmount), 0).toFixed(2)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">LP tokens staked</p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Total Rewards</h3>
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {stakingPositions.reduce((sum, pos) => sum + parseFloat(pos.rewards), 0).toFixed(2)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending claims</p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Avg. APY</h3>
                </div>
                <div className="text-3xl font-bold text-purple-600">
                  {(stakingPositions.reduce((sum, pos) => sum + pos.apy, 0) / stakingPositions.length || 0).toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Across positions</p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Active Positions</h3>
                </div>
                <div className="text-3xl font-bold text-orange-600">
                  {stakingPositions.length}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Staking positions</p>
              </div>
            </div>

            {/* Staking Positions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Your Staking Positions</h2>
                  <button
                    onClick={() => setShowStakeLP(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Stake LP Tokens
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {stakingPositions.map((position, index) => {
                  const tokenInfo = getTokenInfo(position.poolId);
                  const daysStaked = Math.floor((Date.now() - position.startTime) / (1000 * 60 * 60 * 24));
                  const progress = Math.min((daysStaked / position.lockPeriod) * 100, 100);

                  return (
                    <motion.div
                      key={position.poolId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">{tokenInfo?.symbol[0]}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 dark:text-white">
                              {tokenInfo?.symbol} LP Staking
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {position.apy}% APY • {position.lockPeriod} days lock
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-800 dark:text-white">
                            {position.stakedAmount} LP
                          </div>
                          <div className="text-sm text-green-600">
                            +{position.rewards} rewards
                          </div>
                        </div>
                      </div>

                      {/* Lock Progress */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <span>Lock Progress</span>
                          <span>{daysStaked}/{position.lockPeriod} days</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleClaimStakingRewards(position.poolId)}
                          disabled={parseFloat(position.rewards) === 0}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 rounded-lg transition-colors text-sm"
                        >
                          Claim Rewards
                        </button>
                        <button
                          disabled={daysStaked < position.lockPeriod}
                          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 rounded-lg transition-colors text-sm"
                        >
                          {daysStaked < position.lockPeriod ? 'Locked' : 'Unstake'}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Available Pools for Staking */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Available Pools for Staking</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tokens.map((token) => {
                  const pool = pools[token.address];
                  const isStaked = stakingPositions.some(pos => pos.poolId === token.address);

                  return (
                    <div key={token.address} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{token.symbol[0]}</span>
                          </div>
                          <span className="font-medium text-gray-800 dark:text-white">{token.symbol} Pool</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isStaked ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {isStaked ? 'Staked' : 'Available'}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div>APY: <span className="text-green-600 font-medium">{pool ? (pool.interestRate / 100).toFixed(1) : '0.0'}%</span></div>
                        <div>TVL: <span className="font-medium">{pool ? parseFloat(pool.totalLiquidity).toFixed(0) : '0'} {token.symbol}</span></div>
                      </div>
                      {!isStaked && (
                        <button
                          onClick={() => {
                            setSelectedPoolForStaking(token.address);
                            setShowStakeLP(true);
                          }}
                          className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors text-sm"
                        >
                          Stake LP Tokens
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Pool Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Pool Utilization</h3>
                <div className="space-y-3">
                  {tokens.map((token) => {
                    const pool = pools[token.address];
                    const utilization = pool ? (parseFloat(pool.totalBorrowed) / parseFloat(pool.totalLiquidity)) * 100 : 0;

                    return (
                      <div key={token.address} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{token.symbol}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                utilization > 80 ? 'bg-red-500' : utilization > 60 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${utilization}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-12">{utilization.toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">APY Comparison</h3>
                <div className="space-y-3">
                  {tokens.map((token) => {
                    const pool = pools[token.address];
                    const apy = pool ? pool.interestRate / 100 : 0;

                    return (
                      <div key={token.address} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{token.symbol} Pool</span>
                        <span className="text-sm font-medium text-green-600">{apy.toFixed(1)}% APY</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {Object.values(pools).reduce((sum, pool) => sum + parseFloat(pool.totalLiquidity), 0).toFixed(0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Liquidity (USD)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {Object.values(pools).reduce((sum, pool) => sum + parseFloat(pool.totalBorrowed), 0).toFixed(0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Borrowed (USD)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-2">
                    {((Object.values(pools).reduce((sum, pool) => sum + parseFloat(pool.totalBorrowed), 0) /
                       Object.values(pools).reduce((sum, pool) => sum + parseFloat(pool.totalLiquidity), 0)) * 100 || 0).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg. Utilization</div>
                </div>
              </div>
            </div>

            {/* Historical Performance */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Historical Performance</h3>
              <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                  <p>Historical performance chart would be displayed here</p>
                  <p className="text-sm">Showing liquidity, utilization, and APY trends over time</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Add Liquidity Modal */}
        {showAddLiquidity && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Add Liquidity</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Token
                  </label>
                  <select
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  >
                    <option value="">Choose a token</option>
                    {tokens.map(token => (
                      <option key={token.address} value={token.address}>
                        {token.symbol} - {token.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={liquidityAmount}
                    onChange={(e) => setLiquidityAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowAddLiquidity(false);
                      setSelectedToken('');
                      setLiquidityAmount('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddLiquidity}
                    disabled={isLoading || !selectedToken || !liquidityAmount}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Adding...' : 'Add Liquidity'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Stake LP Modal */}
        {showStakeLP && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Stake LP Tokens</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Pool
                  </label>
                  <select
                    value={selectedPoolForStaking}
                    onChange={(e) => setSelectedPoolForStaking(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  >
                    <option value="">Choose a pool</option>
                    {tokens.map(token => (
                      <option key={token.address} value={token.address}>
                        {token.symbol} LP Pool
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    LP Tokens to Stake
                  </label>
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="Enter LP token amount"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </div>

                {selectedPoolForStaking && (
                  <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Staking Details</h4>
                    <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <div>Pool: {getTokenInfo(selectedPoolForStaking)?.symbol} LP</div>
                      <div>APY: {pools[selectedPoolForStaking] ? (pools[selectedPoolForStaking].interestRate / 100).toFixed(1) : '0.0'}%</div>
                      <div>Lock Period: 30 days</div>
                      <div>Est. Daily Rewards: {stakeAmount ? ((parseFloat(stakeAmount) * (pools[selectedPoolForStaking]?.interestRate || 0) / 100) / 365).toFixed(4) : '0.0000'} tokens</div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowStakeLP(false);
                      setSelectedPoolForStaking('');
                      setStakeAmount('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStakeLP}
                    disabled={isLoading || !selectedPoolForStaking || !stakeAmount}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Staking...' : 'Stake LP Tokens'}
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