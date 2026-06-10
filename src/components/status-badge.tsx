import { cn } from "@/lib/utils";
import type { RequestStatus, Priority, AIRecommendation, RiskScore } from "@/lib/mock-data";

const statusStyles: Record<RequestStatus, string> = {
  Submitted: "bg-muted text-foreground",
  "Manager Review": "bg-warning/15 text-warning",
  "Finance Review": "bg-warning/15 text-warning",
  "Executive Approval": "bg-primary/10 text-primary",
  Approved: "bg-success/15 text-success",
  Rejected: "bg-destructive/15 text-destructive",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium", statusStyles[status])}>
      {status}
    </span>
  );
}

const priorityStyles: Record<Priority, string> = {
  Low: "bg-muted text-muted-foreground",
  Medium: "bg-warning/15 text-warning",
  High: "bg-primary/15 text-primary",
  Critical: "bg-destructive text-destructive-foreground",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium", priorityStyles[priority])}>
      {priority}
    </span>
  );
}

const recStyles: Record<AIRecommendation, string> = {
  Approve: "bg-success/15 text-success",
  Review: "bg-warning/15 text-warning",
  Reject: "bg-destructive/15 text-destructive",
};

export function RecommendationBadge({ rec }: { rec: AIRecommendation }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold", recStyles[rec])}>
      AI: {rec}
    </span>
  );
}

const riskStyles: Record<RiskScore, string> = {
  Low: "bg-success/15 text-success",
  Medium: "bg-warning/15 text-warning",
  High: "bg-destructive/15 text-destructive",
};

export function RiskBadge({ risk }: { risk: RiskScore }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium", riskStyles[risk])}>
      Risk: {risk}
    </span>
  );
}

export function formatAED(n: number) {
  return "AED " + n.toLocaleString("en-AE");
}