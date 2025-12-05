'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

export function CreditScoreWidget() {
  const { t } = useTranslation();

  // Mock data - in real app, this would come from API
  const creditScore = 750;
  const confidence = 85;

  const getScoreColor = (score: number) => {
    if (score >= 700) return 'text-success';
    if (score >= 600) return 'text-warning';
    return 'text-error';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 700) return 'Excellent';
    if (score >= 600) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.creditScore')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className={`text-4xl font-bold ${getScoreColor(creditScore)}`}>
            {creditScore}
          </div>
          <Badge variant="secondary">{getScoreBadge(creditScore)}</Badge>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Confidence Level</span>
            <span>{confidence}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-agri-green h-2 rounded-full"
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Based on satellite data, farm history, and repayment behavior.
        </p>
      </CardContent>
    </Card>
  );
}