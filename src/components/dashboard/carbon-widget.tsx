'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

export function CarbonWidget() {
  const { t } = useTranslation();

  const carbonCredits = 150;
  const value = 2250; // in USD

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.carbonCredits')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-bold text-agri-green">{carbonCredits}</div>
            <div className="text-sm text-muted-foreground">CARBT tokens</div>
          </div>
          <Badge variant="secondary">${value}</Badge>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Monthly Generation</span>
            <span className="text-success">+12</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-sky-teal h-2 rounded-full" style={{ width: '75%' }} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Earned from sustainable farming practices verified by satellite data.
        </p>
      </CardContent>
    </Card>
  );
}