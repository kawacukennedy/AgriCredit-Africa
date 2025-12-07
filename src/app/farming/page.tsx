'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Shield,
  Zap,
  BarChart3,
  Plus,
  Minus,
  Wallet,
  Award,
  Target,
  Users,
  Coins,
  Lock,
  Unlock,
  Info,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export default function FarmingPage() {
  const { t } = useTranslation();
  const [selectedPool, setSelectedPool] = useState<any>(null);
  const [stakeAmount, setStakeAmount] = useState('');

  // Mock comprehensive farming data
  const farmingStats = {
    totalValueLocked: 2500000,
    averageApr: 15.8,
    activeFarmers: 1250,
    dailyRewards: 45000,
    totalStaked: 1850000,
    rewardsDistributed: 125000
  };

  const farmingPools = [
    {
      id: 1,
      name: 'AgriToken Single Stake',
      token: 'AGRI',
      type: 'Single Asset',
      apr: 12.5,
      totalStaked: 500000,
      userStaked: 1500,
      rewards: 187.5,
      lockPeriod: 30,
      risk: 'Low',
      description: 'Stake AGRI tokens to earn rewards from protocol fees and trading pairs.',
      features: ['Auto-compounding', 'Flexible withdrawal', 'Low risk'],
      color: 'from-green-500 to-emerald-500',
      icon: Coins
    },
    {
      id: 2,
      name: 'Carbon Credit Pool',
      token: 'CARBT',
      type: 'Environmental',
      apr: 18.2,
      totalStaked: 250000,
      userStaked: 800,
      rewards: 145.6,
      lockPeriod: 60,
      risk: 'Medium',
      description: 'Stake carbon credits and earn additional tokens from environmental impact rewards.',
      features: ['Carbon sequestration', 'ESG rewards', 'Medium risk'],
      color: 'from-blue-500 to-cyan-500',
      icon: Shield
    },
    {
      id: 3,
      name: 'Yield Aggregator Pool',
      token: 'YIELD',
      type: 'Multi-Asset',
      apr: 25.8,
      totalStaked: 100000,
      userStaked: 250,
      rewards: 64.5,
      lockPeriod: 90,
      risk: 'High',
      description: 'Advanced yield farming with automated strategy optimization across multiple protocols.',
      features: ['Auto-rebalancing', 'High yield', 'Higher risk'],
      color: 'from-purple-500 to-pink-500',
      icon: Zap
    },
    {
      id: 4,
      name: 'Liquidity Mining Pool',
      token: 'AGRI-CUSD',
      type: 'Liquidity Pool',
      apr: 22.3,
      totalStaked: 750000,
      userStaked: 2000,
      rewards: 446,
      lockPeriod: 0,
      risk: 'Medium',
      description: 'Provide liquidity to the AGRI/cUSD trading pair and earn trading fees plus rewards.',
      features: ['Trading fees', 'Impermanent loss protection', 'Flexible staking'],
      color: 'from-amber-500 to-orange-500',
      icon: BarChart3
    }
  ];

  const userPositions = [
    {
      poolId: 1,
      poolName: 'AgriToken Single Stake',
      stakedAmount: 1500,
      token: 'AGRI',
      rewardsEarned: 187.5,
      apr: 12.5,
      lockEndDate: null,
      status: 'active'
    },
    {
      poolId: 2,
      poolName: 'Carbon Credit Pool',
      stakedAmount: 800,
      token: 'CARBT',
      rewardsEarned: 145.6,
      apr: 18.2,
      lockEndDate: '2024-02-15',
      status: 'locked'
    }
  ];

  const getRiskBadgeColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'bg-sky-teal/10 text-sky-teal border-sky-teal/20';
      case 'medium': return 'bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20';
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-gray/10 text-slate-gray border-slate-gray/20';
    }
  };

  const handleStake = (poolId: number) => {
    // Handle staking logic
    console.log('Staking', stakeAmount, 'in pool', poolId);
  };

  const handleUnstake = (poolId: number) => {
    // Handle unstaking logic
    console.log('Unstaking from pool', poolId);
  };

  const handleClaimRewards = (poolId: number) => {
    // Handle claiming rewards
    console.log('Claiming rewards from pool', poolId);
  };

  return (
    <div className="min-h-screen bg-paper-white">

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-agri-green to-sky-teal text-white py-12">
        <div className="container">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              Yield Farming
            </h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Stake your tokens and earn rewards through sustainable agricultural finance protocols
            </p>
          </div>
        </div>
      </section>

      <div className="container py-8">
        {/* Platform Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray">${farmingStats.totalValueLocked.toLocaleString()}</p>
                  <p className="text-sm text-slate-gray/60">Total Value Locked</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray">{farmingStats.averageApr}%</p>
                  <p className="text-sm text-slate-gray/60">Average APR</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray">{farmingStats.activeFarmers.toLocaleString()}</p>
                  <p className="text-sm text-slate-gray/60">Active Farmers</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-level1 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-gray">${farmingStats.dailyRewards.toLocaleString()}</p>
                  <p className="text-sm text-slate-gray/60">Daily Rewards</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pools" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pools" className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Farming Pools</span>
            </TabsTrigger>
            <TabsTrigger value="positions" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>My Positions</span>
            </TabsTrigger>
            <TabsTrigger value="calculator" className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>Rewards Calculator</span>
            </TabsTrigger>
          </TabsList>

          {/* Farming Pools Tab */}
          <TabsContent value="pools" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {farmingPools.map((pool) => {
                const PoolIcon = pool.icon;
                return (
                  <Card key={pool.id} className="shadow-level2 border-0 overflow-hidden hover:shadow-level3 transition-all duration-300 group">
                    <div className={`h-1 bg-gradient-to-r ${pool.color}`}></div>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 bg-gradient-to-r ${pool.color} rounded-xl flex items-center justify-center`}>
                            <PoolIcon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-slate-gray group-hover:text-agri-green transition-colors">
                              {pool.name}
                            </h3>
                            <p className="text-sm text-slate-gray/60">{pool.type} • {pool.token}</p>
                          </div>
                        </div>
                        <Badge className={getRiskBadgeColor(pool.risk)}>
                          {pool.risk} Risk
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-3 bg-slate-gray/5 rounded-lg">
                          <p className="text-2xl font-black text-agri-green">{pool.apr}%</p>
                          <p className="text-xs text-slate-gray/60">APR</p>
                        </div>
                        <div className="text-center p-3 bg-slate-gray/5 rounded-lg">
                          <p className="text-lg font-bold text-slate-gray">{pool.totalStaked.toLocaleString()}</p>
                          <p className="text-xs text-slate-gray/60">Total Staked</p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-gray/70">Lock Period</span>
                          <span className="font-medium">
                            {pool.lockPeriod === 0 ? 'Flexible' : `${pool.lockPeriod} days`}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-gray/70">Your Stake</span>
                          <span className="font-medium text-agri-green">
                            {pool.userStaked.toLocaleString()} {pool.token}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-gray/70">Pending Rewards</span>
                          <span className="font-medium text-harvest-gold">
                            +{pool.rewards.toFixed(1)} {pool.token}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-slate-gray/70 mb-4 line-clamp-2">
                        {pool.description}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {pool.features.map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs border-slate-gray/20">
                            {feature}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          className="flex-1 btn-primary"
                          onClick={() => setSelectedPool(pool)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Stake
                        </Button>
                        {pool.userStaked > 0 && (
                          <Button variant="outline" className="flex-1 border-slate-gray/20 hover:border-red-500 hover:text-red-500">
                            <Minus className="w-4 h-4 mr-2" />
                            Unstake
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* My Positions Tab */}
          <TabsContent value="positions" className="space-y-6">
            <div className="space-y-4">
              {userPositions.map((position) => (
                <Card key={position.poolId} className="shadow-level2 border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-gray">{position.poolName}</h3>
                        <p className="text-sm text-slate-gray/60">
                          Staked: {position.stakedAmount.toLocaleString()} {position.token}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={position.status === 'active' ? 'bg-sky-teal/10 text-sky-teal' : 'bg-amber-500/10 text-amber-600'}>
                          {position.status === 'active' ? 'Active' : 'Locked'}
                        </Badge>
                        {position.lockEndDate && (
                          <p className="text-xs text-slate-gray/60 mt-1">
                            Unlocks: {position.lockEndDate}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-slate-gray/5 rounded-lg">
                        <p className="text-lg font-bold text-agri-green">{position.apr}%</p>
                        <p className="text-xs text-slate-gray/60">APR</p>
                      </div>
                      <div className="text-center p-3 bg-slate-gray/5 rounded-lg">
                        <p className="text-lg font-bold text-harvest-gold">+{position.rewardsEarned.toFixed(1)}</p>
                        <p className="text-xs text-slate-gray/60">Rewards</p>
                      </div>
                      <div className="text-center p-3 bg-slate-gray/5 rounded-lg">
                        <p className="text-lg font-bold text-slate-gray">
                          ${(position.stakedAmount * 1.25).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-gray/60">Value</p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-slate-gray/20 hover:border-agri-green hover:text-agri-green"
                        onClick={() => handleClaimRewards(position.poolId)}
                      >
                        <Award className="w-4 h-4 mr-2" />
                        Claim Rewards
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-slate-gray/20 hover:border-red-500 hover:text-red-500"
                        onClick={() => handleUnstake(position.poolId)}
                        disabled={position.status === 'locked'}
                      >
                        {position.status === 'locked' ? (
                          <Lock className="w-4 h-4 mr-2" />
                        ) : (
                          <Unlock className="w-4 h-4 mr-2" />
                        )}
                        {position.status === 'locked' ? 'Locked' : 'Unstake'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {userPositions.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-gray/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-slate-gray/40" />
                </div>
                <h3 className="text-xl font-semibold text-slate-gray mb-2">No Active Positions</h3>
                <p className="text-slate-gray/70 mb-6">
                  Start farming by staking tokens in one of our yield pools above.
                </p>
                <Button className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Start Farming
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Rewards Calculator Tab */}
          <TabsContent value="calculator" className="space-y-6">
            <Card className="shadow-level2 border-0">
              <CardHeader>
                <CardTitle className="flex items-center text-slate-gray">
                  <DollarSign className="w-5 h-5 mr-2 text-agri-green" />
                  Rewards Calculator
                </CardTitle>
                <CardDescription>
                  Calculate potential rewards based on your stake amount and selected pool
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-gray">Select Pool</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a farming pool" />
                        </SelectTrigger>
                        <SelectContent>
                          {farmingPools.map((pool) => (
                            <SelectItem key={pool.id} value={pool.id.toString()}>
                              {pool.name} - {pool.apr}% APR
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-slate-gray">Stake Amount</Label>
                      <Input
                        type="number"
                        placeholder="Enter amount to stake"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-slate-gray">Staking Period</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="60">60 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                          <SelectItem value="365">1 year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-agri-green/5 border border-agri-green/20 rounded-lg">
                      <h4 className="font-semibold text-agri-green mb-2">Estimated Rewards</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Daily Rewards:</span>
                          <span className="font-medium">$12.50</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Monthly Rewards:</span>
                          <span className="font-medium">$375.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Yearly Rewards:</span>
                          <span className="font-medium">$4,500.00</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h5 className="font-medium text-blue-800 mb-1">Calculation Notes</h5>
                          <p className="text-sm text-blue-700">
                            Estimates are based on current APR and don't include compounding effects or fee changes.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}