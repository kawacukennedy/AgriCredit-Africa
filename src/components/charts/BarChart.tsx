import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DataPoint {
  [key: string]: any;
}

interface CustomBarChartProps {
  data: DataPoint[];
  dataKey: string;
  xAxisKey?: string;
  color?: string;
  title?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  xAxisFormatter?: (value: any) => string;
  tooltipFormatter?: (value: any, name: string) => [string, string];
  className?: string;
}

export function CustomBarChart({
  data,
  dataKey,
  xAxisKey = 'name',
  color = '#8b5cf6',
  title,
  height = 300,
  showGrid = true,
  showLegend = false,
  xAxisFormatter,
  tooltipFormatter,
  className = ''
}: CustomBarChartProps) {
  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-4">{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis
            dataKey={xAxisKey}
            tickFormatter={xAxisFormatter}
            fontSize={12}
          />
          <YAxis fontSize={12} />
          <Tooltip
            labelFormatter={xAxisFormatter}
            formatter={tooltipFormatter}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          {showLegend && <Legend />}
          <Bar
            dataKey={dataKey}
            fill={color}
            radius={[4, 4, 0, 0]}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}