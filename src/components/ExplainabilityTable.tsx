type Row = {
  id: string;
  prediction: string;
  shap: number[]; // mini-graph values
  label: string;
};

const rows: Row[] = [
  { id: "pred_001", prediction: "0.82", shap: [0.1, -0.05, 0.3, 0.2, -0.1], label: "Positive" },
  { id: "pred_002", prediction: "0.41", shap: [-0.2, 0.05, -0.1, 0.1, 0.02], label: "Negative" },
  { id: "pred_003", prediction: "0.67", shap: [0.3, 0.12, -0.05, -0.02, 0.07], label: "Positive" },
  { id: "pred_004", prediction: "0.93", shap: [0.4, 0.15, 0.2, -0.05, 0.1], label: "Positive" },
  { id: "pred_005", prediction: "0.28", shap: [-0.3, -0.1, -0.15, 0.08, -0.05], label: "Negative" },
  { id: "pred_006", prediction: "0.76", shap: [0.25, 0.08, -0.02, 0.12, 0.05], label: "Positive" },
  { id: "pred_007", prediction: "0.15", shap: [-0.4, -0.08, -0.2, -0.05, -0.12], label: "Negative" },
  { id: "pred_008", prediction: "0.89", shap: [0.35, 0.18, 0.15, -0.08, 0.13], label: "Positive" },
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
