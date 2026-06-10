import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { useState } from "react";
import { Send, Sparkles, Bot, User } from "lucide-react";

export const Route = createFileRoute("/ai-assistant")({
  head: () => ({ meta: [{ title: "AI Budget Assistant · e&" }] }),
  component: Assistant,
});

type Msg = { role: "user" | "ai"; text: string };

const suggestions = [
  "What is my department's remaining budget?",
  "Show CAPEX spending this month.",
  "Which departments exceeded budget?",
  "Generate a spending summary.",
];

const answers: Record<string, string> = {
  "What is my department's remaining budget?":
    "Network Operations has **AED 3.75M** remaining out of an annual allocation of AED 12.5M (70% utilized YTD). Based on current run-rate, you are projected to close FY26 at 98% utilization — within plan.",
  "Show CAPEX spending this month.":
    "June 2026 CAPEX to date: **AED 2.31M**. Top three projects: 5G Tower Expansion (AED 1.18M), Data Center Cooling Upgrade (AED 0.62M), Core Router Refresh (AED 0.51M). Pace is +4% vs the monthly plan.",
  "Which departments exceeded budget?":
    "No department has exceeded its annual budget yet. **Marketing (71% YTD)** and **Field Operations (92% YTD)** are tracking ahead of plan and projected to overrun by AED 540K and AED 210K respectively if no action is taken.",
  "Generate a spending summary.":
    "**FY26 YTD Summary** — Total approved budget AED 35.5M, total spent AED 27.2M (76.6%). CAPEX 68% utilized, OPEX 74% utilized. AI has identified AED 2.84M in cost-saving opportunities across 12 initiatives. Budget variance is -3.2% (favourable).",
};

function Assistant() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: "Hello — I am your AI Budget Assistant. Ask me about utilization, forecasts, or specific requests. Try a suggestion to get started." },
  ]);
  const [input, setInput] = useState("");

  function send(text: string) {
    if (!text.trim()) return;
    const reply = answers[text] || `Based on current data: "${text.replace(/\?$/, "")}" — analysis indicates utilization is within expected ranges. I can drill into a specific department or category if you'd like.`;
    setMessages((m) => [...m, { role: "user", text }, { role: "ai", text: reply }]);
    setInput("");
  }

  return (
    <AppLayout title="AI Budget Assistant" subtitle="Conversational analytics across the budget portfolio">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-card border border-border rounded-lg flex flex-col h-[70vh]">
          <div className="flex-1 overflow-auto p-5 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${m.role === "ai" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                  {m.role === "ai" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-lg text-sm leading-relaxed ${m.role === "ai" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"}`}
                  dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }}
                />
              </div>
            ))}
          </div>
          <form
            className="border-t border-border p-3 flex gap-2"
            onSubmit={(e) => { e.preventDefault(); send(input); }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about budgets, forecasts, departments..."
              className="flex-1 px-3 py-2 text-sm rounded-md border border-border bg-background outline-none focus:border-ring"
            />
            <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90">
              <Send className="h-4 w-4" /> Send
            </button>
          </form>
        </div>
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" /> Quick prompts
            </div>
            <div className="space-y-2">
              {suggestions.map((s) => (
                <button key={s} onClick={() => send(s)} className="block w-full text-left text-xs px-3 py-2 rounded-md border border-border hover:bg-muted">
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}