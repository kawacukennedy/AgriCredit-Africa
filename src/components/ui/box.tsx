import React from 'react';
import { cn } from '@/lib/utils';

interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: string;
  margin?: string;
  display?: 'block' | 'inline' | 'inline-block' | 'flex' | 'inline-flex' | 'grid' | 'inline-grid' | 'flow-root';
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
}

const Box = React.forwardRef<HTMLDivElement, BoxProps>(
  ({
    className,
    padding,
    margin,
    display,
    flexDirection,
    alignItems,
    justifyContent,
    style,
    ...props
  }, ref) => {
    const customStyle: React.CSSProperties = {
      ...style,
      ...(padding && { padding }),
      ...(margin && { margin }),
      ...(display && { display }),
      ...(flexDirection && { flexDirection }),
      ...(alignItems && { alignItems }),
      ...(justifyContent && { justifyContent }),
    };

    return (
      <div
        ref={ref}
        className={cn(className)}
        style={customStyle}
        {...props}
      />
    );
  }
);

Box.displayName = 'Box';

export { Box };