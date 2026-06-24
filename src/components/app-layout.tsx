import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Bot, TrendingUp, Sparkles, Building2, BarChart3,
  Database, Shield, Settings, Bell, Search, LogOut, AlertTriangle,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/ai-copilot", label: "AI Co-Pilot", icon: Bot },
  { to: "/forecasting", label: "Forecasting", icon: TrendingUp },
  { to: "/cost-optimization", label: "Cost Optimization", icon: Sparkles },
  { to: "/vendor-intelligence", label: "Vendor Intelligence", icon: Building2 },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/data-management", label: "Data Management", icon: Database },
  { to: "/governance", label: "Governance", icon: Shield },
  { to: "/alerts", label: "Alert Center", icon: AlertTriangle },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (typeof window !== "undefined" && localStorage.getItem("demo_mode") === "1") {
      setUserEmail("guest@demo.local");
      setChecking(false);
      return () => { mounted = false; };
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) {
        navigate({ to: "/auth" });
      } else {
        setUserEmail(data.session.user.email ?? null);
      }
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        if (typeof window !== "undefined" && localStorage.getItem("demo_mode") === "1") return;
        navigate({ to: "/auth" });
      } else setUserEmail(session.user.email ?? null);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [navigate]);

  const { data: roles } = useQuery({
    queryKey: ["my-roles", userEmail],
    enabled: !!userEmail,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role");
      return (data ?? []).map((r) => r.role);
    },
  });

  const { data: unread } = useQuery({
    queryKey: ["unread-alerts", userEmail],
    enabled: !!userEmail,
    queryFn: async () => {
      const { count } = await supabase.from("alerts").select("id", { count: "exact", head: true }).eq("status", "open");
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  async function signOut() {
    if (typeof window !== "undefined") localStorage.removeItem("demo_mode");
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground text-sm">Loading…</div>;
  }

  const roleLabel = roles && roles.length
    ? roles[0].replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Business User";

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="px-5 py-5 border-b border-sidebar-border flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground text-lg" style={{ boxShadow: "var(--shadow-elegant)" }}>
            e&amp;
          </div>
          <div>
            <div className="font-semibold text-sm leading-tight">Budget Intelligence</div>
            <div className="text-[11px] text-sidebar-foreground/60">AI Cost Optimization</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-auto">
          {nav.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold uppercase">
              {userEmail?.[0] ?? "U"}
            </div>
            <div className="text-xs min-w-0 flex-1">
              <div className="font-medium truncate">{userEmail ?? "User"}</div>
              <div className="text-sidebar-foreground/60 truncate">{roleLabel}</div>
            </div>
            <button onClick={signOut} title="Sign out" className="h-8 w-8 rounded-md hover:bg-sidebar-accent flex items-center justify-center">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight truncate">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-sm text-muted-foreground w-72">
              <Search className="h-4 w-4" />
              <input className="bg-transparent outline-none flex-1 text-foreground placeholder:text-muted-foreground" placeholder="Search projects, vendors, invoices…" />
            </div>
            <Link to="/alerts" className="relative h-9 w-9 rounded-md border border-border bg-background flex items-center justify-center hover:bg-muted">
              <Bell className="h-4 w-4" />
              {!!unread && unread > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
                  {unread}
                </span>
              )}
            </Link>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}