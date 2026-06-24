import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in · e& Budget Intelligence" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("demo_mode") === "1") {
      navigate({ to: "/" });
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Account created. You can now sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground text-xl" style={{ boxShadow: "var(--shadow-elegant)" }}>e&amp;</div>
          <div>
            <div className="text-lg font-semibold">Budget Intelligence Platform</div>
            <div className="text-xs text-sidebar-foreground/60">AI-powered CAPEX & OPEX control</div>
          </div>
        </div>
        <div className="space-y-4 max-w-md">
          <div className="text-3xl font-bold leading-tight">Forecast smarter. Spend with confidence.</div>
          <p className="text-sm text-sidebar-foreground/70">
            Real-time budget control, AI cost optimization, vendor intelligence, anomaly detection and executive reporting — purpose-built for telecom finance teams.
          </p>
          <ul className="text-sm space-y-2 text-sidebar-foreground/80">
            <li>• AI Co-Pilot for instant financial answers</li>
            <li>• Automated forecasting with confidence scoring</li>
            <li>• Continuous anomaly & cost-leakage detection</li>
            <li>• Vendor concentration & contract intelligence</li>
          </ul>
        </div>
        <div className="text-xs text-sidebar-foreground/50">© e& Budget Intelligence · Enterprise Edition</div>
      </div>
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground">e&amp;</div>
            <div className="font-semibold">Budget Intelligence</div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{mode === "signup" ? "Create your account" : "Sign in"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{mode === "signup" ? "Provision an account to access the platform." : "Use your e& corporate credentials."}</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-xs font-medium text-foreground/80">Full name</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:border-ring outline-none" />
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-foreground/80">Work email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:border-ring outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:border-ring outline-none" />
            </div>
            <button disabled={loading} className="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 disabled:opacity-60">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-4 text-sm text-muted-foreground hover:text-foreground">
            {mode === "signin" ? "Need an account? Create one →" : "Already have an account? Sign in →"}
          </button>

          <div className="mt-6 pt-6 border-t border-border">
            <button
              onClick={() => {
                localStorage.setItem("demo_mode", "1");
                toast.success("Continuing as guest (demo mode)");
                navigate({ to: "/" });
              }}
              className="w-full px-4 py-2.5 rounded-md border border-border bg-background text-sm font-medium hover:bg-muted"
            >
              Skip — continue as guest
            </button>
            <p className="mt-2 text-[11px] text-muted-foreground text-center">
              Demo mode bypasses sign-in. Data writes may be restricted by row-level security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}