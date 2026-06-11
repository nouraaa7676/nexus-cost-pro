import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · e&" }] }),
  component: Settings,
});

const ROLES = [
  { value: "executive", label: "Executive Management" },
  { value: "finance_director", label: "Finance Director" },
  { value: "budget_team", label: "Budget & Cost Control Team" },
  { value: "department_manager", label: "Department Manager" },
  { value: "business_user", label: "Business Unit User" },
  { value: "admin", label: "System Administrator" },
] as const;

function Settings() {
  const qc = useQueryClient();
  const [me, setMe] = useState<{ id: string; email: string } | null>(null);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setMe({ id: data.user.id, email: data.user.email ?? "" });
    });
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["my-profile", me?.id],
    enabled: !!me,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", me!.id).maybeSingle();
      if (data?.full_name) setFullName(data.full_name);
      return data;
    },
  });

  const { data: myRoles } = useQuery({
    queryKey: ["my-roles-settings", me?.id],
    enabled: !!me,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", me!.id);
      return (data ?? []).map((r) => r.role) as string[];
    },
  });

  async function saveProfile() {
    if (!me) return;
    await supabase.from("profiles").upsert({ id: me.id, email: me.email, full_name: fullName });
    toast.success("Profile updated");
    qc.invalidateQueries({ queryKey: ["my-profile"] });
  }

  async function toggleRole(role: string) {
    if (!me) return;
    const have = myRoles?.includes(role);
    if (have) {
      await supabase.from("user_roles").delete().eq("user_id", me.id).eq("role", role);
    } else {
      await supabase.from("user_roles").insert({ user_id: me.id, role });
    }
    await supabase.from("audit_logs").insert({ action: have ? "role.remove" : "role.assign", entity: "user_role", metadata: { role } });
    qc.invalidateQueries({ queryKey: ["my-roles-settings"] });
    qc.invalidateQueries({ queryKey: ["my-roles"] });
    toast.success(`Role ${have ? "removed" : "assigned"}`);
  }

  return (
    <AppLayout title="Settings" subtitle="Profile, role assignment and platform preferences">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-sm font-semibold mb-4">Profile</div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground/80">Email</label>
              <input value={me?.email ?? ""} disabled className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-muted" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80">Full name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:border-ring outline-none" />
            </div>
            <button onClick={saveProfile} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90">Save profile</button>
            {profile?.updated_at && <div className="text-xs text-muted-foreground">Last updated {new Date(profile.updated_at).toLocaleString()}</div>}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-sm font-semibold mb-1">Role assignment</div>
          <div className="text-xs text-muted-foreground mb-4">Toggle the platform roles you should hold. In production this would be admin-only — here it self-serves for demo.</div>
          <div className="space-y-2">
            {ROLES.map((r) => {
              const active = myRoles?.includes(r.value);
              return (
                <button key={r.value} onClick={() => toggleRole(r.value)} className={`w-full text-left px-3 py-2.5 rounded-md border flex items-center justify-between ${active ? "border-primary bg-primary/5" : "border-border hover:bg-muted"}`}>
                  <div>
                    <div className="text-sm font-medium">{r.label}</div>
                    <div className="text-[11px] text-muted-foreground">{r.value}</div>
                  </div>
                  <span className={`text-xs ${active ? "text-primary font-semibold" : "text-muted-foreground"}`}>{active ? "Assigned" : "Inactive"}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}