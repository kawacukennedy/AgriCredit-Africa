import Image from "next/image";

import MetricCard from "@/components/MetricCard";
import RealtimeCharts from "@/components/RealtimeCharts";

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Real-Time Metrics Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Requests/min" value="1,248" delta="+4.2%" accent="green" />
        <MetricCard title="Latency p95" value="212 ms" delta="-3.1%" accent="green" />
        <MetricCard title="Accuracy" value="92.4%" delta="-0.6%" accent="yellow" />
        <MetricCard title="Drift" value="0.34" delta="exceeded" accent="red" />
      </div>
      <RealtimeCharts />
    </div>
  );
}
