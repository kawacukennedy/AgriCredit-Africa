'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  TrendingUp,
  DollarSign,
  Calendar,
  MapPin,
  User,
  Shield,
  CheckCircle,
  AlertCircle,
  Eye,
  Download,
  Share2,
  Heart,
  MessageSquare,
  Clock,
  Target,
  BarChart3
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { getLoanDetail, fundLoan, getAIReport, getLoanContractDetails } from '@/lib/api';

interface LoanDetail {
  id: string;
  borrower: string;
  amount: number;
  funded_amount: number;
  status: 'requested' | 'funded' | 'disbursed' | 'repaid' | 'defaulted';
  ai_score: number;
  ai_report_cid: string;
  contract_address: string;
  created_at: string;
  updated_at: string;
  farm_data: {
    crop_type: string;
    farm_size: number;
    location: string;
    expected_yield: number;
  };
  borrower_info: {
    name: string;
    reputation_score: number;
    total_loans: number;
    repayment_rate: number;
  };
  funders: Array<{
    address: string;
    amount: number;
    funded_at: string;
    tx_hash: string;
  }>;
}

interface AIReport {
  score: number;
  risk_level: string;
  confidence: number;
  explanation: string[];
  factors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  recommendations: string[];
  cid: string;
}

export default function LoanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [contractDetails, setContractDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(false);
  const [fundingAmount, setFundingAmount] = useState('');
  const [showFundingModal, setShowFundingModal] = useState(false);

  const loanId = params.id as string;

  useEffect(() => {
    if (loanId) {
      loadLoanData();
    }
  }, [loanId]);

  const loadLoanData = async () => {
    try {
      setLoading(true);
      const [loanData, contractData] = await Promise.allSettled([
        getLoanDetail(loanId),
        getLoanContractDetails(loanId)
      ]);

      if (loanData.status === 'fulfilled') {
        setLoan(loanData.value);

        // Load AI report if available
        if (loanData.value.ai_report_cid) {
          try {
            const reportData = await getAIReport(loanData.value.ai_report_cid);
            setAiReport(reportData);
          } catch (error) {
            console.warn('Failed to load AI report:', error);
          }
        }
      }

      if (contractData.status === 'fulfilled') {
        setContractDetails(contractData.value);
      }
    } catch (error) {
      console.error('Failed to load loan data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFundLoan = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet to fund this loan');
      return;
    }

    if (!fundingAmount || parseFloat(fundingAmount) <= 0) {
      alert('Please enter a valid funding amount');
      return;
    }

    const amount = parseFloat(fundingAmount);
    const remainingAmount = loan!.amount - loan!.funded_amount;

    if (amount > remainingAmount) {
      alert(`Maximum funding amount is $${remainingAmount.toFixed(2)}`);
      return;
    }

    setFunding(true);
    try {
      const result = await fundLoan(loanId, amount);

      if (result.success) {
        alert(`Successfully funded $${amount} to this loan!`);
        setShowFundingModal(false);
        setFundingAmount('');
        loadLoanData(); // Refresh data
      } else {
        alert(`Funding failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Funding failed:', error);
      alert('Funding failed. Please try again.');
    } finally {
      setFunding(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'funded': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'disbursed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'repaid': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'defaulted': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading loan details...</p>
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Loan Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The loan you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/marketplace')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const progressPercentage = (loan.funded_amount / loan.amount) * 100;
  const remainingAmount = loan.amount - loan.funded_amount;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Loan #{loan.id.slice(-8)}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Created {new Date(loan.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(loan.status)}`}>
                {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Loan Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                    Loan Overview
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {loan.borrower_info.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {loan.farm_data.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(loan.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">
                    ${loan.amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Requested Amount
                  </div>
                </div>
              </div>

              {/* Funding Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Funding Progress
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ${loan.funded_amount.toLocaleString()} / ${loan.amount.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {progressPercentage.toFixed(1)}% funded
                </div>
              </div>

              {/* Farm Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Crop Type</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-800 dark:text-white">
                    {loan.farm_data.crop_type}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Farm Size</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-800 dark:text-white">
                    {loan.farm_data.farm_size} hectares
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Expected Yield</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-800 dark:text-white">
                    {loan.farm_data.expected_yield} tons
                  </div>
                </div>
              </div>

              {/* Borrower Info */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
                  Borrower Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Reputation Score</span>
                    <div className="text-xl font-semibold text-gray-800 dark:text-white">
                      {loan.borrower_info.reputation_score}/1000
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Loans</span>
                    <div className="text-xl font-semibold text-gray-800 dark:text-white">
                      {loan.borrower_info.total_loans}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Repayment Rate</span>
                    <div className="text-xl font-semibold text-gray-800 dark:text-white">
                      {loan.borrower_info.repayment_rate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* AI Report Panel */}
            {aiReport && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                      AI Credit Assessment Report
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button className="flex items-center gap-1 text-gray-600 hover:text-gray-700 text-sm">
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-300 mb-1">
                      {aiReport.score}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      Credit Score
                    </div>
                    <div className="text-xs text-blue-500 mt-1">
                      Out of 850
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-4 rounded-lg">
                    <div className={`text-2xl font-bold mb-1 ${getRiskColor(aiReport.risk_level)}`}>
                      {aiReport.risk_level}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Risk Level
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Assessment Result
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-300 mb-1">
                      {(aiReport.confidence * 100).toFixed(0)}%
                    </div>
                    <div className="text-sm text-purple-600 dark:text-purple-400">
                      Confidence
                    </div>
                    <div className="text-xs text-purple-500 mt-1">
                      AI Certainty
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
                    Key Factors
                  </h3>
                  <div className="space-y-3">
                    {aiReport.factors.map((factor, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-800 dark:text-white">
                            {factor.factor}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {factor.description}
                          </div>
                        </div>
                        <div className={`text-sm font-medium ${
                          factor.impact > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {factor.impact > 0 ? '+' : ''}{factor.impact}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
                    AI Recommendations
                  </h3>
                  <div className="space-y-2">
                    {aiReport.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Report CID: {aiReport.cid}</span>
                    <a
                      href={`https://ipfs.io/ipfs/${aiReport.cid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on IPFS
                    </a>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Contract Details */}
            {contractDetails && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
              >
                <div className="flex items-center gap-2 mb-6">
                  <Shield className="w-5 h-5 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Smart Contract Details
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Contract Address
                      </label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm font-mono break-all">
                          {loan.contract_address}
                        </code>
                        <button
                          onClick={() => navigator.clipboard.writeText(loan.contract_address)}
                          className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                          title="Copy address"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Network
                      </label>
                      <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                        Polygon Mainnet
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={`https://polygonscan.com/address/${loan.contract_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on Explorer
                    </a>
                    <a
                      href={`https://polygonscan.com/token/${loan.contract_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Token Details
                    </a>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Funders List */}
            {loan.funders.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
              >
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                  Funders ({loan.funders.length})
                </h2>
                <div className="space-y-3">
                  {loan.funders.map((funder, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {funder.address.slice(2, 4).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800 dark:text-white">
                            {funder.address.slice(0, 6)}...{funder.address.slice(-4)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(funder.funded_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-800 dark:text-white">
                          ${funder.amount.toLocaleString()}
                        </div>
                        <a
                          href={`https://polygonscan.com/tx/${funder.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          View TX
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contract Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Contract Actions
              </h3>

              {loan.status === 'requested' && remainingAmount > 0 && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                    <div className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                      <strong>Remaining to fund:</strong> ${remainingAmount.toLocaleString()}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-300">
                      Help this farmer by providing liquidity to their loan.
                    </div>
                  </div>

                  <button
                    onClick={() => setShowFundingModal(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <DollarSign className="w-5 h-5" />
                    Fund This Loan
                  </button>
                </div>
              )}

              {loan.status === 'funded' && (
                <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800 dark:text-green-200 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Loan Fully Funded</span>
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    Funds will be disbursed to the borrower shortly.
                  </div>
                </div>
              )}

              {loan.status === 'disbursed' && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">Loan Active</span>
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Borrower is repaying according to the agreed schedule.
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded-lg transition-colors text-sm">
                    <Heart className="w-4 h-4" />
                    Favorite
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded-lg transition-colors text-sm">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Interest Rate</span>
                  <span className="font-medium">
                    {loan.ai_score >= 750 ? '5%' : loan.ai_score >= 650 ? '7%' : '10%'} APR
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Duration</span>
                  <span className="font-medium">
                    {loan.ai_score >= 750 ? '24 months' : loan.ai_score >= 650 ? '18 months' : '12 months'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Expected ROI</span>
                  <span className="font-medium text-green-600">
                    {loan.ai_score >= 750 ? '12-15%' : loan.ai_score >= 650 ? '15-18%' : '18-22%'}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Funding Modal */}
      {showFundingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Fund This Loan
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Funding Amount (USD)
                </label>
                <input
                  type="number"
                  value={fundingAmount}
                  onChange={(e) => setFundingAmount(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="Enter amount"
                  min="1"
                  max={remainingAmount}
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: ${remainingAmount.toFixed(2)}
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900 p-3 rounded-lg mb-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Note:</strong> Your funds will be locked in escrow until the loan is repaid or defaults.
                  You can earn interest based on the loan's performance.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowFundingModal(false)}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFundLoan}
                  disabled={funding || !fundingAmount || parseFloat(fundingAmount) <= 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {funding ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Funding...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4" />
                      Fund Loan
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