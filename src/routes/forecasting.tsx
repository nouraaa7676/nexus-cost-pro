import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatAED, riskColor } from "@/lib/format";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/forecasting")({
  head: () => ({ meta: [{ title: "Forecasting · e&" }] }),
  component: Forecasting,
});

function Forecasting() {
  const { data } = useQuery({
    queryKey: ["forecast-data"],
    queryFn: async () => {
      const [invs, depts, projects] = await Promise.all([
        supabase.from("invoices").select("*"),
        supabase.from("departments").select("*"),
        supabase.from("projects").select("*"),
      ]);
      return { invoices: invs.data ?? [], departments: depts.data ?? [], projects: projects.data ?? [] };
    },
  });

  const invoices = data?.invoices ?? [];
  const depts = data?.departments ?? [];
  const projects = data?.projects ?? [];

  // Build monthly actual + linear projection for remaining months
  const monthly: Record<number, number> = {};
  invoices.forEach((i) => {
    const m = new Date(i.invoice_date).getMonth() + 1;
    monthly[m] = (monthly[m] ?? 0) + Number(i.amount);
  });
  const monthsWithData = Object.keys(monthly).map(Number).sort((a, b) => a - b);
  const lastMonth = monthsWithData.length ? Math.max(...monthsWithData) : 0;
  const avgRecent = monthsWithData.length ? monthsWithData.slice(-3).reduce((s, m) => s + monthly[m], 0) / Math.min(3, monthsWithData.length) : 0;
  const ytdActual = Object.values(monthly).reduce((s, v) => s + v, 0);
  const projectedRemaining = (12 - lastMonth) * avgRecent;
  const eoyForecast = ytdActual + projectedRemaining;
  const totalBudget = depts.reduce((s, d) => s + Number(d.annual_budget ?? 0), 0);
  const variance = eoyForecast - totalBudget;
  const confidence = monthsWithData.length >= 6 ? 92 : monthsWithData.length >= 3 ? 78 : 55;

  const chartData = Array.from({ length: 12 }, (_, idx) => {
    const m = idx + 1;
    const label = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][idx];
    const actual = m <= lastMonth ? (monthly[m] ?? 0) / 1_000_000 : null;
    const forecast = m > lastMonth ? avgRecent / 1_000_000 : null;
    return { month: label, actual, forecast };
  });

  const deptForecasts = depts.map((d) => {
    const spent = invoices.filter((i) => i.department_id === d.id).reduce((s, i) => s + Number(i.amount), 0);
    const monthsActive = Math.max(1, lastMonth);
    const projected = (spent / monthsActive) * 12;
    const risk = projected > Number(d.annual_budget) * 1.05 ? "high" : projected > Number(d.annual_budget) * 0.95 ? "medium" : "low";
    return { ...d, spent, projected, risk };
  });

  return (
    <AppLayout title="Forecasting Engine" subtitle="AI-driven monthly, quarterly and year-end projections">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="YTD Actual" value={formatAED(ytdActual)} sub={`Through month ${lastMonth || "—"}`} />
        <Stat label="EOY Forecast" value={formatAED(eoyForecast)} sub={`Based on 3-month run rate`} />
        <Stat label="vs Annual Budget" value={formatAED(variance)} sub={variance >= 0 ? "Projected overrun" : "Projected favourable"} negative={variance > 0} />
        <Stat label="Forecast Confidence" value={`${confidence}%`} sub={confidence > 80 ? "High" : confidence > 60 ? "Medium" : "Low"} />
      </div>

      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <div className="flex items-center gap-2 mb-4"><TrendingUp className="h-4 w-4 text-primary" /><div className="text-sm font-semibold">Year-end projection (AED M)</div></div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" />
              <XAxis dataKey="month" fontSize={11} stroke="oklch(0.45 0 0)" />
              <YAxis fontSize={11} stroke="oklch(0.45 0 0)" />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.9 0 0)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="actual" stroke="oklch(0.58 0.22 27)" strokeWidth={2.5} dot={{ r: 3 }} name="Actual" connectNulls />
              <Line type="monotone" dataKey="forecast" stroke="oklch(0.45 0 0)" strokeDasharray="5 5" strokeWidth={2} dot={{ r: 3 }} name="AI Forecast" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg">
          <div className="px-5 py-4 border-b border-border text-sm font-semibold">Department forecasts</div>
          <div className="divide-y divide-border">
            {deptForecasts.length === 0 && <div className="px-5 py-8 text-center text-sm text-muted-foreground">No department data.</div>}
            {deptForecasts.map((d) => (
              <div key={d.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{d.name}</div>
                  <div className="text-xs text-muted-foreground">Forecast {formatAED(d.projected)} · Budget {formatAED(Number(d.annual_budget))}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${riskColor(d.risk)}`}>{d.risk} risk</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg">
          <div className="px-5 py-4 border-b border-border text-sm font-semibold">Project overrun risk</div>
          <div className="divide-y divide-border">
            {projects.length === 0 && <div className="px-5 py-8 text-center text-sm text-muted-foreground">No projects loaded.</div>}
            {projects.map((p) => {
              const overrun = Number(p.actual_amount) > Number(p.planned_amount);
              return (
                <div key={p.id} className="px-5 py-3 flex items-center gap-3">
                  {overrun && <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">Planned {formatAED(Number(p.planned_amount))} · Actual {formatAED(Number(p.actual_amount))}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${riskColor(p.risk ?? "low")}`}>{p.risk ?? "low"}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value, sub, negative }: { label: string; value: string; sub: string; negative?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="text-xs text-muted-foreground uppercase font-medium">{label}</div>
      <div className="text-2xl font-bold mt-1.5">{value}</div>
      <div className={`text-xs mt-0.5 ${negative ? "text-destructive" : "text-muted-foreground"}`}>{sub}</div>
    </div>
  );
}