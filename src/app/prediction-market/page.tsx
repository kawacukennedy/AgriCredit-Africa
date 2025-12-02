'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/hooks/useWallet';
import { TrendingUp, TrendingDown, DollarSign, Clock, Target, BarChart3, Plus, Minus } from 'lucide-react';

interface PredictionMarket {
  id: string;
  question: string;
  description: string;
  category: string;
  endDate: number;
  totalLiquidity: string;
  outcomes: {
    id: string;
    name: string;
    probability: number;
    shares: number;
    price: number;
  }[];
  status: 'active' | 'resolved' | 'expired';
  resolution?: string;
}

export default function PredictionMarketPage() {
  const { address, isConnected } = useWallet();
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateMarket, setShowCreateMarket] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<string>('');
  const [tradeAmount, setTradeAmount] = useState('');

  useEffect(() => {
    if (isConnected) {
      loadPredictionMarkets();
    }
  }, [isConnected]);

  const loadPredictionMarkets = async () => {
    setIsLoading(true);
    try {
      // Mock data - in production, fetch from API
      const mockMarkets: PredictionMarket[] = [
        {
          id: '1',
          question: 'Will maize prices exceed $300/ton in Q4 2024?',
          description: 'Market prediction for maize commodity prices based on weather patterns and global supply',
          category: 'commodities',
          endDate: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days from now
          totalLiquidity: '25000',
          status: 'active',
          outcomes: [
            {
              id: 'yes',
              name: 'Yes',
              probability: 65,
              shares: 16250,
              price: 0.65
            },
            {
              id: 'no',
              name: 'No',
              probability: 35,
              shares: 8750,
              price: 0.35
            }
          ]
        },
        {
          id: '2',
          question: 'Will Kenya receive above-average rainfall in March 2024?',
          description: 'Weather prediction market for agricultural planning',
          category: 'weather',
          endDate: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 days from now
          totalLiquidity: '15000',
          status: 'active',
          outcomes: [
            {
              id: 'above',
              name: 'Above Average',
              probability: 45,
              shares: 6750,
              price: 0.45
            },
            {
              id: 'average',
              name: 'Average',
              probability: 35,
              shares: 5250,
              price: 0.35
            },
            {
              id: 'below',
              name: 'Below Average',
              probability: 20,
              shares: 3000,
              price: 0.20
            }
          ]
        },
        {
          id: '3',
          question: 'Will global fertilizer prices decrease by 10% in 2024?',
          description: 'Market analysis for fertilizer price trends',
          category: 'commodities',
          endDate: Date.now() + 120 * 24 * 60 * 60 * 1000, // 120 days from now
          totalLiquidity: '30000',
          status: 'active',
          outcomes: [
            {
              id: 'yes',
              name: 'Yes (-10% or more)',
              probability: 55,
              shares: 16500,
              price: 0.55
            },
            {
              id: 'no',
              name: 'No (stable or increase)',
              probability: 45,
              shares: 13500,
              price: 0.45
            }
          ]
        }
      ];

      setMarkets(mockMarkets);
    } catch (error) {
      console.error('Failed to load prediction markets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrade = (market: PredictionMarket, outcomeId: string) => {
    setSelectedMarket(market);
    setSelectedOutcome(outcomeId);
    setShowTradeModal(true);
  };

  const confirmTrade = async () => {
    if (!selectedMarket || !selectedOutcome || !tradeAmount) return;

    try {
      const amount = parseFloat(tradeAmount);
      const outcome = selectedMarket.outcomes.find(o => o.id === selectedOutcome);

      if (!outcome) return;

      // Calculate shares to buy
      const sharesToBuy = amount / outcome.price;

      // Mock trade - in production, call contract
      alert(`Successfully purchased ${sharesToBuy.toFixed(2)} shares for $${amount.toFixed(2)}`);

      setShowTradeModal(false);
      setTradeAmount('');
      setSelectedMarket(null);
      setSelectedOutcome('');
      loadPredictionMarkets();
    } catch (error) {
      console.error('Failed to execute trade:', error);
      alert('Failed to execute trade. Please try again.');
    }
  };

  const getTimeRemaining = (endDate: number) => {
    const now = Date.now();
    const diff = endDate - now;

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else {
      return `${hours}h`;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'commodities': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'weather': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'policy': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Prediction Markets
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Connect your wallet to participate in agricultural prediction markets.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Prediction Markets</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Trade on future agricultural outcomes and earn from accurate predictions
          </p>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Markets</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {markets.filter(m => m.status === 'active').length}
                </p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Liquidity</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${markets.reduce((sum, m) => sum + parseInt(m.totalLiquidity), 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Markets Ending Soon</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {markets.filter(m => {
                    const daysLeft = (m.endDate - Date.now()) / (1000 * 60 * 60 * 24);
                    return daysLeft <= 7 && daysLeft > 0;
                  }).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Prediction Markets */}
        <div className="space-y-6">
          {markets.map((market) => (
            <motion.div
              key={market.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{market.question}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(market.category)}`}>
                      {market.category}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">{market.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Ends in {getTimeRemaining(market.endDate)}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      ${parseInt(market.totalLiquidity).toLocaleString()} liquidity
                    </div>
                  </div>
                </div>
              </div>

              {/* Outcomes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {market.outcomes.map((outcome) => (
                  <div key={outcome.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">{outcome.name}</h4>
                      <span className="text-lg font-bold text-green-600">
                        {outcome.probability}%
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <div>Price: ${outcome.price.toFixed(3)}</div>
                      <div>Shares: {outcome.shares.toLocaleString()}</div>
                    </div>

                    <button
                      onClick={() => handleTrade(market, outcome.id)}
                      disabled={market.status !== 'active'}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                      Buy Shares
                    </button>
                  </div>
                ))}
              </div>

              {/* Probability Bar */}
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Probability Distribution</h4>
                <div className="flex gap-1 h-4 rounded-full overflow-hidden">
                  {market.outcomes.map((outcome, index) => (
                    <div
                      key={outcome.id}
                      className={`h-full ${
                        index === 0 ? 'bg-blue-500' :
                        index === 1 ? 'bg-green-500' :
                        'bg-purple-500'
                      }`}
                      style={{ width: `${outcome.probability}%` }}
                      title={`${outcome.name}: ${outcome.probability}%`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {market.outcomes.map((outcome) => (
                    <span key={outcome.id}>{outcome.name} ({outcome.probability}%)</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Create Market Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setShowCreateMarket(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            Create Prediction Market
          </button>
        </div>
      </div>

      {/* Trade Modal */}
      {showTradeModal && selectedMarket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Buy Prediction Shares
            </h3>

            <div className="mb-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">{selectedMarket.question}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Outcome: {selectedMarket.outcomes.find(o => o.id === selectedOutcome)?.name}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount to Invest ($)
                </label>
                <input
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter amount"
                  min="1"
                  step="0.01"
                />
              </div>

              {tradeAmount && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Trade Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Investment:</span>
                      <span>${parseFloat(tradeAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shares to Receive:</span>
                      <span>
                        {selectedMarket.outcomes.find(o => o.id === selectedOutcome) &&
                          (parseFloat(tradeAmount) / selectedMarket.outcomes.find(o => o.id === selectedOutcome)!.price).toFixed(2)
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Probability:</span>
                      <span>
                        {selectedMarket.outcomes.find(o => o.id === selectedOutcome)?.probability}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowTradeModal(false)}
                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmTrade}
                disabled={!tradeAmount || parseFloat(tradeAmount) <= 0}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Confirm Trade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Market Modal */}
      {showCreateMarket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Create Prediction Market
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create a new prediction market for agricultural outcomes.
            </p>
            <div className="text-center py-4">
              <p className="text-gray-500">Market creation feature coming soon...</p>
            </div>
            <button
              onClick={() => setShowCreateMarket(false)}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}