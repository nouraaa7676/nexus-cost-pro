import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Upload, Download, Database, Trash2 } from "lucide-react";

export const Route = createFileRoute("/data-management")({
  head: () => ({ meta: [{ title: "Data Management · e&" }] }),
  component: DataManagement,
});

type Entity = "departments" | "vendors" | "contracts" | "projects" | "invoices" | "budgets";

const schemas: Record<Entity, { fields: string[]; sample: string }> = {
  departments: {
    fields: ["code", "name", "annual_budget"],
    sample: "code,name,annual_budget\nNET,Network Operations,12500000\nIT,IT & Digital,8200000",
  },
  vendors: {
    fields: ["name", "category", "contact_email", "risk_rating"],
    sample: "name,category,contact_email,risk_rating\nEricsson,Network Equipment,contact@ericsson.com,low\nAWS,Cloud,contact@aws.com,medium",
  },
  contracts: {
    fields: ["vendor_name", "department_code", "title", "value", "start_date", "end_date", "renewal_date"],
    sample: "vendor_name,department_code,title,value,start_date,end_date,renewal_date\nEricsson,NET,5G Equipment Supply,18500000,2026-01-01,2027-12-31,2027-09-30",
  },
  projects: {
    fields: ["code", "name", "department_code", "budget_type", "planned_amount", "actual_amount", "status", "risk"],
    sample: "code,name,department_code,budget_type,planned_amount,actual_amount,status,risk\nP-001,5G Rollout Abu Dhabi,NET,CAPEX,4500000,3200000,active,medium",
  },
  invoices: {
    fields: ["invoice_number", "vendor_name", "department_code", "budget_type", "category", "amount", "invoice_date", "status"],
    sample: "invoice_number,vendor_name,department_code,budget_type,category,amount,invoice_date,status\nINV-001,Ericsson,NET,CAPEX,Infrastructure,250000,2026-03-15,approved",
  },
  budgets: {
    fields: ["department_code", "budget_type", "category", "fiscal_year", "period_month", "planned_amount"],
    sample: "department_code,budget_type,category,fiscal_year,period_month,planned_amount\nNET,CAPEX,Infrastructure,2026,1,1000000",
  },
};

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    // simple CSV split (does not handle escaped commas — sufficient for demo)
    const cells = line.split(",").map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = cells[i] ?? ""; });
    return row;
  });
}

function DataManagement() {
  const qc = useQueryClient();
  const [entity, setEntity] = useState<Entity>("departments");
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);

  const { data: counts } = useQuery({
    queryKey: ["entity-counts"],
    queryFn: async () => {
      const list: Entity[] = ["departments", "vendors", "contracts", "projects", "invoices", "budgets"];
      const result: Record<string, number> = {};
      for (const e of list) {
        const { count } = await supabase.from(e).select("id", { count: "exact", head: true });
        result[e] = count ?? 0;
      }
      return result;
    },
  });

  async function importNow() {
    if (!text.trim()) return toast.error("Paste CSV data first");
    setUploading(true);
    try {
      const rows = parseCsv(text);
      if (rows.length === 0) throw new Error("No rows found");

      // Resolve foreign keys for entities that need lookups
      const [{ data: depts }, { data: vendors }] = await Promise.all([
        supabase.from("departments").select("id, code"),
        supabase.from("vendors").select("id, name"),
      ]);
      const deptByCode = new Map((depts ?? []).map((d) => [d.code, d.id]));
      const vendByName = new Map((vendors ?? []).map((v) => [v.name, v.id]));

      const records = rows.map((r) => {
        const out: Record<string, unknown> = { ...r };
        if ("department_code" in r) { out.department_id = deptByCode.get(r.department_code) ?? null; delete out.department_code; }
        if ("vendor_name" in r) { out.vendor_id = vendByName.get(r.vendor_name) ?? null; delete out.vendor_name; }
        // numeric coercions
        ["annual_budget","value","planned_amount","actual_amount","amount","period_month","fiscal_year","performance_rating"].forEach((k) => {
          if (k in out && out[k] !== "" && out[k] !== undefined) out[k] = Number(out[k]);
        });
        return out;
      });

      const { error, count } = await supabase.from(entity).insert(records, { count: "exact" });
      if (error) throw error;
      await supabase.from("audit_logs").insert({ action: "data.import", entity, metadata: { rows: count } });
      toast.success(`Imported ${count ?? records.length} ${entity} rows`);
      setText("");
      qc.invalidateQueries();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setUploading(false);
    }
  }

  async function exportEntity() {
    const { data, error } = await supabase.from(entity).select("*");
    if (error || !data) return toast.error("Export failed");
    if (data.length === 0) return toast.error("No data to export");
    const headers = Object.keys(data[0]);
    const csv = [headers.join(","), ...data.map((row) => headers.map((h) => JSON.stringify((row as Record<string, unknown>)[h] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${entity}-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteAll() {
    if (!confirm(`Delete ALL ${entity} records? This cannot be undone.`)) return;
    const { error } = await supabase.from(entity).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) return toast.error(error.message);
    await supabase.from("audit_logs").insert({ action: "data.delete_all", entity });
    toast.success(`Cleared ${entity}`);
    qc.invalidateQueries();
  }

  function loadFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  return (
    <AppLayout title="Data Management" subtitle="Import, export and manage financial master data">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {(Object.keys(schemas) as Entity[]).map((e) => (
          <button key={e} onClick={() => setEntity(e)} className={`text-left p-3 rounded-lg border transition-colors ${entity === e ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted"}`}>
            <Database className="h-4 w-4 text-primary mb-2" />
            <div className="text-sm font-semibold capitalize">{e}</div>
            <div className="text-xs text-muted-foreground">{counts?.[e] ?? 0} records</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold capitalize">Import {entity}</div>
            <div className="flex gap-2">
              <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border border-border hover:bg-muted cursor-pointer">
                <Upload className="h-3.5 w-3.5" /> Upload CSV
                <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
              </label>
              <button onClick={() => setText(schemas[entity].sample)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border border-border hover:bg-muted">
                Load sample
              </button>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Paste CSV with headers: ${schemas[entity].fields.join(", ")}`}
            className="w-full h-64 px-3 py-2 text-xs font-mono rounded-md border border-border bg-background outline-none focus:border-ring"
          />
          <div className="flex gap-2 mt-3">
            <button onClick={importNow} disabled={uploading} className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60">
              <Upload className="h-4 w-4" /> {uploading ? "Importing…" : "Import data"}
            </button>
            <button onClick={exportEntity} className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md border border-border hover:bg-muted">
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button onClick={deleteAll} className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md border border-destructive/40 text-destructive hover:bg-destructive/5 ml-auto">
              <Trash2 className="h-4 w-4" /> Clear all
            </button>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-sm font-semibold mb-2 capitalize">{entity} schema</div>
          <div className="text-xs text-muted-foreground mb-3">Required CSV columns:</div>
          <ul className="text-xs space-y-1 font-mono">
            {schemas[entity].fields.map((f) => (
              <li key={f} className="px-2 py-1 rounded bg-muted">{f}</li>
            ))}
          </ul>
          <div className="text-xs text-muted-foreground mt-4">
            FK columns like <code className="px-1 bg-muted rounded">department_code</code> and <code className="px-1 bg-muted rounded">vendor_name</code> are resolved automatically to IDs at import time.
          </div>
        </div>
      </div>
    </AppLayout>
  );
}