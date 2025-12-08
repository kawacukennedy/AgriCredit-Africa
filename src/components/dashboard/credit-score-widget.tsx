'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';
import { useRunCreditScoringMutation } from '@/store/apiSlice';
import { TrendingUp, TrendingDown, BarChart3, RefreshCw, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export const CreditScoreWidget = React.memo(function CreditScoreWidget() {
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

  const creditMetrics = useMemo(() => ({
    creditScore: creditData?.data?.credit_score || 0,
    confidence: creditData?.data?.confidence ? Math.round(creditData.data.confidence * 100) : 0,
    riskLevel: creditData?.data?.risk_level || 'Unknown',
  }), [creditData]);

  const getScoreColor = (score: number) => {
    if (score >= 700) return 'text-sky-teal';
    if (score >= 600) return 'text-harvest-gold';
    return 'text-red-500';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 700) return 'from-green-500 to-emerald-500';
    if (score >= 600) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-red-600';
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'bg-sky-teal/10 text-sky-teal border-sky-teal/20';
      case 'medium': return 'bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20';
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-gray/10 text-slate-gray border-slate-gray/20';
    }
  };

  return (
    <Card className="shadow-level2 border-0 overflow-hidden">
      <div className={`h-1 bg-gradient-to-r ${getScoreGradient(creditMetrics.creditScore)}`}></div>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-slate-gray">
          <BarChart3 className="w-5 h-5 mr-2 text-agri-green" />
          AI Credit Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {creditMetrics.creditScore > 0 ? (
          <>
             {/* Score Display */}
             <div className="text-center space-y-4">
                <div className={`text-5xl font-black ${getScoreColor(creditMetrics.creditScore)} animate-ai-score-pulse`}>
                  {creditMetrics.creditScore}
                </div>
               <div className="flex items-center justify-center space-x-2">
                 <Badge className={getRiskBadgeColor(creditMetrics.riskLevel)}>
                   {creditMetrics.riskLevel} Risk
                 </Badge>
                <Badge variant="outline" className="border-slate-gray/20">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              </div>
            </div>

            {/* Confidence Meter */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-gray">AI Confidence</span>
                <span className="text-sm font-bold text-agri-green">{creditMetrics.confidence}%</span>
              </div>
              <Progress value={creditMetrics.confidence} className="h-3" />
              <p className="text-xs text-slate-gray/60 text-center">
                Based on satellite data, repayment history, and market factors
              </p>
            </div>

            {/* Key Factors */}
            {creditData?.data?.explainability && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-gray flex items-center">
                  <Info className="w-4 h-4 mr-2 text-agri-green" />
                  Key Factors
                </h4>
                <div className="space-y-2">
                  {creditData.data.explainability.slice(0, 3).map((factor: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-gray/5 rounded-lg">
                      <span className="text-sm text-slate-gray capitalize">
                        {factor.feature.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center space-x-1">
                        {factor.impact > 0 ? (
                          <TrendingUp className="w-4 h-4 text-sky-teal" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${
                          factor.impact > 0 ? 'text-sky-teal' : 'text-red-500'
                        }`}>
                          {factor.impact > 0 ? '+' : ''}{factor.impact.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Updated */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-gray/10">
              <span className="text-xs text-slate-gray/60">Last updated</span>
              <span className="text-xs text-slate-gray/60">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </>
        ) : (
          <div className="text-center py-8 space-y-6">
            <div className="w-16 h-16 bg-gradient-to-br from-agri-green/20 to-sky-teal/20 rounded-2xl flex items-center justify-center mx-auto">
              <BarChart3 className="w-8 h-8 text-agri-green" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-gray mb-2">
                Get Your AI Credit Score
              </h3>
              <p className="text-slate-gray/70 text-sm max-w-sm mx-auto">
                Our AI analyzes satellite imagery, repayment history, and market data to calculate your personalized credit score
              </p>
            </div>

            <Button
              onClick={handleRunScoring}
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Your Data...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Run AI Credit Scoring
                </>
              )}
            </Button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="font-medium text-red-800 mb-1">Analysis Failed</h5>
                    <p className="text-sm text-red-700">
                      Unable to calculate credit score. Please check your farm data and try again.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-xs text-slate-gray/60">
              <div className="text-center">
                <div className="font-semibold text-agri-green">300-850</div>
                <div>Score Range</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-agri-green">24h</div>
                <div>Processing Time</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});