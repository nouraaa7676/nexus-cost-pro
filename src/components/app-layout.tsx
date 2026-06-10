import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, FileText, PlusCircle, CheckCircle2, BarChart3, Bot, Sparkles, Bell, Search } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Executive Dashboard", icon: LayoutDashboard },
  { to: "/requests", label: "Budget Requests", icon: FileText },
  { to: "/new-request", label: "New Request", icon: PlusCircle },
  { to: "/approvals", label: "Approvals Queue", icon: CheckCircle2 },
  { to: "/reports", label: "Reports & Analytics", icon: BarChart3 },
  { to: "/ai-assistant", label: "AI Budget Assistant", icon: Bot },
  { to: "/research", label: "Research Demonstration", icon: Sparkles },
];

export function AppLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="px-5 py-5 border-b border-sidebar-border flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground text-lg shadow-elegant" style={{ boxShadow: "var(--shadow-elegant)" }}>
            e&amp;
          </div>
          <div>
            <div className="font-semibold text-sm leading-tight">Budget Control</div>
            <div className="text-[11px] text-sidebar-foreground/60">AI-Powered Platform</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold">SA</div>
            <div className="text-xs">
              <div className="font-medium">Sara Al Hashimi</div>
              <div className="text-sidebar-foreground/60">Executive Management</div>
            </div>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-sm text-muted-foreground w-72">
              <Search className="h-4 w-4" />
              <input className="bg-transparent outline-none flex-1 text-foreground placeholder:text-muted-foreground" placeholder="Search requests, projects..." />
            </div>
            <button className="relative h-9 w-9 rounded-md border border-border bg-background flex items-center justify-center hover:bg-muted">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}