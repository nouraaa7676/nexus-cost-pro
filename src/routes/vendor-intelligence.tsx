import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatAED, riskColor } from "@/lib/format";
import { Building2 } from "lucide-react";

export const Route = createFileRoute("/vendor-intelligence")({
  head: () => ({ meta: [{ title: "Vendor Intelligence · e&" }] }),
  component: VendorIntel,
});

function VendorIntel() {
  const { data } = useQuery({
    queryKey: ["vendor-intel"],
    queryFn: async () => {
      const [v, i, c] = await Promise.all([
        supabase.from("vendors").select("*"),
        supabase.from("invoices").select("*"),
        supabase.from("contracts").select("*"),
      ]);
      return { vendors: v.data ?? [], invoices: i.data ?? [], contracts: c.data ?? [] };
    },
  });
  const vendors = data?.vendors ?? [];
  const invoices = data?.invoices ?? [];
  const contracts = data?.contracts ?? [];

  const rows = vendors.map((v) => {
    const ven_invoices = invoices.filter((i) => i.vendor_id === v.id);
    const totalSpend = ven_invoices.reduce((s, i) => s + Number(i.amount), 0);
    const contractValue = contracts.filter((c) => c.vendor_id === v.id).reduce((s, c) => s + Number(c.value), 0);
    return { ...v, totalSpend, contractValue, invoiceCount: ven_invoices.length };
  }).sort((a, b) => b.totalSpend - a.totalSpend);

  const totalAllSpend = rows.reduce((s, r) => s + r.totalSpend, 0);
  const top3 = rows.slice(0, 3).reduce((s, r) => s + r.totalSpend, 0);
  const concentration = totalAllSpend > 0 ? (top3 / totalAllSpend) * 100 : 0;

  return (
    <AppLayout title="Vendor Intelligence" subtitle="Performance, risk and concentration analytics">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Active Vendors" value={String(vendors.filter((v) => v.active).length)} sub={`${vendors.length} total`} />
        <Stat label="Total Vendor Spend" value={formatAED(totalAllSpend)} sub={`Across ${invoices.length} invoices`} />
        <Stat label="Top-3 Concentration" value={`${concentration.toFixed(0)}%`} sub={concentration > 60 ? "High concentration risk" : "Diversified"} negative={concentration > 60} />
        <Stat label="High-Risk Vendors" value={String(rows.filter((r) => r.risk_rating === "high").length)} sub="Risk-rated high" />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /><div className="text-sm font-semibold">Vendor portfolio</div></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-2 font-medium">Vendor</th>
                <th className="text-left px-3 py-2 font-medium">Category</th>
                <th className="text-right px-3 py-2 font-medium">Total Spend</th>
                <th className="text-right px-3 py-2 font-medium">Contracts</th>
                <th className="text-right px-3 py-2 font-medium">Invoices</th>
                <th className="text-left px-3 py-2 font-medium">Risk</th>
                <th className="text-right px-5 py-2 font-medium">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">No vendors loaded.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-2.5 font-medium">{r.name}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{r.category ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{formatAED(r.totalSpend)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{formatAED(r.contractValue)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{r.invoiceCount}</td>
                  <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${riskColor(r.risk_rating ?? "low")}`}>{r.risk_rating ?? "low"}</span></td>
                  <td className="px-5 py-2.5 text-right tabular-nums">{Number(r.performance_rating).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value, sub, negative }: { label: string; value: string; sub: string; negative?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="text-xs text-muted-foreground uppercase font-medium">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      <div className={`text-xs mt-0.5 ${negative ? "text-destructive" : "text-muted-foreground"}`}>{sub}</div>
    </div>
  );
}