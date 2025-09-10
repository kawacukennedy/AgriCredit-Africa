type Props = { title: string; value: string; delta?: string; accent?: "green" | "red" | "blue" | "yellow" };

export default function MetricCard({ title, value, delta, accent = "blue" }: Props) {
  const accentMap: Record<string, string> = {
    green: "bg-green-500/15 text-green-600 dark:text-green-400",
    red: "bg-red-500/15 text-red-600 dark:text-red-400",
    blue: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    yellow: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
  };
  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 bg-white/50 dark:bg-black/20">
      <div className="text-sm text-black/70 dark:text-white/70">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {delta && (
        <div className={`mt-2 inline-block text-xs px-2 py-0.5 rounded ${accentMap[accent]}`}>
          {delta}
        </div>
      )}
    </div>
  );
}
