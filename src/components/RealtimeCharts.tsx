// Placeholder charts. Replace with real charting (e.g., Chart.js, Recharts) later.
export default function RealtimeCharts() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Real-Time Analytics</h2>
      
      {/* Primary Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="text-sm font-medium">Predictions per Minute</div>
            <div className="text-xs text-green-600 dark:text-green-400">↗ +4.2%</div>
          </div>
          <div className="h-48 rounded bg-gradient-to-r from-blue-500/20 to-blue-500/5 relative flex items-end justify-center p-4">
            <div className="text-xs text-black/50 dark:text-white/50 absolute top-2 left-2">Live Stream</div>
            <div className="text-xs text-black/50 dark:text-white/50">1,248 req/min avg</div>
          </div>
        </div>
        
        <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="text-sm font-medium">Model Accuracy Trend</div>
            <div className="text-xs text-yellow-600 dark:text-yellow-400">↘ -0.6%</div>
          </div>
          <div className="h-48 rounded bg-gradient-to-r from-green-500/20 to-green-500/5 relative flex items-end justify-center p-4">
            <div className="text-xs text-black/50 dark:text-white/50 absolute top-2 left-2">Last 24h</div>
            <div className="text-xs text-black/50 dark:text-white/50">92.4% current</div>
          </div>
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
          <div className="text-sm font-medium mb-3">Response Time Distribution</div>
          <div className="h-32 rounded bg-gradient-to-r from-purple-500/20 to-purple-500/5 relative flex items-center justify-center">
            <div className="text-xs text-black/50 dark:text-white/50">p95: 212ms</div>
          </div>
        </div>
        
        <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
          <div className="text-sm font-medium mb-3">Feature Drift Heatmap</div>
          <div className="h-32 rounded bg-gradient-to-r from-orange-500/20 to-orange-500/5 relative flex items-center justify-center">
            <div className="text-xs text-black/50 dark:text-white/50">Drift: 0.34</div>
          </div>
        </div>
        
        <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
          <div className="text-sm font-medium mb-3">Error Rate by Hour</div>
          <div className="h-32 rounded bg-gradient-to-r from-red-500/20 to-red-500/5 relative flex items-center justify-center">
            <div className="text-xs text-black/50 dark:text-white/50">0.12% avg</div>
          </div>
        </div>
      </div>

      {/* Model Performance Breakdown */}
      <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
        <div className="text-sm font-medium mb-3">Confusion Matrix - Real Time</div>
        <div className="grid grid-cols-2 gap-2 max-w-md">
          <div className="bg-green-500/10 border border-green-500/20 p-3 rounded text-center">
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">847</div>
            <div className="text-xs text-black/70 dark:text-white/70">True Positive</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded text-center">
            <div className="text-lg font-semibold text-red-600 dark:text-red-400">23</div>
            <div className="text-xs text-black/70 dark:text-white/70">False Positive</div>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded text-center">
            <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">67</div>
            <div className="text-xs text-black/70 dark:text-white/70">False Negative</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded text-center">
            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">312</div>
            <div className="text-xs text-black/70 dark:text-white/70">True Negative</div>
          </div>
        </div>
      </div>
    </div>
  );
}
