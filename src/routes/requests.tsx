import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { requests } from "@/lib/mock-data";
import { StatusBadge, PriorityBadge, RecommendationBadge, formatAED } from "@/components/status-badge";
import { PlusCircle, Filter, Download } from "lucide-react";

export const Route = createFileRoute("/requests")({
  head: () => ({ meta: [{ title: "Budget Requests · e&" }] }),
  component: RequestsPage,
});

function RequestsPage() {
  return (
    <AppLayout title="Budget Requests" subtitle="All CAPEX and OPEX requests across departments">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-border bg-card hover:bg-muted">
            <Filter className="h-4 w-4" /> Filter
          </button>
          <button className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-border bg-card hover:bg-muted">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
        <Link to="/new-request" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90">
          <PlusCircle className="h-4 w-4" /> New Request
        </Link>
      </div>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Request ID</th>
              <th className="text-left px-4 py-3 font-medium">Project</th>
              <th className="text-left px-4 py-3 font-medium">Department</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-right px-4 py-3 font-medium">Amount</th>
              <th className="text-left px-4 py-3 font-medium">Priority</th>
              <th className="text-left px-4 py-3 font-medium">AI</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {requests.map((r) => (
              <tr key={r.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 font-medium text-primary">{r.id}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{r.project}</div>
                  <div className="text-xs text-muted-foreground">by {r.submittedBy} · {r.submittedOn}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{r.department}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[11px] font-medium bg-secondary text-secondary-foreground">{r.type}</span></td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatAED(r.amount)}</td>
                <td className="px-4 py-3"><PriorityBadge priority={r.priority} /></td>
                <td className="px-4 py-3"><RecommendationBadge rec={r.aiRecommendation} /></td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}