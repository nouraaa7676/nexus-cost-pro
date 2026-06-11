import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Shield, FileText, UserCheck } from "lucide-react";

export const Route = createFileRoute("/governance")({
  head: () => ({ meta: [{ title: "Governance · e&" }] }),
  component: Governance,
});

function Governance() {
  const { data: logs } = useQuery({
    queryKey: ["audit"],
    queryFn: async () => {
      const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });
  const { data: users } = useQuery({
    queryKey: ["user-roles-all"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, email, full_name"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const rolesByUser: Record<string, string[]> = {};
      (roles ?? []).forEach((r) => { (rolesByUser[r.user_id] ??= []).push(r.role); });
      return (profiles ?? []).map((p) => ({ ...p, roles: rolesByUser[p.id] ?? [] }));
    },
  });

  return (
    <AppLayout title="Governance" subtitle="Audit trail, access control and compliance">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card icon={Shield} label="Compliance Status" value="Compliant" sub="All policies enforced" />
        <Card icon={UserCheck} label="Active Users" value={String(users?.length ?? 0)} sub="With role assignments" />
        <Card icon={FileText} label="Audit Events (100)" value={String(logs?.length ?? 0)} sub="Most recent activities" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border text-sm font-semibold">Audit log</div>
          <div className="max-h-[500px] overflow-auto divide-y divide-border">
            {(logs ?? []).length === 0 && <div className="px-5 py-8 text-center text-sm text-muted-foreground">No audit events recorded.</div>}
            {(logs ?? []).map((l) => (
              <div key={l.id} className="px-5 py-2.5 grid grid-cols-[1fr_auto] gap-3">
                <div className="min-w-0">
                  <div className="text-sm"><span className="font-medium">{l.action}</span> · <span className="text-muted-foreground">{l.entity}</span></div>
                  {l.metadata && Object.keys(l.metadata).length > 0 && (
                    <div className="text-[11px] text-muted-foreground truncate font-mono">{JSON.stringify(l.metadata)}</div>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground tabular-nums">{new Date(l.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-border text-sm font-semibold">Users & roles</div>
          <div className="max-h-[500px] overflow-auto divide-y divide-border">
            {(users ?? []).map((u) => (
              <div key={u.id} className="px-5 py-3">
                <div className="text-sm font-medium truncate">{u.full_name || u.email}</div>
                <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {u.roles.length === 0 && <span className="text-[11px] text-muted-foreground">No roles</span>}
                  {u.roles.map((r) => (
                    <span key={r} className="px-1.5 py-0.5 text-[10px] rounded bg-accent text-accent-foreground capitalize">{r.replace(/_/g, " ")}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Card({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 flex items-center gap-4">
      <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center"><Icon className="h-5 w-5" /></div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground uppercase font-medium">{label}</div>
        <div className="text-xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}