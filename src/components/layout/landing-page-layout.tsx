import React from 'react';
import { cn } from '@/lib/utils';

export interface LandingPageLayoutProps {
  hero: React.ReactNode;
  sections: React.ReactNode[];
  footer?: React.ReactNode;
  className?: string;
}

export function LandingPageLayout({
  hero,
  sections,
  footer,
  className,
}: LandingPageLayoutProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Hero Section */}
      <section className="min-h-[80vh] pt-16 pb-16">
        <div className="container mx-auto px-4">
          {hero}
        </div>
      </section>

      {/* Main Sections */}
      {sections.map((section, index) => (
        <section key={index} className="py-24">
          <div className="container mx-auto px-4">
            {section}
          </div>
        </section>
      ))}

      {/* Footer */}
      {footer && (
        <footer className="bg-neutral-900 text-white py-12">
          <div className="container mx-auto px-4">
            {footer}
          </div>
        </footer>
      )}
    </div>
  );
}

// Container component for responsive widths
export interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'fluid';
  className?: string;
}

export function Container({ children, size = 'lg', className }: ContainerProps) {
  const sizeClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    xxl: 'max-w-screen-2xl',
    fluid: 'max-w-full'
  };

  return (
    <div className={cn('mx-auto px-4', sizeClasses[size], className)}>
      {children}
    </div>
  );
}

export default LandingPageLayout;