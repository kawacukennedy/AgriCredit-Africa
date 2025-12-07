'use client';

import { useState, useEffect } from 'react';
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
import { CheckCircle, Shield, User, FileText, Trophy, ArrowRight, ArrowLeft, Sparkles, Clock } from 'lucide-react';

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
  const [startTime] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Load saved progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('agricredit_onboarding_progress');
    if (savedProgress) {
      const { step, data } = JSON.parse(savedProgress);
      setCurrentStep(step);
      setFormData(data);
    }
  }, []);

  // Save progress to localStorage
  const saveProgress = (step: number, data: any) => {
    localStorage.setItem('agricredit_onboarding_progress', JSON.stringify({
      step,
      data,
      timestamp: Date.now()
    }));
  };

  const nextStep = async (stepData?: any) => {
    setIsLoading(true);

    // Simulate API call delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));

    if (stepData) {
      const newData = { ...formData, ...stepData };
      setFormData(newData);
      saveProgress(currentStep + 1, newData);
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }

    setIsLoading(false);
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Clear saved progress
    localStorage.removeItem('agricredit_onboarding_progress');

    // Mark onboarding as complete
    localStorage.setItem('agricredit_onboarding_complete', 'true');

    router.push('/dashboard?onboarding=complete');
  };

  const getEstimatedTimeRemaining = () => {
    const completedSteps = currentStep - 1;
    const remainingSteps = steps.length - currentStep;
    const timePerStep = 2; // minutes
    return remainingSteps * timePerStep;
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
  const timeElapsed = Math.floor((Date.now() - startTime) / 60000); // minutes

  return (
    <div className="min-h-screen bg-gradient-to-br from-paper-white via-paper-white to-sky-teal/5">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-agri-green to-sky-teal text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-agri-green/20 to-sky-teal/20 animate-pulse"></div>
        <div className="container text-center relative z-10">
          <div className="flex items-center justify-center mb-4">
            <Badge variant="secondary" className="bg-harvest-gold/20 text-harvest-gold border-harvest-gold/30 animate-bounce">
              <Sparkles className="w-4 h-4 mr-2" />
              Farmer Onboarding
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 animate-fadeIn">
            Join AgriCredit Africa
          </h1>
          <p className="text-xl max-w-2xl mx-auto opacity-90 animate-fadeIn animation-delay-200">
            Complete your registration to access AI-powered microloans, carbon credits, and our decentralized farming platform
          </p>

          {/* Quick Stats */}
          <div className="flex items-center justify-center space-x-6 mt-8 text-sm opacity-80">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>{timeElapsed} min elapsed</span>
            </div>
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4" />
              <span>{getEstimatedTimeRemaining()} min remaining</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>{Math.round(progressPercentage)}% complete</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Progress Overview */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-gray">Onboarding Progress</h2>
                <p className="text-sm text-slate-gray/60 mt-1">
                  Step {currentStep} of {steps.length} • {steps[currentStep - 1].title}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-agri-green">{Math.round(progressPercentage)}%</div>
                <div className="text-sm text-slate-gray/60">Complete</div>
              </div>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="mb-8">
              <div className="relative">
                <Progress value={progressPercentage} className="h-4 bg-slate-gray/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-agri-green to-sky-teal rounded-full opacity-20"></div>
                <div
                  className="absolute top-0 left-0 h-4 bg-gradient-to-r from-agri-green to-sky-teal rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-3 text-sm">
                <span className="text-slate-gray/60">🚀 Start</span>
                <span className="text-agri-green font-medium flex items-center">
                  <Sparkles className="w-4 h-4 mr-1" />
                  {Math.round(progressPercentage)}% Complete
                </span>
                <span className="text-slate-gray/60">🎯 Finish</span>
              </div>
            </div>

            {/* Enhanced Step Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = index + 1 < currentStep;
                const isCurrent = index + 1 === currentStep;
                const isUpcoming = index + 1 > currentStep;

                return (
                  <div
                    key={step.id}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-500 transform hover:scale-105 ${
                      isCompleted
                        ? 'bg-gradient-to-br from-sky-teal/10 to-green-50 border-sky-teal shadow-lg shadow-sky-teal/20'
                        : isCurrent
                        ? 'bg-gradient-to-br from-agri-green/10 to-emerald-50 border-agri-green shadow-lg shadow-agri-green/20 animate-pulse'
                        : 'bg-paper-white border-slate-gray/20 hover:border-agri-green/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? 'bg-gradient-to-r from-sky-teal to-teal-600 text-white shadow-lg'
                          : isCurrent
                          ? 'bg-gradient-to-r from-agri-green to-green-600 text-white shadow-lg animate-bounce'
                          : 'bg-slate-gray/10 text-slate-gray/40'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6 animate-pulse" />
                        ) : (
                          <StepIcon className={`w-5 h-5 ${isCurrent ? 'animate-pulse' : ''}`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold transition-colors ${
                          isCompleted || isCurrent ? 'text-slate-gray' : 'text-slate-gray/60'
                        }`}>
                          {step.title}
                        </h3>
                        <p className={`text-sm transition-colors ${
                          isCompleted || isCurrent ? 'text-slate-gray/70' : 'text-slate-gray/40'
                        }`}>
                          {step.description}
                        </p>
                        {isCurrent && (
                          <Badge className="mt-1 bg-agri-green/20 text-agri-green border-agri-green/30 text-xs">
                            Current Step
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Enhanced Connector Line */}
                    {index < steps.length - 1 && (
                      <div className={`absolute top-6 left-full w-full h-0.5 -translate-y-1/2 transition-all duration-500 ${
                        isCompleted ? 'bg-gradient-to-r from-sky-teal to-teal-500' : 'bg-slate-gray/20'
                      }`} style={{ width: 'calc(100% - 2.5rem)' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <Card className="shadow-level3 border-0 overflow-hidden animate-fadeIn">
            <div className={`h-2 bg-gradient-to-r ${steps[currentStep - 1].color} animate-pulse`}></div>
            <CardHeader className="pb-6">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${steps[currentStep - 1].color} flex items-center justify-center shadow-lg animate-bounce`}>
                  {renderCurrentStepIcon(currentStep)}
                </div>
                <div className="animate-fadeIn animation-delay-200">
                  <CardTitle className="text-2xl text-slate-gray">
                    {steps[currentStep - 1].title}
                  </CardTitle>
                  <p className="text-slate-gray/70 mt-1">
                    {steps[currentStep - 1].description}
                  </p>
                  {currentStep > 1 && (
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="secondary" className="bg-sky-teal/10 text-sky-teal border-sky-teal/20">
                        Step {currentStep} of {steps.length}
                      </Badge>
                      <Badge variant="secondary" className="bg-harvest-gold/10 text-harvest-gold border-harvest-gold/20">
                        {getEstimatedTimeRemaining()} min remaining
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-agri-green to-sky-teal rounded-2xl flex items-center justify-center mx-auto animate-spin">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-gray">Processing...</h3>
                      <p className="text-slate-gray/60">Please wait while we process your information</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="animate-fadeIn animation-delay-300">
                  {renderStepContent()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1 || isLoading}
              className="flex items-center space-x-2 hover:bg-slate-gray/5 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-slate-gray/60">
                <span>Need help?</span>
                <Button
                  variant="link"
                  className="p-0 h-auto text-agri-green hover:text-agri-green/80 transition-colors"
                  onClick={() => window.open('/help', '_blank')}
                >
                  Contact Support
                </Button>
              </div>

              <div className="flex items-center space-x-2 text-sm text-slate-gray/60">
                <span>💾 Progress saved automatically</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function renderCurrentStepIcon(currentStep: number) {
  const StepIcon = steps[currentStep - 1].icon;
  return <StepIcon className="w-6 h-6 text-white" />;
}