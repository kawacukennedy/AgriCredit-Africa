'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/hooks/useWallet';
import { contractInteractions } from '@/lib/contractInteractions';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';
import { TrendingUp, DollarSign, Clock, Award, Plus, Minus } from 'lucide-react';

interface Position {
  amount: string;
  depositTime: number;
  lastClaimTime: number;
  pendingYield: string;
  totalAccumulated: string;
}

export default function YieldFarmingPage() {
  const { address, isConnected } = useWallet();
  const [position, setPosition] = useState<Position | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
    }
  }, [isConnected, address]);

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
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Staked Amount</h3>
            </div>
            <div className="text-3xl font-bold text-green-600">
              {position ? parseFloat(position.amount).toFixed(2) : '0.00'} AGC
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Pending Yield</h3>
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {position ? parseFloat(position.pendingYield).toFixed(4) : '0.0000'} AGC
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Total Earned</h3>
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {position ? parseFloat(position.totalAccumulated).toFixed(4) : '0.0000'} AGC
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">APY</h3>
            </div>
            <div className="text-3xl font-bold text-orange-600">12.5%</div>
          </motion.div>
        </div>

        {/* Position Details */}
        {position && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-8"
          >
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Your Position
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                  {parseFloat(position.amount).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Staked AGC</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                  {formatTime(position.depositTime)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Deposit Date</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
                  {formatTime(position.lastClaimTime)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Last Claim</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {parseFloat(position.pendingYield).toFixed(4)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Available to Claim</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleClaimYield}
                disabled={parseFloat(position.pendingYield) === 0 || isLoading}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isLoading ? 'Claiming...' : 'Claim Yield'}
              </button>

              <div className="flex gap-2">
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Amount to withdraw"
                  className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                />
                <button
                  onClick={handleWithdraw}
                  disabled={!withdrawAmount || isLoading}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '...' : 'Withdraw'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Farming Pools Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-8"
        >
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Farming Pools
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 font-bold">AGC</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white">AgriCredit Token Pool</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Stake AGC tokens to earn yield</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">12.5% APY</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Annual percentage yield</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">CARBT</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 dark:text-white">Carbon Token Pool</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Stake CARBT tokens for sustainability rewards</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">8.5% APY</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Annual percentage yield</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Performance Chart Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
        >
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Yield Performance (Last 14 Days)
          </h3>
          <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Yield Performance Chart</p>
          </div>
        </motion.div>

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