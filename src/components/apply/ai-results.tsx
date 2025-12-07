'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';
import { useRunCreditScoringMutation, useGetYieldPredictionMutation } from '@/store/apiSlice';

interface AIResultsProps {
  farmData: any;
  onSubmit: (data: any) => void;
  onPrev: () => void;
}

export function AIResults({ farmData, onSubmit, onPrev }: AIResultsProps) {
  const { t } = useTranslation();
  const [runCreditScoring, { data: creditData, isLoading: creditLoading }] = useRunCreditScoringMutation();
  const [runYieldPrediction, { data: yieldData, isLoading: yieldLoading }] = useGetYieldPredictionMutation();
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    // Run AI analysis when component mounts
    runCreditScoring({
      farm_size: parseFloat(farmData.farm_size),
      historical_data: {
        repayment_rate: 0.85, // Mock data - would come from user's history
        satellite_ndvi: 0.7,
        weather_risk: 0.2,
        loan_history: 1,
        income_stability: 0.8,
        location_risk: 0.1,
        crop_diversity: farmData.crops?.length || 1
      },
      mobile_money_usage: 200.0, // Mock data
      cooperative_membership: true
    });

    runYieldPrediction({
      farm_size: parseFloat(farmData.farm_size),
      crop_type: farmData.crops?.[0] || 'maize',
      soil_quality: 0.8,
      weather_data: {
        rainfall: 900,
        temperature: 25,
        fertilizer_usage: 1.2,
        pest_control: true,
        crop_variety: 2,
        farming_experience: parseInt(farmData.farming_experience) || 5,
        irrigation_access: farmData.irrigation_access
      }
    });
  }, [farmData, runCreditScoring, runYieldPrediction]);

  useEffect(() => {
    if (creditData && yieldData) {
      setResults({
        credit_score: creditData.data,
        yield_prediction: yieldData.data
      });
    }
  }, [creditData, yieldData]);

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

  const handleSubmitApplication = () => {
    const applicationData = {
      ...farmData,
      credit_score: results?.credit_score?.credit_score,
      risk_level: results?.credit_score?.risk_level,
      trust_score: results?.credit_score?.trust_score,
      yield_prediction: results?.yield_prediction,
      ai_analysis_complete: true
    };
    onSubmit(applicationData);
  };

  if (creditLoading || yieldLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Running AI Analysis</h3>
          <p className="text-muted-foreground">
            Our AI is analyzing your farm data, satellite imagery, and market conditions...
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Credit Scoring</span>
              <span>{creditLoading ? 'Analyzing...' : 'Complete'}</span>
            </div>
            <Progress value={creditLoading ? 60 : 100} />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Yield Prediction</span>
              <span>{yieldLoading ? 'Analyzing...' : 'Complete'}</span>
            </div>
            <Progress value={yieldLoading ? 40 : 100} />
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center py-8">
        <p className="text-error">Failed to run AI analysis. Please try again.</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry Analysis
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium mb-2">AI Analysis Complete</h3>
        <p className="text-muted-foreground">
          Here's what our AI found about your farm and loan eligibility.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Credit Score Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Credit Score
              <Badge variant="secondary">
                {getScoreBadge(results.credit_score.credit_score)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <div className={`text-4xl font-bold ${getScoreColor(results.credit_score.credit_score)}`}>
                {results.credit_score.credit_score}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Risk Level: {results.credit_score.risk_level}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Confidence</span>
                <span>{Math.round(results.credit_score.confidence * 100)}%</span>
              </div>
              <Progress value={results.credit_score.confidence * 100} />
            </div>

            {results.credit_score.explainability && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Key Factors:</h4>
                <ul className="text-xs space-y-1">
                  {results.credit_score.explainability.slice(0, 3).map((factor: any, index: number) => (
                    <li key={index} className="flex justify-between">
                      <span>{factor.feature}</span>
                      <span className={factor.impact > 0 ? 'text-success' : 'text-error'}>
                        {factor.impact > 0 ? '+' : ''}{factor.impact.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Yield Prediction Card */}
        <Card>
          <CardHeader>
            <CardTitle>Yield Prediction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-agri-green">
                {results.yield_prediction.predicted_yield} {results.yield_prediction.unit}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Expected yield for {farmData.crops?.[0] || 'your crops'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Confidence Range</span>
                <span>
                  {results.yield_prediction.confidence_interval_lower} - {results.yield_prediction.confidence_interval_upper} {results.yield_prediction.unit}
                </span>
              </div>
            </div>

            {results.yield_prediction.factors && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Influencing Factors:</h4>
                <ul className="text-xs space-y-1">
                  {results.yield_prediction.factors.slice(0, 3).map((factor: any, index: number) => (
                    <li key={index} className="flex justify-between">
                      <span>{factor.name}</span>
                      <span className={factor.impact > 0 ? 'text-success' : 'text-error'}>
                        {factor.impact > 0 ? '+' : ''}{factor.impact.toFixed(1)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recommended Loan Terms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-agri-green">
                ${Math.round(results.credit_score.credit_score / 10) * 100}
              </p>
              <p className="text-sm text-muted-foreground">Recommended Amount</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-agri-green">
                {results.credit_score.credit_score >= 700 ? '8.5%' : results.credit_score.credit_score >= 600 ? '12%' : '15%'}
              </p>
              <p className="text-sm text-muted-foreground">Interest Rate</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-agri-green">12</p>
              <p className="text-sm text-muted-foreground">Months Term</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> This AI analysis is for informational purposes and helps determine your loan eligibility.
          Final loan terms will be determined after document verification and manual review.
          All loans are subject to AgriCredit's lending policies and regulatory requirements.
        </p>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onPrev}>
          Previous
        </Button>
        <Button onClick={handleSubmitApplication}>
          Submit Application
        </Button>
      </div>
    </div>
  );
}