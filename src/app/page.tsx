import MetricCard from "@/components/MetricCard";
import RealtimeCharts from "@/components/RealtimeCharts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - VeritasAI",
  description: "Real-time ML model monitoring dashboard with performance metrics and live charts",
};

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Real-Time Metrics Dashboard</h1>
      
      {/* Core Performance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Requests/min" value="1,248" delta="+4.2%" accent="green" />
        <MetricCard title="Latency p95" value="212 ms" delta="-3.1%" accent="green" />
        <MetricCard title="Accuracy" value="92.4%" delta="-0.6%" accent="yellow" />
        <MetricCard title="Model Drift" value="0.34" delta="exceeded" accent="red" />
      </div>

      {/* Model Quality Metrics */}
      <div>
        <h2 className="text-lg font-medium mb-4">Model Quality</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard title="Precision" value="94.7%" delta="+1.2%" accent="green" />
          <MetricCard title="Recall" value="89.3%" delta="+0.8%" accent="green" />
          <MetricCard title="F1 Score" value="91.9%" delta="+1.0%" accent="green" />
          <MetricCard title="AUC-ROC" value="0.967" delta="+0.003" accent="green" />
        </div>
      </div>

      {/* System Performance */}
      <div>
        <h2 className="text-lg font-medium mb-4">System Performance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard title="CPU Usage" value="67%" delta="+12%" accent="yellow" />
          <MetricCard title="Memory" value="4.2 GB" delta="+0.3 GB" accent="green" />
          <MetricCard title="Disk I/O" value="45 MB/s" delta="-2 MB/s" accent="green" />
          <MetricCard title="Error Rate" value="0.12%" delta="+0.02%" accent="red" />
        </div>
      </div>

      {/* Data Quality Metrics */}
      <div>
        <h2 className="text-lg font-medium mb-4">Data Quality</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard title="Missing Values" value="2.1%" delta="-0.3%" accent="green" />
          <MetricCard title="Outliers" value="0.8%" delta="+0.1%" accent="yellow" />
          <MetricCard title="Schema Violations" value="0" delta="0" accent="green" />
          <MetricCard title="Data Freshness" value="<1m" delta="optimal" accent="green" />
        </div>
      </div>

      {/* Interactive Charts */}
      <RealtimeCharts />

      {/* Additional Business Metrics */}
      <div>
        <h2 className="text-lg font-medium mb-4">Business Impact</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <MetricCard title="Revenue Impact" value="+$24.7K" delta="+8.3%" accent="green" />
          <MetricCard title="Cost Savings" value="$12.1K" delta="+15.2%" accent="green" />
          <MetricCard title="Customer Satisfaction" value="4.7/5" delta="+0.2" accent="green" />
        </div>
      </div>
    </div>
  );
}
