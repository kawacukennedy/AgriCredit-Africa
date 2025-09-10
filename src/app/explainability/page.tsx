import ExplainabilityTable from "@/components/ExplainabilityTable";

export default function ExplainabilityPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Per-Prediction Explainability</h1>
      <ExplainabilityTable />
    </div>
  );
}
