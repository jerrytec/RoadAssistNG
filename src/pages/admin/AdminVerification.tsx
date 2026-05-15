import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const AdminVerification = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-verification"],
    queryFn: async () => {
      const { data } = await supabase.from("vendors")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  const setVerification = async (id: string, status: "approved" | "rejected") => {
    const { error } = await (supabase as any).from("vendors").update({
      verification_status: status,
      verified_at: status === "approved" ? new Date().toISOString() : null,
      verified_by: user?.id,
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Vendor ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-verification"] });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">BVN / NIN Verification</h1>
      <p className="text-xs text-muted-foreground">Manual review queue. Validate the operator's BVN and NIN against NIBSS / NIMC, then approve or reject.</p>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left p-2">Business</th>
              <th className="text-left p-2">BVN</th>
              <th className="text-left p-2">NIN</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Loading…</td></tr>}
            {(data ?? []).map((v: any) => (
              <tr key={v.id} className="border-t border-border">
                <td className="p-2 font-medium">{v.business_name}</td>
                <td className="p-2 font-mono">{v.bvn ?? "—"}</td>
                <td className="p-2 font-mono">{v.nin ?? "—"}</td>
                <td className="p-2 capitalize">{v.verification_status ?? "pending"}</td>
                <td className="p-2 space-x-1">
                  <button onClick={() => setVerification(v.id, "approved")} className="text-[10px] px-2 py-1 rounded bg-primary text-primary-foreground">Approve</button>
                  <button onClick={() => setVerification(v.id, "rejected")} className="text-[10px] px-2 py-1 rounded border border-destructive text-destructive">Reject</button>
                </td>
              </tr>
            ))}
            {!isLoading && data?.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No vendors yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminVerification;
