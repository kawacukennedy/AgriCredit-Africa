import React from 'react';
import { cn } from '@/lib/utils';

export interface GridProps {
  children: React.ReactNode;
  columns?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  rows?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  gap?: string;
  areas?: string[][];
  className?: string;
}

export function Grid({
  children,
  columns = 12,
  rows,
  gap = 'lg',
  areas,
  className,
}: GridProps) {
  const getGridTemplate = (value: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number } | undefined) => {
    if (typeof value === 'number') {
      return `repeat(${value}, 1fr)`;
    }

    if (typeof value === 'object') {
      const responsiveClasses: string[] = [];

      if (value.xs) responsiveClasses.push(`grid-cols-${value.xs}`);
      if (value.sm) responsiveClasses.push(`sm:grid-cols-${value.sm}`);
      if (value.md) responsiveClasses.push(`md:grid-cols-${value.md}`);
      if (value.lg) responsiveClasses.push(`lg:grid-cols-${value.lg}`);
      if (value.xl) responsiveClasses.push(`xl:grid-cols-${value.xl}`);

      return responsiveClasses.join(' ');
    }

    return 'grid-cols-12';
  };

  const gridTemplateColumns = getGridTemplate(columns);
  const gridTemplateRows = rows ? getGridTemplate(rows) : undefined;

  const gapClasses = {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
    '2xl': 'gap-12',
    '3xl': 'gap-16',
  };

  const areasString = areas ? areas.map(row => `"${row.join(' ')}"`).join(' ') : undefined;

  return (
    <div
      className={cn(
        'grid',
        typeof gridTemplateColumns === 'string' && gridTemplateColumns.includes('grid-cols-')
          ? gridTemplateColumns
          : '',
        gapClasses[gap as keyof typeof gapClasses] || 'gap-6',
        className
      )}
      style={{
        gridTemplateColumns: typeof gridTemplateColumns === 'string' && !gridTemplateColumns.includes('grid-cols-')
          ? gridTemplateColumns
          : undefined,
        gridTemplateRows: typeof gridTemplateRows === 'string' && !gridTemplateRows.includes('grid-rows-')
          ? gridTemplateRows
          : undefined,
        gridTemplateAreas: areasString,
      }}
    >
      {children}
    </div>
  );
}

export interface GridItemProps {
  children: React.ReactNode;
  colSpan?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  rowSpan?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  colStart?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  rowStart?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  area?: string;
  className?: string;
}

export function GridItem({
  children,
  colSpan,
  rowSpan,
  colStart,
  rowStart,
  area,
  className,
}: GridItemProps) {
  const getSpanClass = (prefix: string, value: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number } | undefined) => {
    if (typeof value === 'number') {
      return `${prefix}-${value}`;
    }

    if (typeof value === 'object') {
      const responsiveClasses: string[] = [];

      if (value.xs) responsiveClasses.push(`${prefix}-${value.xs}`);
      if (value.sm) responsiveClasses.push(`sm:${prefix}-${value.sm}`);
      if (value.md) responsiveClasses.push(`md:${prefix}-${value.md}`);
      if (value.lg) responsiveClasses.push(`lg:${prefix}-${value.lg}`);
      if (value.xl) responsiveClasses.push(`xl:${prefix}-${value.xl}`);

      return responsiveClasses.join(' ');
    }

    return '';
  };

  const colSpanClass = getSpanClass('col-span', colSpan);
  const rowSpanClass = getSpanClass('row-span', rowSpan);
  const colStartClass = getSpanClass('col-start', colStart);
  const rowStartClass = getSpanClass('row-start', rowStart);

  return (
    <div
      className={cn(
        colSpanClass,
        rowSpanClass,
        colStartClass,
        rowStartClass,
        className
      )}
      style={{
        gridArea: area,
      }}
    >
      {children}
    </div>
  );
}

// Layout regions as defined in specs
export function FullBleed({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('col-span-full', className)}>
      {children}
    </div>
  );
}

export function MainContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('col-span-full md:col-start-2 md:col-span-10 lg:col-start-3 lg:col-span-8', className)}>
      {children}
    </div>
  );
}

export function Sidebar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('col-span-full md:col-span-1 sticky top-0', className)}>
      {children}
    </div>
  );
}

export default Grid;