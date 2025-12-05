'use client';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

export default function CarbonPage() {
  const { t } = useTranslation();

  // Mock carbon credit listings
  const listings = [
    {
      id: 1,
      seller: 'Green Farms Ltd',
      amount: 1000,
      price: 25.50,
      type: 'Voluntary Carbon Credit',
      location: 'Kenya',
      verified: true,
    },
    {
      id: 2,
      seller: 'Sustainable Agri Co',
      amount: 500,
      price: 28.00,
      type: 'Nature-based Credit',
      location: 'Tanzania',
      verified: true,
    },
    {
      id: 3,
      seller: 'Eco Farmers Union',
      amount: 750,
      price: 22.75,
      type: 'Agricultural Carbon Credit',
      location: 'Uganda',
      verified: false,
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-gray">
            {t('navigation.carbon')}
          </h1>
          <Button>
            List Carbon Credits
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <Card key={listing.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{listing.seller}</CardTitle>
                    <CardDescription>{listing.type}</CardDescription>
                  </div>
                  <Badge variant={listing.verified ? 'default' : 'secondary'}>
                    {listing.verified ? 'Verified' : 'Pending'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Amount:</span>
                    <span className="font-medium">{listing.amount} tCO2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Price:</span>
                    <span className="font-medium">${listing.price}/tCO2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Location:</span>
                    <span className="font-medium">{listing.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total:</span>
                    <span className="font-bold">${(listing.amount * listing.price).toFixed(2)}</span>
                  </div>
                </div>
                <Button className="w-full mt-4">
                  Buy Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Your Carbon Portfolio</CardTitle>
              <CardDescription>
                Track your carbon credits and trading history.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-agri-green">250</div>
                  <div className="text-sm text-muted-foreground">Credits Owned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-agri-green">$6,250</div>
                  <div className="text-sm text-muted-foreground">Value</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-agri-green">15</div>
                  <div className="text-sm text-muted-foreground">Trades</div>
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