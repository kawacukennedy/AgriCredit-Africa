import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

export interface AlertProps {
  variant: AlertVariant;
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

const variantStyles = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: 'text-green-400',
    defaultIcon: '✓'
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: 'text-red-400',
    defaultIcon: '✕'
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: 'text-yellow-400',
    defaultIcon: '⚠'
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: 'text-blue-400',
    defaultIcon: 'ℹ'
  }
};

export function Alert({
  variant,
  title,
  message,
  dismissible = true,
  onDismiss,
  icon,
  className,
}: AlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'border rounded-lg p-4 flex items-start',
        styles.container,
        className
      )}
      role="alert"
    >
      {/* Icon */}
      <div className={cn('flex-shrink-0 mr-3', styles.icon)}>
        {icon || <span className="text-lg font-bold">{styles.defaultIcon}</span>}
      </div>

      {/* Content */}
      <div className="flex-1">
        {title && (
          <h4 className="font-medium mb-1">{title}</h4>
        )}
        <p className="text-sm">{message}</p>
      </div>

      {/* Dismiss button */}
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 ml-3 p-1 rounded hover:bg-black hover:bg-opacity-10 transition-colors"
          aria-label="Dismiss alert"
        >
          <span className="text-lg">×</span>
        </button>
      )}
    </div>
  );
}

export default Alert;