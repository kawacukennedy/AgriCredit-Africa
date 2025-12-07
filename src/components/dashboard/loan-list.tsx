'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useGetLoansQuery } from '@/store/apiSlice';
import Link from 'next/link';

export function LoanList() {
  const { t } = useTranslation();
  const { data: loans, isLoading, error } = useGetLoansQuery({});

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'funded': return 'bg-success';
      case 'pending': return 'bg-warning';
      case 'repaid': return 'bg-info';
      case 'defaulted': return 'bg-error';
      default: return 'bg-muted';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.activeLoans')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 border rounded-lg animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.activeLoans')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-error text-sm">Failed to load loans. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.activeLoans')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loans && loans.length > 0 ? (
            loans.slice(0, 3).map((loan: any) => (
              <div key={loan.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-semibold">${loan.amount || loan.principal_cents / 100}</p>
                  <p className="text-sm text-muted-foreground">
                    Status: {loan.status}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(loan.status)}>
                    {t(`loans.${loan.status}`)}
                  </Badge>
                  <Link href={`/loan/${loan.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No active loans found.
            </p>
          )}
        </div>
        <Link href="/apply">
          <Button className="w-full mt-4" variant="outline">
            {t('loans.apply')}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}