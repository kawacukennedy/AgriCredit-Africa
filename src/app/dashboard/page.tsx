'use client';

import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { CreditScoreWidget } from '@/components/dashboard/credit-score-widget';
import { LoanList } from '@/components/dashboard/loan-list';
import { FarmMap } from '@/components/dashboard/farm-map';
import { CarbonWidget } from '@/components/dashboard/carbon-widget';
import { useTranslation } from 'react-i18next';

export default function FarmerDashboard() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-gray mb-8">
          {t('dashboard.welcome')}
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <CreditScoreWidget />
            <LoanList />
          </div>
          <div className="space-y-8">
            <FarmMap />
            <CarbonWidget />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}