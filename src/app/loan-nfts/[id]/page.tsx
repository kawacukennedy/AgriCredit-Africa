'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import {
  ArrowLeft,
  ShoppingCart,
  TrendingUp,
  Shield,
  Clock,
  DollarSign,
  BarChart3,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Eye,
  Heart,
  Share2,
  Download
} from 'lucide-react';

interface DynamicAttributes {
  level: number;
  experience: number;
  health: number;
  yield: number;
  rarity: number;
  currentStage: string;
  lastUpdate: number;
  traits: Record<string, number>;
}

interface LoanNFT {
  id: string;
  tokenId: string;
  loanId: string;
  borrower: string;
  amount: number;
  interestRate: number;
  duration: number;
  remainingTerm: number;
  collateral: {
    type: string;
    value: number;
    description: string;
  };
  riskScore: number;
  creditScore: number;
  repaymentHistory: {
    totalPaid: number;
    onTimePayments: number;
    totalPayments: number;
  };
  price: number;
  floorPrice: number;
  lastSalePrice?: number;
  isListed: boolean;
  owner: string;
  metadata: {
    image: string;
    attributes: Array<{
      trait_type: string;
      value: string | number;
    }>;
  };
  yieldProjection: number;
  liquidationPrice: number;
  startDate: number;
  endDate: number;
  repaymentSchedule: Array<{
    date: number;
    amount: number;
    principal: number;
    interest: number;
    status: 'pending' | 'paid' | 'overdue';
  }>;
  dynamicAttributes: DynamicAttributes;
}

export default function LoanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const [loanNFT, setLoanNFT] = useState<LoanNFT | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    if (params.id) {
      loadLoanNFT(params.id as string);
    }
  }, [params.id]);

  // Real-time updates for dynamic attributes
  useEffect(() => {
    if (!loanNFT) return;

    const interval = setInterval(() => {
      updateDynamicAttributes();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [loanNFT]);

  const updateDynamicAttributes = () => {
    if (!loanNFT) return;

    setLoanNFT(prev => {
      if (!prev) return prev;

      const newAttributes = { ...prev.dynamicAttributes };

      // Simulate dynamic changes based on farming conditions
      const timeSinceLastUpdate = (Date.now() - newAttributes.lastUpdate) / 1000 / 60 / 60; // hours

      // Health changes based on weather/sensors (simulated)
      const healthChange = (Math.random() - 0.5) * 2; // -1 to +1
      newAttributes.health = Math.max(0, Math.min(100, newAttributes.health + healthChange));

      // Yield prediction updates
      const yieldChange = (Math.random() - 0.4) * 0.5; // Slightly upward bias
      newAttributes.yield = Math.max(0, newAttributes.yield + yieldChange);

      // Experience gain over time
      newAttributes.experience += Math.random() * 2;

      // Update traits
      newAttributes.traits.waterLevel = Math.max(0, Math.min(100, newAttributes.traits.waterLevel + (Math.random() - 0.5) * 5));
      newAttributes.traits.soilQuality = Math.max(0, Math.min(100, newAttributes.traits.soilQuality + (Math.random() - 0.5) * 2));
      newAttributes.traits.pestLevel = Math.max(0, Math.min(100, Math.random() * 30));

      newAttributes.lastUpdate = Date.now();

      // Check for evolution
      if (newAttributes.experience >= 100 + (newAttributes.level - 1) * 50 && newAttributes.level < 100) {
        newAttributes.level += 1;
        newAttributes.experience = 0; // Reset experience after level up
      }

      return { ...prev, dynamicAttributes: newAttributes };
    });

    setLastUpdate(Date.now());
  };

  const loadLoanNFT = async (id: string) => {
    setLoading(true);
    try {
      // Mock data - in production, fetch from API
      const mockNFT: LoanNFT = {
        id: id,
        tokenId: `100${id}`,
        loanId: `LOAN-2024-00${id}`,
        borrower: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        amount: 5000,
        interestRate: 8.5,
        duration: 365,
        remainingTerm: 245,
        collateral: {
          type: 'Corn Harvest',
          value: 7500,
          description: 'Q4 2024 corn harvest from 50-acre farm in fertile plains'
        },
        riskScore: 2.1,
        creditScore: 720,
        repaymentHistory: {
          totalPaid: 1250,
          onTimePayments: 3,
          totalPayments: 3
        },
        price: 5200,
        floorPrice: 5100,
        lastSalePrice: 5150,
        isListed: true,
        owner: '0x8ba1f109551bD432803012645ac136ddd64DBA72',
        metadata: {
          image: '/api/placeholder/400/400',
          attributes: [
            { trait_type: 'Risk Level', value: 'Low' },
            { trait_type: 'Yield', value: '8.5%' },
            { trait_type: 'Duration', value: '365 days' },
            { trait_type: 'Collateral', value: 'Corn Harvest' }
          ]
        },
        yieldProjection: 8.5,
        liquidationPrice: 4800,
        startDate: Date.now() - 120 * 24 * 60 * 60 * 1000, // 120 days ago
        endDate: Date.now() + 245 * 24 * 60 * 60 * 1000, // 245 days from now
        dynamicAttributes: {
          level: 3,
          experience: 75,
          health: 85,
          yield: 8.5,
          rarity: 2,
          currentStage: 'mature',
          lastUpdate: Date.now(),
          traits: {
            cropType: 1234567890, // hashed string
            plantingDate: Date.now() - 120 * 24 * 60 * 60 * 1000,
            waterLevel: 78,
            soilQuality: 82,
            pestLevel: 12,
            farmSize: 50
          }
        }
        repaymentSchedule: [
          {
            date: Date.now() - 90 * 24 * 60 * 60 * 1000,
            amount: 416.67,
            principal: 341.67,
            interest: 75.00,
            status: 'paid'
          },
          {
            date: Date.now() - 60 * 24 * 60 * 60 * 1000,
            amount: 416.67,
            principal: 349.67,
            interest: 67.00,
            status: 'paid'
          },
          {
            date: Date.now() - 30 * 24 * 60 * 60 * 1000,
            amount: 416.67,
            principal: 357.67,
            interest: 59.00,
            status: 'paid'
          },
          {
            date: Date.now() + 30 * 24 * 60 * 60 * 1000,
            amount: 416.67,
            principal: 365.67,
            interest: 51.00,
            status: 'pending'
          },
          {
            date: Date.now() + 60 * 24 * 60 * 60 * 1000,
            amount: 416.67,
            principal: 373.67,
            interest: 43.00,
            status: 'pending'
          }
        ]
      };

      setLoanNFT(mockNFT);
    } catch (error) {
      console.error('Failed to load loan NFT:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore <= 2.0) return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
    if (riskScore <= 2.5) return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
    if (riskScore <= 3.5) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
    return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      case 'overdue': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const calculateTotalReturn = () => {
    if (!loanNFT) return 0;
    const totalPayments = loanNFT.repaymentSchedule.reduce((sum, payment) => sum + payment.amount, 0);
    return totalPayments - loanNFT.amount;
  };

  const handlePurchase = () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet to make a purchase');
      return;
    }
    setShowPurchaseModal(true);
  };

  const confirmPurchase = async () => {
    // Implement purchase logic
    alert('Purchase functionality would be implemented here');
    setShowPurchaseModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!loanNFT) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Loan Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            The loan NFT you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/loan-nfts')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/loan-nfts')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Marketplace
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFavorited(!isFavorited)}
              className={`p-2 rounded-full transition-colors ${
                isFavorited ? 'text-red-500 bg-red-50 dark:bg-red-900' : 'text-gray-400 hover:text-red-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
            </button>
            <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - NFT Image and Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="relative">
                <img
                  src={loanNFT.metadata.image}
                  alt={`Loan NFT ${loanNFT.tokenId}`}
                  className="w-full h-96 object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getRiskColor(loanNFT.riskScore)}`}>
                    Risk: {loanNFT.riskScore.toFixed(1)}/5
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Listed
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{loanNFT.loanId}</h1>
                    <p className="text-gray-600 dark:text-gray-400">Token #{loanNFT.tokenId}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">${loanNFT.price.toLocaleString()}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Current Price</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">{loanNFT.yieldProjection}%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">APY</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">{loanNFT.duration}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">{loanNFT.remainingTerm}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Remaining</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">{loanNFT.creditScore}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Credit Score</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handlePurchase}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Buy Now
                  </button>
                  <button className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Make Offer
                  </button>
                </div>
              </div>
            </div>

            {/* Loan Terms */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                Loan Terms
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Principal Amount:</span>
                    <span className="font-medium text-gray-900 dark:text-white">${loanNFT.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Interest Rate:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{loanNFT.interestRate}% APR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{loanNFT.duration} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Start Date:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{new Date(loanNFT.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">End Date:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{new Date(loanNFT.endDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Interest:</span>
                    <span className="font-medium text-gray-900 dark:text-white">${calculateTotalReturn().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Return:</span>
                    <span className="font-medium text-green-600">${(loanNFT.amount + calculateTotalReturn()).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Monthly Payment:</span>
                    <span className="font-medium text-gray-900 dark:text-white">${(loanNFT.amount * (1 + loanNFT.interestRate/100) / 12).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">LTV Ratio:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{((loanNFT.amount / loanNFT.collateral.value) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Liquidation Price:</span>
                    <span className="font-medium text-gray-900 dark:text-white">${loanNFT.liquidationPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Repayment Schedule */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Repayment Schedule
              </h2>

              <div className="space-y-4">
                {loanNFT.repaymentSchedule.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${getStatusColor(payment.status)}`}>
                        {payment.status === 'paid' && <CheckCircle className="w-4 h-4" />}
                        {payment.status === 'pending' && <Clock className="w-4 h-4" />}
                        {payment.status === 'overdue' && <AlertTriangle className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {new Date(payment.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {payment.status}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900 dark:text-white">
                        ${payment.amount.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        ${payment.principal.toFixed(2)} + ${payment.interest.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Collateral & Risk Analysis */}
          <div className="space-y-6">
            {/* Collateral Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                Collateral
              </h2>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{loanNFT.collateral.type}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Value:</span>
                    <span className="font-medium text-gray-900 dark:text-white">${loanNFT.collateral.value.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">LTV:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{((loanNFT.amount / loanNFT.collateral.value) * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {loanNFT.collateral.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Risk Analysis */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-600" />
                Risk Analysis
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Risk Score:</span>
                  <span className={`font-medium px-2 py-1 rounded ${getRiskColor(loanNFT.riskScore)}`}>
                    {loanNFT.riskScore.toFixed(1)}/5
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Credit Score:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{loanNFT.creditScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Repayment Rate:</span>
                  <span className="font-medium text-green-600">
                    {((loanNFT.repaymentHistory.onTimePayments / loanNFT.repaymentHistory.totalPayments) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Paid:</span>
                  <span className="font-medium text-gray-900 dark:text-white">${loanNFT.repaymentHistory.totalPaid.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* NFT Attributes */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-600" />
                NFT Attributes
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {loanNFT.metadata.attributes.map((attr, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      {attr.trait_type}
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {attr.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Attributes */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Dynamic Attributes
                </h2>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Last updated: {new Date(lastUpdate).toLocaleTimeString()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                    {loanNFT.dynamicAttributes.level}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    Level
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-700 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(loanNFT.dynamicAttributes.experience / (100 + (loanNFT.dynamicAttributes.level - 1) * 50)) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-blue-500 mt-1">
                    {loanNFT.dynamicAttributes.experience.toFixed(0)} / {100 + (loanNFT.dynamicAttributes.level - 1) * 50} XP
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-300">
                    {loanNFT.dynamicAttributes.health.toFixed(0)}%
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    Health
                  </div>
                  <div className="w-full bg-green-200 dark:bg-green-700 rounded-full h-2 mt-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${loanNFT.dynamicAttributes.health}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-green-500 mt-1">
                    Crop vitality
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">
                    {loanNFT.dynamicAttributes.yield.toFixed(1)}t
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">
                    Yield Prediction
                  </div>
                  <div className="text-xs text-purple-500 mt-1">
                    Expected harvest
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-300 capitalize">
                    {loanNFT.dynamicAttributes.currentStage}
                  </div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">
                    Growth Stage
                  </div>
                  <div className="text-xs text-yellow-500 mt-1">
                    Current phase
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Farm Conditions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Water Level</span>
                      <span className="font-medium">{loanNFT.dynamicAttributes.traits.waterLevel.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${loanNFT.dynamicAttributes.traits.waterLevel}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Soil Quality</span>
                      <span className="font-medium">{loanNFT.dynamicAttributes.traits.soilQuality.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${loanNFT.dynamicAttributes.traits.soilQuality}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Pest Level</span>
                      <span className="font-medium">{loanNFT.dynamicAttributes.traits.pestLevel.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${loanNFT.dynamicAttributes.traits.pestLevel}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Farm Size</span>
                      <span className="font-medium">{loanNFT.dynamicAttributes.traits.farmSize} acres</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (loanNFT.dynamicAttributes.traits.farmSize / 100) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Real-time updates every 30 seconds</span>
                </div>
                <p className="text-xs text-blue-500 dark:text-blue-500 mt-1">
                  Attributes change based on weather, soil conditions, and farming activities
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Confirm Purchase
            </h3>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">NFT Price:</span>
                <span className="font-medium text-gray-900 dark:text-white">${loanNFT.price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Gas Fee (est.):</span>
                <span className="font-medium text-gray-900 dark:text-white">$5.00</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between">
                <span className="font-medium text-gray-900 dark:text-white">Total:</span>
                <span className="font-bold text-gray-900 dark:text-white">${(loanNFT.price + 5).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmPurchase}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Confirm Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}