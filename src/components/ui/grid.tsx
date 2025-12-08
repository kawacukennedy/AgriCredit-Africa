import React from 'react';
import { cn } from '@/lib/utils';

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: number | string;
  rows?: number | string;
  gap?: string;
  areas?: string;
  autoFlow?: 'row' | 'column' | 'dense';
}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({
    className,
    columns,
    rows,
    gap,
    areas,
    autoFlow = 'row',
    style,
    ...props
  }, ref) => {
    const customStyle: React.CSSProperties = {
      ...style,
      ...(columns && { gridTemplateColumns: typeof columns === 'number' ? `repeat(${columns}, 1fr)` : columns }),
      ...(rows && { gridTemplateRows: typeof rows === 'number' ? `repeat(${rows}, 1fr)` : rows }),
      ...(gap && { gap }),
      ...(areas && { gridTemplateAreas: areas }),
      ...(autoFlow && { gridAutoFlow: autoFlow }),
    };

    return (
      <div
        ref={ref}
        className={cn('grid', className)}
        style={customStyle}
        {...props}
      />
    );
  }
);

Grid.displayName = 'Grid';

export { Grid };