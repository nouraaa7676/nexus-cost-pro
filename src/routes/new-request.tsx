import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { useState } from "react";
import { Sparkles, Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/new-request")({
  head: () => ({ meta: [{ title: "New Budget Request · e&" }] }),
  component: NewRequest,
});

const workflow = ["Submitted", "Manager Approval", "Budget Team Review", "Executive Approval", "Completed"];

function NewRequest() {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("CAPEX");
  const numericAmount = parseFloat(amount.replace(/,/g, "")) || 0;
  const showAI = numericAmount > 0;

  return (
    <AppLayout title="New Budget Request" subtitle="Submit CAPEX or OPEX for AI-assisted approval">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form
          className="lg:col-span-2 bg-card border border-border rounded-lg p-6 space-y-5"
          onSubmit={(e) => { e.preventDefault(); toast.success("Request submitted to Manager Approval"); }}
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Request Information</div>
            <div className="text-xs text-muted-foreground">Request ID: <span className="font-mono">REQ-2026-0143</span></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Department">
              <select className="nr-input">
                <option>Network Operations</option>
                <option>IT &amp; Digital</option>
                <option>Marketing</option>
                <option>Human Resources</option>
                <option>Finance</option>
                <option>Field Operations</option>
              </select>
            </Field>
            <Field label="Project Name">
              <input className="nr-input" placeholder="e.g. 5G Tower Expansion" />
            </Field>
            <Field label="Request Type">
              <select className="nr-input" value={type} onChange={(e) => setType(e.target.value)}>
                <option>CAPEX</option>
                <option>OPEX</option>
              </select>
            </Field>
            <Field label="Budget Category">
              <select className="nr-input">
                <option>Infrastructure</option>
                <option>Software &amp; Licenses</option>
                <option>Maintenance</option>
                <option>Advertising</option>
                <option>Travel &amp; Events</option>
                <option>Inter-carrier</option>
              </select>
            </Field>
            <Field label="Amount Requested (AED)">
              <input className="nr-input tabular-nums" inputMode="numeric" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <Field label="Priority Level">
              <select className="nr-input">
                <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
              </select>
            </Field>
          </div>
          <Field label="Justification">
            <textarea className="nr-input min-h-[100px]" placeholder="Business case, expected outcomes, ROI..." />
          </Field>
          <Field label="Supporting Documents">
            <label className="flex items-center gap-3 p-4 border border-dashed border-border rounded-md cursor-pointer hover:bg-muted">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <div className="text-sm">
                <div className="font-medium">Upload invoices, quotes or contracts</div>
                <div className="text-xs text-muted-foreground">PDF, XLSX, DOCX · up to 25MB each</div>
              </div>
              <input type="file" className="hidden" multiple />
            </label>
          </Field>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted">Save Draft</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90">Submit Request</button>
          </div>
        </form>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="text-sm font-semibold mb-4">Approval Workflow</div>
            <ol className="space-y-3">
              {workflow.map((step, i) => (
                <li key={step} className="flex items-start gap-3">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {i === 0 ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{step}</div>
                    <div className="text-xs text-muted-foreground">{i === 0 ? "Current stage" : "Pending"}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {showAI && (
            <div className="bg-card border border-border rounded-lg p-5" style={{ boxShadow: "var(--shadow-elegant)" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <div className="text-sm font-semibold">AI Recommendation</div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Recommendation</span>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-success/15 text-success">Approve</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Risk Score</span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-success/15 text-success">Low</span>
                </div>
                <div className="pt-2 border-t border-border text-xs leading-relaxed text-foreground">
                  Based on historical {type} spending and current utilization, this request falls within the available envelope. No similar requests rejected in the last 12 months.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .nr-input { width: 100%; padding: 8px 12px; font-size: 14px; background: var(--background); border: 1px solid var(--border); border-radius: 6px; outline: none; }
        .nr-input:focus { border-color: var(--ring); box-shadow: 0 0 0 3px oklch(0.58 0.22 27 / 0.12); }
      `}</style>
    </AppLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-muted-foreground mb-1.5">{label}</div>
      {children}
    </label>
  );
}