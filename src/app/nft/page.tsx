'use client';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

export default function NFTPage() {
  const { t } = useTranslation();

  // Mock NFT collections
  const collections = [
    {
      id: 1,
      name: 'Golden Harvest NFT',
      description: 'Exclusive NFT for top yield farmers',
      rarity: 'Legendary',
      farmingReward: '500 AGRI/day',
      price: '2.5 ETH',
      owned: 1,
      total: 100,
    },
    {
      id: 2,
      name: 'Carbon Guardian',
      description: 'NFT for carbon sequestration champions',
      rarity: 'Epic',
      farmingReward: '300 AGRI/day',
      price: '1.8 ETH',
      owned: 0,
      total: 500,
    },
    {
      id: 3,
      name: 'Loan Master',
      description: 'NFT for successful loan repayments',
      rarity: 'Rare',
      farmingReward: '150 AGRI/day',
      price: '0.9 ETH',
      owned: 2,
      total: 1000,
    },
    {
      id: 4,
      name: 'Community Farmer',
      description: 'Basic NFT for active community members',
      rarity: 'Common',
      farmingReward: '50 AGRI/day',
      price: '0.3 ETH',
      owned: 5,
      total: 5000,
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-gray">
            {t('navigation.nft')}
          </h1>
          <Button>
            Mint NFT
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {collections.map((nft) => (
            <Card key={nft.id}>
              <CardHeader>
                <div className="aspect-square bg-gradient-to-br from-agri-green to-agri-blue rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">NFT</span>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{nft.name}</CardTitle>
                    <CardDescription>{nft.description}</CardDescription>
                  </div>
                  <Badge variant={
                    nft.rarity === 'Legendary' ? 'default' :
                    nft.rarity === 'Epic' ? 'secondary' :
                    nft.rarity === 'Rare' ? 'outline' :
                    'outline'
                  }>
                    {nft.rarity}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Reward:</span>
                    <span className="font-medium">{nft.farmingReward}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Price:</span>
                    <span className="font-medium">{nft.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Owned:</span>
                    <span className="font-medium">{nft.owned}/{nft.total}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" className="flex-1">
                    Buy
                  </Button>
                  {nft.owned > 0 && (
                    <Button size="sm" variant="outline" className="flex-1">
                      Farm
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Your NFT Collection</CardTitle>
              <CardDescription>
                NFTs you own and their farming status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-agri-green rounded flex items-center justify-center">
                      <span className="text-white font-bold">G</span>
                    </div>
                    <div>
                      <div className="font-medium">Golden Harvest NFT</div>
                      <div className="text-sm text-muted-foreground">Farming: 500 AGRI/day</div>
                    </div>
                  </div>
                  <Badge>Farming</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-agri-blue rounded flex items-center justify-center">
                      <span className="text-white font-bold">L</span>
                    </div>
                    <div>
                      <div className="font-medium">Loan Master NFT</div>
                      <div className="text-sm text-muted-foreground">Farming: 150 AGRI/day</div>
                    </div>
                  </div>
                  <Badge variant="secondary">Idle</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Farming Rewards</CardTitle>
              <CardDescription>
                Your daily and total farming earnings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-agri-green">650 AGRI</div>
                  <div className="text-sm text-muted-foreground">Daily Earnings</div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Golden Harvest:</span>
                    <span className="font-medium">500 AGRI</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loan Master:</span>
                    <span className="font-medium">150 AGRI</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Total:</span>
                    <span className="font-bold">650 AGRI</span>
                  </div>
                </div>
                <Button className="w-full">
                  Claim Rewards
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}