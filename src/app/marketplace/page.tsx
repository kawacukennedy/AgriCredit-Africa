'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

interface Loan {
  id: string;
  farmer: string;
  amount: number;
  interest: number;
  term: number;
  score: number;
  location: string;
  crop: string;
}

export default function MarketplacePage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all');

  // Mock data
  const loans: Loan[] = [
    {
      id: '1',
      farmer: 'John Doe',
      amount: 1000,
      interest: 12,
      term: 12,
      score: 750,
      location: 'Kenya',
      crop: 'Maize',
    },
    {
      id: '2',
      farmer: 'Jane Smith',
      amount: 1500,
      interest: 10,
      term: 18,
      score: 800,
      location: 'Ghana',
      crop: 'Cassava',
    },
  ];

  const filteredLoans = filter === 'all' ? loans : loans.filter(loan => loan.location === filter);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('navigation.marketplace')}</h1>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex space-x-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'Kenya' ? 'default' : 'outline'}
              onClick={() => setFilter('Kenya')}
            >
              Kenya
            </Button>
            <Button
              variant={filter === 'Ghana' ? 'default' : 'outline'}
              onClick={() => setFilter('Ghana')}
            >
              Ghana
            </Button>
          </div>
        </div>

        {/* Loan Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLoans.map((loan) => (
            <Card key={loan.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">${loan.amount}</CardTitle>
                  <Badge variant="secondary">{loan.score}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Farmer: {loan.farmer}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Location: {loan.location}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Crop: {loan.crop}
                  </p>
                  <div className="flex justify-between text-sm">
                    <span>{loan.interest}% APR</span>
                    <span>{loan.term} months</span>
                  </div>
                </div>
                <Button className="w-full mt-4" size="sm">
                  Fund Loan
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}