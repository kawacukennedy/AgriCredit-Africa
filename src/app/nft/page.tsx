'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Filter,
  Star,
  Heart,
  Share2,
  ShoppingCart,
  TrendingUp,
  Award,
  Leaf,
  Zap,
  Shield,
  Users,
  BarChart3,
  Plus,
  Eye,
  Coins,
  Gem,
  Crown,
  Sparkles,
  Info,
  ExternalLink
} from 'lucide-react';

export default function NFTPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    rarity: 'all',
    type: 'all',
    priceRange: 'all'
  });
  const [selectedNFT, setSelectedNFT] = useState<any>(null);

  // Mock comprehensive NFT data
  const nftCollections = [
    {
      id: 1,
      name: 'Golden Harvest Champion',
      description: 'Exclusive NFT awarded to farmers achieving record-breaking yields. Represents agricultural excellence and sustainable farming mastery.',
      rarity: 'Legendary',
      type: 'Achievement',
      farmingReward: 500,
      price: 2.5,
      currency: 'ETH',
      owned: 1,
      totalSupply: 100,
      floorPrice: 2.2,
      volume24h: 15.8,
      attributes: {
        yield: '95th percentile',
        sustainability: 'Gold Standard',
        region: 'East Africa'
      },
      image: '/api/placeholder/400/400',
      gradient: 'from-amber-400 via-yellow-500 to-orange-500',
      icon: Crown,
      benefits: ['500 AGRI/day farming', 'Governance voting rights', 'Exclusive community access', 'Revenue sharing']
    },
    {
      id: 2,
      name: 'Carbon Sequestration Guardian',
      description: 'Tokenized representation of verified carbon sequestration efforts. Each NFT represents 1 tonne of CO2 permanently removed from the atmosphere.',
      rarity: 'Epic',
      type: 'Environmental',
      farmingReward: 300,
      price: 1.8,
      currency: 'ETH',
      owned: 0,
      totalSupply: 500,
      floorPrice: 1.6,
      volume24h: 8.9,
      attributes: {
        sequestration: '1 tonne CO2',
        methodology: 'REDD+',
        verification: 'Gold Standard'
      },
      image: '/api/placeholder/400/400',
      gradient: 'from-green-400 via-emerald-500 to-teal-500',
      icon: Leaf,
      benefits: ['300 AGRI/day farming', 'Carbon credit trading', 'ESG portfolio boost', 'Impact reporting']
    },
    {
      id: 3,
      name: 'Loan Repayment Master',
      description: 'Achievement NFT for farmers with perfect loan repayment records. Demonstrates financial responsibility and creditworthiness.',
      rarity: 'Rare',
      type: 'Achievement',
      farmingReward: 150,
      price: 0.9,
      currency: 'ETH',
      owned: 2,
      totalSupply: 1000,
      floorPrice: 0.8,
      volume24h: 4.2,
      attributes: {
        repayment: '100% on-time',
        loans: '5+ completed',
        creditScore: '800+'
      },
      image: '/api/placeholder/400/400',
      gradient: 'from-blue-400 via-indigo-500 to-purple-500',
      icon: Shield,
      benefits: ['150 AGRI/day farming', 'Priority loan access', 'Lower interest rates', 'Credit score boost']
    },
    {
      id: 4,
      name: 'Community Builder',
      description: 'NFT for active community members who contribute to the AgriCredit ecosystem through governance participation and community support.',
      rarity: 'Uncommon',
      type: 'Community',
      farmingReward: 75,
      price: 0.4,
      currency: 'ETH',
      owned: 5,
      totalSupply: 5000,
      floorPrice: 0.35,
      volume24h: 2.1,
      attributes: {
        proposals: '10+ voted',
        community: 'Active member',
        tenure: '6+ months'
      },
      image: '/api/placeholder/400/400',
      gradient: 'from-slate-400 via-gray-500 to-zinc-500',
      icon: Users,
      benefits: ['75 AGRI/day farming', 'Governance access', 'Community rewards', 'Early feature access']
    },
    {
      id: 5,
      name: 'Yield Optimization Oracle',
      description: 'AI-powered NFT that provides advanced yield prediction and optimization recommendations for connected farms.',
      rarity: 'Epic',
      type: 'Technology',
      farmingReward: 250,
      price: 1.2,
      currency: 'ETH',
      owned: 0,
      totalSupply: 250,
      floorPrice: 1.1,
      volume24h: 6.7,
      attributes: {
        accuracy: '92% prediction',
        crops: '15+ supported',
        regions: 'Pan-Africa'
      },
      image: '/api/placeholder/400/400',
      gradient: 'from-cyan-400 via-blue-500 to-indigo-500',
      icon: Zap,
      benefits: ['250 AGRI/day farming', 'AI yield predictions', 'Optimization alerts', 'Premium analytics']
    },
    {
      id: 6,
      name: 'Farm Asset Token',
      description: 'Tokenized ownership of physical farm equipment and infrastructure. Represents real-world agricultural assets.',
      rarity: 'Rare',
      type: 'Asset',
      farmingReward: 200,
      price: 1.5,
      currency: 'ETH',
      owned: 0,
      totalSupply: 200,
      floorPrice: 1.3,
      volume24h: 3.8,
      attributes: {
        equipment: 'Irrigation system',
        value: '$50,000',
        location: 'Kenya'
      },
      image: '/api/placeholder/400/400',
      gradient: 'from-lime-400 via-green-500 to-emerald-500',
      icon: BarChart3,
      benefits: ['200 AGRI/day farming', 'Asset ownership', 'Revenue sharing', 'Equipment access']
    }
  ];

  const userCollection = [
    {
      id: 1,
      nftId: 1,
      name: 'Golden Harvest Champion',
      rarity: 'Legendary',
      farmingStatus: 'active',
      dailyReward: 500,
      totalEarned: 12500,
      stakedDate: '2024-01-15',
      lastClaimed: '2024-01-20'
    },
    {
      id: 2,
      nftId: 3,
      name: 'Loan Repayment Master',
      rarity: 'Rare',
      farmingStatus: 'active',
      dailyReward: 150,
      totalEarned: 3750,
      stakedDate: '2024-01-10',
      lastClaimed: '2024-01-20'
    },
    {
      id: 3,
      nftId: 4,
      name: 'Community Builder',
      rarity: 'Uncommon',
      farmingStatus: 'idle',
      dailyReward: 75,
      totalEarned: 1875,
      stakedDate: '2024-01-05',
      lastClaimed: '2024-01-18'
    }
  ];

  const getRarityConfig = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary':
        return { color: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white', icon: Crown };
      case 'epic':
        return { color: 'bg-gradient-to-r from-purple-400 to-pink-500 text-white', icon: Gem };
      case 'rare':
        return { color: 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white', icon: Star };
      case 'uncommon':
        return { color: 'bg-gradient-to-r from-green-400 to-teal-500 text-white', icon: Sparkles };
      default:
        return { color: 'bg-gradient-to-r from-slate-400 to-gray-500 text-white', icon: Award };
    }
  };

  const filteredNFTs = nftCollections.filter(nft => {
    const matchesSearch = nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         nft.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = filters.rarity === 'all' || nft.rarity.toLowerCase() === filters.rarity.toLowerCase();
    const matchesType = filters.type === 'all' || nft.type.toLowerCase() === filters.type.toLowerCase();

    return matchesSearch && matchesRarity && matchesType;
  });

  const totalDailyRewards = userCollection
    .filter(nft => nft.farmingStatus === 'active')
    .reduce((sum, nft) => sum + nft.dailyReward, 0);

  return (
    <div className="min-h-screen bg-paper-white">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white py-12">
        <div className="container">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              NFT Farming Marketplace
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Collect, trade, and farm with tokenized agricultural assets. Earn rewards while supporting sustainable farming.
            </p>
          </div>
        </div>
      </section>

      <div className="container py-8">
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Gem className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-slate-gray">NFT Marketplace</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              <Plus className="w-4 h-4 mr-2" />
              Mint NFT
            </Button>
            <Button variant="outline" className="border-slate-gray/20 hover:border-agri-green hover:text-agri-green">
              <ShoppingCart className="w-4 h-4 mr-2" />
              My Collection
            </Button>
          </div>
        </div>

        <Tabs defaultValue="marketplace" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="marketplace" className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4" />
              <span>Marketplace</span>
            </TabsTrigger>
            <TabsTrigger value="collection" className="flex items-center space-x-2">
              <Award className="w-4 h-4" />
              <span>My Collection</span>
            </TabsTrigger>
            <TabsTrigger value="farming" className="flex items-center space-x-2">
              <Coins className="w-4 h-4" />
              <span>Farming</span>
            </TabsTrigger>
          </TabsList>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="space-y-6">
            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-gray/40 w-5 h-5" />
                  <Input
                    placeholder="Search NFTs by name, description, or attributes..."
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
                <Select value={filters.rarity} onValueChange={(value) => setFilters(prev => ({ ...prev, rarity: value }))}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Rarity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rarity</SelectItem>
                    <SelectItem value="legendary">Legendary</SelectItem>
                    <SelectItem value="epic">Epic</SelectItem>
                    <SelectItem value="rare">Rare</SelectItem>
                    <SelectItem value="uncommon">Uncommon</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="achievement">Achievement</SelectItem>
                    <SelectItem value="environmental">Environmental</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* NFT Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNFTs.map((nft) => {
                const rarityConfig = getRarityConfig(nft.rarity);
                const RarityIcon = rarityConfig.icon;

                return (
                  <Card key={nft.id} className="shadow-level2 border-0 overflow-hidden hover:shadow-level3 transition-all duration-300 group cursor-pointer">
                    <div className={`relative h-48 bg-gradient-to-br ${nft.gradient} flex items-center justify-center`}>
                      <div className="absolute inset-0 bg-black/20"></div>
                      <div className="relative z-10 text-center">
                        <nft.icon className="w-16 h-16 text-white mx-auto mb-2" />
                        <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${rarityConfig.color}`}>
                          <RarityIcon className="w-3 h-3" />
                          <span>{nft.rarity}</span>
                        </div>
                      </div>

                      {/* Overlay Actions */}
                      <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="secondary" size="sm" className="w-8 h-8 p-0 bg-white/90 hover:bg-white">
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button variant="secondary" size="sm" className="w-8 h-8 p-0 bg-white/90 hover:bg-white">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <CardContent className="p-6">
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-slate-gray mb-2 group-hover:text-agri-green transition-colors">
                          {nft.name}
                        </h3>
                        <p className="text-sm text-slate-gray/70 line-clamp-2">
                          {nft.description}
                        </p>
                      </div>

                      {/* Attributes */}
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {Object.entries(nft.attributes).slice(0, 2).map(([key, value]) => (
                          <div key={key} className="text-center p-2 bg-slate-gray/5 rounded">
                            <p className="text-xs text-slate-gray/60 capitalize">{key}</p>
                            <p className="text-sm font-medium text-slate-gray">{String(value)}</p>
                          </div>
                        ))}
                      </div>

                      {/* Stats */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-gray/70">Farming Reward</span>
                          <span className="font-semibold text-agri-green">+{nft.farmingReward} AGRI/day</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-gray/70">Floor Price</span>
                          <span className="font-semibold">{nft.floorPrice} {nft.currency}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-gray/70">24h Volume</span>
                          <span className="font-semibold text-sky-teal">{nft.volume24h} {nft.currency}</span>
                        </div>
                      </div>

                      {/* Benefits Preview */}
                      <div className="mb-4">
                        <p className="text-xs font-medium text-slate-gray mb-2">Benefits:</p>
                        <div className="flex flex-wrap gap-1">
                          {nft.benefits.slice(0, 2).map((benefit, index) => (
                            <Badge key={index} variant="outline" className="text-xs border-slate-gray/20">
                              {benefit.split(' ')[0]}...
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <Button
                          className="flex-1 btn-primary"
                          onClick={() => setSelectedNFT(nft)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button variant="outline" className="flex-1 border-slate-gray/20 hover:border-harvest-gold hover:text-harvest-gold">
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Buy Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredNFTs.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-slate-gray/40 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-gray mb-2">No NFTs found</h3>
                <p className="text-slate-gray/70 mb-6">
                  Try adjusting your search criteria or filters.
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery('');
                  setFilters({ rarity: 'all', type: 'all', priceRange: 'all' });
                }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Collection Tab */}
          <TabsContent value="collection" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userCollection.map((item) => {
                const nft = nftCollections.find(n => n.id === item.nftId);
                if (!nft) return null;

                const rarityConfig = getRarityConfig(item.rarity);
                const RarityIcon = rarityConfig.icon;

                return (
                  <Card key={item.id} className="shadow-level2 border-0 overflow-hidden">
                    <div className={`relative h-48 bg-gradient-to-br ${nft.gradient} flex items-center justify-center`}>
                      <div className="absolute inset-0 bg-black/20"></div>
                      <div className="relative z-10 text-center">
                        <nft.icon className="w-16 h-16 text-white mx-auto mb-2" />
                        <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${rarityConfig.color}`}>
                          <RarityIcon className="w-3 h-3" />
                          <span>{item.rarity}</span>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-gray">{item.name}</h3>
                          <p className="text-sm text-slate-gray/60">Owned • #{item.id}</p>
                        </div>
                        <Badge className={item.farmingStatus === 'active' ? 'bg-sky-teal/10 text-sky-teal' : 'bg-slate-gray/10 text-slate-gray'}>
                          {item.farmingStatus === 'active' ? 'Farming' : 'Idle'}
                        </Badge>
                      </div>

                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-gray/70">Daily Reward</span>
                          <span className="font-semibold text-agri-green">+{item.dailyReward} AGRI</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-gray/70">Total Earned</span>
                          <span className="font-semibold text-harvest-gold">{item.totalEarned.toLocaleString()} AGRI</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-gray/70">Last Claimed</span>
                          <span className="text-sm">{new Date(item.lastClaimed).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          className="flex-1 border-slate-gray/20 hover:border-agri-green hover:text-agri-green"
                          disabled={item.farmingStatus === 'active'}
                        >
                          {item.farmingStatus === 'active' ? 'Farming Active' : 'Start Farming'}
                        </Button>
                        <Button variant="outline" className="flex-1 border-slate-gray/20 hover:border-harvest-gold hover:text-harvest-gold">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View on Explorer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Farming Tab */}
          <TabsContent value="farming" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Farming Overview */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="shadow-level2 border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center text-slate-gray">
                      <Coins className="w-5 h-5 mr-2 text-agri-green" />
                      Farming Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-agri-green/5 rounded-lg">
                        <p className="text-2xl font-black text-agri-green">{totalDailyRewards}</p>
                        <p className="text-sm text-slate-gray/60">Daily Rewards</p>
                      </div>
                      <div className="text-center p-4 bg-harvest-gold/5 rounded-lg">
                        <p className="text-2xl font-black text-harvest-gold">
                          {userCollection.filter(n => n.farmingStatus === 'active').length}
                        </p>
                        <p className="text-sm text-slate-gray/60">Active NFTs</p>
                      </div>
                      <div className="text-center p-4 bg-sky-teal/5 rounded-lg">
                        <p className="text-2xl font-black text-sky-teal">
                          {userCollection.reduce((sum, n) => sum + n.totalEarned, 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-slate-gray/60">Total Earned</p>
                      </div>
                      <div className="text-center p-4 bg-purple-500/5 rounded-lg">
                        <p className="text-2xl font-black text-purple-600">
                          {userCollection.length}
                        </p>
                        <p className="text-sm text-slate-gray/60">Owned NFTs</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {userCollection.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-slate-gray/5 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${nftCollections.find(n => n.id === item.nftId)?.gradient} flex items-center justify-center`}>
                              {React.createElement(nftCollections.find(n => n.id === item.nftId)?.icon || Award, { className: "w-6 h-6 text-white" })}
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-gray">{item.name}</h4>
                              <p className="text-sm text-slate-gray/60">
                                {item.farmingStatus === 'active' ? 'Farming Active' : 'Farming Paused'} • +{item.dailyReward} AGRI/day
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-agri-green">{item.totalEarned.toLocaleString()} AGRI</p>
                            <p className="text-xs text-slate-gray/60">Total Earned</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Claim Rewards */}
              <div className="space-y-6">
                <Card className="shadow-level2 border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center text-slate-gray">
                      <Award className="w-5 h-5 mr-2 text-harvest-gold" />
                      Claim Rewards
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-black text-agri-green mb-1">1,250 AGRI</p>
                      <p className="text-sm text-slate-gray/60">Available to Claim</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-gray/70">Pending Rewards</span>
                        <span className="font-medium text-agri-green">1,250 AGRI</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-gray/70">Next Claim</span>
                        <span className="font-medium">Available Now</span>
                      </div>
                    </div>

                    <Button className="w-full btn-primary">
                      <Award className="w-4 h-4 mr-2" />
                      Claim All Rewards
                    </Button>

                    <p className="text-xs text-slate-gray/60 text-center">
                      Rewards are automatically compounded for maximum yield
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-level1 border-0">
                  <CardHeader>
                    <CardTitle className="text-slate-gray">Farming Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm text-slate-gray/70">
                      <div className="flex items-start space-x-2">
                        <Info className="w-4 h-4 text-agri-green mt-0.5 flex-shrink-0" />
                        <p>Keep NFTs farming to maximize rewards</p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <TrendingUp className="w-4 h-4 text-harvest-gold mt-0.5 flex-shrink-0" />
                        <p>Rare NFTs provide higher farming yields</p>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Shield className="w-4 h-4 text-sky-teal mt-0.5 flex-shrink-0" />
                        <p>Claim rewards regularly to avoid overflow</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}