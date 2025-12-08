import React from 'react';
import { cn } from '@/lib/utils';

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  color?: 'primary' | 'secondary' | 'neutral-900' | 'neutral-700' | 'neutral-600';
  align?: 'left' | 'center' | 'right' | 'justify';
  truncate?: boolean;
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, as: Component = 'h1', color = 'neutral-900', align = 'left', truncate = false, weight = 'bold', ...props }, ref) => {
    const baseClasses = 'font-heading';

    const colorClasses = {
      primary: 'text-primary-900',
      secondary: 'text-secondary-900',
      'neutral-900': 'text-neutral-900',
      'neutral-700': 'text-neutral-700',
      'neutral-600': 'text-neutral-600',
    };

    const alignClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify',
    };

    const weightClasses = {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    };

    const truncateClass = truncate ? 'truncate' : '';

    const sizeClasses = {
      h1: 'text-h1',
      h2: 'text-h2',
      h3: 'text-h3',
      h4: 'text-h4',
      h5: 'text-h5',
      h6: 'text-h6',
    };

    return (
      <Component
        ref={ref}
        className={cn(
          baseClasses,
          sizeClasses[Component],
          colorClasses[color],
          alignClasses[align],
          weightClasses[weight],
          truncateClass,
          className
        )}
        {...props}
      />
    );
  }
);

Heading.displayName = 'Heading';

export { Heading };