export default function ReportPreview() {
  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium">ML Model Performance Report</h3>
            <p className="text-sm text-black/70 dark:text-white/70 mt-1">
              Generated: {new Date().toLocaleDateString()} | Model: fraud-detection-v2.1
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-black/70 dark:text-white/70">Report ID</div>
            <div className="font-mono text-xs">RPT-2024-001</div>
          </div>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
        <h3 className="text-sm font-medium mb-4">Executive Summary</h3>
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-semibold text-green-600 dark:text-green-400">92.4%</div>
            <div className="text-xs text-black/70 dark:text-white/70">Overall Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">1,248</div>
            <div className="text-xs text-black/70 dark:text-white/70">Predictions/min</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400">0.34</div>
            <div className="text-xs text-black/70 dark:text-white/70">Data Drift</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-semibold text-red-600 dark:text-red-400">0.12%</div>
            <div className="text-xs text-black/70 dark:text-white/70">Error Rate</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className="text-sm mb-2 font-medium">Performance Trends (Last 30 Days)</div>
          <div className="h-40 rounded bg-gradient-to-r from-blue-500/20 to-blue-500/5 flex items-center justify-center">
            <span className="text-xs text-black/50 dark:text-white/50">Accuracy & Precision Trends</span>
          </div>
        </div>
        <div className="md:col-span-1">
          <div className="text-sm mb-2 font-medium">Prediction Distribution</div>
          <div className="h-40 rounded bg-gradient-to-r from-purple-500/20 to-purple-500/5 flex items-center justify-center">
            <span className="text-xs text-black/50 dark:text-white/50">Class Balance</span>
          </div>
        </div>
      </div>

      {/* Detailed Findings */}
      <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
        <h3 className="text-sm font-medium mb-4">Key Findings & Recommendations</h3>
        <div className="space-y-3 text-sm text-black/80 dark:text-white/80">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0"></div>
            <p><strong>Model Performance:</strong> Accuracy remains stable at 92.4% with precision of 94.7% and recall of 89.3%.</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 shrink-0"></div>
            <p><strong>Data Drift Alert:</strong> Moderate drift detected (0.34) in feature distributions. Recommend model retraining within 2 weeks.</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
            <p><strong>System Health:</strong> Average response time 212ms, 99.88% uptime. CPU usage elevated but within acceptable range.</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0"></div>
            <p><strong>Business Impact:</strong> Generated $24.7K additional revenue through improved fraud detection accuracy.</p>
          </div>
        </div>
      </div>

      {/* Compliance Section */}
      <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
        <h3 className="text-sm font-medium mb-4">Compliance & Governance</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-medium text-black/70 dark:text-white/70 mb-2">Audit Trail</h4>
            <div className="text-xs space-y-1">
              <div>✅ Model validation completed</div>
              <div>✅ Bias testing passed</div>
              <div>✅ Data lineage documented</div>
              <div>⚠️ Fairness metrics review pending</div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-medium text-black/70 dark:text-white/70 mb-2">Regulatory Compliance</h4>
            <div className="text-xs space-y-1">
              <div>✅ GDPR compliance verified</div>
              <div>✅ Model explainability requirements met</div>
              <div>✅ Risk assessment completed</div>
              <div>✅ Documentation up to date</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
