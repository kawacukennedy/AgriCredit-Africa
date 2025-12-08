import React from 'react';
import { cn } from '@/lib/utils';

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'vertical' | 'horizontal';
  spacing?: string;
  align?: 'start' | 'center' | 'end' | 'stretch';
  divider?: boolean | React.ReactNode;
}

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({
    className,
    direction = 'vertical',
    spacing = 'md',
    align = 'stretch',
    divider,
    children,
    ...props
  }, ref) => {
    const directionClass = direction === 'vertical' ? 'flex-col' : 'flex-row';
    const alignClass = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    }[align];

    const spacingClass = direction === 'vertical' ? `space-y-${spacing}` : `space-x-${spacing}`;

    const childrenArray = React.Children.toArray(children);

    if (divider && childrenArray.length > 1) {
      const dividedChildren = childrenArray.reduce((acc: React.ReactNode[], child, index) => {
        acc.push(child);
        if (index < childrenArray.length - 1) {
          acc.push(
            React.isValidElement(divider) ? (
              React.cloneElement(divider, { key: `divider-${index}` })
            ) : (
              <div key={`divider-${index}`} className="border-t border-neutral-200" />
            )
          );
        }
        return acc;
      }, []);

      return (
        <div
          ref={ref}
          className={cn('flex', directionClass, alignClass, className)}
          {...props}
        >
          {dividedChildren}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn('flex', directionClass, alignClass, spacingClass, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Stack.displayName = 'Stack';

export { Stack };