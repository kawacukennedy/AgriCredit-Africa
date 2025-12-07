'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { useGetMarketplaceListingsQuery, useFundLoanMutation } from '@/store/apiSlice';
import Link from 'next/link';

export default function MarketplacePage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all');
  const [fundLoan, { isLoading: isFunding }] = useFundLoanMutation();

  const { data: listings, isLoading, error } = useGetMarketplaceListingsQuery({
    crop_type: filter !== 'all' ? filter : undefined,
  });

  const handleFundLoan = async (loanId: string) => {
    try {
      await fundLoan({
        id: loanId,
        amount_cents: 100000, // Example amount
      }).unwrap();
      // Refresh data or show success message
    } catch (error) {
      console.error('Failed to fund loan:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">{t('navigation.marketplace')}</h1>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">{t('navigation.marketplace')}</h1>
          <p className="text-error">Failed to load marketplace listings. Please try again.</p>
        </div>
        <Footer />
      </div>
    );
  }

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
              variant={filter === 'maize' ? 'default' : 'outline'}
              onClick={() => setFilter('maize')}
            >
              Maize
            </Button>
            <Button
              variant={filter === 'cassava' ? 'default' : 'outline'}
              onClick={() => setFilter('cassava')}
            >
              Cassava
            </Button>
            <Button
              variant={filter === 'rice' ? 'default' : 'outline'}
              onClick={() => setFilter('rice')}
            >
              Rice
            </Button>
          </div>
        </div>

        {/* Loan Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings && listings.data && listings.data.length > 0 ? (
            listings.data.map((loan: any) => (
              <Card key={loan.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      ${loan.principal_cents ? loan.principal_cents / 100 : loan.amount || 0}
                    </CardTitle>
                    <Badge variant="secondary">
                      {loan.ai_score || loan.score || 'N/A'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Farmer: {loan.borrower_wallet ?
                        `${loan.borrower_wallet.slice(0, 6)}...${loan.borrower_wallet.slice(-4)}` :
                        'Anonymous'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Location: {loan.farm?.region_code || 'Unknown'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Crop: {loan.farm?.crop_types?.join(', ') || 'Various'}
                    </p>
                    <div className="flex justify-between text-sm">
                      <span>{loan.interest_rate || 8.5}% APR</span>
                      <span>{loan.term_days ? `${Math.round(loan.term_days / 30)} months` : 'TBD'}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <Link href={`/loan/${loan.id}`}>
                      <Button variant="outline" size="sm" className="flex-1">
                        View Details
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleFundLoan(loan.id)}
                      disabled={isFunding}
                    >
                      {isFunding ? 'Funding...' : 'Fund Loan'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground mb-4">
                No loans available in the marketplace at the moment.
              </p>
              <Link href="/apply">
                <Button>Apply for a Loan</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}