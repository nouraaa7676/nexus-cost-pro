import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { departments, monthlyTrend, approvalTimes, totals, requests, aiForecasts } from "@/lib/mock-data";
import { formatAED, StatusBadge, RecommendationBadge } from "@/components/status-badge";
import { ArrowDownRight, ArrowUpRight, TrendingUp, Wallet, Clock, Activity, Sparkles, AlertTriangle } from "lucide-react";
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
    <div className="bg-card border border-border rounded-lg p-5 shadow-card" style={{ boxShadow: "var(--shadow-card)" }}>
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
  const recent = requests.slice(0, 5);
  return (
    <AppLayout title="Executive Dashboard" subtitle="FY2026 · Year-to-date performance">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <KpiCard label="Approved Budget" value="AED 35.5M" delta="+8.2% YoY" positive icon={Wallet} />
        <KpiCard label="Pending Requests" value="14" delta="3 high priority" positive={false} icon={Clock} />
        <KpiCard label="CAPEX Utilization" value="68%" delta="On track" positive icon={Activity} />
        <KpiCard label="OPEX Utilization" value="74%" delta="+2pp vs plan" positive={false} icon={Activity} />
        <KpiCard label="Budget Variance" value="-3.2%" delta="Favourable" positive icon={TrendingUp} />
        <KpiCard label="AI Cost Savings" value={formatAED(totals.aiSavings)} delta="12 initiatives" positive icon={Sparkles} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Monthly CAPEX vs OPEX Trend" subtitle="AED millions">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyTrend}>
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

        <ChartCard title="Budget vs Actual Spending" subtitle="Plan AED 2.4M / month">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrend.map((m) => ({ month: m.month, actual: m.capex + m.opex, budget: m.budget * 2 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" />
              <XAxis dataKey="month" stroke="oklch(0.45 0 0)" fontSize={11} />
              <YAxis stroke="oklch(0.45 0 0)" fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.9 0 0)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="actual" stroke="oklch(0.58 0.22 27)" strokeWidth={2.5} dot={{ r: 3 }} name="Actual" />
              <Line type="monotone" dataKey="budget" stroke="oklch(0.12 0 0)" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Budget" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Department Spending" subtitle="Spent vs allocated (AED M)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={departments.map((d) => ({ name: d.name.split(" ")[0], spent: d.spent / 1_000_000, budget: d.budget / 1_000_000 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" />
              <XAxis dataKey="name" stroke="oklch(0.45 0 0)" fontSize={11} />
              <YAxis stroke="oklch(0.45 0 0)" fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.9 0 0)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="budget" fill="oklch(0.85 0 0)" name="Allocated" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spent" fill="oklch(0.58 0.22 27)" name="Spent" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Approval Processing Time" subtitle="Days · Manual vs AI-assisted">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={approvalTimes} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" />
              <XAxis type="number" stroke="oklch(0.45 0 0)" fontSize={11} />
              <YAxis type="category" dataKey="stage" stroke="oklch(0.45 0 0)" fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.9 0 0)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="manual" fill="oklch(0.12 0 0)" name="Manual" radius={[0, 4, 4, 0]} />
              <Bar dataKey="ai" fill="oklch(0.58 0.22 27)" name="AI-assisted" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Recent Requests</div>
              <div className="text-xs text-muted-foreground">Latest submissions across departments</div>
            </div>
            <Link to="/requests" className="text-xs text-primary font-medium hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-border">
            {recent.map((r) => (
              <div key={r.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{r.project}</div>
                  <div className="text-xs text-muted-foreground">{r.id} · {r.department} · {r.type}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-sm font-semibold tabular-nums">{formatAED(r.amount)}</div>
                  <RecommendationBadge rec={r.aiRecommendation} />
                  <StatusBadge status={r.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <div className="text-sm font-semibold">AI Forecasting</div>
          </div>
          <div className="space-y-3">
            {aiForecasts.map((f) => (
              <div key={f.label} className="border border-border rounded-md p-3">
                <div className="text-xs text-muted-foreground">{f.label}</div>
                <div className="text-base font-semibold mt-0.5">{f.value}</div>
                <div className={`text-xs mt-0.5 ${f.positive ? "text-success" : "text-destructive"}`}>{f.delta}</div>
              </div>
            ))}
            <div className="mt-3 flex items-start gap-2 p-3 rounded-md bg-warning/10 border border-warning/30">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <div className="text-xs text-foreground">
                <span className="font-semibold">Forecast alert:</span> Marketing OPEX projected to exceed plan by AED 540K. Recommend reallocation.
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
