'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { TrendingUp, Award, AlertTriangle, CheckCircle, Clock, DollarSign, BarChart3, Calendar, Target, Shield } from 'lucide-react';
import { getBorrowerReputation } from '@/lib/api';
import { BarChart, LineChart } from '@/components/charts';

interface ReputationData {
  borrower: string;
  totalLoans: number;
  repaidLoans: number;
  defaultedLoans: number;
  reputationScore: number;
  repaymentRate: number;
  creditScore: number;
}

interface LoanHistory {
  loanId: string;
  amount: number;
  status: 'repaid' | 'defaulted' | 'active';
  repaymentDate?: number;
  dueDate: number;
}

export default function ReputationPage() {
  const { address, isConnected } = useWallet();
  const [reputation, setReputation] = useState<ReputationData | null>(null);
  const [loanHistory, setLoanHistory] = useState<LoanHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('6months');

  useEffect(() => {
    if (isConnected && address) {
      loadReputationData();
    }
  }, [isConnected, address]);

  const loadReputationData = async () => {
    if (!address) return;

    setLoading(true);
    try {
      const reputationData = await getBorrowerReputation(address);
      setReputation(reputationData);

      // Mock loan history data - in real implementation, this would come from API
      const mockHistory: LoanHistory[] = [
        { loanId: '0x123...', amount: 5000, status: 'repaid', repaymentDate: Date.now() - 86400000 * 30, dueDate: Date.now() - 86400000 * 25 },
        { loanId: '0x456...', amount: 7500, status: 'repaid', repaymentDate: Date.now() - 86400000 * 60, dueDate: Date.now() - 86400000 * 55 },
        { loanId: '0x789...', amount: 3000, status: 'active', dueDate: Date.now() + 86400000 * 15 },
      ];
      setLoanHistory(mockHistory);
    } catch (error) {
      console.error('Failed to load reputation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReputationTier = (score: number) => {
    if (score >= 900) return { tier: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900' };
    if (score >= 800) return { tier: 'Very Good', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900' };
    if (score >= 700) return { tier: 'Good', color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900' };
    if (score >= 600) return { tier: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-900' };
    return { tier: 'Poor', color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900' };
  };

  const getRiskLevel = (score: number) => {
    if (score >= 750) return { level: 'Low Risk', color: 'text-green-600' };
    if (score >= 650) return { level: 'Medium Risk', color: 'text-yellow-600' };
    return { level: 'High Risk', color: 'text-red-600' };
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Please connect your wallet to view your reputation data.
          </p>
        </div>
      </div>
    );
  }

  const tier = reputation ? getReputationTier(reputation.reputationScore) : null;
  const risk = reputation ? getRiskLevel(reputation.reputationScore) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reputation Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Track your borrowing reputation and creditworthiness
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : reputation ? (
          <div className="space-y-8">
            {/* Reputation Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className={`p-6 rounded-lg ${tier?.bgColor}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Reputation Score</p>
                    <p className={`text-3xl font-bold ${tier?.color}`}>{reputation.reputationScore}</p>
                    <p className="text-sm text-gray-500">out of 1000</p>
                  </div>
                  <Award className={`w-8 h-8 ${tier?.color}`} />
                </div>
                <div className="mt-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${tier?.bgColor} ${tier?.color}`}>
                    {tier?.tier} Tier
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Credit Score</p>
                    <p className="text-3xl font-bold text-blue-600">{reputation.creditScore}</p>
                    <p className="text-sm text-gray-500">calculated</p>
                  </div>
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Repayment Rate</p>
                    <p className="text-3xl font-bold text-green-600">{reputation.repaymentRate.toFixed(1)}%</p>
                    <p className="text-sm text-gray-500">historical</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Risk Level</p>
                    <p className={`text-3xl font-bold ${risk?.color}`}>{risk?.level}</p>
                    <p className="text-sm text-gray-500">assessment</p>
                  </div>
                  <AlertTriangle className={`w-8 h-8 ${risk?.color}`} />
                </div>
              </div>
            </div>

            {/* Loan Statistics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Loan Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{reputation.totalLoans}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Loans</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{reputation.repaidLoans}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Successfully Repaid</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{reputation.defaultedLoans}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Defaults</div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reputation Trend</h3>
                <div className="h-64">
                  <LineChart
                    data={[
                      { month: 'Jan', score: 650 },
                      { month: 'Feb', score: 680 },
                      { month: 'Mar', score: 720 },
                      { month: 'Apr', score: 750 },
                      { month: 'May', score: 780 },
                      { month: 'Jun', score: reputation.reputationScore },
                    ]}
                    xKey="month"
                    yKey="score"
                    color="#10B981"
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Loan Performance</h3>
                <div className="h-64">
                  <BarChart
                    data={[
                      { category: 'Repaid', value: reputation.repaidLoans, color: '#10B981' },
                      { category: 'Active', value: reputation.totalLoans - reputation.repaidLoans - reputation.defaultedLoans, color: '#3B82F6' },
                      { category: 'Defaulted', value: reputation.defaultedLoans, color: '#EF4444' },
                    ]}
                    xKey="category"
                    yKey="value"
                  />
                </div>
              </div>
            </div>

            {/* Loan History */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Loan History</h2>
              <div className="space-y-4">
                {loanHistory.map((loan) => (
                  <div key={loan.loanId} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        loan.status === 'repaid' ? 'bg-green-500' :
                        loan.status === 'defaulted' ? 'bg-red-500' : 'bg-blue-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Loan {loan.loanId.slice(0, 8)}...
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ${loan.amount.toLocaleString()} • Due: {new Date(loan.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        loan.status === 'repaid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        loan.status === 'defaulted' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                      </span>
                      {loan.repaymentDate && (
                        <span className="text-sm text-gray-500">
                          {new Date(loan.repaymentDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reputation Insights */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Reputation Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">Strengths</h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    {reputation.repaidLoans > 0 && (
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {reputation.repaidLoans} successful repayments
                      </li>
                    )}
                    {reputation.repaymentRate >= 90 && (
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Excellent repayment rate ({reputation.repaymentRate.toFixed(1)}%)
                      </li>
                    )}
                    {reputation.reputationScore >= 750 && (
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        High reputation score
                      </li>
                    )}
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">Areas for Improvement</h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    {reputation.defaultedLoans > 0 && (
                      <li className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        {reputation.defaultedLoans} loan defaults recorded
                      </li>
                    )}
                    {reputation.repaymentRate < 85 && (
                      <li className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        Repayment rate could be improved
                      </li>
                    )}
                    {reputation.totalLoans < 3 && (
                      <li className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        More loan history needed for better assessment
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Reputation Data</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your reputation data will appear here once you have loan activity.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}