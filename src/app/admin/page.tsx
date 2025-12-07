'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { useGetLoansQuery } from '@/store/apiSlice';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { data: loans, isLoading } = useGetLoansQuery({});

  const stats = {
    totalLoans: loans?.length || 1250,
    activeLoans: loans?.filter((l: any) => l.status === 'funded' || l.status === 'active').length || 890,
    totalVolume: 2500000,
    defaultRate: 2.3,
  };

  const handleOracleUpdate = () => {
    // Implement oracle update logic
    console.log('Triggering oracle update...');
  };

  const handleDisputeResolution = (loanId: string) => {
    // Implement dispute resolution logic
    console.log('Resolving dispute for loan:', loanId);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="loans">Loan Management</TabsTrigger>
            <TabsTrigger value="oracle">Oracle Control</TabsTrigger>
            <TabsTrigger value="disputes">Dispute Resolution</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Total Loans</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalLoans}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Active Loans</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeLoans}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Volume</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.totalVolume.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Default Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.defaultRate}%</div>
                </CardContent>
              </Card>
            </div>

            {/* System Health */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>API Status</span>
                      <Badge className="bg-success">Healthy</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Blockchain</span>
                      <Badge className="bg-success">Synced</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>AI Models</span>
                      <Badge className="bg-success">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>• 15 new loan applications</div>
                    <div>• 8 loans funded</div>
                    <div>• 3 repayments processed</div>
                    <div>• 2 carbon credits minted</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="destructive" className="text-xs">High</Badge>
                      <span className="text-sm">Oracle latency spike</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">Medium</Badge>
                      <span className="text-sm">Pending KYC reviews</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="loans">
            <Card>
              <CardHeader>
                <CardTitle>Loan Management</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 border rounded-lg animate-pulse">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {loans && loans.slice(0, 10).map((loan: any) => (
                      <div key={loan.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-semibold">Loan #{loan.id}</p>
                          <p className="text-sm text-muted-foreground">
                            ${loan.principal_cents ? loan.principal_cents / 100 : loan.amount || 0} •
                            Status: {loan.status} •
                            Score: {loan.ai_score || 'N/A'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={loan.status === 'funded' ? 'default' : 'secondary'}>
                            {loan.status}
                          </Badge>
                          <Button size="sm" variant="outline">
                            Review
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="oracle">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Oracle Console</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Oracle Health</span>
                      <Badge className="bg-success">Healthy</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Last Update</span>
                      <span className="text-sm text-muted-foreground">2 minutes ago</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pending Updates</span>
                      <span className="text-sm text-muted-foreground">3</span>
                    </div>
                    <Button className="w-full" onClick={handleOracleUpdate}>
                      Trigger Oracle Update
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Feeds</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Satellite NDVI</span>
                      <Badge className="bg-success">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Weather Data</span>
                      <Badge className="bg-success">Active</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Market Prices</span>
                      <Badge className="bg-warning">Delayed</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>IoT Sensors</span>
                      <Badge className="bg-success">Active</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="disputes">
            <Card>
              <CardHeader>
                <CardTitle>Dispute Resolution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">Loan Repayment Dispute #1234</h4>
                        <p className="text-sm text-muted-foreground">
                          Farmer claims payment was made but not recorded
                        </p>
                      </div>
                      <Badge variant="destructive">Urgent</Badge>
                    </div>
                    <div className="flex space-x-2 mt-3">
                      <Button size="sm" variant="outline" onClick={() => handleDisputeResolution('1234')}>
                        Review Evidence
                      </Button>
                      <Button size="sm">Resolve</Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">Carbon Credit Verification #5678</h4>
                        <p className="text-sm text-muted-foreground">
                          Discrepancy in satellite data verification
                        </p>
                      </div>
                      <Badge variant="secondary">Medium</Badge>
                    </div>
                    <div className="flex space-x-2 mt-3">
                      <Button size="sm" variant="outline">
                        Review Evidence
                      </Button>
                      <Button size="sm">Resolve</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}