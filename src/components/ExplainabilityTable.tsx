type Row = {
  id: string;
  prediction: string;
  shap: number[]; // mini-graph values
  label: string;
};

const rows: Row[] = [
  { id: "1", prediction: "0.82", shap: [0.1, -0.05, 0.3, 0.2, -0.1], label: "Positive" },
  { id: "2", prediction: "0.41", shap: [-0.2, 0.05, -0.1, 0.1, 0.02], label: "Negative" },
  { id: "3", prediction: "0.67", shap: [0.3, 0.12, -0.05, -0.02, 0.07], label: "Positive" },
];

function MiniSpark({ values }: { values: number[] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const norm = (v: number) => (v - min) / (max - min || 1);
  return (
    <div className="h-6 w-24 flex items-end gap-0.5">
      {values.map((v, i) => (
        <div key={i} className="w-1.5 bg-purple-500/60" style={{ height: `${Math.round(norm(v) * 100)}%` }} />
      ))}
    </div>
  );
}

export default function ExplainabilityTable() {
  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-black/5 dark:bg-white/10">
          <tr>
            <th className="text-left px-3 py-2">ID</th>
            <th className="text-left px-3 py-2">Prediction</th>
            <th className="text-left px-3 py-2">SHAP</th>
            <th className="text-left px-3 py-2">Label</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-black/5 dark:border-white/5">
              <td className="px-3 py-2">{r.id}</td>
              <td className="px-3 py-2">{r.prediction}</td>
              <td className="px-3 py-2"><MiniSpark values={r.shap} /></td>
              <td className="px-3 py-2">
                <span className={
                  "px-2 py-1 rounded text-xs " +
                  (r.label === "Positive"
                    ? "bg-green-500/15 text-green-600 dark:text-green-400"
                    : "bg-red-500/15 text-red-600 dark:text-red-400")
                }>
                  {r.label}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
