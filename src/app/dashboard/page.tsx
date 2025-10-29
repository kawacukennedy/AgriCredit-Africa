'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { OnboardingModal } from '@/components/OnboardingModal';

export default function Dashboard() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('agricredit_onboarding_completed');
    if (!hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    localStorage.setItem('agricredit_onboarding_completed', 'true');
  };

  const handleApplyForLoan = () => {
    router.push('/loan-application');
  };

  const handleListProduce = () => {
    router.push('/marketplace');
  };

  const handleViewCarbonImpact = () => {
    router.push('/carbon-dashboard');
  };

  return (
    <>
      <OnboardingModal isOpen={showOnboarding} onClose={handleOnboardingClose} />
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Welcome, Farmer</span>
              <div className="w-8 h-8 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* AI Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Credit Score</h3>
            <div className="text-3xl font-bold text-green-600">785</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Trust: High</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Farm Analytics</h3>
            <div className="text-3xl font-bold text-blue-600">92%</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Yield Prediction</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Active Loans</h3>
            <div className="text-3xl font-bold text-purple-600">2</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">$1,250 outstanding</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Carbon Tokens</h3>
            <div className="text-3xl font-bold text-teal-600">1,247</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">CARBT earned</p>
          </motion.div>
        </div>

        {/* DAO Proposals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-8"
        >
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">DAO Proposals</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white">Increase microloan limits</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Proposal to raise max loan amount to $5,000</p>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Vote Yes</button>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Vote No</button>
              </div>
            </div>
            <div className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white">New IoT sensor deployment</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Fund installation of weather sensors in rural areas</p>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Vote Yes</button>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Vote No</button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
        >
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <button
               onClick={handleApplyForLoan}
               className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
             >
               <h4 className="font-medium text-gray-800 dark:text-white">Apply for Loan</h4>
               <p className="text-sm text-gray-600 dark:text-gray-400">Get AI-powered credit assessment</p>
             </button>
             <button
               onClick={handleListProduce}
               className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
             >
               <h4 className="font-medium text-gray-800 dark:text-white">List Produce</h4>
               <p className="text-sm text-gray-600 dark:text-gray-400">Sell on the marketplace</p>
             </button>
              <button
                onClick={handleViewCarbonImpact}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <h4 className="font-medium text-gray-800 dark:text-white">View Carbon Impact</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Track your environmental contribution</p>
              </button>
              <button
                onClick={() => router.push('/nft-farming')}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <h4 className="font-medium text-gray-800 dark:text-white">NFT Farming</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage tokenized farm assets</p>
              </button>
              <button
                onClick={() => router.push('/liquidity-pool')}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <h4 className="font-medium text-gray-800 dark:text-white">Liquidity Pools</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Provide liquidity and earn rewards</p>
              </button>
              <button
                onClick={() => router.push('/yield-farming')}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <h4 className="font-medium text-gray-800 dark:text-white">Yield Farming</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Stake tokens for passive income</p>
              </button>
           </div>
        </motion.div>
      </main>
    </>
  );
}