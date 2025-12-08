import React from 'react';
import { cn } from '@/lib/utils';

interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: string;
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  basis?: string;
  grow?: number;
  shrink?: number;
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
}

const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  ({
    className,
    gap,
    wrap = 'nowrap',
    basis,
    grow,
    shrink,
    direction = 'row',
    align = 'stretch',
    justify = 'flex-start',
    style,
    ...props
  }, ref) => {
    const customStyle: React.CSSProperties = {
      ...style,
      ...(gap && { gap }),
      ...(basis && { flexBasis: basis }),
      ...(grow !== undefined && { flexGrow: grow }),
      ...(shrink !== undefined && { flexShrink: shrink }),
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          `flex-${direction}`,
          `flex-${wrap}`,
          `items-${align}`,
          `justify-${justify}`,
          className
        )}
        style={customStyle}
        {...props}
      />
    );
  }
);

Flex.displayName = 'Flex';

export { Flex };