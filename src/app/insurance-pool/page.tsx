'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/hooks/useWallet';
import { contractInteractions } from '@/lib/contractInteractions';
import { Shield, TrendingUp, DollarSign, Users, Plus, Minus, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface InsurancePool {
  id: string;
  name: string;
  description: string;
  totalLiquidity: string;
  activePolicies: number;
  coverageRatio: number;
  premiumRate: number;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'active' | 'inactive';
}

interface InsurancePolicy {
  id: string;
  poolId: string;
  farmer: string;
  coverageAmount: number;
  premium: number;
  startDate: number;
  endDate: number;
  status: 'active' | 'claimed' | 'expired';
  claimAmount?: number;
}

export default function InsurancePoolPage() {
  const { address, isConnected } = useWallet();
  const [pools, setPools] = useState<InsurancePool[]>([]);
  const [userPolicies, setUserPolicies] = useState<InsurancePolicy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreatePool, setShowCreatePool] = useState(false);
  const [showPurchasePolicy, setShowPurchasePolicy] = useState(false);
  const [selectedPool, setSelectedPool] = useState<InsurancePool | null>(null);
  const [policyForm, setPolicyForm] = useState({
    coverageAmount: '',
    duration: '365'
  });

  useEffect(() => {
    if (isConnected) {
      loadInsurancePools();
      loadUserPolicies();
    }
  }, [isConnected, address]);

  const loadInsurancePools = async () => {
    setIsLoading(true);
    try {
      // Mock data - in production, fetch from API
      const mockPools: InsurancePool[] = [
        {
          id: '1',
          name: 'Crop Failure Insurance',
          description: 'Protection against crop failure due to weather events',
          totalLiquidity: '50000',
          activePolicies: 45,
          coverageRatio: 85,
          premiumRate: 2.5,
          riskLevel: 'medium',
          status: 'active'
        },
        {
          id: '2',
          name: 'Drought Protection',
          description: 'Insurance against prolonged drought periods',
          totalLiquidity: '75000',
          activePolicies: 32,
          coverageRatio: 78,
          premiumRate: 3.2,
          riskLevel: 'high',
          status: 'active'
        },
        {
          id: '3',
          name: 'Pest & Disease Coverage',
          description: 'Protection against pest infestations and crop diseases',
          totalLiquidity: '25000',
          activePolicies: 18,
          coverageRatio: 92,
          premiumRate: 1.8,
          riskLevel: 'low',
          status: 'active'
        }
      ];

      setPools(mockPools);
    } catch (error) {
      console.error('Failed to load insurance pools:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserPolicies = async () => {
    if (!address) return;

    try {
      // Mock data - in production, fetch from API
      const mockPolicies: InsurancePolicy[] = [
        {
          id: 'POL-001',
          poolId: '1',
          farmer: address,
          coverageAmount: 5000,
          premium: 125,
          startDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
          endDate: Date.now() + 335 * 24 * 60 * 60 * 1000,
          status: 'active'
        }
      ];

      setUserPolicies(mockPolicies);
    } catch (error) {
      console.error('Failed to load user policies:', error);
    }
  };

  const handlePurchasePolicy = (pool: InsurancePool) => {
    setSelectedPool(pool);
    setShowPurchasePolicy(true);
  };

  const confirmPurchasePolicy = async () => {
    if (!selectedPool || !address) return;

    try {
      const coverageAmount = parseFloat(policyForm.coverageAmount);
      const duration = parseInt(policyForm.duration);

      // Calculate premium based on coverage and pool rate
      const premium = (coverageAmount * selectedPool.premiumRate / 100) * (duration / 365);

      // Mock purchase - in production, call contract
      alert(`Policy purchased successfully! Premium: $${premium.toFixed(2)}`);

      setShowPurchasePolicy(false);
      setPolicyForm({ coverageAmount: '', duration: '365' });
      loadUserPolicies();
    } catch (error) {
      console.error('Failed to purchase policy:', error);
      alert('Failed to purchase policy. Please try again.');
    }
  };

  const handleClaimPolicy = async (policyId: string) => {
    try {
      // Mock claim - in production, call contract
      alert('Insurance claim submitted successfully!');
      loadUserPolicies();
    } catch (error) {
      console.error('Failed to claim policy:', error);
      alert('Failed to submit claim. Please try again.');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'claimed': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      case 'expired': return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Insurance Pools
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Connect your wallet to access agricultural insurance pools.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Insurance Pools</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Protect your agricultural investments with decentralized insurance
          </p>
        </div>

        {/* Insurance Pools */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {pools.map((pool) => (
            <motion.div
              key={pool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{pool.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{pool.description}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(pool.riskLevel)}`}>
                  {pool.riskLevel} risk
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Liquidity:</span>
                  <span className="font-medium">${parseInt(pool.totalLiquidity).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Policies:</span>
                  <span className="font-medium">{pool.activePolicies}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Coverage Ratio:</span>
                  <span className="font-medium">{pool.coverageRatio}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Premium Rate:</span>
                  <span className="font-medium">{pool.premiumRate}% APR</span>
                </div>
              </div>

              <button
                onClick={() => handlePurchasePolicy(pool)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Get Coverage
              </button>
            </motion.div>
          ))}
        </div>

        {/* User's Insurance Policies */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Your Insurance Policies
          </h2>

          {userPolicies.length > 0 ? (
            <div className="space-y-4">
              {userPolicies.map((policy) => (
                <div key={policy.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">Policy #{policy.id}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Coverage: ${policy.coverageAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(policy.status)}`}>
                        {policy.status}
                      </span>
                      {policy.status === 'active' && (
                        <button
                          onClick={() => handleClaimPolicy(policy.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          File Claim
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Premium:</span>
                      <div className="font-medium">${policy.premium.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Start Date:</span>
                      <div className="font-medium">{new Date(policy.startDate).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">End Date:</span>
                      <div className="font-medium">{new Date(policy.endDate).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Claim Amount:</span>
                      <div className="font-medium">{policy.claimAmount ? `$${policy.claimAmount}` : 'N/A'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                No Insurance Policies
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Purchase an insurance policy to protect your agricultural investments.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Purchase Policy Modal */}
      {showPurchasePolicy && selectedPool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Purchase Insurance Policy
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {selectedPool.name}
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Coverage Amount ($)
                </label>
                <input
                  type="number"
                  value={policyForm.coverageAmount}
                  onChange={(e) => setPolicyForm({...policyForm, coverageAmount: e.target.value})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter coverage amount"
                  min="100"
                  max="50000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Coverage Duration (days)
                </label>
                <select
                  value={policyForm.duration}
                  onChange={(e) => setPolicyForm({...policyForm, duration: e.target.value})}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="180">6 months (180 days)</option>
                  <option value="365">1 year (365 days)</option>
                  <option value="730">2 years (730 days)</option>
                </select>
              </div>

              {policyForm.coverageAmount && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Policy Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Coverage:</span>
                      <span>${parseFloat(policyForm.coverageAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span>{policyForm.duration} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Premium Rate:</span>
                      <span>{selectedPool.premiumRate}%</span>
                    </div>
                    <div className="flex justify-between font-medium border-t border-gray-300 dark:border-gray-600 pt-1 mt-2">
                      <span>Total Premium:</span>
                      <span>${((parseFloat(policyForm.coverageAmount) * selectedPool.premiumRate / 100) * (parseInt(policyForm.duration) / 365)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPurchasePolicy(false)}
                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmPurchasePolicy}
                disabled={!policyForm.coverageAmount}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Purchase Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}