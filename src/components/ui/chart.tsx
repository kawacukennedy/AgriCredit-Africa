import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

export type ChartType = 'line' | 'bar' | 'pie' | 'scatter' | 'radar';

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
  }[];
}

export interface ChartProps {
  type: ChartType;
  data: ChartData;
  width?: number;
  height?: number;
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  animationDuration?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export function Chart({
  type,
  data,
  width = 400,
  height = 300,
  responsive = true,
  maintainAspectRatio = false,
  animationDuration = 1000,
  showLegend = true,
  showTooltip = true,
  className,
}: ChartProps) {
  // Simple SVG-based chart implementation
  // In a real app, you'd use Chart.js, D3, or similar

  const chartId = useMemo(() => `chart-${Math.random().toString(36).substring(2, 11)}`, []);

  const renderLineChart = () => {
    const { labels, datasets } = data;
    const maxValue = Math.max(...datasets.flatMap(d => d.data));
    const minValue = Math.min(...datasets.flatMap(d => d.data));
    const range = maxValue - minValue || 1;

    const points = datasets.map(dataset =>
      dataset.data.map((value, index) => {
        const x = (index / (labels.length - 1)) * width;
        const y = height - ((value - minValue) / range) * height;
        return `${x},${y}`;
      }).join(' ')
    );

    return (
      <svg width={width} height={height} className="border border-neutral-200 rounded">
        {/* Grid lines */}
        <defs>
          <pattern id={`grid-${chartId}`} width="40" height="20" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${chartId})`} />

        {/* Lines */}
        {datasets.map((dataset, datasetIndex) => (
          <polyline
            key={datasetIndex}
            points={points[datasetIndex]}
            fill="none"
            stroke={dataset.borderColor?.[0] || `hsl(${datasetIndex * 60}, 70%, 50%)`}
            strokeWidth={dataset.borderWidth || 2}
          />
        ))}

        {/* Data points */}
        {datasets.map((dataset, datasetIndex) =>
          dataset.data.map((value, index) => {
            const x = (index / (labels.length - 1)) * width;
            const y = height - ((value - minValue) / range) * height;
            return (
              <circle
                key={`${datasetIndex}-${index}`}
                cx={x}
                cy={y}
                r="4"
                fill={dataset.backgroundColor?.[0] || `hsl(${datasetIndex * 60}, 70%, 50%)`}
                stroke="white"
                strokeWidth="2"
              />
            );
          })
        )}

        {/* X-axis labels */}
        {labels.map((label, index) => (
          <text
            key={index}
            x={(index / (labels.length - 1)) * width}
            y={height + 15}
            textAnchor="middle"
            className="text-xs fill-neutral-600"
          >
            {label}
          </text>
        ))}
      </svg>
    );
  };

  const renderBarChart = () => {
    const { labels, datasets } = data;
    const maxValue = Math.max(...datasets.flatMap(d => d.data));
    const barWidth = width / (labels.length * datasets.length) - 4;
    const groupWidth = width / labels.length;

    return (
      <svg width={width} height={height} className="border border-neutral-200 rounded">
        {/* Grid lines */}
        <defs>
          <pattern id={`grid-${chartId}`} width="40" height="20" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${chartId})`} />

        {/* Bars */}
        {datasets.map((dataset, datasetIndex) =>
          dataset.data.map((value, index) => {
            const barHeight = (value / maxValue) * (height - 40);
            const x = index * groupWidth + (datasetIndex * (barWidth + 4)) + 2;
            const y = height - barHeight - 20;

            return (
              <rect
                key={`${datasetIndex}-${index}`}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={dataset.backgroundColor?.[0] || `hsl(${datasetIndex * 60}, 70%, 50%)`}
                className="transition-all duration-300 hover:opacity-80"
              />
            );
          })
        )}

        {/* X-axis labels */}
        {labels.map((label, index) => (
          <text
            key={index}
            x={index * groupWidth + groupWidth / 2}
            y={height - 5}
            textAnchor="middle"
            className="text-xs fill-neutral-600"
          >
            {label}
          </text>
        ))}
      </svg>
    );
  };

  const renderPieChart = () => {
    const { datasets } = data;
    const dataset = datasets[0]; // Simple implementation for single dataset
    const total = dataset.data.reduce((sum, value) => sum + value, 0);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;

    let currentAngle = -Math.PI / 2; // Start from top

    return (
      <svg width={width} height={height} className="border border-neutral-200 rounded">
        {dataset.data.map((value, index) => {
          const percentage = value / total;
          const angle = percentage * 2 * Math.PI;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;

          const x1 = centerX + radius * Math.cos(startAngle);
          const y1 = centerY + radius * Math.sin(startAngle);
          const x2 = centerX + radius * Math.cos(endAngle);
          const y2 = centerY + radius * Math.sin(endAngle);

          const largeArcFlag = percentage > 0.5 ? 1 : 0;

          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');

          currentAngle = endAngle;

          return (
            <path
              key={index}
              d={pathData}
              fill={dataset.backgroundColor?.[index] || `hsl(${index * 60}, 70%, 50%)`}
              className="transition-all duration-300 hover:opacity-80"
            />
          );
        })}
      </svg>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return renderLineChart();
      case 'bar':
        return renderBarChart();
      case 'pie':
        return renderPieChart();
      case 'scatter':
        return renderLineChart(); // Simplified
      case 'radar':
        return renderLineChart(); // Simplified
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div className={cn('chart-container', className)}>
      {renderChart()}

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap justify-center mt-4 space-x-4">
          {data.datasets.map((dataset, index) => (
            <div key={index} className="flex items-center">
              <div
                className="w-3 h-3 rounded mr-2"
                style={{
                  backgroundColor: dataset.backgroundColor?.[0] || `hsl(${index * 60}, 70%, 50%)`
                }}
              />
              <span className="text-sm text-neutral-600">{dataset.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Chart;