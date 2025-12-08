import React from 'react';
import { cn } from '@/lib/utils';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
}

export interface WizardLayoutProps {
  steps: WizardStep[];
  currentStep: number;
  children: React.ReactNode;
  onNext?: () => void;
  onPrevious?: () => void;
  onStepClick?: (stepIndex: number) => void;
  nextLabel?: string;
  previousLabel?: string;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  className?: string;
}

export function WizardLayout({
  steps,
  currentStep,
  children,
  onNext,
  onPrevious,
  onStepClick,
  nextLabel = 'Next',
  previousLabel = 'Previous',
  canGoNext = true,
  canGoPrevious = true,
  className,
}: WizardLayoutProps) {
  return (
    <div className={cn('min-h-screen flex flex-col', className)}>
      {/* Steps Indicator */}
      <div className="h-18 bg-white border-b border-neutral-200 flex items-center justify-center px-6">
        <div className="flex items-center space-x-4 max-w-2xl w-full">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            const isClickable = onStepClick && (isCompleted || index === currentStep);

            return (
              <React.Fragment key={step.id}>
                <div className="flex items-center">
                  <button
                    onClick={() => isClickable && onStepClick(index)}
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                      {
                        'bg-primary-500 text-white': isActive,
                        'bg-primary-300 text-white': isCompleted,
                        'bg-neutral-200 text-neutral-600': !isCompleted && !isActive,
                        'cursor-pointer hover:opacity-80': isClickable,
                        'cursor-not-allowed': !isClickable,
                      }
                    )}
                    disabled={!isClickable}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </button>
                  <div className="ml-3 hidden sm:block">
                    <div className={cn(
                      'text-sm font-medium',
                      isActive ? 'text-primary-600' : isCompleted ? 'text-neutral-900' : 'text-neutral-500'
                    )}>
                      {step.title}
                    </div>
                    {step.description && (
                      <div className="text-xs text-neutral-500 mt-1">
                        {step.description}
                      </div>
                    )}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    'flex-1 h-0.5 mx-4',
                    isCompleted ? 'bg-primary-300' : 'bg-neutral-200'
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {children}
        </div>
      </div>

      {/* Navigation */}
      <div className="h-20 bg-white border-t border-neutral-200 flex items-center justify-between px-6">
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className={cn(
            'px-6 py-2 rounded-lg font-medium transition-colors',
            canGoPrevious
              ? 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300'
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
          )}
        >
          {previousLabel}
        </button>

        <div className="text-sm text-neutral-500">
          Step {currentStep + 1} of {steps.length}
        </div>

        <button
          onClick={onNext}
          disabled={!canGoNext}
          className={cn(
            'px-6 py-2 rounded-lg font-medium transition-colors',
            canGoNext
              ? 'bg-primary-500 text-white hover:bg-primary-600'
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
          )}
        >
          {currentStep === steps.length - 1 ? 'Complete' : nextLabel}
        </button>
      </div>
    </div>
  );
}

export default WizardLayout;