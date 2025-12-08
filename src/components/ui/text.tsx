import React from 'react';
import { cn } from '@/lib/utils';

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral-900' | 'neutral-700' | 'neutral-600' | 'neutral-500' | 'neutral-400';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  decoration?: 'none' | 'underline' | 'line-through';
  as?: 'p' | 'span' | 'div';
}

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, size = 'md', color = 'neutral-900', weight = 'normal', decoration = 'none', as: Component = 'p', ...props }, ref) => {
    const baseClasses = 'font-body';

    const sizeClasses = {
      xs: 'text-caption',
      sm: 'text-body_small',
      md: 'text-body_medium',
      lg: 'text-body_large',
      xl: 'text-h6',
    };

    const colorClasses = {
      primary: 'text-primary-900',
      secondary: 'text-secondary-900',
      success: 'text-success',
      warning: 'text-warning',
      error: 'text-error',
      info: 'text-info',
      'neutral-900': 'text-neutral-900',
      'neutral-700': 'text-neutral-700',
      'neutral-600': 'text-neutral-600',
      'neutral-500': 'text-neutral-500',
      'neutral-400': 'text-neutral-400',
    };

    const weightClasses = {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    };

    const decorationClasses = {
      none: '',
      underline: 'underline',
      'line-through': 'line-through',
    };

    return (
      <Component
        ref={ref}
        className={cn(
          baseClasses,
          sizeClasses[size],
          colorClasses[color],
          weightClasses[weight],
          decorationClasses[decoration],
          className
        )}
        {...props}
      />
    );
  }
);

Text.displayName = 'Text';

export { Text };