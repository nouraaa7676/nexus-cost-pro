import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { formatAEDFull, severityColor } from "@/lib/format";
import { AlertTriangle, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/alerts")({
  head: () => ({ meta: [{ title: "Alert Center · e&" }] }),
  component: Alerts,
});

function Alerts() {
  const qc = useQueryClient();
  const [scanning, setScanning] = useState(false);

  const { data } = useQuery({
    queryKey: ["alerts-all"],
    queryFn: async () => {
      const { data } = await supabase.from("alerts").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase.channel("alerts-rt").on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => qc.invalidateQueries({ queryKey: ["alerts-all"] })).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  async function resolve(id: string) {
    await supabase.from("alerts").update({ status: "resolved", resolved_at: new Date().toISOString() }).eq("id", id);
    await supabase.from("audit_logs").insert({ action: "alert.resolve", entity: "alert", entity_id: id });
    qc.invalidateQueries({ queryKey: ["alerts-all"] });
  }

  async function scan() {
    setScanning(true);
    try {
      const [{ data: invoices }, { data: depts }, { data: vendors }, { data: contracts }] = await Promise.all([
        supabase.from("invoices").select("*"),
        supabase.from("departments").select("*"),
        supabase.from("vendors").select("*"),
        supabase.from("contracts").select("*"),
      ]);
      const newAlerts: { title: string; description: string; severity: "low"|"medium"|"high"|"critical"; impact_amount?: number; source: string }[] = [];

      // 1. Duplicate invoice detection: same vendor + amount + date
      const seen = new Map<string, number>();
      (invoices ?? []).forEach((i) => {
        const k = `${i.vendor_id}-${i.amount}-${i.invoice_date}`;
        seen.set(k, (seen.get(k) ?? 0) + 1);
      });
      let dupCount = 0; let dupImpact = 0;
      seen.forEach((c, k) => { if (c > 1) { dupCount += c - 1; dupImpact += Number(k.split("-")[1]) * (c - 1); } });
      if (dupCount > 0) {
        newAlerts.push({ title: `${dupCount} potential duplicate invoice(s) detected`, description: "Invoices with identical vendor, amount and date were found.", severity: "high", impact_amount: dupImpact, source: "anomaly" });
      }

      // 2. Department budget overrun
      (depts ?? []).forEach((d) => {
        const spent = (invoices ?? []).filter((i) => i.department_id === d.id).reduce((s, i) => s + Number(i.amount), 0);
        if (Number(d.annual_budget) > 0 && spent > Number(d.annual_budget)) {
          newAlerts.push({ title: `${d.name} exceeded annual budget`, description: `Spent ${formatAEDFull(spent)} vs budget ${formatAEDFull(Number(d.annual_budget))}.`, severity: "critical", impact_amount: spent - Number(d.annual_budget), source: "overrun" });
        } else if (Number(d.annual_budget) > 0 && spent > Number(d.annual_budget) * 0.9) {
          newAlerts.push({ title: `${d.name} approaching budget threshold`, description: `Utilisation above 90%.`, severity: "medium", source: "threshold" });
        }
      });

      // 3. Vendor month-over-month spike
      const byVendorMonth: Record<string, Record<string, number>> = {};
      (invoices ?? []).forEach((i) => {
        if (!i.vendor_id) return;
        const ym = `${new Date(i.invoice_date).getFullYear()}-${String(new Date(i.invoice_date).getMonth() + 1).padStart(2, "0")}`;
        (byVendorMonth[i.vendor_id] ??= {})[ym] = (byVendorMonth[i.vendor_id]?.[ym] ?? 0) + Number(i.amount);
      });
      Object.entries(byVendorMonth).forEach(([vid, byM]) => {
        const months = Object.keys(byM).sort();
        if (months.length >= 2) {
          const prev = byM[months[months.length - 2]]; const cur = byM[months[months.length - 1]];
          if (prev > 0 && cur > prev * 1.25) {
            const v = (vendors ?? []).find((x) => x.id === vid);
            newAlerts.push({ title: `${v?.name ?? "Vendor"} spending spike`, description: `Month-over-month increase of ${(((cur - prev) / prev) * 100).toFixed(0)}%.`, severity: "high", impact_amount: cur - prev, source: "spike" });
          }
        }
      });

      // 4. Contract renewal approaching
      (contracts ?? []).forEach((c) => {
        if (c.renewal_date) {
          const days = (new Date(c.renewal_date).getTime() - Date.now()) / (24 * 3600 * 1000);
          if (days > 0 && days < 60) {
            newAlerts.push({ title: `Contract renewal in ${Math.round(days)} days`, description: `${c.title} — value ${formatAEDFull(Number(c.value))}.`, severity: "medium", impact_amount: Number(c.value), source: "renewal" });
          }
        }
      });

      if (newAlerts.length === 0) {
        toast.success("Scan complete — no new anomalies detected");
      } else {
        const { error } = await supabase.from("alerts").insert(newAlerts);
        if (error) throw error;
        toast.success(`Created ${newAlerts.length} new alert(s)`);
      }
      qc.invalidateQueries({ queryKey: ["alerts-all"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  const open = (data ?? []).filter((a) => a.status === "open");
  const resolved = (data ?? []).filter((a) => a.status !== "open");

  return (
    <AppLayout title="Executive Alert Center" subtitle="AI anomaly detection · real-time">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4 text-sm">
          <div><span className="text-muted-foreground">Open:</span> <span className="font-semibold">{open.length}</span></div>
          <div><span className="text-muted-foreground">Resolved:</span> <span className="font-semibold">{resolved.length}</span></div>
        </div>
        <button onClick={scan} disabled={scanning} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60">
          {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Run AI anomaly scan
        </button>
      </div>

      <div className="space-y-2">
        {(data ?? []).length === 0 && <div className="bg-card border border-border rounded-lg p-8 text-center text-sm text-muted-foreground">No alerts yet. Run the AI scan to detect anomalies.</div>}
        {(data ?? []).map((a) => (
          <div key={a.id} className={`bg-card border rounded-lg p-4 flex items-start gap-4 ${a.status === "open" ? "border-border" : "border-border opacity-60"}`}>
            <div className="h-9 w-9 rounded-md bg-destructive/10 text-destructive flex items-center justify-center shrink-0"><AlertTriangle className="h-4 w-4" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-sm font-semibold">{a.title}</div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${severityColor(a.severity)}`}>{a.severity}</span>
                {a.source && <span className="text-[10px] text-muted-foreground">{a.source}</span>}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{a.description}</div>
              {a.impact_amount && <div className="text-xs mt-1">Potential impact: <span className="font-semibold tabular-nums">{formatAEDFull(Number(a.impact_amount))}</span></div>}
            </div>
            {a.status === "open" ? (
              <button onClick={() => resolve(a.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-border hover:bg-muted shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
              </button>
            ) : (
              <span className="text-[11px] text-muted-foreground shrink-0">Resolved</span>
            )}
          </div>
        ))}
      </div>
    </AppLayout>
  );
}