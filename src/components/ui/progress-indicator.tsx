import React from 'react';
import { cn } from '@/lib/utils';

export type ProgressVariant = 'linear' | 'circular' | 'steps';

export interface ProgressIndicatorProps {
  variant?: ProgressVariant;
  value?: number; // 0-100
  max?: number;
  indeterminate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  showValue?: boolean;
  steps?: number; // For steps variant
  currentStep?: number; // For steps variant
  className?: string;
}

export function ProgressIndicator({
  variant = 'linear',
  value = 0,
  max = 100,
  indeterminate = false,
  size = 'md',
  color = '#4CAF50',
  showValue = false,
  steps,
  currentStep,
  className,
}: ProgressIndicatorProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: {
      linear: 'h-1',
      circular: 'w-4 h-4',
      steps: 'h-2'
    },
    md: {
      linear: 'h-2',
      circular: 'w-8 h-8',
      steps: 'h-3'
    },
    lg: {
      linear: 'h-4',
      circular: 'w-12 h-12',
      steps: 'h-4'
    }
  };

  if (variant === 'linear') {
    return (
      <div className={cn('w-full bg-neutral-200 rounded-full overflow-hidden', className)}>
        <div
          className={cn(
            'transition-all duration-300 ease-in-out rounded-full',
            sizeClasses[size].linear,
            indeterminate && 'animate-pulse'
          )}
          style={{
            width: indeterminate ? '100%' : `${percentage}%`,
            backgroundColor: color,
          }}
        />
        {showValue && (
          <div className="text-center mt-2 text-sm text-neutral-600">
            {Math.round(percentage)}%
          </div>
        )}
      </div>
    );
  }

  if (variant === 'circular') {
    const radius = size === 'sm' ? 6 : size === 'md' ? 14 : 22;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = indeterminate ? circumference * 0.75 : circumference - (percentage / 100) * circumference;

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg
          className={cn(sizeClasses[size].circular)}
          viewBox={`0 0 ${radius * 2 + 4} ${radius * 2 + 4}`}
        >
          {/* Background circle */}
          <circle
            cx={radius + 2}
            cy={radius + 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="2"
          />
          {/* Progress circle */}
          <circle
            cx={radius + 2}
            cy={radius + 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn(
              'transition-all duration-300 ease-in-out',
              indeterminate && 'animate-spin'
            )}
            style={{
              transformOrigin: `${radius + 2}px ${radius + 2}px`,
            }}
          />
        </svg>
        {showValue && !indeterminate && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-medium">{Math.round(percentage)}%</span>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'steps' && steps && currentStep !== undefined) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        {Array.from({ length: steps }, (_, index) => (
          <div
            key={index}
            className={cn(
              'flex-1 rounded-full transition-all duration-300',
              sizeClasses[size].steps,
              index < currentStep
                ? 'bg-primary-500'
                : index === currentStep
                ? 'bg-primary-300'
                : 'bg-neutral-200'
            )}
          />
        ))}
        {showValue && (
          <div className="ml-2 text-sm text-neutral-600">
            {currentStep + 1} / {steps}
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default ProgressIndicator;