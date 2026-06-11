import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatAED } from "@/lib/format";
import { Sparkles, TrendingDown, Zap } from "lucide-react";

export const Route = createFileRoute("/cost-optimization")({
  head: () => ({ meta: [{ title: "Cost Optimization · e&" }] }),
  component: CostOpt,
});

function CostOpt() {
  const { data } = useQuery({
    queryKey: ["cost-opt"],
    queryFn: async () => {
      const [v, i, c, d] = await Promise.all([
        supabase.from("vendors").select("*"),
        supabase.from("invoices").select("*"),
        supabase.from("contracts").select("*"),
        supabase.from("departments").select("*"),
      ]);
      return { vendors: v.data ?? [], invoices: i.data ?? [], contracts: c.data ?? [], departments: d.data ?? [] };
    },
  });
  const invoices = data?.invoices ?? [];
  const vendors = data?.vendors ?? [];
  const contracts = data?.contracts ?? [];
  const departments = data?.departments ?? [];

  // Heuristic AI recommendations
  const recs: { title: string; impact: number; priority: "High" | "Medium" | "Low"; rationale: string }[] = [];

  // Vendor consolidation: vendors in same category, low spend each
  const byCategory: Record<string, { vendorId: string; spend: number }[]> = {};
  vendors.forEach((v) => {
    const spend = invoices.filter((i) => i.vendor_id === v.id).reduce((s, i) => s + Number(i.amount), 0);
    const cat = v.category ?? "Uncategorised";
    (byCategory[cat] ??= []).push({ vendorId: v.id, spend });
  });
  Object.entries(byCategory).forEach(([cat, arr]) => {
    if (arr.length >= 3) {
      const total = arr.reduce((s, x) => s + x.spend, 0);
      recs.push({
        title: `Consolidate ${arr.length} ${cat} vendors`,
        impact: Math.round(total * 0.08),
        priority: "High",
        rationale: `${arr.length} active vendors in ${cat} category with total spend ${formatAED(total)}. Consolidation typically yields 6–12% savings via volume discounts.`,
      });
    }
  });

  // Unused budget reallocation
  departments.forEach((d) => {
    const spent = invoices.filter((i) => i.department_id === d.id).reduce((s, i) => s + Number(i.amount), 0);
    const remaining = Number(d.annual_budget) - spent;
    if (Number(d.annual_budget) > 0 && remaining > Number(d.annual_budget) * 0.4) {
      recs.push({
        title: `Reallocate unused budget in ${d.name}`,
        impact: Math.round(remaining * 0.5),
        priority: "Medium",
        rationale: `${d.name} utilisation is low. ${formatAED(remaining)} unused could fund higher-priority initiatives.`,
      });
    }
  });

  // Contracts up for renewal
  const soon = contracts.filter((c) => c.renewal_date && new Date(c.renewal_date).getTime() - Date.now() < 90 * 24 * 3600 * 1000);
  if (soon.length > 0) {
    recs.push({
      title: `Renegotiate ${soon.length} contracts up for renewal`,
      impact: Math.round(soon.reduce((s, c) => s + Number(c.value ?? 0), 0) * 0.05),
      priority: "High",
      rationale: `${soon.length} contracts renew within 90 days. Use the window to renegotiate pricing — typical 4–8% reduction.`,
    });
  }

  // Cloud / IT spend spike heuristic
  const cloudCats = ["Cloud", "Cloud Services", "SaaS", "Software & Licenses"];
  const cloudSpend = invoices.filter((i) => cloudCats.includes(i.category ?? "")).reduce((s, i) => s + Number(i.amount), 0);
  if (cloudSpend > 0) {
    recs.push({
      title: "Cloud cost rightsizing review",
      impact: Math.round(cloudSpend * 0.15),
      priority: "Medium",
      rationale: `Cloud / SaaS spend ${formatAED(cloudSpend)} identified. Rightsizing, reserved instances and license cleanup typically save 12–20%.`,
    });
  }

  recs.sort((a, b) => b.impact - a.impact);
  const totalSavings = recs.reduce((s, r) => s + r.impact, 0);

  return (
    <AppLayout title="Cost Optimization Engine" subtitle="AI-identified savings opportunities across the portfolio">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Tile icon={Sparkles} label="Potential Annual Savings" value={formatAED(totalSavings)} />
        <Tile icon={TrendingDown} label="Opportunities Identified" value={String(recs.length)} />
        <Tile icon={Zap} label="High Priority" value={String(recs.filter((r) => r.priority === "High").length)} />
        <Tile icon={Sparkles} label="Avg Impact" value={formatAED(recs.length ? totalSavings / recs.length : 0)} />
      </div>

      <div className="space-y-3">
        {recs.length === 0 && (
          <div className="bg-card border border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
            Load vendor, contract and invoice data to surface AI-driven savings opportunities.
          </div>
        )}
        {recs.map((r, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 flex items-start gap-4">
            <div className="h-10 w-10 rounded-md bg-accent text-accent-foreground flex items-center justify-center shrink-0"><Sparkles className="h-5 w-5" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-sm font-semibold">{r.title}</div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${r.priority === "High" ? "bg-destructive/15 text-destructive" : r.priority === "Medium" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>{r.priority}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{r.rationale}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-muted-foreground">Est. savings</div>
              <div className="text-lg font-bold text-success">{formatAED(r.impact)}</div>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}

function Tile({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 flex items-center gap-4">
      <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center"><Icon className="h-5 w-5" /></div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground uppercase font-medium">{label}</div>
        <div className="text-xl font-bold truncate">{value}</div>
      </div>
    </div>
  );
}