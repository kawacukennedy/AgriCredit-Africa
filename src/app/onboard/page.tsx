'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import dynamic from 'next/dynamic';

const RoleSelectionForm = dynamic(() => import('@/components/onboard/role-selection-form'), {
  loading: () => <div className="animate-pulse p-8 bg-neutral-800/5 rounded-lg">Loading role selection...</div>
});

const DIDCreationForm = dynamic(() => import('@/components/onboard/did-creation-form'), {
  loading: () => <div className="animate-pulse p-8 bg-neutral-800/5 rounded-lg">Loading DID creation...</div>
});

const AIKYCForm = dynamic(() => import('@/components/onboard/ai-kyc-form'), {
  loading: () => <div className="animate-pulse p-8 bg-neutral-800/5 rounded-lg">Loading AI KYC...</div>
});

const ProfileSetupForm = dynamic(() => import('@/components/onboard/profile-setup-form'), {
  loading: () => <div className="animate-pulse p-8 bg-neutral-800/5 rounded-lg">Loading profile setup...</div>
});

const OnboardingComplete = dynamic(() => import('@/components/onboard/onboarding-complete'), {
  loading: () => <div className="animate-pulse p-8 bg-neutral-800/5 rounded-lg">Loading completion...</div>
});
import { useRouter } from 'next/navigation';
import { CheckCircle, Shield, User, FileText, Trophy, ArrowRight, ArrowLeft, Sparkles, Clock } from 'lucide-react';

// Common steps for all roles
const commonSteps = [
  {
    id: 1,
    title: 'Role Selection',
    description: 'Choose your role in the platform',
    icon: User,
    color: 'from-blue-600 to-cyan-600'
  },
  {
    id: 2,
    title: 'DID Creation',
    description: 'Create your decentralized identity',
    icon: Shield,
    color: 'from-green-600 to-emerald-600'
  },
  {
    id: 3,
    title: 'AI KYC',
    description: 'Verify your identity with AI',
    icon: User,
    color: 'from-amber-600 to-orange-600'
  }
];

// Farmer-specific steps
const farmerSteps = [
  ...commonSteps,
  {
    id: 4,
    title: 'Farm Setup',
    description: 'Configure your farming operations',
    icon: FileText,
    color: 'from-purple-600 to-pink-600'
  },
  {
    id: 5,
    title: 'Loan Application',
    description: 'Set up your loan preferences',
    icon: Trophy,
    color: 'from-indigo-600 to-purple-600'
  },
  {
    id: 6,
    title: 'Complete',
    description: 'Welcome to AgriCredit Africa',
    icon: Trophy,
    color: 'from-emerald-600 to-teal-600'
  }
];

// Investor-specific steps
const investorSteps = [
  ...commonSteps,
  {
    id: 4,
    title: 'Investment Profile',
    description: 'Set up your investment preferences',
    icon: FileText,
    color: 'from-purple-600 to-pink-600'
  },
  {
    id: 5,
    title: 'Portfolio Setup',
    description: 'Configure your investment portfolio',
    icon: Trophy,
    color: 'from-indigo-600 to-purple-600'
  },
  {
    id: 6,
    title: 'Complete',
    description: 'Welcome to AgriCredit Africa',
    icon: Trophy,
    color: 'from-emerald-600 to-teal-600'
  }
];

export default function OnboardPage() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [startTime] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Get the appropriate steps based on selected role
  const getSteps = () => {
    const role = formData.role;
    if (role === 'investor') return investorSteps;
    if (role === 'farmer') return farmerSteps;
    return commonSteps; // Default to common steps until role is selected
  };

  const steps = getSteps();

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

    // Redirect based on role
    const userRole = formData.role || 'farmer';
    router.push(`/dashboard/${userRole}?onboarding=complete`);
  };

  const getEstimatedTimeRemaining = () => {
    const completedSteps = currentStep - 1;
    const remainingSteps = steps.length - currentStep;
    const timePerStep = 2; // minutes
    return remainingSteps * timePerStep;
  };

  const renderStepContent = () => {
    const role = formData.role;

    switch (currentStep) {
      case 1:
        return <RoleSelectionForm onNext={nextStep} initialData={formData} />;
      case 2:
        return <DIDCreationForm onNext={nextStep} onPrev={prevStep} initialData={formData} />;
      case 3:
        return <AIKYCForm onNext={nextStep} onPrev={prevStep} initialData={formData} />;
      case 4:
        return <ProfileSetupForm onNext={nextStep} onPrev={prevStep} initialData={formData} role={role} />;
      case 5:
        return <ProfileSetupForm onNext={nextStep} onPrev={prevStep} initialData={formData} role={role} />;
      case 6:
        return <OnboardingComplete onComplete={handleComplete} profileData={formData} />;
      default:
        return null;
    }
  };

  const progressPercentage = steps.length > 1 ? ((currentStep - 1) / (steps.length - 1)) * 100 : 0;
  const timeElapsed = Math.floor((Date.now() - startTime) / 60000); // minutes

  return (
    <div className="bg-gradient-to-br from-neutral-50 via-neutral-50 to-neutral-100">

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-agri-green to-sky-teal text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-agri-green/20 to-sky-teal/20 animate-pulse"></div>
        <div className="container text-center relative z-10">
          <div className="flex items-center justify-center mb-4">
            <Badge variant="secondary" className={`animate-bounce ${
              formData.role === 'investor'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                : formData.role === 'farmer'
                ? 'bg-harvest-gold/20 text-harvest-gold border-harvest-gold/30'
                : 'bg-harvest-gold/20 text-harvest-gold border-harvest-gold/30'
            }`}>
              <Sparkles className="w-4 h-4 mr-2" />
              {formData.role === 'investor' ? 'Investor Onboarding' :
               formData.role === 'farmer' ? 'Farmer Onboarding' :
               'AgriCredit Onboarding'}
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 animate-fadeIn">
            Join AgriCredit Africa
          </h1>
          <p className="text-xl max-w-2xl mx-auto opacity-90 animate-fadeIn animation-delay-200">
            {formData.role === 'investor'
              ? 'Complete your registration to access AI-powered investment opportunities, carbon credits, and our decentralized finance platform'
              : formData.role === 'farmer'
              ? 'Complete your registration to access AI-powered microloans, carbon credits, and our decentralized farming platform'
              : 'Complete your registration to access AI-powered financial services and our decentralized platform'
            }
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
        <div className="max-w-3xl mx-auto">
          {/* Progress Overview */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-neutral-800">Onboarding Progress</h2>
                <p className="text-sm text-neutral-800/60 mt-1">
                  Step {currentStep} of {steps.length} • {steps[currentStep - 1].title}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-agri-green">{Math.round(progressPercentage)}%</div>
                <div className="text-sm text-neutral-800/60">Complete</div>
              </div>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="mb-8">
              <div className="relative">
                <Progress value={progressPercentage} className="h-4 bg-neutral-800/20" />
                <div className="absolute inset-0 bg-gradient-to-r from-agri-green to-sky-teal rounded-full opacity-20"></div>
                <div
                  className="absolute top-0 left-0 h-4 bg-gradient-to-r from-agri-green to-sky-teal rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-3 text-sm">
                <span className="text-neutral-800/60">🚀 Start</span>
                <span className="text-agri-green font-medium flex items-center">
                  <Sparkles className="w-4 h-4 mr-1" />
                  {Math.round(progressPercentage)}% Complete
                </span>
                <span className="text-neutral-800/60">🎯 Finish</span>
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
                         ? 'bg-gradient-to-br from-sky-teal/10 to-neutral-100 border-sky-teal shadow-lg shadow-sky-teal/20'
                         : isCurrent
                         ? 'bg-gradient-to-br from-agri-green/10 to-neutral-100 border-agri-green shadow-lg shadow-agri-green/20 animate-pulse'
                         : 'bg-neutral-100 border-neutral-400 hover:border-agri-green/50'
                     }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? 'bg-gradient-to-r from-sky-teal to-teal-600 text-white shadow-lg'
                          : isCurrent
                          ? 'bg-gradient-to-r from-agri-green to-green-600 text-white shadow-lg animate-bounce'
                          : 'bg-neutral-800/10 text-neutral-800/40'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-6 h-6 animate-pulse" />
                        ) : (
                          <StepIcon className={`w-5 h-5 ${isCurrent ? 'animate-pulse' : ''}`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold transition-colors ${
                          isCompleted || isCurrent ? 'text-neutral-800' : 'text-neutral-800/60'
                        }`}>
                          {step.title}
                        </h3>
                        <p className={`text-sm transition-colors ${
                          isCompleted || isCurrent ? 'text-neutral-800/70' : 'text-neutral-800/40'
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
                        <div className={`hidden md:block absolute top-6 left-full w-full h-0.5 -translate-y-1/2 transition-all duration-500 ${
                          isCompleted ? 'bg-gradient-to-r from-sky-teal to-teal-500' : 'bg-neutral-400'
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
                  <CardTitle className="text-2xl text-neutral-800">
                    {steps[currentStep - 1].title}
                  </CardTitle>
                  <p className="text-neutral-800/70 mt-1">
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
                      <h3 className="text-lg font-semibold text-neutral-800">Processing...</h3>
                      <p className="text-neutral-800/60">Please wait while we process your information</p>
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
              className="flex items-center space-x-2 hover:bg-neutral-800/5 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-neutral-800/60">
                <span>Need help?</span>
                <Button
                  variant="link"
                  className="p-0 h-auto text-agri-green hover:text-agri-green/80 transition-colors"
                  onClick={() => window.open('/help', '_blank')}
                >
                  Contact Support
                </Button>
              </div>

              <div className="flex items-center space-x-2 text-sm text-neutral-800/60">
                <span>💾 Progress saved automatically</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderCurrentStepIcon(currentStep: number) {
  const StepIcon = steps[currentStep - 1].icon;
  return <StepIcon className="w-6 h-6 text-white" />;
}