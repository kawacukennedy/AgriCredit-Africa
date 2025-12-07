'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { FarmDetailsForm } from '@/components/apply/farm-details-form';
import { DocumentsForm } from '@/components/apply/documents-form';
import { ConsentForm } from '@/components/apply/consent-form';
import { AIResults } from '@/components/apply/ai-results';
import { useApplyForLoanMutation } from '@/store/apiSlice';
import { useRouter } from 'next/navigation';

const steps = [
  { id: 1, title: 'Farm Details', description: 'Provide your farm information' },
  { id: 2, title: 'Documents', description: 'Upload supporting documents' },
  { id: 3, title: 'Consent', description: 'Agree to data usage' },
  { id: 4, title: 'AI Review', description: 'Review credit assessment' },
];

export default function LoanApplyPage() {
  return (
    <AuthGuard>
      <LoanApplyContent />
    </AuthGuard>
  );
}

function LoanApplyContent() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [applyForLoan, { isLoading }] = useApplyForLoanMutation();
  const router = useRouter();

  const nextStep = (stepData?: any) => {
    if (stepData) {
      setFormData((prev: any) => ({ ...prev, ...stepData }));
    }
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (applicationData: any) => {
    try {
      const loanData = {
        borrower_wallet: '0x1234567890123456789012345678901234567890', // Would come from wallet
        principal_cents: Math.round(applicationData.credit_score / 10) * 100 * 100, // Convert to cents
        term_days: 365,
        purpose: 'Agricultural production',
        consent: true,
        farm_id: 'farm-001', // Would be created from farm data
        credit_score: applicationData.credit_score,
        risk_level: applicationData.risk_level,
        trust_score: applicationData.trust_score,
        collateral_token: '0x0000000000000000000000000000000000000000',
        collateral_amount: 0,
        interest_rate: applicationData.credit_score >= 700 ? 8.5 : applicationData.credit_score >= 600 ? 12 : 15
      };

      await applyForLoan(loanData).unwrap();
      router.push('/dashboard?success=application_submitted');
    } catch (error) {
      console.error('Failed to submit application:', error);
      // Handle error - show toast or error message
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <FarmDetailsForm onNext={nextStep} initialData={formData} />;
      case 2:
        return <DocumentsForm onNext={nextStep} onPrev={prevStep} initialData={formData} />;
      case 3:
        return <ConsentForm onNext={nextStep} onPrev={prevStep} initialData={formData} />;
      case 4:
        return <AIResults farmData={formData} onSubmit={handleSubmit} onPrev={prevStep} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            {t('loans.apply')}
          </h1>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex justify-between">
              {steps.map((step) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.id <= currentStep
                        ? 'bg-agri-green text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step.id}
                  </div>
                  <div className="text-xs mt-2 text-center">
                    <div className="font-medium">{step.title}</div>
                    <div className="text-muted-foreground">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-muted rounded-full h-2">
              <div
                className="bg-agri-green h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <Card>
            <CardHeader>
              <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            </CardHeader>
            <CardContent>
              {renderStepContent()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}