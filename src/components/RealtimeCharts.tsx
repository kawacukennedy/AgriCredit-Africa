// Placeholder charts. Replace with real charting (e.g., Chart.js) later.
export default function RealtimeCharts() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
        <div className="text-sm mb-2">Predictions per minute</div>
        <div className="h-48 rounded bg-gradient-to-r from-blue-500/20 to-blue-500/5" aria-label="Line chart placeholder" />
      </div>
      <div className="rounded-lg border border-black/10 dark:border-white/10 p-4">
        <div className="text-sm mb-2">Accuracy vs Time</div>
        <div className="h-48 rounded bg-gradient-to-r from-green-500/20 to-green-500/5" aria-label="Bar chart placeholder" />
      </div>
    </div>
  );
}
