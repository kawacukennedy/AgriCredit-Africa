import React from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fluid';
  padding?: string;
  center?: boolean;
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = 'lg', padding, center = false, ...props }, ref) => {
    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      fluid: 'max-w-full',
    };

    const paddingClass = padding ? '' : 'px-lg';
    const centerClass = center ? 'mx-auto' : '';

    return (
      <div
        ref={ref}
        className={cn(
          'w-full',
          sizeClasses[size],
          paddingClass,
          centerClass,
          className
        )}
        style={padding ? { padding } : undefined}
        {...props}
      />
    );
  }
);

Container.displayName = 'Container';

export { Container };