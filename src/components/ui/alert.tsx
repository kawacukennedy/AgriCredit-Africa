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
    container: 'bg-success/10 border-success/20 text-success',
    icon: 'text-success',
    defaultIcon: '✓'
  },
  error: {
    container: 'bg-destructive/10 border-destructive/20 text-destructive',
    icon: 'text-destructive',
    defaultIcon: '✕'
  },
  warning: {
    container: 'bg-warning/10 border-warning/20 text-warning',
    icon: 'text-warning',
    defaultIcon: '⚠'
  },
  info: {
    container: 'bg-info/10 border-info/20 text-info',
    icon: 'text-info',
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
          className="flex-shrink-0 ml-3 p-1 rounded hover:bg-muted transition-colors"
          aria-label="Dismiss alert"
        >
          <span className="text-lg">×</span>
        </button>
      )}
    </div>
  );
}

export default Alert;