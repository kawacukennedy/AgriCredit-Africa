'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { DIDCreationForm } from '@/components/onboard/did-creation-form';
import { AIKYCForm } from '@/components/onboard/ai-kyc-form';
import { ProfileSetupForm } from '@/components/onboard/profile-setup-form';
import { OnboardingComplete } from '@/components/onboard/onboarding-complete';
import { useRouter } from 'next/navigation';

const steps = [
  { id: 1, title: 'DID Creation', description: 'Create your decentralized identity' },
  { id: 2, title: 'AI KYC', description: 'Verify your identity with AI' },
  { id: 3, title: 'Profile Setup', description: 'Complete your farmer profile' },
  { id: 4, title: 'Complete', description: 'Welcome to AgriCredit Africa' },
];

export default function OnboardPage() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const router = useRouter();

  const nextStep = (stepData?: any) => {
    if (stepData) {
      setFormData(prev => ({ ...prev, ...stepData }));
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

  const handleComplete = () => {
    router.push('/dashboard?onboarding=complete');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <DIDCreationForm onNext={nextStep} initialData={formData} />;
      case 2:
        return <AIKYCForm onNext={nextStep} onPrev={prevStep} initialData={formData} />;
      case 3:
        return <ProfileSetupForm onNext={nextStep} onPrev={prevStep} initialData={formData} />;
      case 4:
        return <OnboardingComplete onComplete={handleComplete} profileData={formData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            Farmer Onboarding
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Complete your registration to access AgriCredit Africa's decentralized farming platform
          </p>

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
      <Footer />
    </div>
  );
}