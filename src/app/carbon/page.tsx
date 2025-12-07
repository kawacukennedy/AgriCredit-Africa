'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { useGetCarbonCreditsQuery, useGetClimateAnalysisMutation } from '@/store/apiSlice';

export default function CarbonPage() {
  const { t } = useTranslation();
  const [generateCredits, { isLoading: generating }] = useGetClimateAnalysisMutation();
  const { data: carbonCredits, isLoading } = useGetCarbonCreditsQuery({});

  // Mock marketplace listings - in real app, this would come from API
  const marketplaceListings = [
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

  const handleGenerateCredits = async () => {
    try {
      // Mock satellite and IoT data
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
      // Refresh data or show success message
    } catch (error) {
      console.error('Failed to generate carbon credits:', error);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-gray">
            {t('navigation.carbon')}
          </h1>
          <div className="space-x-2">
            <Button onClick={handleGenerateCredits} disabled={generating}>
              {generating ? 'Generating...' : 'Generate Credits'}
            </Button>
            <Button variant="outline">
              List for Sale
            </Button>
          </div>
        </div>

        <Tabs defaultValue="portfolio" className="space-y-6">
          <TabsList>
            <TabsTrigger value="portfolio">My Portfolio</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Carbon Credits Balance</CardTitle>
                  <CardDescription>
                    Your verified carbon credits available for trading or retirement.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-8 bg-muted rounded w-1/3"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-3xl font-bold text-agri-green">
                        {carbonCredits?.length || 0} tCO2
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Total verified carbon credits
                      </p>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                          <div className="text-lg font-semibold">0</div>
                          <div className="text-sm text-muted-foreground">Retired</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold">0</div>
                          <div className="text-sm text-muted-foreground">Traded</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Your carbon credit transactions and generations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="font-medium">Credits Generated</p>
                        <p className="text-sm text-muted-foreground">From sustainable farming</p>
                      </div>
                      <Badge variant="secondary">+50 tCO2</Badge>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <div>
                        <p className="font-medium">Credits Sold</p>
                        <p className="text-sm text-muted-foreground">To Green Corp</p>
                      </div>
                      <Badge variant="outline">-25 tCO2</Badge>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium">Credits Retired</p>
                        <p className="text-sm text-muted-foreground">For climate impact</p>
                      </div>
                      <Badge variant="outline">-10 tCO2</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="marketplace">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketplaceListings.map((listing) => (
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
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Carbon Sequestration</CardTitle>
                  <CardDescription>
                    Monthly carbon sequestration from your farming activities.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted rounded">
                    <p className="text-muted-foreground">Carbon sequestration chart would go here</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Market Trends</CardTitle>
                  <CardDescription>
                    Carbon credit price trends and market analysis.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Current Average Price</span>
                      <span className="font-bold">$25.42/tCO2</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>30-Day Change</span>
                      <span className="font-bold text-success">+2.3%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Trading Volume</span>
                      <span className="font-bold">1,250 tCO2</span>
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