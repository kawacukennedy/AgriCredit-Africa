import React from 'react';
import { cn } from '@/lib/utils';

export interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
  className?: string;
}

export function AuthLayout({
  children,
  title,
  subtitle,
  backgroundImage,
  className,
}: AuthLayoutProps) {
  return (
    <div
      className={cn(
        'min-h-screen flex items-center justify-center p-6',
        'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800',
        className
      )}
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-md">
        {/* Auth Card */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl p-8 w-full">
          {/* Header */}
          {(title || subtitle) && (
            <div className="text-center mb-8">
              {title && (
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-neutral-600 dark:text-neutral-400">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Content */}
          {children}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            © 2024 AgriCredit Africa. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;