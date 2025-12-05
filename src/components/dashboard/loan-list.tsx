'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface Loan {
  id: string;
  amount: number;
  status: 'funded' | 'pending' | 'repaid' | 'defaulted';
  dueDate: string;
}

export function LoanList() {
  const { t } = useTranslation();

  // Mock data
  const loans: Loan[] = [
    { id: '1', amount: 500, status: 'funded', dueDate: '2025-01-15' },
    { id: '2', amount: 750, status: 'pending', dueDate: '2025-02-01' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'funded': return 'bg-success';
      case 'pending': return 'bg-warning';
      case 'repaid': return 'bg-info';
      case 'defaulted': return 'bg-error';
      default: return 'bg-muted';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.activeLoans')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loans.map((loan) => (
            <div key={loan.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-semibold">${loan.amount}</p>
                <p className="text-sm text-muted-foreground">Due: {loan.dueDate}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(loan.status)}>
                  {t(`loans.${loan.status}`)}
                </Badge>
                <Button variant="outline" size="sm">
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button className="w-full mt-4" variant="outline">
          {t('loans.apply')}
        </Button>
      </CardContent>
    </Card>
  );
}