'use client';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
  const { t } = useTranslation();

  // Mock data
  const stats = {
    totalLoans: 1250,
    activeLoans: 890,
    totalVolume: 2500000,
    defaultRate: 2.3,
  };

  const recentLoans = [
    { id: '1', farmer: 'John Doe', amount: 1000, status: 'pending', score: 750 },
    { id: '2', farmer: 'Jane Smith', amount: 1500, status: 'funded', score: 800 },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

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

        {/* Oracle Console */}
        <div className="grid lg:grid-cols-2 gap-8">
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
                <Button className="w-full">
                  Trigger Oracle Update
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loan Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Loans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentLoans.map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-semibold">{loan.farmer}</p>
                      <p className="text-sm text-muted-foreground">${loan.amount} • Score: {loan.score}</p>
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
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}