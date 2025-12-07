'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { DIDCreationForm } from '@/components/onboard/did-creation-form';
import { AIKYCForm } from '@/components/onboard/ai-kyc-form';
import { ProfileSetupForm } from '@/components/onboard/profile-setup-form';
import { OnboardingComplete } from '@/components/onboard/onboarding-complete';
import { useRouter } from 'next/navigation';
import { CheckCircle, Shield, User, FileText, Trophy, ArrowRight, ArrowLeft } from 'lucide-react';

const steps = [
  {
    id: 1,
    title: 'DID Creation',
    description: 'Create your decentralized identity',
    icon: Shield,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 2,
    title: 'AI KYC',
    description: 'Verify your identity with AI',
    icon: User,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 3,
    title: 'Profile Setup',
    description: 'Complete your farmer profile',
    icon: FileText,
    color: 'from-amber-500 to-orange-500'
  },
  {
    id: 4,
    title: 'Complete',
    description: 'Welcome to AgriCredit Africa',
    icon: Trophy,
    color: 'from-purple-500 to-pink-500'
  },
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

  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-paper-white via-paper-white to-sky-teal/5">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-agri-green to-sky-teal text-white py-16">
        <div className="container text-center">
          <Badge variant="secondary" className="mb-4 bg-harvest-gold/20 text-harvest-gold border-harvest-gold/30">
            🚜 Farmer Onboarding
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Join AgriCredit Africa
          </h1>
          <p className="text-xl max-w-2xl mx-auto opacity-90">
            Complete your registration to access AI-powered microloans, carbon credits, and our decentralized farming platform
          </p>
        </div>
      </section>

      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Progress Overview */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-gray">Onboarding Progress</h2>
              <span className="text-sm text-slate-gray/60">
                Step {currentStep} of {steps.length}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <Progress value={progressPercentage} className="h-3" />
              <div className="flex justify-between mt-2 text-sm text-slate-gray/60">
                <span>Start</span>
                <span>{Math.round(progressPercentage)}% Complete</span>
                <span>Finish</span>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = index + 1 < currentStep;
                const isCurrent = index + 1 === currentStep;
                const isUpcoming = index + 1 > currentStep;

                return (
                  <div
                    key={step.id}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                      isCompleted
                        ? 'bg-sky-teal/10 border-sky-teal shadow-level2'
                        : isCurrent
                        ? 'bg-agri-green/5 border-agri-green shadow-level2'
                        : 'bg-paper-white border-slate-gray/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isCompleted
                          ? 'bg-sky-teal text-white'
                          : isCurrent
                          ? 'bg-agri-green text-white'
                          : 'bg-slate-gray/10 text-slate-gray/40'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <StepIcon className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${
                          isCompleted || isCurrent ? 'text-slate-gray' : 'text-slate-gray/60'
                        }`}>
                          {step.title}
                        </h3>
                        <p className={`text-sm ${
                          isCompleted || isCurrent ? 'text-slate-gray/70' : 'text-slate-gray/40'
                        }`}>
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                      <div className={`absolute top-6 left-full w-full h-0.5 -translate-y-1/2 ${
                        isCompleted ? 'bg-sky-teal' : 'bg-slate-gray/20'
                      }`} style={{ width: 'calc(100% - 2.5rem)' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <Card className="shadow-level3 border-0 overflow-hidden">
            <div className={`h-2 bg-gradient-to-r ${steps[currentStep - 1].color}`}></div>
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${steps[currentStep - 1].color} flex items-center justify-center`}>
                  <steps[currentStep - 1].icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-slate-gray">
                    {steps[currentStep - 1].title}
                  </CardTitle>
                  <p className="text-slate-gray/70 mt-1">
                    {steps[currentStep - 1].description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>

            <div className="flex items-center space-x-2 text-sm text-slate-gray/60">
              <span>Need help?</span>
              <Button variant="link" className="p-0 h-auto text-agri-green hover:text-agri-green/80">
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}