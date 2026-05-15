import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AdminUsers = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id,full_name,phone,created_at").order("created_at", { ascending: false }).limit(200),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      const roleMap = new Map<string, string[]>();
      (roles ?? []).forEach((r: any) => {
        const arr = roleMap.get(r.user_id) ?? []; arr.push(r.role); roleMap.set(r.user_id, arr);
      });
      return (profiles ?? []).map((p: any) => ({ ...p, roles: roleMap.get(p.id) ?? [] }));
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Users</h1>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted text-muted-foreground">
            <tr><th className="text-left p-2">Name</th><th className="text-left p-2">Phone</th><th className="text-left p-2">Roles</th><th className="text-left p-2">Joined</th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">Loading…</td></tr>}
            {(data ?? []).map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="p-2 font-medium">{u.full_name ?? "—"}</td>
                <td className="p-2">{u.phone ?? "—"}</td>
                <td className="p-2"><span className="text-[10px]">{u.roles.join(", ") || "buyer"}</span></td>
                <td className="p-2 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {!isLoading && data?.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No users yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
