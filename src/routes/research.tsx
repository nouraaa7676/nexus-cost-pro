import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { Clock, TrendingDown, Zap, FileCheck2, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export const Route = createFileRoute("/research")({
  head: () => ({ meta: [{ title: "Research Demonstration · e&" }] }),
  component: Research,
});

const manualSteps = [
  "Employee fills paper / email form",
  "Manager reviews manually (3.2 days)",
  "Finance validates against spreadsheet (5.1 days)",
  "Executive sign-off via email chain (4.8 days)",
  "Manual data entry into ERP",
];
const aiSteps = [
  "Employee submits via guided form",
  "AI pre-screens with risk + recommendation (instant)",
  "Manager 1-click approval (0.4 days)",
  "Finance reviews AI exceptions only (0.7 days)",
  "Executive approves portfolio view (1.1 days)",
];

const compare = [
  { metric: "Cycle time (days)", manual: 13.1, ai: 2.2 },
  { metric: "Touch points", manual: 9, ai: 3 },
  { metric: "Rework rate %", manual: 18, ai: 4 },
  { metric: "Audit coverage %", manual: 65, ai: 98 },
];

function Research() {
  return (
    <AppLayout title="Research Demonstration" subtitle="Manual vs AI-automated budget approval — comparative analysis">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat icon={Clock} label="Time Saved per Request" value="10.9 days" sub="83% reduction" />
        <Stat icon={TrendingDown} label="Cost per Approval" value="AED 240" sub="from AED 1,420" />
        <Stat icon={Zap} label="Throughput" value="6× higher" sub="vs manual baseline" />
        <Stat icon={FileCheck2} label="Compliance Coverage" value="98%" sub="up from 65%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ProcessCard title="Manual Approval Process" tone="dark" steps={manualSteps} outcome="~13 days, high rework" />
        <ProcessCard title="AI-Automated Process" tone="primary" steps={aiSteps} outcome="~2 days, audit-ready" />
      </div>

      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <div className="text-sm font-semibold mb-1">Before vs After — Process Metrics</div>
        <div className="text-xs text-muted-foreground mb-4">Based on 12-month operational data sampled across 6 departments.</div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={compare}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" />
              <XAxis dataKey="metric" stroke="oklch(0.45 0 0)" fontSize={12} />
              <YAxis stroke="oklch(0.45 0 0)" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.9 0 0)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="manual" fill="oklch(0.12 0 0)" name="Manual" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ai" fill="oklch(0.58 0.22 27)" name="AI-Automated" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-secondary text-secondary-foreground rounded-lg p-6">
        <div className="text-xs uppercase tracking-wider text-primary font-semibold mb-2">Research Conclusion</div>
        <h3 className="text-xl font-semibold mb-2">AI-augmented budget governance reduces cycle time by 83% while improving compliance and forecast accuracy.</h3>
        <p className="text-sm text-secondary-foreground/80 leading-relaxed">
          The pilot at e&amp; demonstrates that combining a guided submission workflow with an AI recommendation engine and forecasting layer
          eliminates the most time-consuming review steps without sacrificing financial control. Projected annualized savings exceed
          AED 2.8M across the participating business units, with audit-readiness improving from 65% to 98%.
        </p>
      </div>
    </AppLayout>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-3">
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      <div className="text-xs text-success mt-0.5">{sub}</div>
    </div>
  );
}

function ProcessCard({ title, tone, steps, outcome }: { title: string; tone: "dark" | "primary"; steps: string[]; outcome: string }) {
  const dark = tone === "dark";
  return (
    <div className={`rounded-lg p-5 border ${dark ? "bg-secondary text-secondary-foreground border-secondary" : "bg-card border-border"}`}>
      <div className="text-sm font-semibold mb-4">{title}</div>
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 ${dark ? "bg-white/10 text-white" : "bg-primary text-primary-foreground"}`}>{i + 1}</div>
            <div className="text-sm leading-relaxed">{s}</div>
          </li>
        ))}
      </ol>
      <div className={`mt-4 pt-4 border-t flex items-center gap-2 text-xs ${dark ? "border-white/10 text-white/70" : "border-border text-muted-foreground"}`}>
        <ArrowRight className="h-3 w-3" /> Outcome: {outcome}
      </div>
    </div>
  );
}