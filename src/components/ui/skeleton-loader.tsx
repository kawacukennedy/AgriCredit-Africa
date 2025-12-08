import React from 'react';
import { cn } from '@/lib/utils';

export type SkeletonVariant = 'text' | 'circle' | 'rectangle' | 'card';

export interface SkeletonLoaderProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  animation?: 'pulse' | 'wave' | 'none';
  speed?: string;
  className?: string;
}

export function SkeletonLoader({
  variant = 'rectangle',
  width,
  height,
  borderRadius,
  animation = 'pulse',
  speed = '1.5s',
  className,
}: SkeletonLoaderProps) {
  const baseClasses = 'bg-neutral-200';

  const variantClasses = {
    text: 'h-4 rounded',
    circle: 'rounded-full',
    rectangle: 'rounded',
    card: 'rounded-lg p-4 space-y-3'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'relative overflow-hidden',
    none: ''
  };

  const getSize = (size: string | number | undefined) => {
    if (typeof size === 'number') return `${size}px`;
    return size;
  };

  const style: React.CSSProperties = {
    width: getSize(width),
    height: getSize(height),
    borderRadius,
    animationDuration: speed,
  };

  if (variant === 'card') {
    return (
      <div
        className={cn(
          baseClasses,
          variantClasses.card,
          animationClasses[animation],
          className
        )}
        style={style}
      >
        {/* Card header skeleton */}
        <div className="flex items-center space-x-3">
          <div className={cn(baseClasses, 'w-10 h-10 rounded-full', animationClasses[animation])} />
          <div className="flex-1 space-y-2">
            <div className={cn(baseClasses, 'h-4 rounded', animationClasses[animation])} style={{ width: '60%' }} />
            <div className={cn(baseClasses, 'h-3 rounded', animationClasses[animation])} style={{ width: '40%' }} />
          </div>
        </div>

        {/* Card content skeleton */}
        <div className="space-y-2">
          <div className={cn(baseClasses, 'h-3 rounded', animationClasses[animation])} />
          <div className={cn(baseClasses, 'h-3 rounded', animationClasses[animation])} style={{ width: '80%' }} />
          <div className={cn(baseClasses, 'h-3 rounded', animationClasses[animation])} style={{ width: '60%' }} />
        </div>

        {/* Card actions skeleton */}
        <div className="flex space-x-2">
          <div className={cn(baseClasses, 'h-8 rounded', animationClasses[animation])} style={{ width: '80px' }} />
          <div className={cn(baseClasses, 'h-8 rounded', animationClasses[animation])} style={{ width: '60px' }} />
        </div>

        {/* Wave animation overlay */}
        {animation === 'wave' && (
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
            style={{
              animation: `wave ${speed} infinite`,
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
    >
      {/* Wave animation overlay */}
      {animation === 'wave' && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
          style={{
            animation: `wave ${speed} infinite`,
          }}
        />
      )}
    </div>
  );
}

// Predefined skeleton components for common use cases
export function SkeletonText({ lines = 1, className, ...props }: { lines?: number } & Omit<SkeletonLoaderProps, 'variant'>) {
  if (lines === 1) {
    return <SkeletonLoader variant="text" {...props} className={className} />;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonLoader
          key={i}
          variant="text"
          width={i === lines - 1 ? '60%' : '100%'}
          {...props}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 40, className, ...props }: { size?: number } & Omit<SkeletonLoaderProps, 'variant'>) {
  return (
    <SkeletonLoader
      variant="circle"
      width={size}
      height={size}
      {...props}
      className={className}
    />
  );
}

export function SkeletonButton({ width = 80, height = 32, className, ...props }: Omit<SkeletonLoaderProps, 'variant'>) {
  return (
    <SkeletonLoader
      variant="rectangle"
      width={width}
      height={height}
      borderRadius="4px"
      {...props}
      className={className}
    />
  );
}

export default SkeletonLoader;