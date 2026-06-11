import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { formatAED } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, FileSpreadsheet, Sparkles, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports · e&" }] }),
  component: Reports,
});

type Tpl = { key: string; title: string; desc: string };
const templates: Tpl[] = [
  { key: "executive_summary", title: "Executive Summary", desc: "KPI rollup, key risks and AI commentary for the leadership team." },
  { key: "cfo_summary", title: "CFO Briefing", desc: "Financial position, variance drivers and cash outlook." },
  { key: "monthly_review", title: "Monthly Budget Review", desc: "Month-over-month CAPEX, OPEX and department performance." },
  { key: "variance_analysis", title: "Variance Analysis", desc: "Budget vs actual with AI-generated explanations." },
  { key: "cost_optimization", title: "Cost Optimization Report", desc: "Identified savings, recommendations and impact." },
  { key: "vendor_analysis", title: "Vendor Analysis", desc: "Concentration, performance and contract risks." },
];

async function gatherContext() {
  const [d, v, i, p] = await Promise.all([
    supabase.from("departments").select("name, annual_budget"),
    supabase.from("vendors").select("name, category, risk_rating"),
    supabase.from("invoices").select("amount, budget_type, invoice_date, vendor_id, department_id"),
    supabase.from("projects").select("name, planned_amount, actual_amount, risk, status"),
  ]);
  return JSON.stringify({ departments: d.data ?? [], vendors: v.data ?? [], invoices: (i.data ?? []).slice(0, 200), projects: p.data ?? [] });
}

function Reports() {
  const qc = useQueryClient();
  const [generating, setGenerating] = useState<string | null>(null);
  const { data: reports } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const { data } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const { data: depts } = useQuery({
    queryKey: ["depts-with-spend"],
    queryFn: async () => {
      const [d, i] = await Promise.all([
        supabase.from("departments").select("*"),
        supabase.from("invoices").select("department_id, amount"),
      ]);
      return (d.data ?? []).map((x) => {
        const spent = (i.data ?? []).filter((r) => r.department_id === x.id).reduce((s, r) => s + Number(r.amount), 0);
        return { ...x, spent };
      });
    },
  });

  async function generate(t: Tpl) {
    setGenerating(t.key);
    try {
      const ctx = await gatherContext();
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: ctx,
          messages: [{ role: "user", content: `Generate a ${t.title} for e&. ${t.desc} Use clear section headings, bullet points and AED. Keep it under 600 words.` }],
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { content } = (await res.json()) as { content: string };
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("reports").insert({ title: `${t.title} — ${new Date().toLocaleDateString()}`, report_type: t.key, content, generated_by: user?.id });
      await supabase.from("audit_logs").insert({ action: "report.generate", entity: "report", metadata: { type: t.key } });
      toast.success(`${t.title} generated`);
      qc.invalidateQueries({ queryKey: ["reports"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate report");
    } finally {
      setGenerating(null);
    }
  }

  function download(name: string, content: string, mime = "text/markdown") {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/[^\w]+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppLayout title="Reports" subtitle="Generative AI report writer + on-demand exports">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="text-sm font-semibold mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Generative AI report writer</div>
          <div className="grid sm:grid-cols-2 gap-3">
            {templates.map((t) => (
              <div key={t.key} className="bg-card border border-border rounded-lg p-4">
                <div className="text-sm font-semibold">{t.title}</div>
                <div className="text-xs text-muted-foreground mt-1 mb-3">{t.desc}</div>
                <button onClick={() => generate(t)} disabled={generating === t.key} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60">
                  {generating === t.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Generate with AI
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-sm font-semibold mb-3">Department utilization</div>
          <div className="space-y-3">
            {(depts ?? []).length === 0 && <div className="text-xs text-muted-foreground">No departments yet.</div>}
            {(depts ?? []).map((d) => {
              const pct = Number(d.annual_budget) > 0 ? Math.round((d.spent / Number(d.annual_budget)) * 100) : 0;
              const over = pct > 90;
              return (
                <div key={d.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium truncate">{d.name}</span>
                    <span className="text-muted-foreground tabular-nums">{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${over ? "bg-destructive" : "bg-primary"}`} style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">{formatAED(d.spent)} of {formatAED(Number(d.annual_budget))}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg">
        <div className="px-5 py-4 border-b border-border text-sm font-semibold">Generated reports</div>
        <div className="divide-y divide-border">
          {(reports ?? []).length === 0 && <div className="px-5 py-8 text-center text-sm text-muted-foreground">No reports generated yet.</div>}
          {(reports ?? []).map((r) => (
            <details key={r.id} className="px-5 py-3">
              <summary className="flex items-center justify-between cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-md bg-accent text-accent-foreground flex items-center justify-center"><FileText className="h-4 w-4" /></div>
                  <div>
                    <div className="text-sm font-medium">{r.title}</div>
                    <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()} · {r.report_type}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.preventDefault(); download(r.title, r.content ?? ""); }} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border border-border hover:bg-muted">
                    <Download className="h-3.5 w-3.5" /> Markdown
                  </button>
                  <button onClick={(e) => { e.preventDefault(); download(r.title, r.content ?? "", "application/vnd.ms-excel"); }} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border border-border hover:bg-muted">
                    <FileSpreadsheet className="h-3.5 w-3.5" /> Export
                  </button>
                </div>
              </summary>
              <pre className="mt-3 text-xs whitespace-pre-wrap bg-muted/40 p-3 rounded-md border border-border max-h-96 overflow-auto">{r.content}</pre>
            </details>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}