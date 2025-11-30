'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import {
  ShoppingCart,
  TrendingUp,
  Shield,
  Clock,
  DollarSign,
  BarChart3,
  Filter,
  Search,
  Heart,
  Eye,
  Zap,
  Award,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

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
}

export default function LoanNFTMarketplace() {
  const { address, isConnected } = useWallet();
  const [loanNFTs, setLoanNFTs] = useState<LoanNFT[]>([]);
  const [filteredNFTs, setFilteredNFTs] = useState<LoanNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    riskLevel: '',
    yieldRange: { min: '', max: '' },
    duration: '',
    priceRange: { min: '', max: '' },
    collateralType: ''
  });
  const [sortBy, setSortBy] = useState('price-low');
  const [selectedNFT, setSelectedNFT] = useState<LoanNFT | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadLoanNFTs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [loanNFTs, searchTerm, filters, sortBy]);

  const loadLoanNFTs = async () => {
    setLoading(true);
    try {
      // Mock data - in production, fetch from API
      const mockNFTs: LoanNFT[] = [
        {
          id: '1',
          tokenId: '1001',
          loanId: 'LOAN-2024-001',
          borrower: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          amount: 5000,
          interestRate: 8.5,
          duration: 365,
          remainingTerm: 245,
          collateral: {
            type: 'Corn Harvest',
            value: 7500,
            description: 'Q4 2024 corn harvest from 50-acre farm'
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
          liquidationPrice: 4800
        },
        {
          id: '2',
          tokenId: '1002',
          loanId: 'LOAN-2024-002',
          borrower: '0x8ba1f109551bD432803012645ac136ddd64DBA72',
          amount: 7500,
          interestRate: 7.2,
          duration: 180,
          remainingTerm: 89,
          collateral: {
            type: 'Wheat Field',
            value: 10000,
            description: 'Spring wheat crop from 75-acre field'
          },
          riskScore: 1.8,
          creditScore: 780,
          repaymentHistory: {
            totalPaid: 900,
            onTimePayments: 2,
            totalPayments: 2
          },
          price: 7650,
          floorPrice: 7600,
          isListed: true,
          owner: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          metadata: {
            image: '/api/placeholder/400/400',
            attributes: [
              { trait_type: 'Risk Level', value: 'Very Low' },
              { trait_type: 'Yield', value: '7.2%' },
              { trait_type: 'Duration', value: '180 days' },
              { trait_type: 'Collateral', value: 'Wheat Field' }
            ]
          },
          yieldProjection: 7.2,
          liquidationPrice: 7200
        },
        {
          id: '3',
          tokenId: '1003',
          loanId: 'LOAN-2024-003',
          borrower: '0x9c2d45Dd7735C1234567890abcdef123456789',
          amount: 10000,
          interestRate: 12.5,
          duration: 270,
          remainingTerm: 180,
          collateral: {
            type: 'Rice Paddy',
            value: 12000,
            description: 'Irrigated rice paddy in fertile delta region'
          },
          riskScore: 3.7,
          creditScore: 650,
          repaymentHistory: {
            totalPaid: 625,
            onTimePayments: 1,
            totalPayments: 2
          },
          price: 9800,
          floorPrice: 9500,
          lastSalePrice: 9600,
          isListed: true,
          owner: '0xabcdef1234567890abcdef1234567890abcdef',
          metadata: {
            image: '/api/placeholder/400/400',
            attributes: [
              { trait_type: 'Risk Level', value: 'Medium' },
              { trait_type: 'Yield', value: '12.5%' },
              { trait_type: 'Duration', value: '270 days' },
              { trait_type: 'Collateral', value: 'Rice Paddy' }
            ]
          },
          yieldProjection: 12.5,
          liquidationPrice: 8500
        }
      ];

      setLoanNFTs(mockNFTs);
    } catch (error) {
      console.error('Failed to load loan NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...loanNFTs];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(nft =>
        nft.loanId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.collateral.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.borrower.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Risk level filter
    if (filters.riskLevel) {
      const riskMap = { 'very-low': [0, 2.0], 'low': [2.0, 2.5], 'medium': [2.5, 3.5], 'high': [3.5, 5.0] };
      const [min, max] = riskMap[filters.riskLevel as keyof typeof riskMap] || [0, 5];
      filtered = filtered.filter(nft => nft.riskScore >= min && nft.riskScore < max);
    }

    // Yield range filter
    if (filters.yieldRange.min || filters.yieldRange.max) {
      const minYield = filters.yieldRange.min ? parseFloat(filters.yieldRange.min) : 0;
      const maxYield = filters.yieldRange.max ? parseFloat(filters.yieldRange.max) : 100;
      filtered = filtered.filter(nft => nft.yieldProjection >= minYield && nft.yieldProjection <= maxYield);
    }

    // Duration filter
    if (filters.duration) {
      const durationMap = {
        'short': [0, 180],
        'medium': [180, 270],
        'long': [270, 365]
      };
      const [min, max] = durationMap[filters.duration as keyof typeof durationMap] || [0, 365];
      filtered = filtered.filter(nft => nft.duration >= min && nft.duration <= max);
    }

    // Price range filter
    if (filters.priceRange.min || filters.priceRange.max) {
      const minPrice = filters.priceRange.min ? parseFloat(filters.priceRange.min) : 0;
      const maxPrice = filters.priceRange.max ? parseFloat(filters.priceRange.max) : 100000;
      filtered = filtered.filter(nft => nft.price >= minPrice && nft.price <= maxPrice);
    }

    // Collateral type filter
    if (filters.collateralType) {
      filtered = filtered.filter(nft =>
        nft.collateral.type.toLowerCase().includes(filters.collateralType.toLowerCase())
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'yield-high':
          return b.yieldProjection - a.yieldProjection;
        case 'yield-low':
          return a.yieldProjection - b.yieldProjection;
        case 'risk-low':
          return a.riskScore - b.riskScore;
        case 'risk-high':
          return b.riskScore - a.riskScore;
        default:
          return 0;
      }
    });

    setFilteredNFTs(filtered);
  };

  const toggleFavorite = (nftId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(nftId)) {
      newFavorites.delete(nftId);
    } else {
      newFavorites.add(nftId);
    }
    setFavorites(newFavorites);
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore <= 2.0) return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
    if (riskScore <= 2.5) return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
    if (riskScore <= 3.5) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
    return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Loan NFT Marketplace
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Connect your wallet to browse and trade tokenized agricultural loans.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Loan NFT Marketplace</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Trade tokenized agricultural loans with real yield and collateral backing
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by loan ID, collateral type, or borrower..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="yield-high">Yield: High to Low</option>
                <option value="yield-low">Yield: Low to High</option>
                <option value="risk-low">Risk: Low to High</option>
                <option value="risk-high">Risk: High to Low</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Risk Level
                  </label>
                  <select
                    value={filters.riskLevel}
                    onChange={(e) => setFilters({...filters, riskLevel: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Risk Levels</option>
                    <option value="very-low">Very Low (≤2.0)</option>
                    <option value="low">Low (2.0-2.5)</option>
                    <option value="medium">Medium (2.5-3.5)</option>
                    <option value="high">High (≥3.5)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Yield Range (%)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.yieldRange.min}
                      onChange={(e) => setFilters({...filters, yieldRange: {...filters.yieldRange, min: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.yieldRange.max}
                      onChange={(e) => setFilters({...filters, yieldRange: {...filters.yieldRange, max: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration
                  </label>
                  <select
                    value={filters.duration}
                    onChange={(e) => setFilters({...filters, duration: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Durations</option>
                    <option value="short">Short (≤180 days)</option>
                    <option value="medium">Medium (180-270 days)</option>
                    <option value="long">Long (≥270 days)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price Range ($)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.priceRange.min}
                      onChange={(e) => setFilters({...filters, priceRange: {...filters.priceRange, min: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.priceRange.max}
                      onChange={(e) => setFilters({...filters, priceRange: {...filters.priceRange, max: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Collateral Type
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Corn, Wheat, Rice"
                    value={filters.collateralType}
                    onChange={(e) => setFilters({...filters, collateralType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* NFT Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNFTs.map((nft) => (
              <div key={nft.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="relative">
                  <img
                    src={nft.metadata.image}
                    alt={`Loan NFT ${nft.tokenId}`}
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={() => toggleFavorite(nft.id)}
                    className="absolute top-3 right-3 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:shadow-lg transition-shadow"
                  >
                    <Heart
                      className={`w-4 h-4 ${favorites.has(nft.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`}
                    />
                  </button>
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(nft.riskScore)}`}>
                      Risk: {nft.riskScore.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{nft.loanId}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Token #{nft.tokenId}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">${nft.price.toLocaleString()}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Floor: ${nft.floorPrice.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Yield:</span>
                      <div className="font-medium text-green-600">{nft.yieldProjection}% APY</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                      <div className="font-medium">{nft.duration} days</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Collateral:</span>
                      <div className="font-medium">{nft.collateral.type}</div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Credit Score:</span>
                      <div className="font-medium">{nft.creditScore}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedNFT(nft);
                        setShowDetailsModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Details
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors">
                      <ShoppingCart className="w-4 h-4" />
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedNFT && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Loan NFT #{selectedNFT.tokenId}
                  </h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <img
                      src={selectedNFT.metadata.image}
                      alt={`Loan NFT ${selectedNFT.tokenId}`}
                      className="w-full rounded-lg"
                    />

                    <div className="mt-4 space-y-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Attributes</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedNFT.metadata.attributes.map((attr, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                            <div className="text-xs text-gray-600 dark:text-gray-400">{attr.trait_type}</div>
                            <div className="font-medium text-gray-900 dark:text-white">{attr.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Loan Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Loan ID:</span>
                          <span className="font-medium">{selectedNFT.loanId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Principal:</span>
                          <span className="font-medium">${selectedNFT.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Interest Rate:</span>
                          <span className="font-medium">{selectedNFT.interestRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                          <span className="font-medium">{selectedNFT.duration} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Remaining Term:</span>
                          <span className="font-medium">{selectedNFT.remainingTerm} days</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Collateral</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Type:</span>
                          <span className="font-medium">{selectedNFT.collateral.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Value:</span>
                          <span className="font-medium">${selectedNFT.collateral.value.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">LTV:</span>
                          <span className="font-medium">{((selectedNFT.amount / selectedNFT.collateral.value) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{selectedNFT.collateral.description}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Risk Metrics</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Risk Score:</span>
                          <span className={`font-medium ${getRiskColor(selectedNFT.riskScore)}`}>
                            {selectedNFT.riskScore.toFixed(1)}/5
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Credit Score:</span>
                          <span className="font-medium">{selectedNFT.creditScore}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Repayment Rate:</span>
                          <span className="font-medium">
                            {((selectedNFT.repaymentHistory.onTimePayments / selectedNFT.repaymentHistory.totalPayments) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">${selectedNFT.price.toLocaleString()}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Current Price</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600">+{selectedNFT.yieldProjection}% APY</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Projected Yield</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors">
                          Make Offer
                        </button>
                        <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors">
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}