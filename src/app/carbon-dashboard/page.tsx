'use client';

import { motion } from 'framer-motion';

export default function CarbonDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Carbon Dashboard</h1>
            <button className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">
              Sell CARBT Tokens
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Impact Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">CO2 Offset</h3>
            <div className="text-3xl font-bold text-teal-600">2.4 tons</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">This month</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">CARBT Tokens</h3>
            <div className="text-3xl font-bold text-green-600">1,247</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Earned this year</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Token Value</h3>
            <div className="text-3xl font-bold text-blue-600">$2,494</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Current market value</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">NDVI Score</h3>
            <div className="text-3xl font-bold text-purple-600">0.72</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Vegetation health</p>
          </motion.div>
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Monthly CO2 Sequestration
            </h3>
            <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Chart visualization would go here</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Token Earnings Over Time
            </h3>
            <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Chart visualization would go here</p>
            </div>
          </motion.div>
        </div>

        {/* Farm Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-8"
        >
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            3D Farm Visualization
          </h3>
          <div className="h-96 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl">🌱</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">Interactive 3D farm map would display here</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Showing NDVI data, carbon sequestration zones, and IoT sensor locations
              </p>
            </div>
          </div>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
        >
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Performance Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-600 mb-2">94%</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Carbon verification accuracy</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">+23%</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Yield increase from sustainable practices</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">$1,247</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Additional income from carbon credits</p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}