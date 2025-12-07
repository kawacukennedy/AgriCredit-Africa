'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { useGetMarketplaceListingsQuery, useFundLoanMutation } from '@/store/apiSlice';
import Link from 'next/link';
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
  Plus
} from 'lucide-react';

export default function MarketplacePage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    crop: 'all',
    region: 'all',
    scoreRange: 'all',
    amountRange: 'all',
    sortBy: 'score'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const [fundLoan, { isLoading: isFunding }] = useFundLoanMutation();

  const { data: listings, isLoading, error } = useGetMarketplaceListingsQuery({
    crop_type: filters.crop !== 'all' ? filters.crop : undefined,
    region: filters.region !== 'all' ? filters.region : undefined,
    min_score: filters.scoreRange !== 'all' ? parseInt(filters.scoreRange.split('-')[0]) : undefined,
    max_score: filters.scoreRange !== 'all' ? parseInt(filters.scoreRange.split('-')[1]) : undefined,
  });

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
        <Navbar />
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
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-paper-white">
        <Navbar />
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
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-agri-green to-sky-teal text-white py-12">
        <div className="container">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              Loan Marketplace
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Discover vetted agricultural loans and invest in sustainable farming across Africa
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
                {displayLoans.length} loans available
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
                  className="rounded-l-none"
                >
                  List
                </Button>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="shadow-level1 border-0">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                        <SelectItem value="score">AI Score (High to Low)</SelectItem>
                        <SelectItem value="amount">Loan Amount (Low to High)</SelectItem>
                        <SelectItem value="interest">Interest Rate (Low to High)</SelectItem>
                        <SelectItem value="newest">Newest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-gray/10">
                  <Button variant="outline" size="sm" onClick={() => setFilters({
                    crop: 'all',
                    region: 'all',
                    scoreRange: 'all',
                    amountRange: 'all',
                    sortBy: 'score'
                  })}>
                    Clear Filters
                  </Button>
                  <span className="text-sm text-slate-gray/60">
                    {displayLoans.length} results found
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Loan Cards */}
        {displayLoans.length > 0 ? (
          <div className={viewMode === 'grid'
            ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
          }>
            {displayLoans.map((loan: any) => (
              <Card key={loan.id} className="shadow-level2 border-0 overflow-hidden hover:shadow-level3 transition-all duration-300 group">
                {viewMode === 'grid' && (
                  <div className="aspect-video bg-gradient-to-br from-agri-green/10 to-sky-teal/10 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Leaf className="w-12 h-12 text-agri-green mx-auto mb-2" />
                        <p className="text-sm text-slate-gray/60">{loan.crop || 'Crop Farming'}</p>
                      </div>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Button variant="secondary" size="sm" className="w-8 h-8 p-0 bg-white/90 hover:bg-white">
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-gray mb-1">
                        ${loan.amount || loan.principal_cents / 100 || 0}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Badge className={getRiskBadgeColor(loan.riskLevel || 'Low')}>
                          {loan.aiScore || loan.score || 750} Score
                        </Badge>
                        <Badge variant="outline" className="border-slate-gray/20">
                          {loan.riskLevel || 'Low'} Risk
                        </Badge>
                      </div>
                    </div>
                    {viewMode === 'list' && (
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Heart className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-slate-gray/70">
                      <MapPin className="w-4 h-4" />
                      <span>{loan.location || 'Unknown Location'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-slate-gray/70">
                      <Leaf className="w-4 h-4" />
                      <span>{loan.crop || 'Various Crops'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-slate-gray/70">
                      <Calendar className="w-4 h-4" />
                      <span>{loan.termMonths || 12} months • {loan.interestRate || 8.5}% APR</span>
                    </div>
                  </div>

                  {loan.fundedPercentage > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-gray">Funding Progress</span>
                        <span className="text-sm text-agri-green">{loan.fundedPercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-gray/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-agri-green to-sky-teal h-2 rounded-full transition-all duration-300"
                          style={{ width: `${loan.fundedPercentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-slate-gray/70 mb-4 line-clamp-2">
                    {loan.description || 'Experienced farmer seeking capital for sustainable agricultural expansion.'}
                  </p>

                  <div className="flex space-x-2">
                    <Link href={`/loan/${loan.id}`} className="flex-1">
                      <Button variant="outline" className="w-full border-slate-gray/20 hover:border-agri-green hover:text-agri-green">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                    <Button
                      className="flex-1 btn-primary"
                      onClick={() => handleFundLoan(loan.id)}
                      disabled={isFunding}
                    >
                      {isFunding ? 'Funding...' : 'Fund Loan'}
                    </Button>
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
      </div>

      <Footer />
    </div>
  );
}