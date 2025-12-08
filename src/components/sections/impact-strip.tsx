import React from 'react';
import { cn } from '@/lib/utils';

export interface Metric {
  label: string;
  value: string;
  icon?: string;
  trend?: 'up' | 'down' | 'stable';
}

export interface ImpactMetricsProps {
  metrics: Metric[];
  animated?: boolean;
  duration?: number;
  className?: string;
}

export function ImpactMetrics({
  metrics,
  animated = true,
  duration = 2000,
  className,
}: ImpactMetricsProps) {
  return (
    <section className={cn('bg-white py-16 -mt-16 relative z-10 rounded-t-3xl shadow-lg', className)}>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {metrics.map((metric, index) => (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center mb-2">
                {metric.icon && (
                  <span className="text-2xl mr-2">{metric.icon}</span>
                )}
                <span
                  className={cn(
                    'text-3xl md:text-4xl font-bold text-primary-600',
                    animated && 'animate-pulse'
                  )}
                  style={{
                    animationDuration: animated ? `${duration}ms` : undefined,
                    animationDelay: animated ? `${index * 200}ms` : undefined,
                  }}
                >
                  {metric.value}
                </span>
                {metric.trend && (
                  <span className={cn(
                    'ml-2 text-sm',
                    {
                      'text-green-500': metric.trend === 'up',
                      'text-red-500': metric.trend === 'down',
                      'text-neutral-500': metric.trend === 'stable',
                    }
                  )}>
                    {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                  </span>
                )}
              </div>
              <div className="text-sm text-neutral-600 font-medium">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Legacy export for backward compatibility
export function ImpactStrip() {
  const metrics = [
    { label: 'Farmers Reached', value: '10,000+', icon: '👥', trend: 'up' as const },
    { label: 'Loans Disbursed', value: '$2.5M+', icon: '💰', trend: 'up' as const },
    { label: 'Carbon Credits', value: '50,000+', icon: '🌱', trend: 'up' as const },
    { label: 'Repayment Rate', value: '92%', icon: '✅', trend: 'stable' as const },
  ];

  return <ImpactMetrics metrics={metrics} />;
}