'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';
import { useGetCarbonCreditsQuery, useGetClimateAnalysisMutation } from '@/store/apiSlice';
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Leaf,
  BarChart3,
  DollarSign,
  Plus,
  ShoppingCart,
  Recycle,
  Award,
  CheckCircle,
  AlertTriangle,
  Info,
  MapPin,
  Calendar,
  Users,
  Globe,
  Zap,
  Star,
  Eye
} from 'lucide-react';

export default function CarbonPage() {
  const { t } = useTranslation();
  const [generateCredits, { isLoading: generating }] = useGetClimateAnalysisMutation();
  const { data: carbonCredits, isLoading } = useGetCarbonCreditsQuery({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    region: 'all',
    priceRange: 'all',
    verification: 'all'
  });

  // Mock comprehensive data
  const userPortfolio = {
    totalCredits: 150,
    availableCredits: 120,
    retiredCredits: 20,
    tradedCredits: 10,
    totalValue: 3750,
    monthlyGeneration: 12,
    yearlyTarget: 200,
    progressPercentage: 75
  };

  const marketplaceListings = [
    {
      id: 1,
      seller: 'Green Farms Ltd',
      sellerType: 'Farm Cooperative',
      amount: 1000,
      availableAmount: 750,
      price: 25.50,
      type: 'Voluntary Carbon Credit',
      methodology: 'Improved Forest Management',
      location: 'Kenya',
      region: 'East Africa',
      verified: true,
      vintage: 2024,
      rating: 4.8,
      description: 'Credits generated from sustainable maize farming with no-till practices and agroforestry integration.',
      image: '/api/placeholder/400/200',
      certifications: ['Verified Carbon Standard', 'Gold Standard'],
      impact: {
        treesPlanted: 2500,
        hectaresProtected: 150,
        co2Sequestered: 1000
      }
    },
    {
      id: 2,
      seller: 'Sustainable Agri Co',
      sellerType: 'Agricultural Company',
      amount: 500,
      availableAmount: 500,
      price: 28.00,
      type: 'Nature-based Credit',
      methodology: 'REDD+',
      location: 'Tanzania',
      region: 'East Africa',
      verified: true,
      vintage: 2023,
      rating: 4.9,
      description: 'High-quality credits from avoided deforestation and reforestation projects in Tanzania.',
      image: '/api/placeholder/400/200',
      certifications: ['Verified Carbon Standard', 'Climate Action Reserve'],
      impact: {
        treesPlanted: 5000,
        hectaresProtected: 300,
        co2Sequestered: 500
      }
    },
    {
      id: 3,
      seller: 'Eco Farmers Union',
      sellerType: 'Farmers Union',
      amount: 750,
      availableAmount: 600,
      price: 22.75,
      type: 'Agricultural Carbon Credit',
      methodology: 'Soil Carbon Sequestration',
      location: 'Uganda',
      region: 'East Africa',
      verified: true,
      vintage: 2024,
      rating: 4.6,
      description: 'Credits from regenerative agriculture practices including cover cropping and reduced tillage.',
      image: '/api/placeholder/400/200',
      certifications: ['Verified Carbon Standard'],
      impact: {
        treesPlanted: 0,
        hectaresProtected: 200,
        co2Sequestered: 750
      }
    },
    {
      id: 4,
      seller: 'Climate Farmers Network',
      sellerType: 'Farmers Network',
      amount: 1200,
      availableAmount: 900,
      price: 26.80,
      type: 'Voluntary Carbon Credit',
      methodology: 'Afforestation',
      location: 'Ghana',
      region: 'West Africa',
      verified: true,
      vintage: 2024,
      rating: 4.7,
      description: 'Credits from large-scale tree planting and agroforestry projects across Ghana.',
      image: '/api/placeholder/400/200',
      certifications: ['Gold Standard', 'Verified Carbon Standard'],
      impact: {
        treesPlanted: 10000,
        hectaresProtected: 400,
        co2Sequestered: 1200
      }
    }
  ];

  const recentActivity = [
    { type: 'generated', amount: 12, description: 'Monthly generation from maize farming', date: '2024-01-15', impact: '+12 tCO2' },
    { type: 'sold', amount: 25, description: 'Sold to Green Energy Corp', date: '2024-01-10', impact: '-25 tCO2' },
    { type: 'retired', amount: 10, description: 'Retired for climate impact', date: '2024-01-05', impact: '-10 tCO2' },
    { type: 'purchased', amount: 50, description: 'Bought from Eco Farms', date: '2024-01-01', impact: '+50 tCO2' }
  ];

  const marketAnalytics = {
    averagePrice: 25.42,
    priceChange: 2.3,
    tradingVolume: 1250,
    topRegions: ['Kenya', 'Tanzania', 'Ghana'],
    trendingProjects: ['Agroforestry', 'Regenerative Agriculture', 'REDD+']
  };

  const handleGenerateCredits = async () => {
    try {
      const analysisData = {
        satellite_data: {
          ndvi_score: 0.75,
          land_cover: 'cropland',
          cloud_cover: 0.1
        },
        iot_sensors: {
          soil_moisture: 0.65,
          temperature: 24.5,
          humidity: 70.0
        }
      };

      await generateCredits(analysisData).unwrap();
    } catch (error) {
      console.error('Failed to generate carbon credits:', error);
    }
  };

  const filteredListings = marketplaceListings.filter(listing => {
    const matchesSearch = listing.seller.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filters.type === 'all' || listing.type.toLowerCase().includes(filters.type.toLowerCase());
    const matchesRegion = filters.region === 'all' || listing.region === filters.region;
    const matchesVerification = filters.verification === 'all' ||
                               (filters.verification === 'verified' && listing.verified) ||
                               (filters.verification === 'pending' && !listing.verified);

    return matchesSearch && matchesType && matchesRegion && matchesVerification;
  });

  return (
    <div className="min-h-screen bg-paper-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-12">
        <div className="container">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              Carbon Credits Marketplace
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Trade verified carbon credits from sustainable African agriculture and contribute to climate action
            </p>
          </div>
        </div>
      </section>

      <div className="container py-8">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-slate-gray">Carbon Trading</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              onClick={handleGenerateCredits}
              disabled={generating}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              {generating ? (
                <>
                  <Zap className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Credits
                </>
              )}
            </Button>
            <Button variant="outline" className="border-slate-gray/20 hover:border-agri-green hover:text-agri-green">
              <ShoppingCart className="w-4 h-4 mr-2" />
              List for Sale
            </Button>
          </div>
        </div>

        <Tabs defaultValue="portfolio" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="portfolio" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>My Portfolio</span>
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4" />
              <span>Marketplace</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            {/* Portfolio Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="shadow-level1 border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-black text-slate-gray">{userPortfolio.totalCredits}</p>
                      <p className="text-sm text-slate-gray/60">Total Credits</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <Leaf className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-xs text-green-600">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +{userPortfolio.monthlyGeneration} this month
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-level1 border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-black text-slate-gray">${userPortfolio.totalValue.toLocaleString()}</p>
                      <p className="text-sm text-slate-gray/60">Portfolio Value</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-xs text-amber-600">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Market value
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-level1 border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-black text-slate-gray">{userPortfolio.progressPercentage}%</p>
                      <p className="text-sm text-slate-gray/60">Yearly Target</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <Progress value={userPortfolio.progressPercentage} className="mt-3 h-2" />
                </CardContent>
              </Card>

              <Card className="shadow-level1 border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-black text-slate-gray">{userPortfolio.availableCredits}</p>
                      <p className="text-sm text-slate-gray/60">Available</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-xs text-slate-gray/60">
                    Ready to trade
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <BarChart3 className="w-5 h-5 mr-2 text-agri-green" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your carbon credit transactions and generations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-gray/5 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          activity.type === 'generated' ? 'bg-green-100' :
                          activity.type === 'sold' ? 'bg-red-100' :
                          activity.type === 'retired' ? 'bg-blue-100' :
                          'bg-amber-100'
                        }`}>
                          {activity.type === 'generated' && <Plus className="w-5 h-5 text-green-600" />}
                          {activity.type === 'sold' && <TrendingDown className="w-5 h-5 text-red-600" />}
                          {activity.type === 'retired' && <Recycle className="w-5 h-5 text-blue-600" />}
                          {activity.type === 'purchased' && <ShoppingCart className="w-5 h-5 text-amber-600" />}
                        </div>
                        <div>
                          <p className="font-medium text-slate-gray capitalize">{activity.type}</p>
                          <p className="text-sm text-slate-gray/60">{activity.description}</p>
                          <p className="text-xs text-slate-gray/50">{activity.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          activity.type === 'generated' || activity.type === 'purchased' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {activity.impact}
                        </p>
                        <p className="text-xs text-slate-gray/60">{activity.amount} tCO2</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="space-y-6">
            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-gray/40 w-5 h-5" />
                  <Input
                    placeholder="Search by seller, location, or project type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" className="border-slate-gray/20">
                  <Filter className="w-4 h-4 mr-2" />
                  Advanced Filters
                </Button>
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2">
                <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Credit Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="voluntary">Voluntary</SelectItem>
                    <SelectItem value="nature">Nature-based</SelectItem>
                    <SelectItem value="agricultural">Agricultural</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.region} onValueChange={(value) => setFilters(prev => ({ ...prev, region: value }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    <SelectItem value="East Africa">East Africa</SelectItem>
                    <SelectItem value="West Africa">West Africa</SelectItem>
                    <SelectItem value="Southern Africa">Southern Africa</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.verification} onValueChange={(value) => setFilters(prev => ({ ...prev, verification: value }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Verification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Marketplace Listings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredListings.map((listing) => (
                <Card key={listing.id} className="shadow-level2 border-0 overflow-hidden hover:shadow-level3 transition-all duration-300 group">
                  <div className="aspect-video bg-gradient-to-br from-green-500/10 to-emerald-500/10 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Leaf className="w-12 h-12 text-agri-green mx-auto mb-2" />
                        <p className="text-sm text-slate-gray/60">{listing.methodology}</p>
                      </div>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge className={listing.verified ? 'bg-sky-teal/10 text-sky-teal border-sky-teal/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}>
                        {listing.verified ? 'Verified' : 'Pending'}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-gray mb-1">{listing.seller}</h3>
                        <p className="text-sm text-slate-gray/60 mb-2">{listing.sellerType}</p>
                        <div className="flex items-center space-x-4 text-sm text-slate-gray/70">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{listing.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{listing.vintage}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-harvest-gold fill-current" />
                        <span className="text-sm font-medium">{listing.rating}</span>
                      </div>
                    </div>

                    <p className="text-sm text-slate-gray/70 mb-4 line-clamp-2">
                      {listing.description}
                    </p>

                    {/* Impact Metrics */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center p-2 bg-slate-gray/5 rounded">
                        <p className="text-lg font-bold text-agri-green">{listing.impact.treesPlanted.toLocaleString()}</p>
                        <p className="text-xs text-slate-gray/60">Trees Planted</p>
                      </div>
                      <div className="text-center p-2 bg-slate-gray/5 rounded">
                        <p className="text-lg font-bold text-agri-green">{listing.impact.hectaresProtected}</p>
                        <p className="text-xs text-slate-gray/60">Hectares</p>
                      </div>
                      <div className="text-center p-2 bg-slate-gray/5 rounded">
                        <p className="text-lg font-bold text-agri-green">{listing.impact.co2Sequestered}</p>
                        <p className="text-xs text-slate-gray/60">tCO2</p>
                      </div>
                    </div>

                    {/* Certifications */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {listing.certifications.map((cert, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-slate-gray/20">
                          {cert}
                        </Badge>
                      ))}
                    </div>

                    {/* Pricing */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-2xl font-black text-slate-gray">${listing.price}</p>
                        <p className="text-sm text-slate-gray/60">per tCO2</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-slate-gray">
                          {listing.availableAmount} / {listing.amount} tCO2
                        </p>
                        <p className="text-sm text-slate-gray/60">Available</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <Progress value={(listing.availableAmount / listing.amount) * 100} className="h-2" />
                      <p className="text-xs text-slate-gray/60 mt-1 text-center">
                        {Math.round((listing.availableAmount / listing.amount) * 100)}% available
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Button variant="outline" className="flex-1 border-slate-gray/20 hover:border-agri-green hover:text-agri-green">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button className="flex-1 btn-primary">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Buy Credits
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredListings.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-slate-gray/40 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-gray mb-2">No credits found</h3>
                <p className="text-slate-gray/70 mb-6">
                  Try adjusting your search criteria or filters.
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery('');
                  setFilters({ type: 'all', region: 'all', priceRange: 'all', verification: 'all' });
                }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Market Overview */}
              <Card className="shadow-level2 border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-gray">
                    <TrendingUp className="w-5 h-5 mr-2 text-agri-green" />
                    Market Overview
                  </CardTitle>
                  <CardDescription>
                    Current carbon credit market trends and pricing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-slate-gray/5 rounded-lg">
                      <p className="text-2xl font-black text-slate-gray">${marketAnalytics.averagePrice}</p>
                      <p className="text-sm text-slate-gray/60">Average Price</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-black text-green-600">+{marketAnalytics.priceChange}%</p>
                      <p className="text-sm text-slate-gray/60">30-Day Change</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-gray/70">Trading Volume</span>
                      <span className="font-semibold text-slate-gray">{marketAnalytics.tradingVolume.toLocaleString()} tCO2</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-gray/70">Active Sellers</span>
                      <span className="font-semibold text-slate-gray">47</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-gray/70">Total Credits</span>
                      <span className="font-semibold text-slate-gray">25,000+ tCO2</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Regions */}
              <Card className="shadow-level2 border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-gray">
                    <Globe className="w-5 h-5 mr-2 text-agri-green" />
                    Top Regions
                  </CardTitle>
                  <CardDescription>
                    Most active carbon credit markets in Africa
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {marketAnalytics.topRegions.map((region, index) => (
                      <div key={region} className="flex items-center justify-between p-3 bg-slate-gray/5 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-agri-green to-sky-teal rounded-lg flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <span className="font-medium text-slate-gray">{region}</span>
                        </div>
                        <Badge variant="secondary" className="bg-agri-green/10 text-agri-green">
                          {Math.floor(Math.random() * 500) + 200} credits
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Trending Projects */}
              <Card className="shadow-level2 border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-gray">
                    <Zap className="w-5 h-5 mr-2 text-agri-green" />
                    Trending Projects
                  </CardTitle>
                  <CardDescription>
                    Popular carbon sequestration methodologies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {marketAnalytics.trendingProjects.map((project, index) => (
                      <div key={project} className="flex items-center justify-between p-3 bg-slate-gray/5 rounded-lg">
                        <span className="font-medium text-slate-gray">{project}</span>
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">
                            +{Math.floor(Math.random() * 20) + 5}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Market Insights */}
              <Card className="shadow-level2 border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-slate-gray">
                    <Info className="w-5 h-5 mr-2 text-agri-green" />
                    Market Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h5 className="font-medium text-blue-800 mb-1">Growing Demand</h5>
                        <p className="text-sm text-blue-700">
                          Carbon credit prices have increased 15% in the last quarter due to rising corporate ESG commitments.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h5 className="font-medium text-green-800 mb-1">High Standards</h5>
                        <p className="text-sm text-green-700">
                          All listed credits meet international verification standards and undergo regular audits.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}