export default function TopBar() {
  return (
    <div className="w-full border-b border-black/10 dark:border-white/10 bg-black/[.02] dark:bg-white/[.02]">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
        <div className="text-sm">
          Notifications & Alerts
        </div>
        <div className="flex gap-3 text-xs">
          <span className="px-2 py-1 rounded bg-red-500/15 text-red-600 dark:text-red-400">Model Drift exceeded threshold</span>
          <span className="px-2 py-1 rounded bg-yellow-500/15 text-yellow-700 dark:text-yellow-300">New audit-ready report generated</span>
        </div>
      </div>
    </div>
  );
}
