import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { departments } from "@/lib/mock-data";
import { formatAED } from "@/components/status-badge";
import { FileText, FileSpreadsheet, Presentation, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports & Analytics · e&" }] }),
  component: Reports,
});

const reports = [
  { name: "Budget Utilization Report", desc: "Department-level CAPEX/OPEX utilization", period: "Q2 2026" },
  { name: "CAPEX Report", desc: "Capital projects status, spend and forecast", period: "YTD 2026" },
  { name: "OPEX Report", desc: "Operating expenses by category and department", period: "YTD 2026" },
  { name: "Variance Analysis Report", desc: "Budget vs actual with AI-generated commentary", period: "May 2026" },
  { name: "Monthly Executive Summary", desc: "KPI rollup, top risks and AI insights", period: "May 2026" },
];

function Reports() {
  return (
    <AppLayout title="Reports & Analytics" subtitle="Generate, download and schedule budget reports">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {reports.map((r) => (
            <div key={r.name} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-md bg-accent text-accent-foreground flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.desc} · {r.period}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <ExportBtn icon={FileText} label="PDF" onClick={() => toast.success(`Exporting ${r.name} as PDF`)} />
                <ExportBtn icon={FileSpreadsheet} label="Excel" onClick={() => toast.success(`Exporting ${r.name} as Excel`)} />
                <ExportBtn icon={Presentation} label="PPT" onClick={() => toast.success(`Exporting ${r.name} as PowerPoint`)} />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-sm font-semibold mb-3">Department Utilization</div>
          <div className="space-y-3">
            {departments.map((d) => {
              const pct = Math.round((d.spent / d.budget) * 100);
              const over = pct > 85;
              return (
                <div key={d.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{d.name}</span>
                    <span className="text-muted-foreground tabular-nums">{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${over ? "bg-destructive" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">{formatAED(d.spent)} of {formatAED(d.budget)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function ExportBtn({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border border-border hover:bg-muted">
      <Icon className="h-3.5 w-3.5" /> {label} <Download className="h-3 w-3" />
    </button>
  );
}