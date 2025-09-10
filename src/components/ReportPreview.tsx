export default function ReportPreview() {
  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 grid md:grid-cols-3 gap-4">
      <div className="md:col-span-2">
        <div className="text-sm mb-2">Summary Metrics</div>
        <div className="h-40 rounded bg-gradient-to-r from-blue-500/20 to-blue-500/5" />
      </div>
      <div className="md:col-span-1">
        <div className="text-sm mb-2">Distribution</div>
        <div className="h-40 rounded bg-gradient-to-r from-purple-500/20 to-purple-500/5" />
      </div>
      <div className="md:col-span-3">
        <div className="text-sm mb-2">Notes</div>
        <div className="rounded border border-black/10 dark:border-white/10 p-3 text-xs text-black/70 dark:text-white/70">
          Audit-Ready PDF Report Preview with summary graphs and metadata.
        </div>
      </div>
    </div>
  );
}
