import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type SnackbarVariant = 'success' | 'error' | 'warning' | 'info';

export interface SnackbarProps {
  message: string;
  variant?: SnackbarVariant;
  autoHideDuration?: number;
  onClose?: () => void;
  action?: React.ReactNode;
  className?: string;
}

const variantStyles = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  warning: 'bg-yellow-500 text-black',
  info: 'bg-blue-500 text-white'
};

export function Snackbar({
  message,
  variant = 'info',
  autoHideDuration = 6000,
  onClose,
  action,
  className,
}: SnackbarProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [autoHideDuration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto',
        'transform transition-all duration-300 ease-in-out',
        'shadow-lg rounded-lg p-4 flex items-center justify-between',
        variantStyles[variant],
        className
      )}
      role="alert"
    >
      <span className="flex-1">{message}</span>

      {action && (
        <div className="ml-4 flex-shrink-0">
          {action}
        </div>
      )}

      <button
        onClick={handleClose}
        className="ml-4 p-1 rounded hover:bg-black hover:bg-opacity-20 transition-colors"
        aria-label="Close snackbar"
      >
        <span className="text-lg">×</span>
      </button>
    </div>
  );
}

// Snackbar Manager for multiple snackbars
interface SnackbarItem extends SnackbarProps {
  id: string;
}

interface SnackbarManagerProps {
  snackbars: SnackbarItem[];
  onRemove: (id: string) => void;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

export function SnackbarManager({
  snackbars,
  onRemove,
  position = 'bottom-right'
}: SnackbarManagerProps) {
  const positionClasses = {
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4'
  };

  return (
    <div className={cn('fixed z-50 space-y-2', positionClasses[position])}>
      {snackbars.map((snackbar) => (
        <Snackbar
          key={snackbar.id}
          {...snackbar}
          onClose={() => onRemove(snackbar.id)}
        />
      ))}
    </div>
  );
}

export default Snackbar;