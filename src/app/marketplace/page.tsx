'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Search,
  Filter,
  MapPin,
  Star,
  ShoppingCart,
  TrendingUp,
  Shield,
  Truck,
  RefreshCw,
  Heart,
  Share2,
  AlertCircle,
  CheckCircle,
  Clock,
  Map
} from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import {
  getMarketplaceListings,
  createEscrow,
  getUserEscrows,
  confirmDelivery,
  completeEscrow,
  getMarketInsights,
  connectWebSocket,
  onWebSocketMessage,
  disconnectWebSocket
} from '@/lib/api';

export default function Marketplace() {
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const [listings, setListings] = useState<any[]>([]);
  const [filteredListings, setFilteredListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [userEscrows, setUserEscrows] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [marketInsights, setMarketInsights] = useState<any>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  useEffect(() => {
    filterListings();
  }, [listings, searchTerm, selectedCrop, selectedLocation, priceRange, sortBy]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (address) {
      connectWebSocket(1, 'marketplace'); // Using mock user ID for now

      // Listen for new listings
      onWebSocketMessage('new_listing', (data) => {
        console.log('New listing received:', data);
        setListings(prev => [data, ...prev]);
        setLastUpdate(new Date());
      });

      // Listen for escrow updates
      onWebSocketMessage('escrow_update', (data) => {
        console.log('Escrow update received:', data);
        setUserEscrows(prev => prev.map(escrow =>
          escrow.id === data.escrow_id ? { ...escrow, status: data.status } : escrow
        ));
      });

      return () => {
        disconnectWebSocket();
      };
    }
  }, [address]);

  const loadMarketplaceData = async () => {
    try {
      setLoading(true);
      const [listingsData, escrowsData, insightsData] = await Promise.allSettled([
        getMarketplaceListings(),
        address ? getUserEscrows(address) : Promise.resolve([]),
        getMarketInsights()
      ]);

      if (listingsData.status === 'fulfilled') {
        setListings(listingsData.value || []);
      }

      if (escrowsData.status === 'fulfilled') {
        setUserEscrows(escrowsData.value || []);
      }

      if (insightsData.status === 'fulfilled') {
        setMarketInsights(insightsData.value);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterListings = () => {
    let filtered = [...listings];

    // Text search
    if (searchTerm) {
      filtered = filtered.filter(listing =>
        listing.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.crop_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Crop filter
    if (selectedCrop) {
      filtered = filtered.filter(listing => listing.crop_type === selectedCrop);
    }

    // Location filter
    if (selectedLocation) {
      filtered = filtered.filter(listing =>
        listing.location?.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    // Price range filter
    if (priceRange.min) {
      filtered = filtered.filter(listing => listing.price_per_unit >= parseFloat(priceRange.min));
    }
    if (priceRange.max) {
      filtered = filtered.filter(listing => listing.price_per_unit <= parseFloat(priceRange.max));
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return a.price_per_unit - b.price_per_unit;
        case 'price_high':
          return b.price_per_unit - a.price_per_unit;
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'rating':
          return (b.ai_recommendation_score || 0) - (a.ai_recommendation_score || 0);
        default:
          return 0;
      }
    });

    setFilteredListings(filtered);
  };

  const handlePurchase = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet to make a purchase');
      return;
    }

    if (!purchaseQuantity || parseFloat(purchaseQuantity) <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    if (!selectedListing) return;

    const quantity = parseFloat(purchaseQuantity);
    const totalAmount = quantity * selectedListing.price_per_unit;

    if (quantity > selectedListing.quantity) {
      alert('Quantity exceeds available amount');
      return;
    }

    setIsPurchasing(true);
    try {
      // Create escrow contract
      const escrowData = {
        seller: selectedListing.seller,
        amount: totalAmount,
        token: '0xA0b86a33E6441e88C5F2712C3E9b74Ec6F6e44d8', // cUSD token
        listing_id: selectedListing.id,
        geo_location: selectedListing.location
      };

      const result = await createEscrow(escrowData);

      if (result.success) {
        alert(`Purchase initiated successfully! Escrow ID: ${result.escrow_id}`);
        setShowPurchaseModal(false);
        setPurchaseQuantity('');
        setSelectedListing(null);
        loadMarketplaceData(); // Refresh data
      } else {
        alert(`Purchase failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handlePurchaseClick = (listing: any) => {
    setSelectedListing(listing);
    setShowPurchaseModal(true);
  };

  const handleViewListingDetails = (listingId: number) => {
    router.push(`/loan/${listingId}`);
  };

  const handleListProduce = () => {
    router.push('/marketplace/list');
  };

  const toggleFavorite = (listingId: number) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(listingId)) {
        newFavorites.delete(listingId);
      } else {
        newFavorites.add(listingId);
      }
      return newFavorites;
    });
  };

  const handleShare = async (listing: any) => {
    const shareData = {
      title: listing.title,
      text: `Check out this ${listing.crop_type} listing: ${listing.title}`,
      url: `${window.location.origin}/marketplace/${listing.id}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareData.url);
      alert('Link copied to clipboard!');
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Connecting to wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Marketplace</h1>
                {lastUpdate && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Updated {lastUpdate.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={loadMarketplaceData}
                disabled={loading}
                className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
                title="Refresh listings"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleListProduce}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                List Produce
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search produce, farmers, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              >
                <option value="">All Crops</option>
                <option value="maize">Maize</option>
                <option value="rice">Rice</option>
                <option value="cassava">Cassava</option>
                <option value="wheat">Wheat</option>
                <option value="coffee">Coffee</option>
                <option value="tea">Tea</option>
              </select>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              >
                <option value="">All Locations</option>
                <option value="kenya">Kenya</option>
                <option value="uganda">Uganda</option>
                <option value="nigeria">Nigeria</option>
                <option value="tanzania">Tanzania</option>
                <option value="ethiopia">Ethiopia</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              >
                <option value="newest">Newest</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="rating">AI Rating</option>
              </select>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 border rounded-lg transition-colors flex items-center gap-2 ${
                  showFilters
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-200 dark:border-gray-700 pt-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Min Price ($/ton)
                    </label>
                    <input
                      type="number"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Price ($/ton)
                    </label>
                    <input
                      type="number"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                      placeholder="1000"
                      min="0"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setPriceRange({ min: '', max: '' });
                        setSearchTerm('');
                        setSelectedCrop('');
                        setSelectedLocation('');
                      }}
                      className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
         </motion.div>

        {/* 3D Farm Visualization Map */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Map className="w-5 h-5 text-green-600" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Farm Locations Map</h3>
          </div>

          <div className="relative h-96 bg-gradient-to-br from-green-100 to-blue-100 dark:from-gray-700 dark:to-gray-800 rounded-lg overflow-hidden">
            {/* Simple 3D Map Visualization */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🌍</div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Interactive Farm Map</h3>
                <p className="text-gray-600 dark:text-gray-400">3D visualization of agricultural lands</p>
              </div>
            </div>

            {/* Map Controls */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button className="bg-white dark:bg-gray-700 p-2 rounded shadow hover:shadow-md transition-shadow">
                <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button className="bg-white dark:bg-gray-700 p-2 rounded shadow hover:shadow-md transition-shadow">
                <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-700 p-3 rounded shadow">
              <div className="text-sm font-medium text-gray-800 dark:text-white mb-2">Legend</div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">Active Farms</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400">Water Sources</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Interactive 3D farm visualization showing agricultural lands, water sources, and crop distributions across regions.
            Click on farm markers to view details.
          </div>
        </div>

        {/* Listings */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No listings found</h3>
            <p className="text-gray-500 dark:text-gray-500">Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredListings.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 group"
              >
                <div className="relative">
                  <Image
                    src={listing.image || '/file.svg'}
                    alt={listing.title}
                    width={400}
                    height={128}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {listing.ai_recommendation_score && listing.ai_recommendation_score > 80 && (
                    <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      AI Recommended
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                    {listing.crop_type}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white group-hover:text-green-600 transition-colors">
                      {listing.title}
                    </h3>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {(listing.ai_recommendation_score || 0) / 10}/10
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4" />
                      {listing.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Shield className="w-4 h-4" />
                      Quality: {listing.quality_grade || 'Standard'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Truck className="w-4 h-4" />
                      {listing.quantity} {listing.unit || 'tons'} available
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="text-2xl font-bold text-green-600">
                        ${listing.price_per_unit}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">/{listing.unit || 'ton'}</span>
                    </div>
                    {listing.harvest_date && (
                      <div className="text-right">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Harvest</div>
                        <div className="text-sm font-medium">
                          {new Date(listing.harvest_date).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>

                   <div className="flex gap-2">
                     <button
                       onClick={() => handlePurchaseClick(listing)}
                       className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                     >
                       <ShoppingCart className="w-4 h-4" />
                       Buy Now
                     </button>
                     <button
                       onClick={() => handleViewListingDetails(listing.id)}
                       className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                     >
                       Details
                     </button>
                     <button
                       onClick={() => toggleFavorite(listing.id)}
                       className={`p-2 transition-colors ${
                         favorites.has(listing.id)
                           ? 'text-red-600 dark:text-red-400'
                           : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                       }`}
                     >
                       <Heart className={`w-5 h-5 ${favorites.has(listing.id) ? 'fill-current' : ''}`} />
                     </button>
                     <button
                       onClick={() => handleShare(listing)}
                       className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                     >
                       <Share2 className="w-5 h-5" />
                     </button>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Active Escrows */}
        {userEscrows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm mb-8"
          >
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Your Active Escrows
            </h3>
            <div className="space-y-4">
              {userEscrows.slice(0, 3).map((escrow: any) => (
                <div key={escrow.id} className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-white">Escrow #{escrow.id}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Amount: ${escrow.amount}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      escrow.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      escrow.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {escrow.status}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {escrow.status === 'active' && (
                      <>
                        <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                          Confirm Delivery
                        </button>
                        <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                          Dispute
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* AI Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm"
        >
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            AI Market Insights
          </h3>
          {marketInsights ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  Price Trends
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {marketInsights.price_trends?.[0] ?
                    `${marketInsights.price_trends[0].crop} prices ${marketInsights.price_trends[0].change_percent > 0 ? 'up' : 'down'} ${Math.abs(marketInsights.price_trends[0].change_percent)}% this month.` :
                    'Maize prices are up 12% this month.'
                  }
                </p>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 text-xs rounded ${
                    marketInsights.price_trends?.[0]?.trend === 'bullish' ?
                      'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-400' :
                      'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-400'
                  }`}>
                    {marketInsights.price_trends?.[0]?.trend === 'bullish' ? 'Bullish market' : 'Bearish market'}
                  </span>
                </div>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  Regional Demand
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {marketInsights.regional_demand?.[0] ?
                    `High demand in ${marketInsights.regional_demand[0].region} markets. Quality premium available.` :
                    'High demand for organic produce in Nairobi and Kampala markets.'
                  }
                </p>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-400 text-xs rounded">
                    +{marketInsights.regional_demand?.[0]?.premium || 25}% premium
                  </span>
                </div>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  Optimal Timing
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {marketInsights.optimal_timing?.[0] ?
                    `Best time to ${marketInsights.optimal_timing[0].action}: ${marketInsights.optimal_timing[0].timeframe}. ${marketInsights.optimal_timing[0].reason}.` :
                    'Best time to sell: Next 2 weeks. Weather conditions are favorable.'
                  }
                </p>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-400 text-xs rounded">
                    {marketInsights.optimal_timing?.[0]?.action === 'sell' ? 'Sell now' : 'Buy now'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading market insights...</p>
            </div>
          )}
        </motion.div>

        {/* Purchase Modal */}
        <AnimatePresence>
          {showPurchaseModal && selectedListing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowPurchaseModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
                    Purchase {selectedListing.title}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <Image
                        src={selectedListing.image || '/file.svg'}
                        alt={selectedListing.title}
                        width={400}
                        height={200}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-white">Details</h4>
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <p>Crop: {selectedListing.crop_type}</p>
                          <p>Location: {selectedListing.location}</p>
                          <p>Quality: {selectedListing.quality_grade}</p>
                          <p>Available: {selectedListing.quantity} {selectedListing.unit}</p>
                          {selectedListing.harvest_date && (
                            <p>Harvest: {new Date(selectedListing.harvest_date).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-white">Pricing</h4>
                        <div className="text-2xl font-bold text-green-600">
                          ${selectedListing.price_per_unit}/{selectedListing.unit}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Quantity to Purchase
                        </label>
                        <input
                          type="number"
                          value={purchaseQuantity}
                          onChange={(e) => setPurchaseQuantity(e.target.value)}
                          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                          placeholder="Enter quantity"
                          min="0.1"
                          max={selectedListing.quantity}
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Total Cost
                        </label>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <span className="text-xl font-bold text-gray-800 dark:text-white">
                            ${purchaseQuantity ? (parseFloat(purchaseQuantity) * selectedListing.price_per_unit).toFixed(2) : '0.00'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg mb-6">
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Secure Escrow Protection
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Your payment will be held in escrow until delivery is confirmed. Both buyer and seller are protected by smart contracts.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowPurchaseModal(false)}
                        className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handlePurchase}
                        disabled={isPurchasing || !purchaseQuantity || parseFloat(purchaseQuantity) <= 0}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {isPurchasing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4" />
                            Purchase with Escrow
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}