import ReportPreview from "@/components/ReportPreview";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reports - VeritasAI",
  description: "Audit-ready ML model reports with summary graphs and compliance documentation",
};

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Audit-Ready Report Preview</h1>
      <ReportPreview />
    </div>
  );
}
