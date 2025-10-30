import React from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DataPoint {
  [key: string]: any;
}

interface LineChartProps {
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

export function CustomLineChart({
  data,
  dataKey,
  xAxisKey = 'timestamp',
  color = '#3b82f6',
  title,
  height = 300,
  showGrid = true,
  showLegend = false,
  xAxisFormatter,
  tooltipFormatter,
  className = ''
}: LineChartProps) {
  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-4">{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data}>
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
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}