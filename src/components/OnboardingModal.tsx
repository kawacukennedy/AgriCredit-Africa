'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, Leaf, CreditCard, Store, BarChart3 } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  {
    icon: Leaf,
    title: 'Welcome to AgriCredit',
    description: 'Your gateway to decentralized microcredit and sustainable agriculture in Africa.',
  },
  {
    icon: CreditCard,
    title: 'Apply for Loans',
    description: 'Get AI-powered credit scoring and apply for loans with competitive rates.',
  },
  {
    icon: Store,
    title: 'Access Marketplace',
    description: 'Buy and sell agricultural products with transparent pricing and smart contracts.',
  },
  {
    icon: BarChart3,
    title: 'Monitor Your Farm',
    description: 'Use IoT sensors and AI analytics to optimize your farming operations.',
  },
];

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {currentStepData.title}
          </h2>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {currentStepData.description}
          </p>

          {/* Progress indicators */}
          <div className="flex justify-center space-x-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep
                    ? 'bg-green-600'
                    : index < currentStep
                    ? 'bg-green-300'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSkip}
              className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}