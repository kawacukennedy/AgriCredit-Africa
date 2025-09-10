import ExplainabilityTable from "@/components/ExplainabilityTable";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explainability - VeritasAI",
  description: "Per-prediction explainability dashboard with SHAP values and feature importance visualization",
};

export default function ExplainabilityPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Per-Prediction Explainability</h1>
      <ExplainabilityTable />
    </div>
  );
}
