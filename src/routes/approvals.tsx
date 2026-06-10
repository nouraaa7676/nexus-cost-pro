import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { requests } from "@/lib/mock-data";
import { StatusBadge, PriorityBadge, RecommendationBadge, RiskBadge, formatAED } from "@/components/status-badge";
import { Check, X, MessageSquare, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/approvals")({
  head: () => ({ meta: [{ title: "Approvals Queue · e&" }] }),
  component: Approvals,
});

function Approvals() {
  const pending = requests.filter((r) => !["Approved", "Rejected"].includes(r.status));
  return (
    <AppLayout title="Approvals Queue" subtitle="Pending decisions requiring your action">
      <div className="space-y-4">
        {pending.map((r) => (
          <div key={r.id} className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">{r.id}</span> · {r.department} · {r.type}
                </div>
                <div className="text-base font-semibold mt-0.5">{r.project}</div>
                <div className="text-xs text-muted-foreground mt-1">Submitted by {r.submittedBy} on {r.submittedOn}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold tabular-nums">{formatAED(r.amount)}</div>
                <div className="flex gap-2 mt-1 justify-end">
                  <PriorityBadge priority={r.priority} />
                  <StatusBadge status={r.status} />
                </div>
              </div>
            </div>
            <div className="text-sm text-foreground/80 mb-4">{r.justification}</div>

            <div className="bg-muted/40 border border-border rounded-md p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <div className="text-sm font-semibold">AI Analysis</div>
                <div className="ml-auto flex gap-2">
                  <RecommendationBadge rec={r.aiRecommendation} />
                  <RiskBadge risk={r.aiRisk} />
                </div>
              </div>
              <div className="text-sm text-foreground/80">{r.aiReason}</div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => toast.success(`${r.id} approved`)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-success text-white hover:opacity-90">
                <Check className="h-4 w-4" /> Approve
              </button>
              <button onClick={() => toast.error(`${r.id} rejected`)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-destructive text-destructive hover:bg-destructive/5">
                <X className="h-4 w-4" /> Reject
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md border border-border hover:bg-muted">
                <MessageSquare className="h-4 w-4" /> Add Comment
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}