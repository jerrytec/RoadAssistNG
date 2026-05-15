import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useHasAdminRole, type AdminRole } from "@/hooks/useAdminRoles";

const ROLES: AdminRole[] = ["super_admin","operations","finance","compliance","fraud","support","analytics"];

const AdminRolesPage = () => {
  const isSuper = useHasAdminRole("super_admin");
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("operations");

  const { data } = useQuery({
    queryKey: ["all-admin-roles"],
    queryFn: async () => {
      const [{ data: ar }, { data: profs }] = await Promise.all([
        (supabase as any).from("admin_roles").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id,full_name"),
      ]);
      const map = new Map((profs ?? []).map((p: any) => [p.id, p.full_name]));
      return ((ar ?? []) as any[]).map((r) => ({ ...r, name: map.get(r.user_id) ?? "—" }));
    },
  });

  const grant = async () => {
    if (!isSuper) return toast.error("Only super admins can grant roles");
    if (!email.trim()) return toast.error("Enter user id");
    const { error } = await (supabase as any).from("admin_roles").insert({ user_id: email.trim(), role });
    if (error) return toast.error(error.message);
    toast.success("Role granted");
    setEmail("");
    qc.invalidateQueries({ queryKey: ["all-admin-roles"] });
  };

  const revoke = async (id: string) => {
    if (!isSuper) return;
    const { error } = await (supabase as any).from("admin_roles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["all-admin-roles"] });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Admin Roles</h1>
      <p className="text-xs text-muted-foreground">Assign one of the seven admin roles to a user. Only Super Admins can grant or revoke.</p>

      {isSuper && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold">Grant role</p>
          <div className="flex flex-col md:flex-row gap-2">
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="User UUID (from Users page)"
              className="flex-1 py-2 px-3 border border-border rounded-lg text-xs bg-background" />
            <select value={role} onChange={(e) => setRole(e.target.value as AdminRole)}
              className="py-2 px-3 border border-border rounded-lg text-xs bg-background">
              {ROLES.map((r) => <option key={r} value={r}>{r.replace("_"," ")}</option>)}
            </select>
            <button onClick={grant} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold">Grant</button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted text-muted-foreground">
            <tr><th className="text-left p-2">User</th><th className="text-left p-2">Role</th><th className="text-left p-2">Granted</th><th></th></tr>
          </thead>
          <tbody>
            {(data ?? []).map((r: any) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-2">{r.name} <span className="text-[10px] text-muted-foreground font-mono">{r.user_id.slice(0,8)}</span></td>
                <td className="p-2 capitalize">{r.role.replace("_"," ")}</td>
                <td className="p-2 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="p-2 text-right">
                  {isSuper && <button onClick={() => revoke(r.id)} className="text-[10px] text-destructive">Revoke</button>}
                </td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No admin roles assigned yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminRolesPage;
