import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { formatAED } from "@/lib/format";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Wallet, TrendingUp, Sparkles, ShieldCheck, Clock, AlertTriangle, ArrowRightLeft, Lock, Unlock, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/opex-management")({
  head: () => ({ meta: [{ title: "OPEX Management · e&" }] }),
  component: OpexManagement,
});

const CATEGORIES = ["HR","IT","Marketing","Commercial","Network","Operations","Facilities","Corporate Services","Legal","Customer Experience","Finance"];
const BRAND = ["#E30613","#111111","#F59E0B","#10B981","#3B82F6","#8B5CF6","#EC4899","#14B8A6","#F97316","#6366F1","#84CC16"];

function KPI({ label, value, sub, icon: Icon, tone = "default" }: any) {
  const tones: Record<string, string> = { default:"", primary:"text-primary", success:"text-success", warning:"text-warning", destructive:"text-destructive" };
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

function OpexManagement() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"dashboard" | "departments" | "categories" | "actions" | "forecast" | "insights">("dashboard");

  const { data } = useQuery({
    queryKey: ["opex-all"],
    queryFn: async () => {
      const [depts, invs, budgets] = await Promise.all([
        supabase.from("departments").select("*"),
        supabase.from("invoices").select("*"),
        supabase.from("budgets").select("*").eq("budget_type", "OPEX"),
      ]);
      return { departments: depts.data ?? [], invoices: invs.data ?? [], budgets: budgets.data ?? [] };
    },
    refetchInterval: 20000,
  });

  const departments = data?.departments ?? [];
  const invoices = (data?.invoices ?? []).filter((i: any) => i.budget_type === "OPEX");
  const budgets = data?.budgets ?? [];

  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const periodStart = new Date(currentYear, currentMonth - 1, 1);

  const kpis = useMemo(() => {
    const totalBudget = departments.reduce((s: number, d: any) => s + Number(d.annual_budget || 0), 0);
    const ytd = invoices.filter((i: any) => new Date(i.invoice_date).getFullYear() === currentYear)
      .reduce((s: number, i: any) => s + Number(i.amount), 0);
    const ptd = invoices.filter((i: any) => new Date(i.invoice_date) >= periodStart)
      .reduce((s: number, i: any) => s + Number(i.amount), 0);
    const commit = budgets.reduce((s: number, b: any) => s + Number(b.planned_amount || 0), 0);
    const remaining = totalBudget - ytd;
    const util = totalBudget > 0 ? (ytd / totalBudget) * 100 : 0;
    const runRate = currentMonth > 0 ? (ytd / currentMonth) * 12 : 0;
    return { totalBudget, ytd, ptd, commit, remaining, util, runRate };
  }, [departments, invoices, budgets, currentMonth, currentYear]);

  const monthly = useMemo(() => {
    const arr = Array.from({ length: 12 }, (_, i) => ({ month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i], actual: 0, forecast: 0, budget: kpis.totalBudget / 12 / 1_000_000 }));
    invoices.forEach((i: any) => {
      const d = new Date(i.invoice_date);
      if (d.getFullYear() !== currentYear) return;
      arr[d.getMonth()].actual += Number(i.amount) / 1_000_000;
    });
    const avg = arr.slice(0, currentMonth).reduce((s, x) => s + x.actual, 0) / Math.max(1, currentMonth);
    for (let i = currentMonth; i < 12; i++) arr[i].forecast = avg;
    return arr;
  }, [invoices, kpis.totalBudget, currentMonth, currentYear]);

  const catData = useMemo(() => {
    const map: Record<string, number> = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
    invoices.forEach((i: any) => { if (i.category && map[i.category] !== undefined) map[i.category] += Number(i.amount) / 1_000_000; });
    return Object.entries(map).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
  }, [invoices]);

  const deptRows = useMemo(() => {
    return departments.map((d: any) => {
      const dInv = invoices.filter((i: any) => i.department_id === d.id);
      const ytd = dInv.filter((i: any) => new Date(i.invoice_date).getFullYear() === currentYear).reduce((s: number, i: any) => s + Number(i.amount), 0);
      const ptd = dInv.filter((i: any) => new Date(i.invoice_date) >= periodStart).reduce((s: number, i: any) => s + Number(i.amount), 0);
      const commit = budgets.filter((b: any) => b.department_id === d.id).reduce((s: number, b: any) => s + Number(b.planned_amount || 0), 0);
      const actual = ytd;
      const budget = Number(d.annual_budget || 0);
      const remaining = budget - actual - commit;
      const forecast = currentMonth > 0 ? (ytd / currentMonth) * 12 : 0;
      const variance = budget - forecast;
      const util = budget > 0 ? (actual / budget) * 100 : 0;
      const status = util > 100 ? "red" : util > 85 ? "amber" : "green";
      return { id: d.id, name: d.name, budget, ptd, ytd, commit, actual, remaining, forecast, variance, util, status };
    });
  }, [departments, invoices, budgets, currentMonth, periodStart]);

  const insights = useMemo(() => {
    const over = deptRows.filter((r) => r.util > 100).map((r) => `${r.name} is overspent by ${formatAED(-r.remaining)}`);
    const unused = deptRows.filter((r) => r.util < 40 && r.budget > 0).map((r) => `${r.name} has only used ${r.util.toFixed(0)}% of its budget`);
    const risk = deptRows.filter((r) => r.forecast > r.budget).map((r) => `${r.name} forecast to exceed budget by ${formatAED(r.forecast - r.budget)}`);
    const topCat = catData.sort((a, b) => b.value - a.value)[0];
    const savings = deptRows.filter((r) => r.remaining > 0).reduce((s, r) => s + r.remaining, 0);
    return { over, unused, risk, topCat, savings };
  }, [deptRows, catData]);

  return (
    <AppLayout title="OPEX Budget Monitoring" subtitle="Department PTD/YTD tracking, forecasts and AI-driven governance">
      <div className="flex flex-wrap gap-1 mb-6 rounded-lg border border-border bg-card p-1 w-fit">
        {[
          ["dashboard", "Dashboard", Wallet],
          ["departments", "Departments", ShieldCheck],
          ["categories", "Categories", TrendingUp],
          ["actions", "Controller Actions", ArrowRightLeft],
          ["forecast", "Forecasting", Clock],
          ["insights", "AI Insights", Sparkles],
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
            <KPI label="Annual OPEX Budget" value={formatAED(kpis.totalBudget)} icon={Wallet} tone="primary" />
            <KPI label="PTD Spend" value={formatAED(kpis.ptd)} sub="Period-to-Date" icon={Clock} />
            <KPI label="YTD Spend" value={formatAED(kpis.ytd)} sub="Year-to-Date" icon={TrendingUp} />
            <KPI label="Remaining" value={formatAED(kpis.remaining)} icon={Sparkles} tone={kpis.remaining < 0 ? "destructive" : "success"} />
            <KPI label="Utilization" value={kpis.util.toFixed(1) + "%"} icon={ShieldCheck} tone={kpis.util > 100 ? "destructive" : kpis.util > 85 ? "warning" : "success"} />
            <KPI label="Forecast Year-End" value={formatAED(kpis.runRate)} icon={AlertTriangle} tone={kpis.runRate > kpis.totalBudget ? "warning" : "default"} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Monthly OPEX Trend (AED M)">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                  <Line type="monotone" dataKey="actual" stroke="#E30613" strokeWidth={2} name="Actual" />
                  <Line type="monotone" dataKey="forecast" stroke="#F59E0B" strokeDasharray="4 4" strokeWidth={2} name="Forecast" />
                  <Line type="monotone" dataKey="budget" stroke="#111111" strokeWidth={1} name="Budget/mo" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="PTD vs YTD Comparison (AED M)">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={deptRows.slice(0, 8).map((r) => ({ name: r.name, PTD: r.ptd / 1_000_000, YTD: r.ytd / 1_000_000 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                  <Bar dataKey="PTD" fill="#111111" radius={[4,4,0,0]} />
                  <Bar dataKey="YTD" fill="#E30613" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Budget vs Actual by Department (AED M)">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={deptRows.map((r) => ({ name: r.name, Budget: r.budget / 1_000_000, Actual: r.actual / 1_000_000 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                  <Bar dataKey="Budget" fill="#111111" radius={[4,4,0,0]} />
                  <Bar dataKey="Actual" fill="#E30613" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Category Spending Share">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95}>
                    {catData.map((_, i) => <Cell key={i} fill={BRAND[i % BRAND.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <ChartCard title="Budget Utilization Heatmap">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {deptRows.map((r) => (
                <div key={r.id} className={`p-3 rounded-md border ${r.status === "red" ? "bg-destructive/10 border-destructive/30" : r.status === "amber" ? "bg-warning/10 border-warning/30" : "bg-success/10 border-success/30"}`}>
                  <div className="text-xs font-medium truncate">{r.name}</div>
                  <div className="text-lg font-semibold mt-1">{r.util.toFixed(0)}%</div>
                  <div className="text-[10px] text-muted-foreground">{formatAED(r.actual)}</div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}

      {tab === "departments" && <DepartmentsTable rows={deptRows} />}
      {tab === "categories" && <CategoriesTable catData={catData} invoices={invoices} />}
      {tab === "actions" && <ControllerActions departments={departments} onSaved={() => qc.invalidateQueries({ queryKey: ["opex-all"] })} />}
      {tab === "forecast" && <ForecastPanel rows={deptRows} monthly={monthly} kpis={kpis} currentMonth={currentMonth} />}
      {tab === "insights" && <InsightsPanel insights={insights} />}
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

function DepartmentsTable({ rows }: any) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs text-muted-foreground uppercase">
          <tr>
            <th className="text-left px-4 py-2">Department</th>
            <th className="text-right px-4 py-2">Budget</th>
            <th className="text-right px-4 py-2">PTD</th>
            <th className="text-right px-4 py-2">YTD</th>
            <th className="text-right px-4 py-2">Commit</th>
            <th className="text-right px-4 py-2">Actual</th>
            <th className="text-right px-4 py-2">Remaining</th>
            <th className="text-right px-4 py-2">Forecast</th>
            <th className="text-right px-4 py-2">Variance</th>
            <th className="text-center px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r: any) => (
            <tr key={r.id} className="border-t border-border">
              <td className="px-4 py-2 font-medium">{r.name}</td>
              <td className="px-4 py-2 text-right">{formatAED(r.budget)}</td>
              <td className="px-4 py-2 text-right">{formatAED(r.ptd)}</td>
              <td className="px-4 py-2 text-right">{formatAED(r.ytd)}</td>
              <td className="px-4 py-2 text-right">{formatAED(r.commit)}</td>
              <td className="px-4 py-2 text-right">{formatAED(r.actual)}</td>
              <td className={`px-4 py-2 text-right ${r.remaining < 0 ? "text-destructive" : ""}`}>{formatAED(r.remaining)}</td>
              <td className="px-4 py-2 text-right">{formatAED(r.forecast)}</td>
              <td className={`px-4 py-2 text-right ${r.variance < 0 ? "text-destructive" : "text-success"}`}>{formatAED(r.variance)}</td>
              <td className="px-4 py-2 text-center">
                <span className={`inline-block h-2 w-2 rounded-full ${r.status === "red" ? "bg-destructive" : r.status === "amber" ? "bg-warning" : "bg-success"}`} />
                <span className="text-xs ml-2 capitalize">{r.status}</span>
              </td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={10} className="text-center py-10 text-muted-foreground">No department data.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function CategoriesTable({ catData, invoices }: any) {
  const rows = CATEGORIES.map((c) => {
    const invs = invoices.filter((i: any) => i.category === c);
    const spend = invs.reduce((s: number, i: any) => s + Number(i.amount), 0);
    return { name: c, count: invs.length, spend };
  });
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
      <ChartCard title="Category Spending (AED M)">
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={catData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={130} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
            <Bar dataKey="value" fill="#E30613" radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <div className="rounded-lg border border-border bg-card overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground uppercase">
            <tr><th className="text-left px-4 py-2">Category</th><th className="text-right px-4 py-2">Invoices</th><th className="text-right px-4 py-2">Total Spend</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-border">
                <td className="px-4 py-2 font-medium">{r.name}</td>
                <td className="px-4 py-2 text-right">{r.count}</td>
                <td className="px-4 py-2 text-right">{formatAED(r.spend)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ControllerActions({ departments, onSaved }: any) {
  const [from, setFrom] = useState<string>(departments[0]?.id ?? "");
  const [to, setTo] = useState<string>(departments[1]?.id ?? "");
  const [amount, setAmount] = useState<string>("");
  const [busy, setBusy] = useState<string | null>(null);

  async function transfer() {
    if (!from || !to || from === to || !Number(amount)) { toast.error("Select two departments and enter an amount"); return; }
    setBusy("transfer");
    const src = departments.find((d: any) => d.id === from);
    const dst = departments.find((d: any) => d.id === to);
    const a = Number(amount);
    const { error: e1 } = await supabase.from("departments").update({ annual_budget: Number(src.annual_budget) - a }).eq("id", from);
    const { error: e2 } = await supabase.from("departments").update({ annual_budget: Number(dst.annual_budget) + a }).eq("id", to);
    if (e1 || e2) toast.error((e1 || e2)!.message);
    else {
      await supabase.from("audit_logs").insert({ action: "budget_transfer", entity: "departments", entity_id: to, details: { from, to, amount: a } }).select();
      toast.success("Budget transferred");
      setAmount("");
      onSaved?.();
    }
    setBusy(null);
  }

  async function adjust(id: string, delta: number, label: string) {
    setBusy(id + label);
    const d = departments.find((x: any) => x.id === id);
    if (!d) { setBusy(null); return; }
    const { error } = await supabase.from("departments").update({ annual_budget: Number(d.annual_budget) + delta }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(label + " applied"); onSaved?.(); }
    setBusy(null);
  }

  const input = "w-full px-3 py-2 rounded-md border border-border bg-background text-sm";
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="text-sm font-semibold mb-4 flex items-center gap-2"><ArrowRightLeft className="h-4 w-4" />Transfer Budget Between Departments</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <label className="text-sm"><div className="text-xs uppercase text-muted-foreground mb-1">From</div>
            <select className={input} value={from} onChange={(e) => setFrom(e.target.value)}>{departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          </label>
          <label className="text-sm"><div className="text-xs uppercase text-muted-foreground mb-1">To</div>
            <select className={input} value={to} onChange={(e) => setTo(e.target.value)}>{departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          </label>
          <label className="text-sm"><div className="text-xs uppercase text-muted-foreground mb-1">Amount (AED)</div><input className={input} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
          <div className="flex items-end"><button onClick={transfer} disabled={busy === "transfer"} className="w-full px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground inline-flex items-center justify-center gap-2">{busy === "transfer" && <Loader2 className="h-4 w-4 animate-spin" />}Transfer</button></div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-auto">
        <div className="p-4 border-b border-border text-sm font-semibold">Freeze / Release Budget Lines</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground uppercase">
            <tr><th className="text-left px-4 py-2">Department</th><th className="text-right px-4 py-2">Annual Budget</th><th className="text-right px-4 py-2">Actions</th></tr>
          </thead>
          <tbody>
            {departments.map((d: any) => (
              <tr key={d.id} className="border-t border-border">
                <td className="px-4 py-2 font-medium">{d.name}</td>
                <td className="px-4 py-2 text-right">{formatAED(d.annual_budget)}</td>
                <td className="px-4 py-2 text-right">
                  <div className="inline-flex gap-2">
                    <button onClick={() => adjust(d.id, -Number(d.annual_budget) * 0.1, "Freeze 10%")} className="px-2 py-1 text-xs rounded-md border border-border hover:bg-muted inline-flex items-center gap-1"><Lock className="h-3 w-3" />Freeze 10%</button>
                    <button onClick={() => adjust(d.id, Number(d.annual_budget) * 0.1, "Release +10%")} className="px-2 py-1 text-xs rounded-md border border-border hover:bg-muted inline-flex items-center gap-1"><Unlock className="h-3 w-3" />Release +10%</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ForecastPanel({ rows, monthly, kpis, currentMonth }: any) {
  const q = [0, 0, 0, 0];
  monthly.forEach((m: any, i: number) => { q[Math.floor(i / 3)] += (m.actual || 0) + (m.forecast || 0); });
  const confidence = currentMonth >= 6 ? 92 : currentMonth >= 3 ? 78 : 60;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Monthly Run Rate" value={formatAED(kpis.ytd / Math.max(1, currentMonth))} icon={Clock} />
        <KPI label="Quarterly Forecast" value={formatAED((kpis.ytd / Math.max(1, currentMonth)) * 3)} icon={TrendingUp} />
        <KPI label="Year-End Forecast" value={formatAED(kpis.runRate)} icon={AlertTriangle} tone={kpis.runRate > kpis.totalBudget ? "warning" : "default"} />
        <KPI label="Confidence" value={confidence + "%"} icon={ShieldCheck} tone="success" />
      </div>
      <ChartCard title="Forecast vs Budget (AED M)">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
            <Legend />
            <Line type="monotone" dataKey="actual" stroke="#E30613" strokeWidth={2} name="Actual" />
            <Line type="monotone" dataKey="forecast" stroke="#F59E0B" strokeDasharray="4 4" strokeWidth={2} name="Forecast" />
            <Line type="monotone" dataKey="budget" stroke="#111111" strokeWidth={1} name="Budget/mo" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
      <div className="rounded-lg border border-border bg-card overflow-auto">
        <div className="p-4 border-b border-border text-sm font-semibold">Department Forecast & Variance</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground uppercase">
            <tr><th className="text-left px-4 py-2">Department</th><th className="text-right px-4 py-2">Budget</th><th className="text-right px-4 py-2">YTD</th><th className="text-right px-4 py-2">Forecast</th><th className="text-right px-4 py-2">Variance</th><th className="text-right px-4 py-2">Overrun Risk</th></tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-4 py-2 font-medium">{r.name}</td>
                <td className="px-4 py-2 text-right">{formatAED(r.budget)}</td>
                <td className="px-4 py-2 text-right">{formatAED(r.ytd)}</td>
                <td className="px-4 py-2 text-right">{formatAED(r.forecast)}</td>
                <td className={`px-4 py-2 text-right ${r.variance < 0 ? "text-destructive" : "text-success"}`}>{formatAED(r.variance)}</td>
                <td className="px-4 py-2 text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.forecast > r.budget ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>
                    {r.forecast > r.budget ? "High" : "Low"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InsightsPanel({ insights }: any) {
  const Block = ({ title, items, tone }: any) => (
    <div className={`rounded-lg border p-4 ${tone === "red" ? "border-destructive/30 bg-destructive/5" : tone === "amber" ? "border-warning/30 bg-warning/5" : "border-success/30 bg-success/5"}`}>
      <div className="text-sm font-semibold mb-2">{title}</div>
      {items.length ? (
        <ul className="space-y-1 text-sm">{items.map((t: string, i: number) => <li key={i}>• {t}</li>)}</ul>
      ) : <div className="text-xs text-muted-foreground">No issues detected.</div>}
    </div>
  );
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Block title="Overspending Departments" tone="red" items={insights.over} />
      <Block title="Forecast Overruns" tone="amber" items={insights.risk} />
      <Block title="Unused Budget Opportunities" tone="green" items={insights.unused} />
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-sm font-semibold mb-2">Executive Recommendation</div>
        <div className="text-sm text-muted-foreground">
          Top spending category: <span className="font-medium text-foreground">{insights.topCat?.name ?? "n/a"}</span> ({formatAED((insights.topCat?.value ?? 0) * 1_000_000)}).
          Potential reallocation from underused departments: <span className="font-medium text-foreground">{formatAED(insights.savings)}</span>.
          Consider redirecting these funds to high-priority initiatives and tightening controls on overspending units.
        </div>
      </div>
    </div>
  );
}