'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/hooks/useWallet';
import { TrendingUp, DollarSign, BarChart3, Zap, Target, Plus, Minus, RefreshCw } from 'lucide-react';

interface YieldStrategy {
  id: string;
  name: string;
  description: string;
  protocols: string[];
  apy: number;
  tvl: string;
  risk: 'low' | 'medium' | 'high';
  tokens: string[];
  minDeposit: string;
  lockPeriod: number; // days
  performance: {
    '1d': number;
    '7d': number;
    '30d': number;
  };
}

interface UserPosition {
  strategyId: string;
  amount: string;
  depositedAt: number;
  rewards: string;
  apy: number;
}

export default function YieldAggregatorPage() {
  const { address, isConnected } = useWallet();
  const [strategies, setStrategies] = useState<YieldStrategy[]>([]);
  const [userPositions, setUserPositions] = useState<UserPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<YieldStrategy | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [activeTab, setActiveTab] = useState('strategies');

  useEffect(() => {
    if (isConnected) {
      loadYieldStrategies();
      loadUserPositions();
    }
  }, [isConnected, address]);

  const loadYieldStrategies = async () => {
    setIsLoading(true);
    try {
      // Mock data - in production, fetch from API
      const mockStrategies: YieldStrategy[] = [
        {
          id: '1',
          name: 'AgriCredit LP Optimizer',
          description: 'Automated yield farming across AgriCredit liquidity pools',
          protocols: ['AgriCredit', 'Uniswap V3'],
          apy: 12.5,
          tvl: '2500000',
          risk: 'medium',
          tokens: ['AGC', 'USDC'],
          minDeposit: '100',
          lockPeriod: 30,
          performance: {
            '1d': 0.8,
            '7d': 5.2,
            '30d': 12.1
          }
        },
        {
          id: '2',
          name: 'Carbon Yield Vault',
          description: 'Stake carbon tokens for sustainable farming rewards',
          protocols: ['CarbonToken', 'Compound'],
          apy: 8.7,
          tvl: '1800000',
          risk: 'low',
          tokens: ['CARBT'],
          minDeposit: '50',
          lockPeriod: 0,
          performance: {
            '1d': 0.3,
            '7d': 2.1,
            '30d': 8.7
          }
        },
        {
          id: '3',
          name: 'Multi-Protocol Farm',
          description: 'Cross-protocol yield aggregation for maximum returns',
          protocols: ['AgriCredit', 'CarbonToken', 'YieldToken', 'Aave'],
          apy: 18.3,
          tvl: '4200000',
          risk: 'high',
          tokens: ['AGC', 'CARBT', 'YIELD'],
          minDeposit: '500',
          lockPeriod: 90,
          performance: {
            '1d': 1.2,
            '7d': 8.5,
            '30d': 18.3
          }
        },
        {
          id: '4',
          name: 'Stablecoin Vault',
          description: 'Low-risk stablecoin yield farming',
          protocols: ['Compound', 'Aave'],
          apy: 6.2,
          tvl: '5000000',
          risk: 'low',
          tokens: ['USDC', 'USDT', 'DAI'],
          minDeposit: '10',
          lockPeriod: 0,
          performance: {
            '1d': 0.1,
            '7d': 0.7,
            '30d': 2.1
          }
        }
      ];

      setStrategies(mockStrategies);
    } catch (error) {
      console.error('Failed to load yield strategies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserPositions = async () => {
    if (!address) return;

    try {
      // Mock data - in production, fetch from API
      const mockPositions: UserPosition[] = [
        {
          strategyId: '2',
          amount: '1000',
          depositedAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
          rewards: '43.50',
          apy: 8.7
        }
      ];

      setUserPositions(mockPositions);
    } catch (error) {
      console.error('Failed to load user positions:', error);
    }
  };

  const handleDeposit = (strategy: YieldStrategy) => {
    setSelectedStrategy(strategy);
    setShowDepositModal(true);
  };

  const confirmDeposit = async () => {
    if (!selectedStrategy || !depositAmount) return;

    try {
      const amount = parseFloat(depositAmount);

      if (amount < parseFloat(selectedStrategy.minDeposit)) {
        alert(`Minimum deposit is ${selectedStrategy.minDeposit} tokens`);
        return;
      }

      // Mock deposit - in production, call contract
      alert(`Successfully deposited ${amount} tokens into ${selectedStrategy.name}`);

      setShowDepositModal(false);
      setDepositAmount('');
      setSelectedStrategy(null);
      loadUserPositions();
    } catch (error) {
      console.error('Failed to deposit:', error);
      alert('Failed to deposit. Please try again.');
    }
  };

  const handleWithdraw = async (position: UserPosition) => {
    try {
      // Mock withdraw - in production, call contract
      alert(`Successfully withdrew from position`);
      loadUserPositions();
    } catch (error) {
      console.error('Failed to withdraw:', error);
      alert('Failed to withdraw. Please try again.');
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 0) return 'text-green-600';
    return 'text-red-600';
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Yield Aggregator
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Connect your wallet to access automated yield farming strategies.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Yield Aggregator</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Maximize your returns with automated cross-protocol yield farming
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('strategies')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'strategies'
                ? 'bg-green-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Strategies
          </button>
          <button
            onClick={() => setActiveTab('positions')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'positions'
                ? 'bg-green-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            My Positions
          </button>
        </div>

        {activeTab === 'strategies' && (
          <>
            {/* Strategy Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Strategies</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{strategies.length}</p>
                  </div>
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average APY</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(strategies.reduce((sum, s) => sum + s.apy, 0) / strategies.length).toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total TVL</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${(strategies.reduce((sum, s) => sum + parseInt(s.tvl), 0) / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">My Positions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{userPositions.length}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Yield Strategies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {strategies.map((strategy) => (
                <motion.div
                  key={strategy.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{strategy.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{strategy.description}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(strategy.risk)}`}>
                      {strategy.risk} risk
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{strategy.apy}%</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">APY</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${(parseInt(strategy.tvl) / 1000000).toFixed(1)}M
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">TVL</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Protocols:</div>
                    <div className="flex flex-wrap gap-1">
                      {strategy.protocols.map((protocol) => (
                        <span key={protocol} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded">
                          {protocol}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Performance:</div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className={`font-medium ${getPerformanceColor(strategy.performance['1d'])}`}>
                          {strategy.performance['1d'] >= 0 ? '+' : ''}{strategy.performance['1d']}%
                        </span>
                        <div className="text-gray-500">1D</div>
                      </div>
                      <div>
                        <span className={`font-medium ${getPerformanceColor(strategy.performance['7d'])}`}>
                          {strategy.performance['7d'] >= 0 ? '+' : ''}{strategy.performance['7d']}%
                        </span>
                        <div className="text-gray-500">7D</div>
                      </div>
                      <div>
                        <span className={`font-medium ${getPerformanceColor(strategy.performance['30d'])}`}>
                          {strategy.performance['30d'] >= 0 ? '+' : ''}{strategy.performance['30d']}%
                        </span>
                        <div className="text-gray-500">30D</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <span>Min: ${strategy.minDeposit}</span>
                    <span>Lock: {strategy.lockPeriod > 0 ? `${strategy.lockPeriod} days` : 'Flexible'}</span>
                  </div>

                  <button
                    onClick={() => handleDeposit(strategy)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Deposit
                  </button>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'positions' && (
          <div className="space-y-6">
            {userPositions.length > 0 ? (
              userPositions.map((position) => {
                const strategy = strategies.find(s => s.id === position.strategyId);
                return (
                  <div key={`${position.strategyId}-${position.depositedAt}`} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {strategy?.name || 'Unknown Strategy'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Deposited {new Date(position.depositedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          ${parseFloat(position.amount).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Deposited</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-lg font-semibold text-green-600">{position.apy}%</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Current APY</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-blue-600">${position.rewards}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Rewards Earned</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          ${((parseFloat(position.amount) * position.apy / 100) / 365 * 30).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Yield</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-purple-600">
                          ${((parseFloat(position.amount) + parseFloat(position.rewards))).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Value</div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
                        Compound Rewards
                      </button>
                      <button
                        onClick={() => handleWithdraw(position)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
                      >
                        Withdraw
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                  No Active Positions
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Start earning yield by depositing into one of our strategies.
                </p>
                <button
                  onClick={() => setActiveTab('strategies')}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  View Strategies
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      {showDepositModal && selectedStrategy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Deposit into {selectedStrategy.name}
            </h3>

            <div className="mb-4">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Strategy Details</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>APY:</span>
                    <span className="font-medium text-green-600">{selectedStrategy.apy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Minimum Deposit:</span>
                    <span>${selectedStrategy.minDeposit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lock Period:</span>
                    <span>{selectedStrategy.lockPeriod > 0 ? `${selectedStrategy.lockPeriod} days` : 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk Level:</span>
                    <span className={`px-2 py-1 text-xs rounded ${getRiskColor(selectedStrategy.risk)}`}>
                      {selectedStrategy.risk}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Deposit Amount
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter amount"
                  min={selectedStrategy.minDeposit}
                  step="0.01"
                />
              </div>

              {depositAmount && parseFloat(depositAmount) >= parseFloat(selectedStrategy.minDeposit) && (
                <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg mt-4">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Deposit Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Deposit Amount:</span>
                      <span>${parseFloat(depositAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Monthly Yield:</span>
                      <span className="text-green-600">
                        ${((parseFloat(depositAmount) * selectedStrategy.apy / 100) / 12).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Annual Yield:</span>
                      <span className="text-green-600">
                        ${((parseFloat(depositAmount) * selectedStrategy.apy / 100)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDepositModal(false)}
                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeposit}
                disabled={!depositAmount || parseFloat(depositAmount) < parseFloat(selectedStrategy.minDeposit)}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Confirm Deposit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}