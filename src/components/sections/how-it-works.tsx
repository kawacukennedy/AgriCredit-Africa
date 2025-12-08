import React from 'react';
import { cn } from '@/lib/utils';

export interface Step {
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface HowItWorksProps {
  title: string;
  steps: Step[];
  layout?: 'horizontal' | 'vertical';
  className?: string;
}

export function HowItWorks({
  title,
  steps,
  layout = 'horizontal',
  className,
}: HowItWorksProps) {
  return (
    <section className={cn('py-16', className)}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-neutral-900 mb-12">
          {title}
        </h2>

        <div className={cn(
          'grid gap-8',
          layout === 'horizontal'
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
            : 'grid-cols-1 max-w-2xl mx-auto'
        )}>
          {steps.map((step, index) => (
            <div
              key={index}
              className={cn(
                'text-center group',
                layout === 'vertical' && 'flex items-start space-x-4'
              )}
            >
              {/* Step Number/Icon */}
              <div className={cn(
                'relative mb-6',
                layout === 'vertical' && 'mb-0 flex-shrink-0'
              )}>
                <div
                  className={cn(
                    'w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg transition-transform group-hover:scale-110',
                    step.color
                  )}
                >
                  {step.icon}
                </div>
                {layout === 'horizontal' && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-neutral-300 rounded-full" />
                )}
              </div>

              {/* Content */}
              <div className={layout === 'vertical' ? 'flex-1' : ''}>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Connector Line for Vertical Layout */}
              {layout === 'vertical' && index < steps.length - 1 && (
                <div className="absolute left-8 top-16 w-0.5 h-16 bg-neutral-300" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;