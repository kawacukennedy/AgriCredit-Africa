'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useRunCreditScoringMutation } from '@/store/apiSlice';
import { useState } from 'react';

export function CreditScoreWidget() {
  const { t } = useTranslation();
  const [runCreditScoring, { data: creditData, isLoading, error }] = useRunCreditScoringMutation();

  // Mock farm data for credit scoring - in real app, this would come from user profile
  const farmData = {
    farm_size: 5.2,
    historical_data: {
      repayment_rate: 0.95,
      satellite_ndvi: 0.75,
      weather_risk: 0.2,
      loan_history: 2,
      income_stability: 0.85,
      location_risk: 0.1,
      crop_diversity: 3
    },
    mobile_money_usage: 150.0,
    cooperative_membership: true
  };

  const handleRunScoring = () => {
    runCreditScoring(farmData);
  };

  const creditScore = creditData?.data?.credit_score || 0;
  const confidence = creditData?.data?.confidence ? Math.round(creditData.data.confidence * 100) : 0;

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
        {creditScore > 0 ? (
          <>
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
            {creditData?.data?.explainability && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Key Factors:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {creditData.data.explainability.slice(0, 3).map((factor: any, index: number) => (
                    <li key={index}>• {factor.feature}: {factor.impact > 0 ? '+' : ''}{factor.impact.toFixed(2)}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Run AI credit scoring to get your personalized credit score
            </p>
            <Button onClick={handleRunScoring} disabled={isLoading}>
              {isLoading ? 'Analyzing...' : 'Run Credit Scoring'}
            </Button>
            {error && (
              <p className="text-error text-sm mt-2">
                Failed to run credit scoring. Please try again.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}