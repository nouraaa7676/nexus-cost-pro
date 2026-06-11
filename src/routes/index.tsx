import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { formatAED, formatAEDFull, severityColor } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, TrendingUp, Wallet, Activity, Sparkles, AlertTriangle, Building2 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, AreaChart, Area } from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "e& Budget Approval & AI Cost Control" },
      { name: "description", content: "AI-powered enterprise platform for CAPEX/OPEX budget approval, tracking and forecasting." },
    ],
  }),
  component: Dashboard,
});

function KpiCard({ label, value, delta, positive, icon: Icon }: { label: string; value: string; delta?: string; positive?: boolean; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5" style={{ boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</div>
          <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
          {delta && (
            <div className={`mt-1 text-xs inline-flex items-center gap-1 ${positive ? "text-success" : "text-destructive"}`}>
              {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {delta}
            </div>
          )}
        </div>
        <div className="h-9 w-9 rounded-md bg-accent flex items-center justify-center text-accent-foreground">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="mb-4">
        <div className="text-sm font-semibold">{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
      </div>
      <div className="h-64">{children}</div>
    </div>
  );
}

function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-data"],
    queryFn: async () => {
      const [depts, invs, alerts, vendors, projects] = await Promise.all([
        supabase.from("departments").select("*"),
        supabase.from("invoices").select("*"),
        supabase.from("alerts").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(5),
        supabase.from("vendors").select("*"),
        supabase.from("projects").select("*"),
      ]);
      return {
        departments: depts.data ?? [],
        invoices: invs.data ?? [],
        alerts: alerts.data ?? [],
        vendors: vendors.data ?? [],
        projects: projects.data ?? [],
      };
    },
  });

  const departments = data?.departments ?? [];
  const invoices = data?.invoices ?? [];
  const alerts = data?.alerts ?? [];
  const projects = data?.projects ?? [];

  const totalBudget = departments.reduce((s, d) => s + Number(d.annual_budget ?? 0), 0);
  const capexSpent = invoices.filter((i) => i.budget_type === "CAPEX").reduce((s, i) => s + Number(i.amount), 0);
  const opexSpent = invoices.filter((i) => i.budget_type === "OPEX").reduce((s, i) => s + Number(i.amount), 0);
  const totalSpent = capexSpent + opexSpent;
  const remaining = totalBudget - totalSpent;
  const utilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // monthly aggregation
  const monthly: Record<string, { month: string; capex: number; opex: number; total: number }> = {};
  for (let m = 1; m <= 12; m++) {
    const k = String(m).padStart(2, "0");
    monthly[k] = { month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m - 1], capex: 0, opex: 0, total: 0 };
  }
  invoices.forEach((i) => {
    const m = String(new Date(i.invoice_date).getMonth() + 1).padStart(2, "0");
    const k = monthly[m];
    if (!k) return;
    if (i.budget_type === "CAPEX") k.capex += Number(i.amount) / 1_000_000;
    else if (i.budget_type === "OPEX") k.opex += Number(i.amount) / 1_000_000;
    k.total = k.capex + k.opex;
  });
  const monthlyData = Object.values(monthly);
  const monthlyPlan = totalBudget / 12 / 1_000_000;

  const deptData = departments.map((d) => {
    const spent = invoices.filter((i) => i.department_id === d.id).reduce((s, i) => s + Number(i.amount), 0);
    return { name: d.name.length > 14 ? d.name.slice(0, 12) + "…" : d.name, allocated: Number(d.annual_budget) / 1_000_000, spent: spent / 1_000_000 };
  });

  const isEmpty = !isLoading && departments.length === 0 && invoices.length === 0;

  return (
    <AppLayout title="Executive Dashboard" subtitle="FY2026 · Real-time CAPEX & OPEX intelligence">
      {isEmpty && (
        <div className="mb-6 p-4 rounded-lg border border-primary/20 bg-primary/5 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold">Welcome — your platform is empty</div>
            <div className="text-muted-foreground mt-1">Import departments, vendors and invoices from the <Link to="/data-management" className="text-primary underline">Data Management</Link> page to populate dashboards, forecasts and AI insights.</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <KpiCard label="Annual Budget" value={formatAED(totalBudget)} delta={`${departments.length} departments`} positive icon={Wallet} />
        <KpiCard label="Total CAPEX" value={formatAED(capexSpent)} delta={`${invoices.filter(i => i.budget_type==="CAPEX").length} entries`} positive icon={TrendingUp} />
        <KpiCard label="Total OPEX" value={formatAED(opexSpent)} delta={`${invoices.filter(i => i.budget_type==="OPEX").length} entries`} positive icon={Activity} />
        <KpiCard label="Remaining" value={formatAED(remaining)} delta={`${(100 - utilization).toFixed(1)}% available`} positive={remaining >= 0} icon={Wallet} />
        <KpiCard label="Utilization" value={`${utilization.toFixed(1)}%`} delta={utilization > 90 ? "Above plan" : "On track"} positive={utilization < 95} icon={Activity} />
        <KpiCard label="Open Alerts" value={String(alerts.length)} delta={`${alerts.filter(a => a.severity === "critical" || a.severity === "high").length} high impact`} positive={alerts.length === 0} icon={AlertTriangle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Monthly CAPEX vs OPEX" subtitle="AED millions">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="capex" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.58 0.22 27)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="oklch(0.58 0.22 27)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="opex" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.12 0 0)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="oklch(0.12 0 0)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" />
              <XAxis dataKey="month" stroke="oklch(0.45 0 0)" fontSize={11} />
              <YAxis stroke="oklch(0.45 0 0)" fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.9 0 0)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="capex" stroke="oklch(0.58 0.22 27)" fill="url(#capex)" name="CAPEX" />
              <Area type="monotone" dataKey="opex" stroke="oklch(0.12 0 0)" fill="url(#opex)" name="OPEX" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Budget vs Actual" subtitle={`Plan ${monthlyPlan.toFixed(1)}M / month`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData.map((m) => ({ ...m, plan: monthlyPlan }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" />
              <XAxis dataKey="month" stroke="oklch(0.45 0 0)" fontSize={11} />
              <YAxis stroke="oklch(0.45 0 0)" fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.9 0 0)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="total" stroke="oklch(0.58 0.22 27)" strokeWidth={2.5} dot={{ r: 3 }} name="Actual" />
              <Line type="monotone" dataKey="plan" stroke="oklch(0.12 0 0)" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Plan" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Department Spend Comparison" subtitle="Allocated vs spent (AED M)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" />
              <XAxis dataKey="name" stroke="oklch(0.45 0 0)" fontSize={11} />
              <YAxis stroke="oklch(0.45 0 0)" fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.9 0 0)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="allocated" fill="oklch(0.85 0 0)" name="Allocated" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spent" fill="oklch(0.58 0.22 27)" name="Spent" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Cost Drivers" subtitle="Active projects by actual spend">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projects.slice().sort((a, b) => Number(b.actual_amount) - Number(a.actual_amount)).slice(0, 6).map((p) => ({ name: p.name.length > 18 ? p.name.slice(0, 16) + "…" : p.name, value: Number(p.actual_amount) / 1_000_000 }))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" />
              <XAxis type="number" stroke="oklch(0.45 0 0)" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="oklch(0.45 0 0)" fontSize={10} width={130} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.9 0 0)" }} />
              <Bar dataKey="value" fill="oklch(0.58 0.22 27)" name="AED M" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Open Risk Alerts</div>
              <div className="text-xs text-muted-foreground">AI-detected anomalies and risks</div>
            </div>
            <Link to="/alerts" className="text-xs text-primary font-medium hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-border">
            {alerts.length === 0 && <div className="px-5 py-8 text-center text-sm text-muted-foreground">No open alerts.</div>}
            {alerts.map((a) => (
              <div key={a.id} className="px-5 py-3 flex items-start gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${severityColor(a.severity)}`}>{a.severity}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{a.description}</div>
                </div>
                {a.impact_amount && <div className="text-xs font-semibold tabular-nums">{formatAEDFull(Number(a.impact_amount))}</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-primary" />
            <div className="text-sm font-semibold">Vendor Concentration</div>
          </div>
          <div className="space-y-2 text-xs">
            {(data?.vendors ?? []).slice(0, 5).map((v) => {
              const spent = invoices.filter((i) => i.vendor_id === v.id).reduce((s, i) => s + Number(i.amount), 0);
              const pct = totalSpent > 0 ? (spent / totalSpent) * 100 : 0;
              return (
                <div key={v.id}>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium truncate">{v.name}</span>
                    <span className="text-muted-foreground">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </div>
              );
            })}
            {(data?.vendors ?? []).length === 0 && <div className="text-muted-foreground py-4 text-center">No vendor data.</div>}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
