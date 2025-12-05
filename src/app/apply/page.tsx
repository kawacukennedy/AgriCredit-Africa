'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

const steps = [
  { id: 1, title: 'Farm Details', description: 'Provide your farm information' },
  { id: 2, title: 'Documents', description: 'Upload supporting documents' },
  { id: 3, title: 'Consent', description: 'Agree to data usage' },
  { id: 4, title: 'AI Review', description: 'Review credit assessment' },
];

export default function LoanApplyPage() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
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
              {currentStep === 1 && (
                <div className="space-y-4">
                  <p>Enter your farm details here.</p>
                  {/* Farm details form would go here */}
                </div>
              )}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <p>Upload your documents.</p>
                  {/* Document upload would go here */}
                </div>
              )}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <p>Consent to data usage.</p>
                  {/* Consent form would go here */}
                </div>
              )}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <p>AI credit assessment results.</p>
                  {/* AI results would go here */}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              {t('common.previous')}
            </Button>
            <Button onClick={nextStep} disabled={currentStep === steps.length}>
              {currentStep === steps.length ? 'Submit Application' : t('common.next')}
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}