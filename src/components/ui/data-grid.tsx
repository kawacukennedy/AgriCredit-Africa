import React, { useState, useRef, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface DataGridColumn<T> {
  key: keyof T | string;
  header: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  groupable?: boolean;
}

export interface DataGridProps<T> {
  data: T[];
  columns: DataGridColumn<T>[];
  minHeight?: string;
  maxHeight?: string;
  onRowClick?: (row: T) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
  enableColumnResize?: boolean;
  enableColumnReorder?: boolean;
  enableRowGrouping?: boolean;
  className?: string;
}

export function DataGrid<T extends Record<string, any>>({
  data,
  columns: initialColumns,
  minHeight = '400px',
  maxHeight = '600px',
  onRowClick,
  onSelectionChange,
  enableColumnResize = true,
  enableColumnReorder = true,
  enableRowGrouping = true,
  className,
}: DataGridProps<T>) {
  const [columns, setColumns] = useState(initialColumns);
  const [sortColumn, setSortColumn] = useState<keyof T | string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [groupBy, setGroupBy] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const tableRef = useRef<HTMLTableElement>(null);

  const processedData = useMemo(() => {
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

  const groupedData = useMemo(() => {
    if (!groupBy) return { groups: [], ungrouped: processedData };

    const groups: Record<string, T[]> = {};
    processedData.forEach((row) => {
      const groupKey = String(row[groupBy]);
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(row);
    });

    return {
      groups: Object.entries(groups).map(([key, items]) => ({ key, items })),
      ungrouped: []
    };
  }, [processedData, groupBy]);

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

      const selectedData = Array.from(newSelected).map(i => processedData[i]);
      onSelectionChange?.(selectedData);

      return newSelected;
    });
  }, [processedData, onSelectionChange]);

  const handleGroupToggle = useCallback((groupKey: string) => {
    setExpandedGroups(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(groupKey)) {
        newExpanded.delete(groupKey);
      } else {
        newExpanded.add(groupKey);
      }
      return newExpanded;
    });
  }, []);

  const handleColumnReorder = useCallback((draggedKey: string, targetKey: string) => {
    if (!enableColumnReorder) return;

    const draggedIndex = columns.findIndex(col => col.key === draggedKey);
    const targetIndex = columns.findIndex(col => col.key === targetKey);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newColumns = [...columns];
    const [dragged] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(targetIndex, 0, dragged);

    setColumns(newColumns);
  }, [columns, enableColumnReorder]);

  const handleResizeStart = useCallback((e: React.MouseEvent, columnKey: string) => {
    if (!enableColumnResize) return;

    const column = columns.find(col => col.key === columnKey);
    if (!column?.resizable) return;

    setResizingColumn(columnKey);
    setStartX(e.clientX);
    setStartWidth(column.width || 120);
  }, [columns, enableColumnResize]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizingColumn) return;

    const deltaX = e.clientX - startX;
    const newWidth = Math.max(80, startWidth + deltaX);

    setColumns(prev => prev.map(col =>
      col.key === resizingColumn
        ? { ...col, width: newWidth }
        : col
    ));
  }, [resizingColumn, startX, startWidth]);

  const handleResizeEnd = useCallback(() => {
    setResizingColumn(null);
  }, []);

  React.useEffect(() => {
    if (resizingColumn) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [resizingColumn, handleResizeMove, handleResizeEnd]);

  const renderCell = (row: T, column: DataGridColumn<T>) => {
    const value = row[column.key as keyof T];
    return column.render ? column.render(value, row) : String(value || '');
  };

  const renderGroupRow = (group: { key: string; items: T[] }) => {
    const isExpanded = expandedGroups.has(group.key);

    return (
      <React.Fragment key={`group-${group.key}`}>
        <tr
          className="bg-neutral-100 font-medium cursor-pointer hover:bg-neutral-200"
          onClick={() => handleGroupToggle(group.key)}
        >
          <td colSpan={columns.length + 1} className="px-4 py-2">
            <div className="flex items-center">
              <span className="mr-2">{isExpanded ? '▼' : '▶'}</span>
              <span>{group.key} ({group.items.length} items)</span>
            </div>
          </td>
        </tr>
        {isExpanded && group.items.map((row, rowIndex) => (
          <tr
            key={rowIndex}
            className={cn(
              'border-b border-neutral-200 hover:bg-neutral-50',
              { 'cursor-pointer': onRowClick }
            )}
            onClick={() => onRowClick?.(row)}
          >
            <td className="px-3 py-2">
              <input
                type="checkbox"
                checked={selectedRows.has(rowIndex)}
                onChange={() => handleRowSelect(rowIndex)}
                className="rounded border-neutral-300"
              />
            </td>
            {columns.map((column) => (
              <td
                key={String(column.key)}
                className="px-4 py-2 text-sm text-neutral-900"
                style={{ width: column.width }}
              >
                {renderCell(row, column)}
              </td>
            ))}
          </tr>
        ))}
      </React.Fragment>
    );
  };

  return (
    <div
      className={cn('border border-neutral-200 rounded-lg overflow-hidden', className)}
      style={{ minHeight, maxHeight }}
    >
      {/* Toolbar */}
      <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {enableRowGrouping && (
            <select
              value={String(groupBy || '')}
              onChange={(e) => setGroupBy(e.target.value || null)}
              className="px-2 py-1 text-sm border border-neutral-300 rounded"
            >
              <option value="">No Grouping</option>
              {columns.filter(col => col.groupable).map(col => (
                <option key={String(col.key)} value={String(col.key)}>
                  Group by {col.header}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="text-sm text-neutral-600">
          {processedData.length} rows
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto" style={{ maxHeight: `calc(${maxHeight} - 60px)` }}>
        <table ref={tableRef} className="w-full border-collapse">
          <thead className="bg-neutral-100 sticky top-0 z-10">
            <tr>
              <th className="w-12 px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedRows.size === processedData.length && processedData.length > 0}
                  onChange={() => {
                    const newSelected = selectedRows.size === processedData.length ? new Set<number>() : new Set(processedData.map((_, i) => i));
                    setSelectedRows(newSelected);
                    const selectedData = Array.from(newSelected).map(i => processedData[i]);
                    onSelectionChange?.(selectedData);
                  }}
                  className="rounded border-neutral-300"
                />
              </th>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    'px-4 py-3 text-left text-sm font-medium text-neutral-900 border-b border-neutral-200 relative select-none',
                    { 'cursor-move': enableColumnReorder }
                  )}
                  style={{ width: column.width ? `${column.width}px` : undefined }}
                  draggable={enableColumnReorder}
                  onDragStart={() => setDraggedColumn(String(column.key))}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => draggedColumn && handleColumnReorder(draggedColumn, String(column.key))}
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
                  {enableColumnResize && column.resizable && (
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize bg-neutral-300 hover:bg-neutral-400"
                      onMouseDown={(e) => handleResizeStart(e, String(column.key))}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupBy
              ? groupedData.groups.map(renderGroupRow)
              : processedData.map((row, index) => (
                  <tr
                    key={index}
                    className={cn(
                      'border-b border-neutral-200 hover:bg-neutral-50',
                      { 'cursor-pointer': onRowClick }
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(index)}
                        onChange={() => handleRowSelect(index)}
                        className="rounded border-neutral-300"
                      />
                    </td>
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className="px-4 py-2 text-sm text-neutral-900"
                        style={{ width: column.width ? `${column.width}px` : undefined }}
                      >
                        {renderCell(row, column)}
                      </td>
                    ))}
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataGrid;