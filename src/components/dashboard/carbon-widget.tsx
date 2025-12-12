'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useGetUserCarbonCreditsQuery, useGetCarbonTransactionsQuery } from '@/store/apiSlice';
import { Leaf, TrendingUp, DollarSign, BarChart3, Plus, ArrowRight, Info, AlertCircle } from 'lucide-react';

export function CarbonWidget() {
  const { t } = useTranslation();

  const { data: carbonData, isLoading: carbonLoading, error: carbonError } = useGetUserCarbonCreditsQuery();

  // Use real data with fallbacks
  const carbonCredits = carbonData?.data?.balance || 0;
  const value = carbonData?.data?.value_usd || 0;
  const monthlyGeneration = carbonData?.data?.monthly_generation || 0;
  const yearlyTarget = carbonData?.data?.yearly_target || 200;
  const progressPercentage = yearlyTarget > 0 ? (carbonCredits / yearlyTarget) * 100 : 0;

  // Mock transactions for now - in future, add API endpoint for carbon transactions
  const recentTransactions = [
    { date: '2024-01-15', amount: 8, type: 'earned', activity: 'Sustainable irrigation' },
    { date: '2024-01-10', amount: 5, type: 'earned', activity: 'No-till farming' },
    { date: '2024-01-05', amount: 3, type: 'sold', activity: 'Market sale' },
  ];

  if (carbonLoading) {
    return (
      <Card className="shadow-level2 border-0">
        <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-slate-gray">
            <Leaf className="w-5 h-5 mr-2 text-agri-green" />
            Carbon Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="loading-skeleton h-16 rounded-lg"></div>
            <div className="loading-skeleton h-12 rounded-lg"></div>
            <div className="loading-skeleton h-20 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (carbonError) {
    return (
      <Card className="shadow-level2 border-0">
        <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-slate-gray">
            <Leaf className="w-5 h-5 mr-2 text-agri-green" />
            Carbon Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-gray mb-2">Unable to Load Carbon Data</h3>
            <p className="text-slate-gray/70 text-sm mb-4">
              We couldn't load your carbon credits information. Please try again.
            </p>
            <Button variant="outline" size="sm">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-level2 border-0">
      <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-slate-gray">
          <Leaf className="w-5 h-5 mr-2 text-agri-green" />
          Carbon Credits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Balance */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto">
            <Leaf className="w-8 h-8 text-white" />
          </div>

          <div>
            <div className="text-4xl font-black text-slate-gray mb-1">
              {carbonCredits}
            </div>
            <div className="text-sm text-slate-gray/60 mb-2">CARBT Tokens</div>
            <Badge className="bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20">
              <DollarSign className="w-3 h-3 mr-1" />
              ${value.toLocaleString()}
            </Badge>
          </div>
        </div>

        {/* Progress to Yearly Target */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-gray">2024 Target Progress</span>
            <span className="text-sm font-bold text-agri-green">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-slate-gray/10 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-agri-green to-sky-teal h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-slate-gray/60 text-center">
            {yearlyTarget - carbonCredits} credits to reach annual target
          </p>
        </div>

        {/* Monthly Generation */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Monthly Generation</span>
            </div>
            <span className="text-lg font-bold text-green-600">+{monthlyGeneration}</span>
          </div>
          <p className="text-xs text-green-700 mt-1">
            Earned from sustainable farming practices verified by satellite data
          </p>
        </div>

        {/* Recent Activity */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-gray flex items-center">
            <BarChart3 className="w-4 h-4 mr-2 text-agri-green" />
            Recent Activity
          </h4>
          <div className="space-y-2">
            {recentTransactions.map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-gray/5 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-gray">{transaction.activity}</p>
                  <p className="text-xs text-slate-gray/60">{transaction.date}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    transaction.type === 'earned' ? 'text-sky-teal' : 'text-harvest-gold'
                  }`}>
                    {transaction.type === 'earned' ? '+' : '-'}{transaction.amount}
                  </p>
                  <p className="text-xs text-slate-gray/60">CARBT</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-4">
          <Button variant="outline" size="sm" className="border-slate-gray/20 hover:border-agri-green hover:text-agri-green">
            <Plus className="w-4 h-4 mr-2" />
            Earn More
          </Button>
          <Button variant="outline" size="sm" className="border-slate-gray/20 hover:border-harvest-gold hover:text-harvest-gold">
            <ArrowRight className="w-4 h-4 mr-2" />
            Trade
          </Button>
        </div>

        {/* Info Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              Carbon credits are generated from verified sustainable farming practices and can be traded on global markets.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}