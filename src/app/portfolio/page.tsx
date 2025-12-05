'use client';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

export default function PortfolioPage() {
  const { t } = useTranslation();

  // Mock data
  const portfolio = {
    totalValue: 25000,
    totalReturn: 3200,
    activeLoans: 8,
    loans: [
      {
        id: '1',
        farmer: 'John Doe',
        amount: 1000,
        currentValue: 1100,
        return: 100,
        status: 'active',
      },
      {
        id: '2',
        farmer: 'Jane Smith',
        amount: 1500,
        currentValue: 1650,
        return: 150,
        status: 'active',
      },
    ],
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Investor Portfolio</h1>

        {/* Portfolio Summary */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${portfolio.totalValue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Return</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">+${portfolio.totalReturn.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active Loans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{portfolio.activeLoans}</div>
            </CardContent>
          </Card>
        </div>

        {/* Loan NFTs */}
        <Card>
          <CardHeader>
            <CardTitle>Loan NFTs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {portfolio.loans.map((loan) => (
                <div key={loan.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{loan.farmer}</h3>
                    <Badge variant="secondary">{loan.status}</Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p>Invested: ${loan.amount}</p>
                    <p>Current Value: ${loan.currentValue}</p>
                    <p className="text-success">Return: +${loan.return}</p>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                    <Button size="sm" variant="outline">
                      Sell NFT
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}