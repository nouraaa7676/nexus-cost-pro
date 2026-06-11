export function formatAED(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  if (Math.abs(v) >= 1_000_000) return "AED " + (v / 1_000_000).toFixed(2) + "M";
  if (Math.abs(v) >= 1_000) return "AED " + (v / 1_000).toFixed(1) + "K";
  return "AED " + v.toLocaleString("en-AE", { maximumFractionDigits: 0 });
}

export function formatAEDFull(n: number | null | undefined): string {
  return "AED " + Number(n ?? 0).toLocaleString("en-AE", { maximumFractionDigits: 0 });
}

export function formatPct(n: number | null | undefined, digits = 1): string {
  return (Number(n ?? 0) * 100).toFixed(digits) + "%";
}

export function monthName(m: number): string {
  return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m - 1] ?? String(m);
}

export function severityColor(s: string): string {
  switch (s) {
    case "critical": return "bg-destructive text-destructive-foreground";
    case "high": return "bg-destructive/15 text-destructive";
    case "medium": return "bg-warning/15 text-warning";
    default: return "bg-muted text-muted-foreground";
  }
}

export function riskColor(r: string): string {
  switch (r) {
    case "high": return "bg-destructive/15 text-destructive";
    case "medium": return "bg-warning/15 text-warning";
    default: return "bg-success/15 text-success";
  }
}