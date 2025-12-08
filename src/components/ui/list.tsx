import React from 'react';
import { cn } from '@/lib/utils';

export interface ListItem {
  id: string | number;
  title: string;
  subtitle?: string;
  avatar?: string | React.ReactNode;
  actions?: React.ReactNode;
  metadata?: React.ReactNode;
}

export interface ListProps {
  items: ListItem[];
  variant?: 'default' | 'borderless' | 'divided';
  itemHeight?: string;
  onItemClick?: (item: ListItem) => void;
  className?: string;
}

export function List({
  items,
  variant = 'default',
  itemHeight = '48px',
  onItemClick,
  className,
}: ListProps) {
  const listClasses = cn(
    'divide-y divide-neutral-200',
    {
      'border border-neutral-200 rounded-lg': variant === 'default',
      'border-0': variant === 'borderless',
      'divide-neutral-100': variant === 'divided',
    },
    className
  );

  const itemClasses = cn(
    'flex items-center px-4 py-3 hover:bg-neutral-50 transition-colors',
    {
      'cursor-pointer': onItemClick,
    }
  );

  return (
    <div className={listClasses}>
      {items.map((item) => (
        <div
          key={item.id}
          className={itemClasses}
          style={{ minHeight: itemHeight }}
          onClick={() => onItemClick?.(item)}
        >
          {/* Avatar */}
          {item.avatar && (
            <div className="flex-shrink-0 mr-3">
              {typeof item.avatar === 'string' ? (
                <img
                  src={item.avatar}
                  alt={item.title}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                item.avatar
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-neutral-900 truncate">
                  {item.title}
                </h4>
                {item.subtitle && (
                  <p className="text-sm text-neutral-500 truncate">
                    {item.subtitle}
                  </p>
                )}
              </div>

              {/* Metadata */}
              {item.metadata && (
                <div className="ml-3 flex-shrink-0 text-sm text-neutral-500">
                  {item.metadata}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {item.actions && (
            <div className="ml-3 flex-shrink-0">
              {item.actions}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default List;