import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send, Sparkles, Bot, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ai-copilot")({
  head: () => ({ meta: [{ title: "AI Co-Pilot · e&" }] }),
  component: CoPilot,
});

type Msg = { role: "user" | "assistant"; content: string };

const suggestions = [
  "Why is CAPEX increasing?",
  "Which departments exceeded budget?",
  "Show vendor spending trends.",
  "Generate executive summary.",
  "Predict year-end spending.",
  "What cost-saving opportunities exist?",
  "Who are the most expensive vendors?",
  "What projects have highest risk?",
];

async function gatherContext(): Promise<string> {
  const [d, v, i, p, a] = await Promise.all([
    supabase.from("departments").select("name, annual_budget"),
    supabase.from("vendors").select("name, category, risk_rating"),
    supabase.from("invoices").select("amount, budget_type, invoice_date, vendor_id, department_id, category").order("invoice_date", { ascending: false }).limit(300),
    supabase.from("projects").select("name, planned_amount, actual_amount, risk, status, budget_type"),
    supabase.from("alerts").select("title, severity, description, impact_amount").eq("status", "open"),
  ]);
  return JSON.stringify({
    departments: d.data ?? [],
    vendors: v.data ?? [],
    invoicesRecent: i.data ?? [],
    projects: p.data ?? [],
    openAlerts: a.data ?? [],
  });
}

function CoPilot() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hello — I am your AI Co-Pilot. Ask me anything about CAPEX, OPEX, departments, vendors or forecasts. I have live access to your platform data." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const ctx = await gatherContext();
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: ctx, messages: next.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })) }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { content } = (await res.json()) as { content: string };
      setMessages([...next, { role: "assistant", content }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Co-Pilot failed");
      setMessages(next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout title="AI Co-Pilot" subtitle="Conversational financial intelligence over your live data">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-card border border-border rounded-lg flex flex-col h-[75vh]">
          <div className="flex-1 overflow-auto p-5 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${m.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                  {m.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${m.role === "assistant" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Bot className="h-4 w-4" /></div>
                <div className="px-4 py-2.5 rounded-lg bg-muted text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analysing your data…</div>
              </div>
            )}
          </div>
          <form className="border-t border-border p-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about budgets, forecasts, vendors…" className="flex-1 px-3 py-2 text-sm rounded-md border border-border bg-background outline-none focus:border-ring" />
            <button disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"><Send className="h-4 w-4" /> Send</button>
          </form>
        </div>
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" /> Try asking</div>
            <div className="space-y-2">
              {suggestions.map((s) => (
                <button key={s} onClick={() => send(s)} className="block w-full text-left text-xs px-3 py-2 rounded-md border border-border hover:bg-muted">{s}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}