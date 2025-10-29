'use client';

import React, { useState } from 'react';

export default function CarbonDashboard() {
  const [isSelling, setIsSelling] = useState(false);

  const handleSellTokens = async () => {
    setIsSelling(true);
    // Simulate selling tokens
    setTimeout(() => {
      alert('CARBT tokens sold successfully! Transaction pending on blockchain.');
      setIsSelling(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Carbon Dashboard</h1>
            <button
              onClick={handleSellTokens}
              disabled={isSelling}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSelling ? 'Selling...' : 'Sell CARBT Tokens'}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Impact Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">CO2 Offset</h3>
            <div className="text-3xl font-bold text-teal-600">2.4 tons</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">This month</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">CARBT Tokens</h3>
            <div className="text-3xl font-bold text-green-600">1,247</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Earned this year</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Token Value</h3>
            <div className="text-3xl font-bold text-blue-600">$2,494</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Current market value</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">NDVI Score</h3>
            <div className="text-3xl font-bold text-purple-600">0.72</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Vegetation health</p>
          </div>
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Monthly CO2 Sequestration
            </h3>
            <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Interactive charts coming soon</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Token Earnings Over Time
            </h3>
            <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Interactive charts coming soon</p>
            </div>
          </div>
        </div>

        {/* Farm Visualization */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-8">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Farm Health Visualization
          </h3>
          <div className="h-96 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-lg p-6">
            <div className="grid grid-cols-8 grid-rows-6 gap-2 h-full">
              {Array.from({ length: 48 }, (_, i) => {
                const health = Math.random();
                const color = health > 0.8 ? 'bg-green-500' : health > 0.6 ? 'bg-yellow-500' : 'bg-red-500';
                return (
                  <div
                    key={i}
                    className={`${color} rounded cursor-pointer hover:scale-110 transition-transform`}
                    title={`Plot ${i + 1}: NDVI ${health.toFixed(2)}`}
                  />
                );
              })}
            </div>
            <div className="mt-4 flex justify-center space-x-6 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                <span className="text-gray-700 dark:text-gray-300">Healthy (NDVI &gt; 0.8)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                <span className="text-gray-700 dark:text-gray-300">Moderate (0.6-0.8)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                <span className="text-gray-700 dark:text-gray-300">Needs Attention (&lt; 0.6)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
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
        </div>
      </main>
    </div>
  );
}