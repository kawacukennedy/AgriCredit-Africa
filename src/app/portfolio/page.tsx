'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ExternalLink,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Shield,
  Zap
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import {
  getInvestorPortfolio,
  getPortfolioAnalytics,
  getLoanNFTs,
  getTransactionHistory,
  withdrawFromLoan,
  sellLoanNFT
} from '@/lib/api';

interface PortfolioData {
  totalValue: number;
  totalInvested: number;
  totalReturns: number;
  totalAPY: number;
  activeLoans: number;
  maturedLoans: number;
  defaultedLoans: number;
  availableBalance: number;
}

interface LoanInvestment {
  id: string;
  loanId: string;
  amount: number;
  currentValue: number;
  expectedReturn: number;
  apy: number;
  status: 'active' | 'matured' | 'defaulted';
  borrower: string;
  cropType: string;
  location: string;
  fundedDate: string;
  maturityDate: string;
  riskLevel: 'low' | 'medium' | 'high';
  nftTokenId?: string;
}

interface Transaction {
  id: string;
  type: 'investment' | 'return' | 'withdrawal' | 'fee';
  amount: number;
  date: string;
  loanId?: string;
  txHash: string;
  status: 'completed' | 'pending' | 'failed';
}

export default function InvestorPortfolio() {
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [investments, setInvestments] = useState<LoanInvestment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loanNFTs, setLoanNFTs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedInvestment, setSelectedInvestment] = useState<LoanInvestment | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      loadPortfolioData();
    }
  }, [isConnected, address]);

  const loadPortfolioData = async () => {
    if (!address) return;

    try {
      setLoading(true);
      const [portfolioData, investmentsData, transactionsData, nftsData] = await Promise.allSettled([
        getPortfolioAnalytics(address),
        getInvestorPortfolio(address),
        getTransactionHistory(address),
        getLoanNFTs(address)
      ]);

      if (portfolioData.status === 'fulfilled') {
        setPortfolio(portfolioData.value);
      }

      if (investmentsData.status === 'fulfilled') {
        setInvestments(investmentsData.value);
      }

      if (transactionsData.status === 'fulfilled') {
        setTransactions(transactionsData.value);
      }

      if (nftsData.status === 'fulfilled') {
        setLoanNFTs(nftsData.value);
      }
    } catch (error) {
      console.error('Failed to load portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!selectedInvestment || !withdrawAmount) return;

    const amount = parseFloat(withdrawAmount);
    if (amount <= 0 || amount > selectedInvestment.currentValue) {
      alert('Invalid withdrawal amount');
      return;
    }

    setWithdrawing(true);
    try {
      const result = await withdrawFromLoan(selectedInvestment.loanId, amount);

      if (result.success) {
        alert(`Successfully withdrew $${amount} from loan ${selectedInvestment.loanId}`);
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setSelectedInvestment(null);
        loadPortfolioData(); // Refresh data
      } else {
        alert(`Withdrawal failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Withdrawal failed:', error);
      alert('Withdrawal failed. Please try again.');
    } finally {
      setWithdrawing(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900';
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-600 bg-blue-100 dark:bg-blue-900';
      case 'matured': return 'text-green-600 bg-green-100 dark:bg-green-900';
      case 'defaulted': return 'text-red-600 bg-red-100 dark:bg-red-900';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Connect Your Wallet
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Please connect your wallet to view your investment portfolio.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  const totalReturnPercentage = portfolio ? ((portfolio.totalReturns / portfolio.totalInvested) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Investment Portfolio</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track your agricultural investments and returns
              </p>
            </div>
            <button
              onClick={loadPortfolioData}
              disabled={loading}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Portfolio Summary */}
        {portfolio && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</span>
                </div>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                ${portfolio.totalValue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                +${portfolio.totalReturns.toFixed(2)} returns
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Average APY</span>
                </div>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {portfolio.totalAPY.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Annual return rate
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Loans</span>
                </div>
                <Activity className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                {portfolio.activeLoans}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Currently earning
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Available Balance</span>
                </div>
                <DollarSign className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">
                ${portfolio.availableBalance.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Ready to invest
              </div>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'investments', label: 'Investments', icon: DollarSign },
            { id: 'nfts', label: 'Loan NFTs', icon: Shield },
            { id: 'transactions', label: 'Transactions', icon: Activity }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Risk Heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Risk Distribution
              </h3>
              <div className="space-y-4">
                {[
                  { risk: 'low', count: investments.filter(i => i.riskLevel === 'low').length, color: 'bg-green-500' },
                  { risk: 'medium', count: investments.filter(i => i.riskLevel === 'medium').length, color: 'bg-yellow-500' },
                  { risk: 'high', count: investments.filter(i => i.riskLevel === 'high').length, color: 'bg-red-500' }
                ].map((item) => (
                  <div key={item.risk} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded ${item.color}`}></div>
                      <span className="capitalize text-gray-700 dark:text-gray-300">{item.risk} Risk</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.count} loans</span>
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${item.color}`}
                          style={{ width: `${investments.length > 0 ? (item.count / investments.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Performance Chart Placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Portfolio Performance
              </h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">Performance chart coming soon</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === 'investments' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Your Investments ({investments.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {investments.length > 0 ? investments.map((investment) => (
                <div key={investment.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-800 dark:text-white">
                          Loan #{investment.loanId}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(investment.status)}`}>
                          {investment.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(investment.riskLevel)}`}>
                          {investment.riskLevel} risk
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <div>{investment.cropType} • {investment.location}</div>
                        <div>Funded {new Date(investment.fundedDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-800 dark:text-white">
                        ${investment.currentValue.toLocaleString()}
                      </div>
                      <div className={`text-sm flex items-center gap-1 ${
                        investment.currentValue >= investment.amount ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {investment.currentValue >= investment.amount ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        ${(investment.currentValue - investment.amount).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Invested</div>
                      <div className="font-medium">${investment.amount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">APY</div>
                      <div className="font-medium text-green-600">{investment.apy.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Expected Return</div>
                      <div className="font-medium">${investment.expectedReturn.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Maturity</div>
                      <div className="font-medium">{new Date(investment.maturityDate).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/loan/${investment.loanId}`)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                    >
                      View Details
                    </button>
                    {investment.status === 'active' && (
                      <button
                        onClick={() => {
                          setSelectedInvestment(investment);
                          setShowWithdrawModal(true);
                        }}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                      >
                        Withdraw
                      </button>
                    )}
                    {investment.nftTokenId && (
                      <button className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors">
                        View NFT
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                    No investments yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Start investing in agricultural loans to build your portfolio.
                  </p>
                  <button
                    onClick={() => router.push('/marketplace')}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Browse Loans
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'nfts' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {loanNFTs.length > 0 ? loanNFTs.map((nft) => (
              <div key={nft.tokenId} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                  <Shield className="w-16 h-16 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-2">
                    Loan NFT #{nft.tokenId}
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4">
                    <div>Loan: #{nft.loanId}</div>
                    <div>Value: ${nft.value.toLocaleString()}</div>
                    <div>APY: {nft.apy.toFixed(1)}%</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm transition-colors">
                      View Details
                    </button>
                    <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm transition-colors">
                      Sell NFT
                    </button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full text-center py-12">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                  No Loan NFTs
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your loan NFTs will appear here once you have tokenized investments.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'transactions' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Transaction History
              </h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.length > 0 ? transactions.map((tx) => (
                <div key={tx.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${
                        tx.type === 'investment' ? 'bg-green-100 dark:bg-green-900' :
                        tx.type === 'return' ? 'bg-blue-100 dark:bg-blue-900' :
                        tx.type === 'withdrawal' ? 'bg-orange-100 dark:bg-orange-900' :
                        'bg-gray-100 dark:bg-gray-900'
                      }`}>
                        {tx.type === 'investment' ? <TrendingUp className="w-4 h-4 text-green-600" /> :
                         tx.type === 'return' ? <DollarSign className="w-4 h-4 text-blue-600" /> :
                         tx.type === 'withdrawal' ? <ArrowDownRight className="w-4 h-4 text-orange-600" /> :
                         <Activity className="w-4 h-4 text-gray-600" />}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800 dark:text-white capitalize">
                          {tx.type}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString()}
                        </div>
                        {tx.loanId && (
                          <div className="text-sm text-blue-600 dark:text-blue-400">
                            Loan #{tx.loanId}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${
                        tx.type === 'return' || tx.type === 'investment' ? 'text-green-600' :
                        tx.type === 'withdrawal' ? 'text-red-600' : 'text-gray-800 dark:text-white'
                      }`}>
                        {tx.type === 'withdrawal' ? '-' : '+'}${tx.amount.toLocaleString()}
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                        tx.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {tx.status}
                      </div>
                      <a
                        href={`https://polygonscan.com/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-blue-600 hover:text-blue-700 mt-1"
                      >
                        View on Explorer
                      </a>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                    No transactions yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your investment transactions will appear here.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </main>

      {/* Withdraw Modal */}
      {showWithdrawModal && selectedInvestment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Withdraw from Loan #{selectedInvestment.loanId}
              </h3>

              <div className="mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Current Value: ${selectedInvestment.currentValue.toLocaleString()}
                </div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Withdrawal Amount (USD)
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="Enter amount"
                  min="1"
                  max={selectedInvestment.currentValue}
                  step="0.01"
                />
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900 p-3 rounded-lg mb-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> Early withdrawal may result in penalties and loss of accrued interest.
                  The remaining investment will continue earning returns.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {withdrawing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Withdrawing...
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="w-4 h-4" />
                      Withdraw
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}