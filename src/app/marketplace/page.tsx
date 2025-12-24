'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { useGetMarketplaceListingsQuery, useFundLoanMutation, useCreateEscrowMutation, useGetUserEscrowsQuery, useConfirmEscrowDeliveryMutation, useCompleteEscrowMutation } from '@/store/apiSlice';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Search,
  Filter,
  MapPin,
  TrendingUp,
  DollarSign,
  Calendar,
  Leaf,
  BarChart3,
  Eye,
  Heart,
  Share2,
  Star,
  CheckCircle,
  AlertTriangle,
  Info,
  Plus,
  Map
} from 'lucide-react';

const LoanMap = dynamic(() => import('@/components/marketplace/loan-map'), {
  ssr: false,
  loading: () => <div className="h-96 bg-slate-gray/10 rounded-lg animate-pulse flex items-center justify-center">Loading map...</div>
});

export default function MarketplacePage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    type: 'all', // 'loans', 'produce', 'equipment', 'all'
    crop: 'all',
    region: 'all',
    scoreRange: 'all',
    amountRange: 'all',
    sortBy: 'newest'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [showEscrowModal, setShowEscrowModal] = useState(false);

  const [fundLoan, { isLoading: isFunding }] = useFundLoanMutation();
  const [createEscrow, { isLoading: isCreatingEscrow }] = useCreateEscrowMutation();
  const [confirmDelivery] = useConfirmEscrowDeliveryMutation();
  const [completeEscrow] = useCompleteEscrowMutation();

  // Get current user address - in a real app this would come from auth context
  const userAddress = '0x1234567890123456789012345678901234567890'; // Placeholder
  const { data: userEscrows, refetch: refetchEscrows } = useGetUserEscrowsQuery(userAddress);

  const { data: listings, isLoading, error, refetch } = useGetMarketplaceListingsQuery({
    crop_type: filters.crop !== 'all' ? filters.crop : undefined,
    location: filters.region !== 'all' ? filters.region : undefined,
    min_score: filters.scoreRange !== 'all' ? parseInt(filters.scoreRange.split('-')[0]) : undefined,
    max_score: filters.scoreRange !== 'all' ? parseInt(filters.scoreRange.split('-')[1]) : undefined,
    min_price: filters.amountRange !== 'all' ? parseInt(filters.amountRange.split('-')[0]) : undefined,
    max_price: filters.amountRange !== 'all' ? (filters.amountRange.includes('+') ? undefined : parseInt(filters.amountRange.split('-')[1])) : undefined,
    search: searchQuery || undefined,
    sort_by: filters.sortBy,
  }, {
    pollingInterval: 30000, // Poll every 30 seconds for real-time updates
  });

  // Mock product listings for demonstration
  const mockProductListings = [
    {
      id: 'p1',
      type: 'produce',
      title: 'Organic Maize - Grade A',
      description: 'Freshly harvested organic maize from sustainable farms in Kenya',
      price: 250,
      currency: 'USD',
      quantity: 1000,
      unit: 'kg',
      seller: 'FarmCo Kenya Ltd',
      location: 'Nairobi, Kenya',
      crop: 'Maize',
      harvestDate: '2024-01-15',
      expiryDate: '2024-06-15',
      qualityGrade: 'A',
      images: ['/api/placeholder/400/200'],
      aiScore: 850
    },
    {
      id: 'p2',
      type: 'produce',
      title: 'Premium Cassava Roots',
      description: 'High-quality cassava roots perfect for processing',
      price: 180,
      currency: 'USD',
      quantity: 500,
      unit: 'kg',
      seller: 'GreenFields Nigeria',
      location: 'Lagos, Nigeria',
      crop: 'Cassava',
      harvestDate: '2024-01-20',
      expiryDate: '2024-04-20',
      qualityGrade: 'A+',
      images: ['/api/placeholder/400/200'],
      aiScore: 820
    },
    {
      id: 'e1',
      type: 'equipment',
      title: 'John Deere Tractor - Model 5E',
      description: 'Well-maintained tractor with GPS guidance system',
      price: 45000,
      currency: 'USD',
      quantity: 1,
      unit: 'unit',
      seller: 'AgriTech Solutions',
      location: 'Accra, Ghana',
      category: 'Tractors',
      condition: 'Excellent',
      year: 2020,
      images: ['/api/placeholder/400/200'],
      aiScore: 780
    }
  ];

  const handleFundLoan = async (loanId: string) => {
    try {
      await fundLoan({
        id: loanId,
        amount_cents: 100000, // Example amount
      }).unwrap();
      // Refresh data or show success message
    } catch (error) {
      console.error('Failed to fund loan:', error);
    }
  };

  const handlePurchaseProduct = (listing: any) => {
    setSelectedListing(listing);
    setShowEscrowModal(true);
  };

  const handleCreateEscrow = async (escrowData: any) => {
    try {
      await createEscrow({
        seller: escrowData.seller || selectedListing?.seller,
        amount: escrowData.amount,
        token: escrowData.token || '0x0000000000000000000000000000000000000000', // Default to ETH
        listing_id: escrowData.listingId,
        geo_location: escrowData.deliveryLocation || 'Unknown',
      }).unwrap();

      setShowEscrowModal(false);
      refetchEscrows(); // Refresh escrows list
      // Show success message - you could add a toast notification here
      alert('Escrow created successfully!');
    } catch (error) {
      console.error('Failed to create escrow:', error);
      alert('Failed to create escrow. Please try again.');
    }
  };

  const handleConfirmDelivery = async (escrowId: number) => {
    try {
      await confirmDelivery(escrowId).unwrap();
      refetchEscrows(); // Refresh escrows list
      alert('Delivery confirmed successfully!');
    } catch (error) {
      console.error('Failed to confirm delivery:', error);
      alert('Failed to confirm delivery. Please try again.');
    }
  };

  const handleCompleteEscrow = async (escrowId: number) => {
    try {
      await completeEscrow(escrowId).unwrap();
      refetchEscrows(); // Refresh escrows list
      alert('Escrow completed successfully!');
    } catch (error) {
      console.error('Failed to complete escrow:', error);
      alert('Failed to complete escrow. Please try again.');
    }
  };

  // Mock data for demonstration
  const mockLoans = [
    {
      id: '1',
      amount: 2500,
      aiScore: 785,
      farmer: 'John Doe',
      location: 'Nairobi, Kenya',
      crop: 'Maize',
      interestRate: 8.5,
      termMonths: 12,
      fundedPercentage: 35,
      riskLevel: 'Low',
      farmSize: 5.2,
      ndvi: 0.78,
      description: 'Experienced maize farmer seeking capital for expansion',
      image: '/api/placeholder/400/200'
    },
    {
      id: '2',
      amount: 1800,
      aiScore: 742,
      farmer: 'Sarah Johnson',
      location: 'Lagos, Nigeria',
      crop: 'Cassava',
      interestRate: 9.2,
      termMonths: 8,
      fundedPercentage: 0,
      riskLevel: 'Medium',
      farmSize: 3.8,
      ndvi: 0.72,
      description: 'Sustainable cassava farming with organic practices',
      image: '/api/placeholder/400/200'
    },
    {
      id: '3',
      amount: 3200,
      aiScore: 812,
      farmer: 'Michael Brown',
      location: 'Accra, Ghana',
      crop: 'Rice',
      interestRate: 7.8,
      termMonths: 15,
      fundedPercentage: 60,
      riskLevel: 'Low',
      farmSize: 7.1,
      ndvi: 0.82,
      description: 'High-yield rice production with irrigation system',
      image: '/api/placeholder/400/200'
    }
  ];

  const displayLoans = listings?.data?.length > 0 ? listings.data : mockLoans;

  // Combine loans and product listings
  const allListings = [
    ...(displayLoans || []).map((loan: any) => ({ ...loan, listingType: 'loan' })),
    ...mockProductListings.map((product: any) => ({ ...product, listingType: product.type }))
  ];

  // Client-side filtering and sorting
  const filteredListings = allListings.filter((listing: any) => {
    const amount = listing.amount || listing.price || listing.principal_cents / 100 || 0;
    const score = listing.aiScore || listing.score || 750;
    const location = listing.location || '';
    const crop = listing.crop || '';
    const listingType = listing.listingType || listing.type;

    // Type filter
    if (filters.type !== 'all' && listingType !== filters.type) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const searchableFields = [
        listing.farmer, listing.seller, listing.title, location, crop, listing.description
      ].filter(Boolean);

      if (!searchableFields.some(field => field.toLowerCase().includes(searchLower))) {
        return false;
      }
    }

    // Amount/Price range filter
    if (filters.amountRange !== 'all') {
      if (filters.amountRange === '5000+') {
        if (amount < 5000) return false;
      } else {
        const [min, max] = filters.amountRange.split('-').map(Number);
        if (amount < min || amount > max) return false;
      }
    }

    // Score range filter
    if (filters.scoreRange !== 'all') {
      const [min, max] = filters.scoreRange.split('-').map(Number);
      if (score < min || score > max) return false;
    }

    // Crop filter
    if (filters.crop !== 'all' && crop.toLowerCase() !== filters.crop.toLowerCase()) {
      return false;
    }

    // Region filter
    if (filters.region !== 'all' && !location.toLowerCase().includes(filters.region.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Sorting
  const sortedListings = [...filteredListings].sort((a: any, b: any) => {
    const aAmount = a.amount || a.price || a.principal_cents / 100 || 0;
    const bAmount = b.amount || b.price || b.principal_cents / 100 || 0;
    const aScore = a.aiScore || a.score || 750;
    const bScore = b.aiScore || b.score || 750;
    const aInterest = a.interestRate || 8.5;
    const bInterest = b.interestRate || 8.5;

    switch (filters.sortBy) {
      case 'amount':
      case 'price_low':
        return aAmount - bAmount;
      case 'price_high':
        return bAmount - aAmount;
      case 'interest':
        return aInterest - bInterest;
      case 'newest':
        return (b.id || 0) - (a.id || 0); // Assuming higher id is newer
      case 'score':
      case 'relevance':
      default:
        return bScore - aScore;
    }
  });

  const getRiskBadgeColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'bg-sky-teal/10 text-sky-teal border-sky-teal/20';
      case 'medium': return 'bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20';
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-gray/10 text-slate-gray border-slate-gray/20';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper-white">
        <div className="container py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-slate-gray/10 rounded w-64"></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="shadow-level1">
                  <div className="h-48 bg-slate-gray/10 rounded-t-xl"></div>
                  <CardContent className="p-6 space-y-3">
                    <div className="h-6 bg-slate-gray/10 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-gray/10 rounded w-1/2"></div>
                    <div className="h-4 bg-slate-gray/10 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-paper-white">
        <div className="container py-8">
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-gray mb-2">Unable to Load Marketplace</h2>
            <p className="text-slate-gray/70 mb-6">
              We couldn't load the loan listings. Please try again later.
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-white">

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-agri-green to-sky-teal text-white py-12">
        <div className="container">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              AgriCredit Marketplace
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Buy and sell agricultural produce, equipment, and invest in sustainable farming across Africa
            </p>
          </div>
        </div>
      </section>

      <div className="container py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-gray/40 w-5 h-5" />
            <Input
              placeholder="Search by farmer, location, or crop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Toggle and View Mode */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-slate-gray/20"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {showFilters ? ' (Hide)' : ' (Show)'}
            </Button>

            <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-gray/60">
                  {sortedListings.length} listings available
                </span>
              <div className="flex border border-slate-gray/20 rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-none"
                >
                  List
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  className="rounded-l-none"
                >
                  <Map className="w-4 h-4 mr-1" />
                  Map
                </Button>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="shadow-level1 border-0">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-4">
                   <div className="space-y-2">
                     <Label className="text-sm font-medium text-slate-gray">Listing Type</Label>
                     <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                       <SelectTrigger>
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="all">All Types</SelectItem>
                         <SelectItem value="loan">Loans</SelectItem>
                         <SelectItem value="produce">Produce</SelectItem>
                         <SelectItem value="equipment">Equipment</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>

                   <div className="space-y-2">
                     <Label className="text-sm font-medium text-slate-gray">Crop Type</Label>
                     <Select value={filters.crop} onValueChange={(value) => setFilters(prev => ({ ...prev, crop: value }))}>
                       <SelectTrigger>
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="all">All Crops</SelectItem>
                         <SelectItem value="maize">Maize</SelectItem>
                         <SelectItem value="cassava">Cassava</SelectItem>
                         <SelectItem value="rice">Rice</SelectItem>
                         <SelectItem value="wheat">Wheat</SelectItem>
                         <SelectItem value="soybean">Soybean</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-gray">Region</Label>
                    <Select value={filters.region} onValueChange={(value) => setFilters(prev => ({ ...prev, region: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Regions</SelectItem>
                        <SelectItem value="kenya">Kenya</SelectItem>
                        <SelectItem value="nigeria">Nigeria</SelectItem>
                        <SelectItem value="ghana">Ghana</SelectItem>
                        <SelectItem value="tanzania">Tanzania</SelectItem>
                        <SelectItem value="uganda">Uganda</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-gray">AI Score Range</Label>
                    <Select value={filters.scoreRange} onValueChange={(value) => setFilters(prev => ({ ...prev, scoreRange: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Scores</SelectItem>
                        <SelectItem value="700-850">Excellent (700+)</SelectItem>
                        <SelectItem value="600-699">Good (600-699)</SelectItem>
                        <SelectItem value="500-599">Fair (500-599)</SelectItem>
                        <SelectItem value="300-499">Needs Attention (300-499)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-gray">Loan Amount</Label>
                    <Select value={filters.amountRange} onValueChange={(value) => setFilters(prev => ({ ...prev, amountRange: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Amount</SelectItem>
                        <SelectItem value="0-1000">$0 - $1,000</SelectItem>
                        <SelectItem value="1000-2500">$1,000 - $2,500</SelectItem>
                        <SelectItem value="2500-5000">$2,500 - $5,000</SelectItem>
                        <SelectItem value="5000+">$5,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-gray">Sort By</Label>
                    <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="newest">Newest First</SelectItem>
                         <SelectItem value="score">AI Score (High to Low)</SelectItem>
                         <SelectItem value="price_low">Price (Low to High)</SelectItem>
                         <SelectItem value="price_high">Price (High to Low)</SelectItem>
                         <SelectItem value="relevance">Relevance</SelectItem>
                       </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-gray/10">
                  <Button variant="outline" size="sm" onClick={() => setFilters({
                    type: 'all',
                    crop: 'all',
                    region: 'all',
                    scoreRange: 'all',
                    amountRange: 'all',
                    sortBy: 'newest'
                  })}>
                    Clear Filters
                  </Button>
                  <span className="text-sm text-slate-gray/60">
                    {sortedListings.length} results found
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Map View */}
        {viewMode === 'map' && (
          <Card className="shadow-level2 border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-slate-gray">
                <Map className="w-5 h-5 mr-2 text-agri-green" />
                Loan Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LoanMap loans={sortedListings.filter(l => l.listingType === 'loan')} onLoanSelect={(loanId) => {
                // Navigate to loan detail or highlight in map
                window.location.href = `/loan/${loanId}`;
              }} />
            </CardContent>
          </Card>
        )}

        {/* Listing Cards */}
        {viewMode !== 'map' && sortedListings.length > 0 ? (
          <div className={viewMode === 'grid'
            ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
          }>
            {sortedListings.map((listing: any) => (
              <Card key={listing.id} className="shadow-level2 border-0 overflow-hidden hover:shadow-level3 transition-all duration-300 group">
                {viewMode === 'grid' && (
                  <div className="aspect-video bg-gradient-to-br from-agri-green/10 to-sky-teal/10 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        {listing.listingType === 'loan' ? (
                          <>
                            <DollarSign className="w-12 h-12 text-agri-green mx-auto mb-2" />
                            <p className="text-sm text-slate-gray/60">Agricultural Loan</p>
                          </>
                        ) : listing.listingType === 'produce' ? (
                          <>
                            <Leaf className="w-12 h-12 text-agri-green mx-auto mb-2" />
                            <p className="text-sm text-slate-gray/60">{listing.crop || 'Crop Produce'}</p>
                          </>
                        ) : (
                          <>
                            <BarChart3 className="w-12 h-12 text-agri-green mx-auto mb-2" />
                            <p className="text-sm text-slate-gray/60">{listing.category || 'Equipment'}</p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Button variant="secondary" size="sm" className="w-8 h-8 p-0 bg-white/90 hover:bg-white">
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-white/90 text-slate-gray">
                        {listing.listingType === 'loan' ? 'Loan' : listing.listingType === 'produce' ? 'Produce' : 'Equipment'}
                      </Badge>
                    </div>
                  </div>
                )}

                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-gray mb-1">
                        ${listing.amount || listing.price || listing.principal_cents / 100 || 0}
                        {listing.listingType === 'produce' && listing.unit && (
                          <span className="text-sm font-normal text-slate-gray/60">/{listing.unit}</span>
                        )}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Badge className={getRiskBadgeColor(listing.riskLevel || 'Low')}>
                          {listing.aiScore || listing.score || 750} Score
                        </Badge>
                        {listing.listingType === 'loan' && (
                          <Badge variant="outline" className="border-slate-gray/20">
                            {listing.riskLevel || 'Low'} Risk
                          </Badge>
                        )}
                        {listing.qualityGrade && (
                          <Badge variant="outline" className="border-harvest-gold/20 text-harvest-gold">
                            Grade {listing.qualityGrade}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {viewMode === 'list' && (
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Heart className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3 mb-4">
                    <h4 className="font-semibold text-slate-gray">{listing.title || `Loan from ${listing.farmer || listing.seller}`}</h4>
                    <div className="flex items-center space-x-2 text-sm text-slate-gray/70">
                      <MapPin className="w-4 h-4" />
                      <span>{listing.location || 'Unknown Location'}</span>
                    </div>
                    {listing.listingType === 'loan' ? (
                      <>
                        <div className="flex items-center space-x-2 text-sm text-slate-gray/70">
                          <Leaf className="w-4 h-4" />
                          <span>{listing.crop || 'Various Crops'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-slate-gray/70">
                          <Calendar className="w-4 h-4" />
                          <span>{listing.termMonths || 12} months • {listing.interestRate || 8.5}% APR</span>
                        </div>
                      </>
                    ) : listing.listingType === 'produce' ? (
                      <>
                        <div className="flex items-center space-x-2 text-sm text-slate-gray/70">
                          <TrendingUp className="w-4 h-4" />
                          <span>{listing.quantity} {listing.unit} available</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-slate-gray/70">
                          <Calendar className="w-4 h-4" />
                          <span>Harvest: {listing.harvestDate}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2 text-sm text-slate-gray/70">
                          <BarChart3 className="w-4 h-4" />
                          <span>{listing.condition || 'Used'} • {listing.year || 'N/A'}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {listing.listingType === 'loan' && listing.fundedPercentage > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-gray">Funding Progress</span>
                        <span className="text-sm text-agri-green">{listing.fundedPercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-gray/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-agri-green to-sky-teal h-2 rounded-full transition-all duration-300"
                          style={{ width: `${listing.fundedPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-slate-gray/70 mb-4 line-clamp-2">
                    {listing.description || 'High-quality agricultural product available for purchase.'}
                  </p>

                  <div className="flex space-x-2">
                    <Link href={listing.listingType === 'loan' ? `/loan/${listing.id}` : `/listing/${listing.id}`} className="flex-1">
                      <Button variant="outline" className="w-full border-slate-gray/20 hover:border-agri-green hover:text-agri-green">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                    {listing.listingType === 'loan' ? (
                      <Button
                        className="flex-1 btn-primary"
                        onClick={() => handleFundLoan(listing.id)}
                        disabled={isFunding}
                      >
                        {isFunding ? 'Funding...' : 'Fund Loan'}
                      </Button>
                    ) : (
                      <Button
                        className="flex-1 btn-primary"
                        onClick={() => handlePurchaseProduct(listing)}
                      >
                        Buy Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-gray/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-gray/40" />
            </div>
            <h3 className="text-xl font-semibold text-slate-gray mb-2">No loans found</h3>
            <p className="text-slate-gray/70 mb-6">
              Try adjusting your filters or check back later for new loan opportunities.
            </p>
            <Link href="/apply">
              <Button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Apply for a Loan Instead
              </Button>
            </Link>
          </div>
        )}

        {/* User Escrows Section */}
        {userEscrows?.data?.escrows && userEscrows.data.escrows.length > 0 && (
          <Card className="shadow-level2 border-0 mt-8">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-gray">
                <CheckCircle className="w-5 h-5 mr-2 text-agri-green" />
                Your Active Escrows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userEscrows.data.escrows.map((escrow: any) => (
                  <Card key={escrow.id} className="border border-slate-gray/20">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-slate-gray">Escrow #{escrow.id}</h4>
                          <p className="text-sm text-slate-gray/70">Amount: ${escrow.amount}</p>
                          <p className="text-sm text-slate-gray/70">Status: {escrow.status}</p>
                          <p className="text-sm text-slate-gray/70">Seller: {escrow.seller}</p>
                        </div>
                        <div className="flex space-x-2">
                          {escrow.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConfirmDelivery(escrow.id)}
                            >
                              Confirm Delivery
                            </Button>
                          )}
                          {escrow.status === 'delivered' && (
                            <Button
                              size="sm"
                              className="btn-primary"
                              onClick={() => handleCompleteEscrow(escrow.id)}
                            >
                              Complete Escrow
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Escrow Modal */}
      {showEscrowModal && selectedListing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-level3">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-gray">
                <CheckCircle className="w-5 h-5 mr-2 text-agri-green" />
                Create Escrow
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-slate-gray mb-2">{selectedListing.title}</h4>
                <p className="text-sm text-slate-gray/70 mb-4">{selectedListing.description}</p>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-gray/70">Price per {selectedListing.unit}:</span>
                    <span className="font-semibold">${selectedListing.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-gray/70">Available Quantity:</span>
                    <span className="font-semibold">{selectedListing.quantity} {selectedListing.unit}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-gray/10 pt-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-gray">Quantity to Purchase</Label>
                  <Input
                    type="number"
                    min="1"
                    max={selectedListing.quantity}
                    defaultValue="1"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-gray">Delivery Location</Label>
                  <Input
                    placeholder="Enter delivery address"
                    className="mt-1"
                  />
                </div>

                <div className="bg-agri-green/5 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-gray">Total Amount:</span>
                    <span className="font-bold text-agri-green">$250</span>
                  </div>
                  <p className="text-xs text-slate-gray/60">
                    Amount will be held in escrow until delivery confirmation
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowEscrowModal(false)}
                >
                  Cancel
                </Button>
                 <Button
                   className="flex-1 btn-primary"
                   disabled={isCreatingEscrow}
                   onClick={() => handleCreateEscrow({
                     listingId: selectedListing.id,
                     quantity: 1,
                     amount: selectedListing.price,
                     deliveryLocation: 'User input'
                   })}
                 >
                   {isCreatingEscrow ? 'Creating...' : 'Create Escrow'}
                 </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}