'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/hooks/useWallet';
import { contractInteractions } from '@/lib/contractInteractions';
import {
  getCarbonListings,
  getCarbonOrders,
  createCarbonListing,
  createCarbonOrder,
  purchaseCarbonCredit,
  CarbonListing,
  CarbonOrder,
  connectWebSocket,
  onWebSocketMessage,
  disconnectWebSocket
} from '@/lib/api';
import { TrendingUp, TrendingDown, DollarSign, Leaf, ShoppingCart, BarChart3, Plus, Minus } from 'lucide-react';
import { CustomLineChart } from '@/components/charts';

// Interfaces moved to API file

export default function CarbonMarketplacePage() {
  const { address, isConnected } = useWallet();
  const [listings, setListings] = useState<CarbonListing[]>([]);
  const [orders, setOrders] = useState<CarbonOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [listingForm, setListingForm] = useState({
    amount: '',
    price: '',
    verificationProof: ''
  });
  const [orderForm, setOrderForm] = useState({
    type: 'buy' as 'buy' | 'sell',
    amount: '',
    price: ''
  });
  const [marketStats, setMarketStats] = useState({
    totalVolume: 0,
    activeListings: 0,
    averagePrice: 0,
    priceChange24h: 0
  });

  // Mock price data for chart
  const priceData = [
    { time: '00:00', price: 24.50 },
    { time: '04:00', price: 24.75 },
    { time: '08:00', price: 25.20 },
    { time: '12:00', price: 24.90 },
    { time: '16:00', price: 25.50 },
    { time: '20:00', price: 25.30 },
    { time: '24:00', price: marketStats.averagePrice || 25.30 }
  ];

  useEffect(() => {
    if (isConnected) {
      loadMarketData();

      // Connect to WebSocket for real-time market updates
      connectWebSocket(1, 'carbon_marketplace'); // Using dummy user ID

      // Listen for market updates
      onWebSocketMessage('market_update', (data: any) => {
        console.log('Received market update:', data);
        // Refresh data when market updates are received
        loadMarketData();
      });
    }

    return () => {
      disconnectWebSocket();
    };
  }, [isConnected]);

  const loadMarketData = async () => {
    setIsLoading(true);
    try {
      const [listingsData, ordersData] = await Promise.allSettled([
        getCarbonListings(),
        getCarbonOrders()
      ]);

      if (listingsData.status === 'fulfilled') {
        setListings(listingsData.value);
      } else {
        // Fallback to mock data if API fails
        console.warn('Failed to load listings, using mock data');
        setListings([
          {
            id: 1,
            seller: '0x1234...5678',
            amount: 100,
            price: 25.50,
            total_value: 2550,
            verification_proof: 'ipfs://QmVerification1',
            timestamp: Date.now() - 3600000,
            status: 'active'
          },
          {
            id: 2,
            seller: '0x9876...1234',
            amount: 250,
            price: 24.80,
            total_value: 6200,
            verification_proof: 'ipfs://QmVerification2',
            timestamp: Date.now() - 7200000,
            status: 'active'
          }
        ]);
      }

      if (ordersData.status === 'fulfilled') {
        setOrders(ordersData.value);
      } else {
        // Fallback to mock data if API fails
        console.warn('Failed to load orders, using mock data');
        setOrders([
          {
            id: 1,
            type: 'buy',
            amount: 200,
            price: 25.00,
            user: '0x1111...2222',
            timestamp: Date.now() - 1800000,
            status: 'open'
          },
          {
            id: 2,
            type: 'sell',
            amount: 150,
            price: 26.50,
            user: '0x3333...4444',
            timestamp: Date.now() - 3600000,
            status: 'open'
          }
        ]);
      }

      // Mock market stats for now
      setMarketStats({
        totalVolume: 45250,
        activeListings: listings.length,
        averagePrice: 25.30,
        priceChange24h: 2.5
      });
    } catch (error) {
      console.error('Failed to load market data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateListing = async () => {
    if (!listingForm.amount || !listingForm.price) return;

    setIsLoading(true);
    try {
      const result = await createCarbonListing({
        amount: parseFloat(listingForm.amount),
        price: parseFloat(listingForm.price),
        verification_proof: listingForm.verificationProof || 'user-verification'
      });

      if (result.success) {
        alert('Carbon credit listing created successfully!');
        setShowCreateListing(false);
        setListingForm({ amount: '', price: '', verificationProof: '' });
        loadMarketData();
      } else {
        alert(result.error || 'Failed to create listing. Please try again.');
      }
    } catch (error) {
      console.error('Failed to create listing:', error);
      alert('Failed to create listing. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!orderForm.amount || !orderForm.price) return;

    setIsLoading(true);
    try {
      const result = await createCarbonOrder({
        type: orderForm.type,
        amount: parseFloat(orderForm.amount),
        price: parseFloat(orderForm.price)
      });

      if (result.success) {
        alert(`${orderForm.type === 'buy' ? 'Buy' : 'Sell'} order created successfully!`);
        setShowCreateOrder(false);
        setOrderForm({ type: 'buy', amount: '', price: '' });
        loadMarketData();
      } else {
        alert(result.error || 'Failed to create order. Please try again.');
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Failed to create order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (listingId: number) => {
    setIsLoading(true);
    try {
      const result = await purchaseCarbonCredit(listingId);
      if (result.success) {
        alert('Purchase completed successfully!');
        loadMarketData();
      } else {
        alert(result.error || 'Purchase failed. Please try again.');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Leaf className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Please connect your wallet to trade carbon credits.
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
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Carbon Credit Marketplace</h1>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateOrder(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Create Order
              </button>
              <button
                onClick={() => setShowCreateListing(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                List Credits
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">CARBT Price</h3>
            </div>
            <div className="text-3xl font-bold text-green-600">${marketStats.averagePrice.toFixed(2)}</div>
            <div className={`flex items-center gap-1 text-sm ${marketStats.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {marketStats.priceChange24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {marketStats.priceChange24h >= 0 ? '+' : ''}{marketStats.priceChange24h.toFixed(1)}% (24h)
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">24h Volume</h3>
            </div>
            <div className="text-3xl font-bold text-blue-600">${marketStats.totalVolume.toLocaleString()}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Active Listings</h3>
            </div>
            <div className="text-3xl font-bold text-teal-600">{marketStats.activeListings}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Market Cap</h3>
            </div>
            <div className="text-3xl font-bold text-purple-600">$2.4M</div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Listings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Active Listings</h2>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {listings.map((listing) => (
                <div key={listing.id} className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-800 dark:text-white">
                          {listing.amount} CARBT
                        </span>
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                          Verified
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Seller: {listing.seller}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        ${listing.price.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        ${listing.total_value.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(listing.timestamp)}
                    </span>
                    <button
                      onClick={() => handlePurchase(listing.id)}
                      disabled={isLoading}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm"
                    >
                      {isLoading ? 'Purchasing...' : 'Buy Now'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Order Book */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Order Book</h2>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {orders.map((order) => (
                <div key={order.id} className="p-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        order.type === 'buy'
                          ? 'bg-green-100 dark:bg-green-900'
                          : 'bg-red-100 dark:bg-red-900'
                      }`}>
                        {order.type === 'buy' ? (
                          <Plus className="w-4 h-4 text-green-600" />
                        ) : (
                          <Minus className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800 dark:text-white">
                          {order.type === 'buy' ? 'Buy' : 'Sell'} {order.amount} CARBT
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          @ ${order.price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTime(order.timestamp)}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'open'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Price Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mt-8"
        >
          <CustomLineChart
            data={priceData}
            dataKey="price"
            xAxisKey="time"
            title="CARBT Price Chart (24h)"
            color="#10b981"
            height={300}
            tooltipFormatter={(value) => [`$${value}`, 'Price']}
          />
        </motion.div>

        {/* Create Listing Modal */}
        {showCreateListing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">List Carbon Credits</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount (CARBT)
                  </label>
                  <input
                    type="number"
                    value={listingForm.amount}
                    onChange={(e) => setListingForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter amount"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price per CARBT ($)
                  </label>
                  <input
                    type="number"
                    value={listingForm.price}
                    onChange={(e) => setListingForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="Enter price"
                    step="0.01"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Verification Proof (IPFS Hash)
                  </label>
                  <input
                    type="text"
                    value={listingForm.verificationProof}
                    onChange={(e) => setListingForm(prev => ({ ...prev, verificationProof: e.target.value }))}
                    placeholder="ipfs://..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </div>

                {listingForm.amount && listingForm.price && (
                  <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-800 dark:text-green-200">Total Value:</span>
                      <span className="font-bold text-green-600">
                        ${(parseFloat(listingForm.amount) * parseFloat(listingForm.price)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCreateListing(false);
                      setListingForm({ amount: '', price: '', verificationProof: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateListing}
                    disabled={isLoading || !listingForm.amount || !listingForm.price}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Creating...' : 'Create Listing'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Create Order Modal */}
        {showCreateOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Create Order</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Order Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOrderForm(prev => ({ ...prev, type: 'buy' }))}
                      className={`flex-1 py-2 px-4 rounded-lg border ${
                        orderForm.type === 'buy'
                          ? 'bg-green-600 text-white border-green-600'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => setOrderForm(prev => ({ ...prev, type: 'sell' }))}
                      className={`flex-1 py-2 px-4 rounded-lg border ${
                        orderForm.type === 'sell'
                          ? 'bg-red-600 text-white border-red-600'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Sell
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount (CARBT)
                  </label>
                  <input
                    type="number"
                    value={orderForm.amount}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter amount"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price per CARBT ($)
                  </label>
                  <input
                    type="number"
                    value={orderForm.price}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="Enter price"
                    step="0.01"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCreateOrder(false);
                      setOrderForm({ type: 'buy', amount: '', price: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateOrder}
                    disabled={isLoading || !orderForm.amount || !orderForm.price}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Creating...' : 'Create Order'}
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