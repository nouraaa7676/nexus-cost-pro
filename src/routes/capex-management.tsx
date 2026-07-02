import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { formatAED } from "@/lib/format";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  Plus, CheckCircle2, XCircle, RotateCcw, FileText, Loader2,
  FolderKanban, Briefcase, Wallet, Clock, TrendingUp, ShieldCheck, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/capex-management")({
  head: () => ({ meta: [{ title: "CAPEX Management · e&" }] }),
  component: CapexManagement,
});

const STAGES = [
  "draft", "commercial", "budget_review", "department_manager",
  "senior_manager", "svp", "finance", "completed",
] as const;
type Stage = typeof STAGES[number];
const STAGE_LABEL: Record<string, string> = {
  draft: "Draft",
  commercial: "Commercial Team",
  budget_review: "Budget & Cost Controller",
  department_manager: "Department Manager",
  senior_manager: "Senior Manager",
  svp: "SVP",
  finance: "Finance",
  completed: "Completed",
  rejected: "Rejected",
};
const BRAND = ["#E30613", "#111111", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6"];

function KPI({ label, value, sub, icon: Icon, tone = "default" }: any) {
  const tones: Record<string, string> = {
    default: "text-foreground",
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
  };
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className={`mt-2 text-2xl font-semibold tracking-tight ${tones[tone]}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const isRej = stage === "rejected";
  const isDone = stage === "completed";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border ${
      isRej ? "bg-destructive/10 text-destructive border-destructive/20"
      : isDone ? "bg-success/10 text-success border-success/20"
      : "bg-muted text-foreground border-border"
    }`}>{STAGE_LABEL[stage] ?? stage}</span>
  );
}

function CapexManagement() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"dashboard" | "requests" | "new" | "review" | "cesr" | "workflow" | "finance">("dashboard");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["capex-all"],
    queryFn: async () => {
      const [reqs, revs, cesr, apps, fin, depts, vendors, cash] = await Promise.all([
        supabase.from("capex_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("capex_reviews").select("*"),
        supabase.from("cesr_records").select("*").order("created_at", { ascending: false }),
        supabase.from("project_approvals").select("*").order("created_at", { ascending: false }),
        supabase.from("financial_processing").select("*"),
        supabase.from("departments").select("id,name,annual_budget"),
        supabase.from("vendors").select("id,name"),
        supabase.from("cash_flow_forecast").select("*"),
      ]);
      return {
        requests: reqs.data ?? [], reviews: revs.data ?? [], cesr: cesr.data ?? [],
        approvals: apps.data ?? [], finance: fin.data ?? [], departments: depts.data ?? [],
        vendors: vendors.data ?? [], cash: cash.data ?? [],
      };
    },
    refetchInterval: 15000,
  });

  const requests = data?.requests ?? [];
  const departments = data?.departments ?? [];
  const vendors = data?.vendors ?? [];
  const approvals = data?.approvals ?? [];
  const cesr = data?.cesr ?? [];
  const reviews = data?.reviews ?? [];
  const finance = data?.finance ?? [];
  const cash = data?.cash ?? [];

  const totals = useMemo(() => {
    const totalBudget = requests.reduce((s, r) => s + Number(r.estimated_budget || 0), 0);
    const commitments = requests
      .filter((r) => ["budget_review", "department_manager", "senior_manager", "svp", "finance"].includes(r.stage))
      .reduce((s, r) => s + Number(r.estimated_budget || 0), 0);
    const expenditure = finance
      .filter((f) => f.budget_released)
      .reduce((s, f) => s + Number(f.released_amount || 0), 0);
    const active = requests.filter((r) => !["rejected", "completed", "draft"].includes(r.stage)).length;
    const pending = requests.filter((r) => !["completed", "rejected", "draft"].includes(r.stage)).length;
    return { totalBudget, commitments, expenditure, remaining: totalBudget - expenditure, active, pending };
  }, [requests, finance]);

  const monthlyData = useMemo(() => {
    const arr = Array.from({ length: 12 }, (_, i) => ({ month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i], commitment: 0, expenditure: 0, cashflow: 0 }));
    requests.forEach((r) => {
      const d = r.expected_start_date ? new Date(r.expected_start_date) : new Date(r.created_at);
      const m = d.getMonth();
      if (["budget_review","department_manager","senior_manager","svp","finance","completed"].includes(r.stage))
        arr[m].commitment += Number(r.estimated_budget || 0);
    });
    finance.forEach((f) => {
      if (!f.budget_released) return;
      const req = requests.find((r) => r.id === f.request_id);
      const d = req ? new Date(req.updated_at) : new Date();
      arr[d.getMonth()].expenditure += Number(f.released_amount || 0);
    });
    cash.forEach((c) => { arr[(c.period_month || 1) - 1].cashflow += Number(c.planned_outflow || 0); });
    return arr.map((x) => ({ ...x, commitment: x.commitment / 1_000_000, expenditure: x.expenditure / 1_000_000, cashflow: x.cashflow / 1_000_000 }));
  }, [requests, finance, cash]);

  const statusData = useMemo(() => {
    const buckets: Record<string, number> = {};
    requests.forEach((r) => { buckets[r.stage] = (buckets[r.stage] || 0) + 1; });
    return Object.entries(buckets).map(([k, v]) => ({ name: STAGE_LABEL[k] ?? k, value: v }));
  }, [requests]);

  const deptSpend = useMemo(() => {
    const map: Record<string, { name: string; budget: number; actual: number }> = {};
    departments.forEach((d) => { map[d.id] = { name: d.name, budget: Number(d.annual_budget || 0) / 1_000_000, actual: 0 }; });
    requests.forEach((r) => {
      if (!r.department_id || !map[r.department_id]) return;
      map[r.department_id].actual += Number(r.estimated_budget || 0) / 1_000_000;
    });
    return Object.values(map);
  }, [departments, requests]);

  return (
    <AppLayout title="CAPEX Project Management" subtitle="Enterprise capital expenditure workflow, CESR governance and financial approvals">
      <div className="flex flex-wrap gap-1 mb-6 rounded-lg border border-border bg-card p-1 w-fit">
        {[
          ["dashboard", "Dashboard", FolderKanban],
          ["requests", "Requests", Briefcase],
          ["new", "New Request", Plus],
          ["review", "B&CC Review", ShieldCheck],
          ["cesr", "CESR", FileText],
          ["workflow", "Approvals", CheckCircle2],
          ["finance", "Finance", Wallet],
        ].map(([k, l, Icon]: any) => (
          <button key={k} onClick={() => setTab(k)}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
            <Icon className="h-4 w-4" />{l}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPI label="Total CAPEX Budget" value={formatAED(totals.totalBudget)} icon={Wallet} tone="primary" />
            <KPI label="Commitments" value={formatAED(totals.commitments)} icon={ShieldCheck} />
            <KPI label="Expenditure" value={formatAED(totals.expenditure)} icon={TrendingUp} tone="success" />
            <KPI label="Remaining" value={formatAED(totals.remaining)} icon={Sparkles} />
            <KPI label="Active Projects" value={totals.active} icon={FolderKanban} />
            <KPI label="Pending Approvals" value={totals.pending} icon={Clock} tone="warning" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Commitment vs Expenditure (AED M)">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                  <Bar dataKey="commitment" fill="#111111" name="Commitment" radius={[4,4,0,0]} />
                  <Bar dataKey="expenditure" fill="#E30613" name="Expenditure" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Annual CAPEX Utilization">
              <div className="flex flex-col justify-center h-[260px] px-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Expenditure vs Total Budget</span>
                  <span className="font-semibold">{totals.totalBudget > 0 ? ((totals.expenditure / totals.totalBudget) * 100).toFixed(1) : "0.0"}%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, totals.totalBudget > 0 ? (totals.expenditure / totals.totalBudget) * 100 : 0)}%` }} />
                </div>
                <div className="flex justify-between text-sm mt-4 mb-1">
                  <span className="text-muted-foreground">Commitments vs Total Budget</span>
                  <span className="font-semibold">{totals.totalBudget > 0 ? ((totals.commitments / totals.totalBudget) * 100).toFixed(1) : "0.0"}%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-foreground" style={{ width: `${Math.min(100, totals.totalBudget > 0 ? (totals.commitments / totals.totalBudget) * 100 : 0)}%` }} />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-6 text-center">
                  <MiniStat label="Budget" value={formatAED(totals.totalBudget)} />
                  <MiniStat label="Committed" value={formatAED(totals.commitments)} />
                  <MiniStat label="Spent" value={formatAED(totals.expenditure)} />
                </div>
              </div>
            </ChartCard>

            <ChartCard title="Project Status Distribution">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label={(e: any) => `${e.value}`}>
                    {statusData.map((_, i) => <Cell key={i} fill={BRAND[i % BRAND.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Department CAPEX Budget vs Committed (AED M)">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={deptSpend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                  <Bar dataKey="budget" fill="#111111" name="Annual Budget" radius={[4,4,0,0]} />
                  <Bar dataKey="actual" fill="#E30613" name="Committed" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Monthly Cash Flow (AED M)">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="cf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E30613" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#E30613" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Area type="monotone" dataKey="cashflow" stroke="#E30613" strokeWidth={2} fill="url(#cf)" name="Planned Outflow" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Budget vs Actual Trend (AED M)">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                  <Line type="monotone" dataKey="commitment" stroke="#111111" strokeWidth={2} name="Commitment" />
                  <Line type="monotone" dataKey="expenditure" stroke="#E30613" strokeWidth={2} name="Actual" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      )}

      {tab === "requests" && (
        <RequestsTable requests={requests} departments={departments} onSelect={(id) => { setSelectedId(id); setTab("workflow"); }} />
      )}

      {tab === "new" && (
        <NewRequestForm departments={departments} vendors={vendors} onCreated={() => { qc.invalidateQueries({ queryKey: ["capex-all"] }); setTab("requests"); }} />
      )}

      {tab === "review" && (
        <ReviewPanel requests={requests} reviews={reviews} onSaved={() => qc.invalidateQueries({ queryKey: ["capex-all"] })} />
      )}

      {tab === "cesr" && (
        <CesrPanel requests={requests} cesr={cesr} departments={departments} onSaved={() => qc.invalidateQueries({ queryKey: ["capex-all"] })} />
      )}

      {tab === "workflow" && (
        <WorkflowPanel requests={requests} approvals={approvals} selectedId={selectedId} setSelectedId={setSelectedId}
          onAction={() => qc.invalidateQueries({ queryKey: ["capex-all"] })} />
      )}

      {tab === "finance" && (
        <FinancePanel requests={requests} finance={finance} onSaved={() => qc.invalidateQueries({ queryKey: ["capex-all"] })} />
      )}
    </AppLayout>
  );
}

function ChartCard({ title, children }: any) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-sm font-semibold mb-3">{title}</div>
      {children}
    </div>
  );
}
function MiniStat({ label, value }: any) {
  return (
    <div className="rounded-md bg-muted/40 py-2">
      <div className="text-[10px] text-muted-foreground uppercase">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function RequestsTable({ requests, departments, onSelect }: any) {
  const [q, setQ] = useState("");
  const filtered = requests.filter((r: any) =>
    !q || r.project_name.toLowerCase().includes(q.toLowerCase()) || r.project_code.toLowerCase().includes(q.toLowerCase())
  );
  const deptMap = Object.fromEntries(departments.map((d: any) => [d.id, d.name]));
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="p-4 flex items-center justify-between border-b border-border">
        <div className="text-sm font-semibold">CAPEX Requests ({filtered.length})</div>
        <input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)}
          className="text-sm px-3 py-1.5 rounded-md border border-border bg-background w-64" />
      </div>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground uppercase">
            <tr>
              <th className="text-left px-4 py-2">Code</th>
              <th className="text-left px-4 py-2">Project</th>
              <th className="text-left px-4 py-2">Business Unit</th>
              <th className="text-left px-4 py-2">Department</th>
              <th className="text-right px-4 py-2">Budget</th>
              <th className="text-left px-4 py-2">Priority</th>
              <th className="text-left px-4 py-2">Stage</th>
              <th className="text-right px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r: any) => (
              <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-4 py-2 font-mono text-xs">{r.project_code}</td>
                <td className="px-4 py-2 font-medium">{r.project_name}</td>
                <td className="px-4 py-2 text-muted-foreground">{r.business_unit}</td>
                <td className="px-4 py-2 text-muted-foreground">{deptMap[r.department_id] ?? "—"}</td>
                <td className="px-4 py-2 text-right">{formatAED(r.estimated_budget)}</td>
                <td className="px-4 py-2 capitalize">{r.priority}</td>
                <td className="px-4 py-2"><StageBadge stage={r.stage} /></td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => onSelect(r.id)} className="text-xs text-primary hover:underline">Open →</button>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">No requests yet. Create one in the New Request tab.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NewRequestForm({ departments, vendors, onCreated }: any) {
  const [form, setForm] = useState<any>({
    project_name: "", business_unit: "Commercial", request_owner: "",
    business_justification: "", scope_of_work: "", expected_benefits: "",
    estimated_budget: "", priority: "medium",
    expected_start_date: "", expected_completion_date: "",
    vendor_id: "", department_id: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm((s: any) => ({ ...s, [k]: v }));

  async function submit(stage: "draft" | "commercial") {
    if (!form.project_name || !form.request_owner || !form.estimated_budget) {
      toast.error("Project name, owner and budget are required"); return;
    }
    setSaving(true);
    const user = (await supabase.auth.getUser()).data.user;
    const payload: any = {
      ...form,
      estimated_budget: Number(form.estimated_budget),
      vendor_id: form.vendor_id || null,
      department_id: form.department_id || null,
      expected_start_date: form.expected_start_date || null,
      expected_completion_date: form.expected_completion_date || null,
      stage,
      submitted_by: user?.id ?? null,
    };
    const { data, error } = await supabase.from("capex_requests").insert(payload).select().single();
    if (error) { toast.error(error.message); setSaving(false); return; }
    if (stage === "commercial") {
      await supabase.from("project_approvals").insert({
        request_id: data.id, stage: "commercial", action: "approve",
        comments: "Submitted by commercial team",
        actor_id: user?.id ?? null, actor_email: user?.email ?? "guest",
      });
    }
    toast.success(stage === "draft" ? "Saved as draft" : "Submitted for review");
    setSaving(false);
    onCreated?.();
  }

  const Field = ({ label, children }: any) => (
    <label className="block text-sm">
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
  const input = "w-full px-3 py-2 rounded-md border border-border bg-background text-sm";

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="text-sm font-semibold mb-4">New CAPEX Project Request</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Project Name *"><input className={input} value={form.project_name} onChange={(e) => set("project_name", e.target.value)} /></Field>
        <Field label="Business Unit *"><input className={input} value={form.business_unit} onChange={(e) => set("business_unit", e.target.value)} /></Field>
        <Field label="Request Owner *"><input className={input} value={form.request_owner} onChange={(e) => set("request_owner", e.target.value)} /></Field>
        <Field label="Estimated Budget (AED) *"><input type="number" className={input} value={form.estimated_budget} onChange={(e) => set("estimated_budget", e.target.value)} /></Field>
        <Field label="Department">
          <select className={input} value={form.department_id} onChange={(e) => set("department_id", e.target.value)}>
            <option value="">— Select —</option>
            {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <Field label="Vendor">
          <select className={input} value={form.vendor_id} onChange={(e) => set("vendor_id", e.target.value)}>
            <option value="">— Optional —</option>
            {vendors.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </Field>
        <Field label="Priority">
          <select className={input} value={form.priority} onChange={(e) => set("priority", e.target.value)}>
            {["low","medium","high","critical"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <div />
        <Field label="Expected Start Date"><input type="date" className={input} value={form.expected_start_date} onChange={(e) => set("expected_start_date", e.target.value)} /></Field>
        <Field label="Expected Completion Date"><input type="date" className={input} value={form.expected_completion_date} onChange={(e) => set("expected_completion_date", e.target.value)} /></Field>
        <div className="md:col-span-2"><Field label="Business Justification"><textarea rows={3} className={input} value={form.business_justification} onChange={(e) => set("business_justification", e.target.value)} /></Field></div>
        <div className="md:col-span-2"><Field label="Scope of Work"><textarea rows={3} className={input} value={form.scope_of_work} onChange={(e) => set("scope_of_work", e.target.value)} /></Field></div>
        <div className="md:col-span-2"><Field label="Expected Benefits"><textarea rows={2} className={input} value={form.expected_benefits} onChange={(e) => set("expected_benefits", e.target.value)} /></Field></div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={() => submit("draft")} disabled={saving} className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted">Save Draft</button>
        <button onClick={() => submit("commercial")} disabled={saving} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-95 inline-flex items-center gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}Submit to Budget Controller
        </button>
      </div>
    </div>
  );
}

const REVIEW_KEYS = [
  ["scope_ok", "Scope Review"],
  ["financial_ok", "Financial Review"],
  ["budget_available", "Budget Availability"],
  ["business_case_ok", "Business Case Validation"],
  ["risk_ok", "Risk Assessment"],
  ["roi_ok", "ROI Review"],
  ["category_ok", "Budget Category Validation"],
] as const;

function ReviewPanel({ requests, reviews, onSaved }: any) {
  const queue = requests.filter((r: any) => ["commercial", "budget_review"].includes(r.stage));
  const [selId, setSelId] = useState<string | null>(queue[0]?.id ?? null);
  const sel = requests.find((r: any) => r.id === selId);
  const existing = reviews.find((rv: any) => rv.request_id === selId);
  const [state, setState] = useState<any>({});
  const [comments, setComments] = useState("");
  const [saving, setSaving] = useState(false);

  useMemo(() => {
    setState(existing ? { ...existing } : {});
    setComments(existing?.comments ?? "");
  }, [selId, existing?.id]);

  async function save(action: "advance" | "revise" | "reject") {
    if (!sel) return;
    setSaving(true);
    const user = (await supabase.auth.getUser()).data.user;
    const payload = {
      request_id: sel.id, comments,
      reviewer_id: user?.id ?? null,
      ...Object.fromEntries(REVIEW_KEYS.map(([k]) => [k, !!state[k]])),
    };
    if (existing) await supabase.from("capex_reviews").update(payload).eq("id", existing.id);
    else await supabase.from("capex_reviews").insert(payload);

    const nextStage: Stage = action === "advance" ? "department_manager" : action === "reject" ? "rejected" as any : "commercial";
    await supabase.from("capex_requests").update({ stage: nextStage }).eq("id", sel.id);
    await supabase.from("project_approvals").insert({
      request_id: sel.id, stage: "budget_review",
      action: action === "advance" ? "approve" : action === "reject" ? "reject" : "return",
      comments, actor_id: user?.id ?? null, actor_email: user?.email ?? "guest",
    });
    toast.success("Review saved");
    setSaving(false);
    onSaved?.();
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
      <div className="rounded-lg border border-border bg-card p-3 max-h-[70vh] overflow-auto">
        <div className="text-xs uppercase text-muted-foreground mb-2 px-1">Awaiting Review ({queue.length})</div>
        {queue.map((r: any) => (
          <button key={r.id} onClick={() => setSelId(r.id)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm mb-1 ${selId === r.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
            <div className="font-medium truncate">{r.project_name}</div>
            <div className={`text-[11px] ${selId === r.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{r.project_code} · {formatAED(r.estimated_budget)}</div>
          </button>
        ))}
        {!queue.length && <div className="text-xs text-muted-foreground p-3">Queue empty.</div>}
      </div>
      <div className="rounded-lg border border-border bg-card p-5">
        {!sel ? <div className="text-muted-foreground text-sm">Select a request to review.</div> : (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-lg font-semibold">{sel.project_name}</div>
                <div className="text-xs text-muted-foreground">{sel.project_code} · {sel.business_unit} · {formatAED(sel.estimated_budget)}</div>
              </div>
              <StageBadge stage={sel.stage} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
              {REVIEW_KEYS.map(([k, label]) => (
                <label key={k} className="flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-border">
                  <input type="checkbox" checked={!!state[k]} onChange={(e) => setState((s: any) => ({ ...s, [k]: e.target.checked }))} />
                  {label}
                </label>
              ))}
            </div>
            <textarea className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" rows={3} placeholder="Reviewer comments…"
              value={comments} onChange={(e) => setComments(e.target.value)} />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => save("reject")} disabled={saving} className="px-3 py-2 text-sm rounded-md border border-destructive text-destructive hover:bg-destructive/10">Reject</button>
              <button onClick={() => save("revise")} disabled={saving} className="px-3 py-2 text-sm rounded-md border border-border hover:bg-muted">Return for Revision</button>
              <button onClick={() => save("advance")} disabled={saving} className="px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-95">Approve & Advance</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CesrPanel({ requests, cesr, departments, onSaved }: any) {
  const eligible = requests.filter((r: any) => !["draft", "rejected"].includes(r.stage));
  const [form, setForm] = useState<any>({
    request_id: eligible[0]?.id ?? "", task_name: "", capex_category: "Network Infrastructure",
    budget_line: "", budget_code: "", cost_center: "", project_owner: "",
    scope_details: "", technical_details: "", financial_details: "",
    procurement_approval: "", department_id: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm((s: any) => ({ ...s, [k]: v }));

  async function create() {
    if (!form.request_id || !form.task_name) { toast.error("Select a request and enter task name"); return; }
    setSaving(true);
    const { error } = await supabase.from("cesr_records").insert({
      ...form, department_id: form.department_id || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("CESR record created"); onSaved?.(); }
    setSaving(false);
  }

  const input = "w-full px-3 py-2 rounded-md border border-border bg-background text-sm";
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="text-sm font-semibold mb-4">Generate CESR</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-sm md:col-span-2">
            <div className="text-xs uppercase text-muted-foreground mb-1">Linked Request</div>
            <select className={input} value={form.request_id} onChange={(e) => set("request_id", e.target.value)}>
              {eligible.map((r: any) => <option key={r.id} value={r.id}>{r.project_code} — {r.project_name}</option>)}
            </select>
          </label>
          <label className="text-sm"><div className="text-xs uppercase text-muted-foreground mb-1">Task Name</div><input className={input} value={form.task_name} onChange={(e) => set("task_name", e.target.value)} /></label>
          <label className="text-sm"><div className="text-xs uppercase text-muted-foreground mb-1">CAPEX Category</div>
            <select className={input} value={form.capex_category} onChange={(e) => set("capex_category", e.target.value)}>
              {["Network Infrastructure","IT Systems","Facilities","Fleet & Equipment","Digital Transformation","Cybersecurity"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="text-sm"><div className="text-xs uppercase text-muted-foreground mb-1">Budget Line</div><input className={input} value={form.budget_line} onChange={(e) => set("budget_line", e.target.value)} /></label>
          <label className="text-sm"><div className="text-xs uppercase text-muted-foreground mb-1">Budget Code</div><input className={input} value={form.budget_code} onChange={(e) => set("budget_code", e.target.value)} /></label>
          <label className="text-sm"><div className="text-xs uppercase text-muted-foreground mb-1">Cost Center</div><input className={input} value={form.cost_center} onChange={(e) => set("cost_center", e.target.value)} /></label>
          <label className="text-sm"><div className="text-xs uppercase text-muted-foreground mb-1">Department</div>
            <select className={input} value={form.department_id} onChange={(e) => set("department_id", e.target.value)}>
              <option value="">—</option>
              {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          <label className="text-sm"><div className="text-xs uppercase text-muted-foreground mb-1">Project Owner</div><input className={input} value={form.project_owner} onChange={(e) => set("project_owner", e.target.value)} /></label>
          <label className="text-sm"><div className="text-xs uppercase text-muted-foreground mb-1">Procurement Approval Ref</div><input className={input} value={form.procurement_approval} onChange={(e) => set("procurement_approval", e.target.value)} /></label>
          <label className="text-sm md:col-span-2"><div className="text-xs uppercase text-muted-foreground mb-1">Scope Details</div><textarea rows={2} className={input} value={form.scope_details} onChange={(e) => set("scope_details", e.target.value)} /></label>
          <label className="text-sm md:col-span-2"><div className="text-xs uppercase text-muted-foreground mb-1">Technical Details</div><textarea rows={2} className={input} value={form.technical_details} onChange={(e) => set("technical_details", e.target.value)} /></label>
          <label className="text-sm md:col-span-2"><div className="text-xs uppercase text-muted-foreground mb-1">Financial Details</div><textarea rows={2} className={input} value={form.financial_details} onChange={(e) => set("financial_details", e.target.value)} /></label>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={create} disabled={saving} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground inline-flex items-center gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}Generate CESR
          </button>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card">
        <div className="p-4 border-b border-border text-sm font-semibold">CESR Registry ({cesr.length})</div>
        <div className="max-h-[70vh] overflow-auto">
          {cesr.map((c: any) => (
            <div key={c.id} className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="font-mono text-xs text-primary">{c.cesr_number}</div>
                <div className="text-[11px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</div>
              </div>
              <div className="font-medium text-sm mt-1">{c.task_name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{c.capex_category} · {c.budget_code || "—"} · {c.cost_center || "—"}</div>
            </div>
          ))}
          {!cesr.length && <div className="p-6 text-center text-sm text-muted-foreground">No CESR records yet.</div>}
        </div>
      </div>
    </div>
  );
}

const WORKFLOW_STAGES: Stage[] = ["commercial", "budget_review", "department_manager", "senior_manager", "svp", "finance", "completed"];

function WorkflowPanel({ requests, approvals, selectedId, setSelectedId, onAction }: any) {
  const list = requests.filter((r: any) => r.stage !== "draft");
  const sel = requests.find((r: any) => r.id === selectedId) ?? list[0];
  const trail = approvals.filter((a: any) => a.request_id === sel?.id);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function act(action: "approve" | "reject" | "return") {
    if (!sel) return;
    setBusy(true);
    const user = (await supabase.auth.getUser()).data.user;
    const curIdx = WORKFLOW_STAGES.indexOf(sel.stage as Stage);
    let nextStage: Stage = sel.stage;
    if (action === "approve") nextStage = WORKFLOW_STAGES[Math.min(curIdx + 1, WORKFLOW_STAGES.length - 1)];
    else if (action === "reject") nextStage = "rejected" as any;
    else nextStage = WORKFLOW_STAGES[Math.max(curIdx - 1, 0)];

    await supabase.from("capex_requests").update({ stage: nextStage }).eq("id", sel.id);
    await supabase.from("project_approvals").insert({
      request_id: sel.id, stage: sel.stage, action,
      comments: comment || null, actor_id: user?.id ?? null, actor_email: user?.email ?? "guest",
    });
    toast.success("Decision recorded");
    setComment("");
    setBusy(false);
    onAction?.();
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
      <div className="rounded-lg border border-border bg-card p-3 max-h-[75vh] overflow-auto">
        <div className="text-xs uppercase text-muted-foreground mb-2 px-1">Requests ({list.length})</div>
        {list.map((r: any) => (
          <button key={r.id} onClick={() => setSelectedId(r.id)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm mb-1 ${sel?.id === r.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
            <div className="font-medium truncate">{r.project_name}</div>
            <div className={`text-[11px] ${sel?.id === r.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{STAGE_LABEL[r.stage]}</div>
          </button>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-card p-5">
        {!sel ? <div className="text-muted-foreground text-sm">Select a project.</div> : (
          <>
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="text-lg font-semibold">{sel.project_name}</div>
                <div className="text-xs text-muted-foreground">{sel.project_code} · {sel.business_unit} · {formatAED(sel.estimated_budget)}</div>
              </div>
              <StageBadge stage={sel.stage} />
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {WORKFLOW_STAGES.map((s, i) => {
                  const curIdx = WORKFLOW_STAGES.indexOf(sel.stage as Stage);
                  const done = i < curIdx || sel.stage === "completed";
                  const current = i === curIdx && sel.stage !== "completed";
                  return (
                    <div key={s} className="flex items-center gap-2 flex-shrink-0">
                      <div className={`h-8 min-w-8 px-2 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                        done ? "bg-success text-white" : current ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}>{done ? "✓" : i + 1}</div>
                      <div className="text-xs">{STAGE_LABEL[s]}</div>
                      {i < WORKFLOW_STAGES.length - 1 && <div className={`h-0.5 w-6 ${done ? "bg-success" : "bg-border"}`} />}
                    </div>
                  );
                })}
              </div>
            </div>

            {sel.stage !== "completed" && sel.stage !== "rejected" && (
              <div className="rounded-md border border-border p-3 mb-6">
                <textarea className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" rows={2}
                  placeholder="Digital comment for the audit log…" value={comment} onChange={(e) => setComment(e.target.value)} />
                <div className="mt-3 flex justify-end gap-2">
                  <button onClick={() => act("reject")} disabled={busy} className="px-3 py-2 text-sm rounded-md border border-destructive text-destructive hover:bg-destructive/10 inline-flex items-center gap-1">
                    <XCircle className="h-4 w-4" />Reject
                  </button>
                  <button onClick={() => act("return")} disabled={busy} className="px-3 py-2 text-sm rounded-md border border-border hover:bg-muted inline-flex items-center gap-1">
                    <RotateCcw className="h-4 w-4" />Return
                  </button>
                  <button onClick={() => act("approve")} disabled={busy} className="px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground inline-flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />Approve
                  </button>
                </div>
              </div>
            )}

            <div>
              <div className="text-sm font-semibold mb-3">Approval History</div>
              <div className="space-y-2">
                {trail.map((a: any) => (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded-md border border-border">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-white text-xs ${
                      a.action === "approve" ? "bg-success" : a.action === "reject" ? "bg-destructive" : "bg-warning"
                    }`}>{a.action === "approve" ? "✓" : a.action === "reject" ? "✕" : "↺"}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{STAGE_LABEL[a.stage]} — {a.action}</div>
                      <div className="text-xs text-muted-foreground">{a.actor_email ?? "system"} · {new Date(a.created_at).toLocaleString()}</div>
                      {a.comments && <div className="text-sm mt-1">{a.comments}</div>}
                    </div>
                  </div>
                ))}
                {!trail.length && <div className="text-sm text-muted-foreground">No approval events yet.</div>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FinancePanel({ requests, finance, onSaved }: any) {
  const queue = requests.filter((r: any) => ["finance", "completed"].includes(r.stage));
  const [selId, setSelId] = useState<string | null>(queue[0]?.id ?? null);
  const sel = requests.find((r: any) => r.id === selId);
  const existing = finance.find((f: any) => f.request_id === selId);
  const [state, setState] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useMemo(() => setState(existing ? { ...existing } : {
    budget_line_validated: false, available_budget_verified: false,
    financial_reference: "", final_approved: false, budget_released: false, released_amount: sel?.estimated_budget ?? "",
  }), [selId, existing?.id]);

  async function save() {
    if (!sel) return;
    setSaving(true);
    const user = (await supabase.auth.getUser()).data.user;
    const payload = {
      request_id: sel.id,
      budget_line_validated: !!state.budget_line_validated,
      available_budget_verified: !!state.available_budget_verified,
      financial_reference: state.financial_reference || null,
      final_approved: !!state.final_approved,
      budget_released: !!state.budget_released,
      released_amount: state.released_amount ? Number(state.released_amount) : null,
      notes: state.notes || null,
      finance_user: user?.id ?? null,
    };
    if (existing) await supabase.from("financial_processing").update(payload).eq("id", existing.id);
    else await supabase.from("financial_processing").insert(payload);

    if (state.final_approved && state.budget_released) {
      await supabase.from("capex_requests").update({ stage: "completed" }).eq("id", sel.id);
      await supabase.from("project_approvals").insert({
        request_id: sel.id, stage: "finance", action: "approve",
        comments: "Budget released — " + (state.financial_reference || ""),
        actor_id: user?.id ?? null, actor_email: user?.email ?? "finance",
      });
    }
    toast.success("Finance record updated");
    setSaving(false);
    onSaved?.();
  }

  const input = "w-full px-3 py-2 rounded-md border border-border bg-background text-sm";
  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
      <div className="rounded-lg border border-border bg-card p-3 max-h-[70vh] overflow-auto">
        <div className="text-xs uppercase text-muted-foreground mb-2 px-1">Finance Queue ({queue.length})</div>
        {queue.map((r: any) => (
          <button key={r.id} onClick={() => setSelId(r.id)} className={`w-full text-left px-3 py-2 rounded-md text-sm mb-1 ${selId === r.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
            <div className="font-medium truncate">{r.project_name}</div>
            <div className={`text-[11px] ${selId === r.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{formatAED(r.estimated_budget)}</div>
          </button>
        ))}
        {!queue.length && <div className="text-xs text-muted-foreground p-3">Nothing pending finance action.</div>}
      </div>
      <div className="rounded-lg border border-border bg-card p-5">
        {!sel ? <div className="text-sm text-muted-foreground">Select a project.</div> : (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-lg font-semibold">{sel.project_name}</div>
                <div className="text-xs text-muted-foreground">{sel.project_code} · {formatAED(sel.estimated_budget)}</div>
              </div>
              <StageBadge stage={sel.stage} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                ["budget_line_validated", "Budget Line Validated"],
                ["available_budget_verified", "Available Budget Verified"],
                ["final_approved", "Final Approval"],
                ["budget_released", "Budget Released"],
              ].map(([k, l]) => (
                <label key={k} className="flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-border">
                  <input type="checkbox" checked={!!state[k]} onChange={(e) => setState((s: any) => ({ ...s, [k]: e.target.checked }))} />{l}
                </label>
              ))}
              <label className="text-sm"><div className="text-xs uppercase text-muted-foreground mb-1">Financial Reference</div><input className={input} value={state.financial_reference ?? ""} onChange={(e) => setState((s: any) => ({ ...s, financial_reference: e.target.value }))} /></label>
              <label className="text-sm"><div className="text-xs uppercase text-muted-foreground mb-1">Released Amount (AED)</div><input type="number" className={input} value={state.released_amount ?? ""} onChange={(e) => setState((s: any) => ({ ...s, released_amount: e.target.value }))} /></label>
              <label className="text-sm md:col-span-2"><div className="text-xs uppercase text-muted-foreground mb-1">Notes</div><textarea rows={2} className={input} value={state.notes ?? ""} onChange={(e) => setState((s: any) => ({ ...s, notes: e.target.value }))} /></label>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={save} disabled={saving} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground inline-flex items-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}Save Finance Record
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}