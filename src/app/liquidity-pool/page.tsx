'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/hooks/useWallet';
import { contractInteractions } from '@/lib/contractInteractions';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';
import { Droplets, TrendingUp, DollarSign, Users, Plus, Minus } from 'lucide-react';

interface PoolInfo {
  totalLiquidity: string;
  totalBorrowed: string;
  availableLiquidity: string;
  interestRate: number;
  active: boolean;
}

export default function LiquidityPoolPage() {
  const { address, isConnected } = useWallet();
  const [pools, setPools] = useState<{[key: string]: PoolInfo}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showAddLiquidity, setShowAddLiquidity] = useState(false);
  const [selectedToken, setSelectedToken] = useState('');
  const [liquidityAmount, setLiquidityAmount] = useState('');

  const tokens = [
    { address: CONTRACT_ADDRESSES.AgriCredit, symbol: 'AGC', name: 'AgriCredit Token' },
    { address: CONTRACT_ADDRESSES.CarbonToken, symbol: 'CARBT', name: 'Carbon Token' },
  ];

  useEffect(() => {
    if (isConnected) {
      loadPoolInfo();
    }
  }, [isConnected]);

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

        {/* Pool Performance Chart Placeholder */}
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
      </main>
    </div>
  );
}