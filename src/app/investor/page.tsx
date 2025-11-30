'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  BarChart3,
  Activity,
  Calendar,
  Target,
  Award,
  ShoppingCart,
  Eye,
  Heart,
  Zap,
  Shield
} from 'lucide-react';

interface PortfolioMetrics {
  totalInvested: number;
  totalReturns: number;
  activeInvestments: number;
  portfolioValue: number;
  yieldRate: number;
  riskScore: number;
}

interface Investment {
  id: string;
  type: 'loan' | 'liquidity_pool' | 'yield_farm' | 'nft';
  name: string;
  amount: number;
  returns: number;
  yield: number;
  risk: 'low' | 'medium' | 'high';
  status: 'active' | 'matured' | 'defaulted';
  startDate: number;
  endDate?: number;
}

interface LoanNFT {
  id: string;
  loanId: string;
  borrower: string;
  amount: number;
  interestRate: number;
  duration: number;
  collateral: string;
  riskScore: number;
  price: number;
  isListed: boolean;
}

export default function InvestorPortal() {
  const { address, isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState('portfolio');
  const [portfolio, setPortfolio] = useState<PortfolioMetrics | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loanNFTs, setLoanNFTs] = useState<LoanNFT[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    { id: 'investments', label: 'My Investments', icon: TrendingUp },
    { id: 'marketplace', label: 'Loan NFT Market', icon: ShoppingCart },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  useEffect(() => {
    if (isConnected && address) {
      loadInvestorData();
    }
  }, [isConnected, address]);

  const loadInvestorData = async () => {
    setLoading(true);
    try {
      // Mock data - in production, fetch from API
      setPortfolio({
        totalInvested: 50000,
        totalReturns: 3250,
        activeInvestments: 8,
        portfolioValue: 53250,
        yieldRate: 6.5,
        riskScore: 3.2
      });

      setInvestments([
        {
          id: '1',
          type: 'loan',
          name: 'Agricultural Loan #1234',
          amount: 10000,
          returns: 650,
          yield: 6.5,
          risk: 'medium',
          status: 'active',
          startDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
          endDate: Date.now() + 335 * 24 * 60 * 60 * 1000 // 335 days from now
        },
        {
          id: '2',
          type: 'liquidity_pool',
          name: 'AgriCredit LP Pool',
          amount: 25000,
          returns: 1250,
          yield: 5.0,
          risk: 'low',
          status: 'active',
          startDate: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
        },
        {
          id: '3',
          type: 'yield_farm',
          name: 'Corn Yield Farm',
          amount: 15000,
          returns: 1350,
          yield: 9.0,
          risk: 'high',
          status: 'active',
          startDate: Date.now() - 45 * 24 * 60 * 60 * 1000, // 45 days ago
        }
      ]);

      setLoanNFTs([
        {
          id: '1',
          loanId: 'LNFT-001',
          borrower: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          amount: 5000,
          interestRate: 8.5,
          duration: 365,
          collateral: 'Corn Harvest',
          riskScore: 2.1,
          price: 5200,
          isListed: true
        },
        {
          id: '2',
          loanId: 'LNFT-002',
          borrower: '0x8ba1f109551bD432803012645ac136ddd64DBA72',
          amount: 7500,
          interestRate: 7.2,
          duration: 180,
          collateral: 'Wheat Field',
          riskScore: 1.8,
          price: 7650,
          isListed: true
        }
      ]);
    } catch (error) {
      console.error('Failed to load investor data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Investor Portal
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Connect your wallet to access investment opportunities and portfolio management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Investor Portal</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Manage your investments, explore opportunities, and track performance
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors whitespace-nowrap ${
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
        <div className="space-y-6">
          {activeTab === 'portfolio' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Portfolio Value</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${portfolio?.portfolioValue.toLocaleString() || '0'}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-green-600">+{portfolio?.yieldRate || 0}% APY</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Returns</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${portfolio?.totalReturns.toLocaleString() || '0'}
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">From ${portfolio?.totalInvested.toLocaleString() || '0'} invested</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Investments</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {portfolio?.activeInvestments || 0}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-purple-600" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm">
                    <Shield className="w-4 h-4 text-gray-400 mr-1" />
                    <span className="text-gray-600 dark:text-gray-400">Risk Score: {portfolio?.riskScore || 0}/5</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'investments' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                My Investments
              </h2>

              <div className="space-y-4">
                {investments.map((investment) => (
                  <div key={investment.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{investment.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{investment.type.replace('_', ' ')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          investment.risk === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          investment.risk === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {investment.risk} risk
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          investment.status === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          investment.status === 'matured' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {investment.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Invested:</span>
                        <div className="font-medium text-gray-900 dark:text-white">${investment.amount.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Returns:</span>
                        <div className="font-medium text-green-600">${investment.returns.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Yield:</span>
                        <div className="font-medium text-gray-900 dark:text-white">{investment.yield}%</div>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Start Date:</span>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {new Date(investment.startDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'marketplace' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Loan NFT Marketplace
                  </h2>
                  <div className="flex gap-2">
                    <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
                      My NFTs
                    </button>
                    <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                      List NFT
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {loanNFTs.map((nft) => (
                    <div key={nft.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{nft.loanId}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Borrower: {nft.borrower.slice(0, 6)}...{nft.borrower.slice(-4)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            nft.riskScore <= 2.0 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            nft.riskScore <= 3.0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            Risk: {nft.riskScore}/5
                          </span>
                          {nft.isListed && (
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              Listed
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Loan Amount:</span>
                          <div className="font-medium text-gray-900 dark:text-white">${nft.amount.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Interest Rate:</span>
                          <div className="font-medium text-gray-900 dark:text-white">{nft.interestRate}%</div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                          <div className="font-medium text-gray-900 dark:text-white">{nft.duration} days</div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Collateral:</span>
                          <div className="font-medium text-gray-900 dark:text-white">{nft.collateral}</div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">${nft.price.toLocaleString()}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Current Price</div>
                        </div>
                        <div className="flex gap-2">
                          <button className="flex items-center gap-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg transition-colors text-sm">
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          <button className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors text-sm">
                            <ShoppingCart className="w-4 h-4" />
                            Buy
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Portfolio Analytics
              </h2>
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                  Advanced Analytics
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Performance charts, risk analysis, and yield projections coming soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}