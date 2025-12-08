import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  variant?: 'striped' | 'bordered' | 'compact' | 'hoverable';
  selectable?: boolean;
  virtualScroll?: boolean;
  height?: string;
  onRowClick?: (row: T) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
  className?: string;
}

export function Table<T extends Record<string, any>>({
  data,
  columns,
  variant = 'striped',
  selectable = false,
  virtualScroll = false,
  height = '400px',
  onRowClick,
  onSelectionChange,
  className,
}: TableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState<Record<string, string>>({});

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Apply filters
    Object.entries(filters).forEach(([key, filterValue]) => {
      if (filterValue) {
        result = result.filter((row) => {
          const value = row[key];
          return String(value).toLowerCase().includes(filterValue.toLowerCase());
        });
      }
    });

    // Apply sorting
    if (sortColumn) {
      result.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, filters, sortColumn, sortDirection]);

  const handleSort = useCallback((columnKey: keyof T | string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  }, [columns, sortColumn, sortDirection]);

  const handleFilterChange = useCallback((columnKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnKey]: value,
    }));
  }, []);

  const handleRowSelect = useCallback((index: number) => {
    setSelectedRows(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(index)) {
        newSelected.delete(index);
      } else {
        newSelected.add(index);
      }

      const selectedData = Array.from(newSelected).map(i => filteredAndSortedData[i]);
      onSelectionChange?.(selectedData);

      return newSelected;
    });
  }, [filteredAndSortedData, onSelectionChange]);

  const handleSelectAll = useCallback(() => {
    setSelectedRows(prev => {
      const newSelected = prev.size === filteredAndSortedData.length ? new Set<number>() : new Set(filteredAndSortedData.map((_, i) => i));
      const selectedData = Array.from(newSelected).map(i => filteredAndSortedData[i]);
      onSelectionChange?.(selectedData);
      return newSelected;
    });
  }, [filteredAndSortedData, onSelectionChange]);

  const renderCell = (row: T, column: Column<T>) => {
    const value = row[column.key as keyof T];
    return column.render ? column.render(value, row) : String(value || '');
  };

  const tableClasses = cn(
    'w-full border-collapse',
    {
      'border border-neutral-200': variant === 'bordered',
      '[&_tbody_tr:nth-child(even)]:bg-neutral-50': variant === 'striped',
      '[&_td]:py-2 [&_th]:py-2': variant === 'compact',
      '[&_tbody_tr:hover]:bg-neutral-50': variant === 'hoverable',
    },
    className
  );

  const TableContent = () => (
    <>
      <thead className="bg-neutral-100">
        <tr>
          {selectable && (
            <th className="w-12 px-3 py-3 text-left">
              <input
                type="checkbox"
                checked={selectedRows.size === filteredAndSortedData.length && filteredAndSortedData.length > 0}
                onChange={handleSelectAll}
                className="rounded border-neutral-300"
              />
            </th>
          )}
          {columns.map((column) => (
            <th
              key={String(column.key)}
              className={cn(
                'px-4 py-3 text-left text-sm font-medium text-neutral-900 border-b border-neutral-200',
                column.className
              )}
              style={{ width: column.width }}
            >
              <div className="flex items-center justify-between">
                <span>{column.header}</span>
                {column.sortable && (
                  <button
                    onClick={() => handleSort(column.key)}
                    className="ml-2 text-neutral-400 hover:text-neutral-600"
                  >
                    {sortColumn === column.key ? (
                      sortDirection === 'asc' ? '↑' : '↓'
                    ) : '↕'}
                  </button>
                )}
              </div>
              {column.filterable && (
                <input
                  type="text"
                  placeholder={`Filter ${column.header}`}
                  value={filters[String(column.key)] || ''}
                  onChange={(e) => handleFilterChange(String(column.key), e.target.value)}
                  className="mt-1 w-full px-2 py-1 text-xs border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filteredAndSortedData.map((row, index) => (
          <tr
            key={index}
            className={cn(
              'border-b border-neutral-200',
              {
                'cursor-pointer': onRowClick,
                'bg-primary-50': selectedRows.has(index),
              }
            )}
            onClick={() => onRowClick?.(row)}
          >
            {selectable && (
              <td className="px-3 py-4">
                <input
                  type="checkbox"
                  checked={selectedRows.has(index)}
                  onChange={() => handleRowSelect(index)}
                  className="rounded border-neutral-300"
                />
              </td>
            )}
            {columns.map((column) => (
              <td
                key={String(column.key)}
                className={cn(
                  'px-4 py-4 text-sm text-neutral-900',
                  column.className
                )}
              >
                {renderCell(row, column)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </>
  );

  if (virtualScroll) {
    return (
      <div className="overflow-auto" style={{ height }}>
        <table className={tableClasses}>
          <TableContent />
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className={tableClasses}>
        <TableContent />
      </table>
    </div>
  );
}

export default Table;