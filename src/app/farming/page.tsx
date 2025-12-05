'use client';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

export default function FarmingPage() {
  const { t } = useTranslation();

  // Mock farming pools
  const pools = [
    {
      id: 1,
      name: 'AgriToken Pool',
      token: 'AGRI',
      apr: 12.5,
      staked: 50000,
      rewards: 6250,
      lockPeriod: '30 days',
      risk: 'Low',
    },
    {
      id: 2,
      name: 'Carbon Credit Pool',
      token: 'CARBON',
      apr: 18.2,
      staked: 25000,
      rewards: 4550,
      lockPeriod: '60 days',
      risk: 'Medium',
    },
    {
      id: 3,
      name: 'Yield Aggregator Pool',
      token: 'YIELD',
      apr: 25.8,
      staked: 10000,
      rewards: 2580,
      lockPeriod: '90 days',
      risk: 'High',
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-gray">
            {t('navigation.farming')}
          </h1>
          <Button>
            Stake Tokens
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {pools.map((pool) => (
            <Card key={pool.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{pool.name}</CardTitle>
                    <CardDescription>{pool.token} Token</CardDescription>
                  </div>
                  <Badge variant="outline">{pool.risk} Risk</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">APR:</span>
                    <span className="font-bold text-agri-green">{pool.apr}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Staked:</span>
                    <span className="font-medium">{pool.staked.toLocaleString()} {pool.token}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Rewards:</span>
                    <span className="font-medium">{pool.rewards.toLocaleString()} {pool.token}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Lock Period:</span>
                    <span className="font-medium">{pool.lockPeriod}</span>
                  </div>
                </div>
                <Button className="w-full mt-4">
                  Stake in Pool
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Your Farming Positions</CardTitle>
              <CardDescription>
                Track your staked tokens and earned rewards.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <div className="font-medium">AgriToken Pool</div>
                    <div className="text-sm text-muted-foreground">Staked: 1,000 AGRI</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-agri-green">+125 AGRI</div>
                    <div className="text-sm text-muted-foreground">Rewards</div>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <div className="font-medium">Carbon Credit Pool</div>
                    <div className="text-sm text-muted-foreground">Staked: 500 CARBON</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-agri-green">+91 CARBON</div>
                    <div className="text-sm text-muted-foreground">Rewards</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Farming Statistics</CardTitle>
              <CardDescription>
                Overall platform farming metrics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-agri-green">$2.5M</div>
                  <div className="text-sm text-muted-foreground">Total Value Locked</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-agri-green">15.8%</div>
                  <div className="text-sm text-muted-foreground">Average APR</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-agri-green">1,250</div>
                  <div className="text-sm text-muted-foreground">Active Farmers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-agri-green">$45K</div>
                  <div className="text-sm text-muted-foreground">Daily Rewards</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}