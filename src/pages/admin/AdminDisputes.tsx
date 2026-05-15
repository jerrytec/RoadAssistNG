import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminDisputes = () => {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-disputes"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("disputes").select("*").order("created_at", { ascending: false }).limit(200);
      return (data ?? []) as any[];
    },
  });

  const setStatus = async (id: string, status: string) => {
    const { error } = await (supabase as any).from("disputes").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Dispute updated");
    qc.invalidateQueries({ queryKey: ["admin-disputes"] });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Disputes</h1>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left p-2">Kind</th>
              <th className="text-left p-2">Reason</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Opened</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Loading…</td></tr>}
            {(data ?? []).map((d) => (
              <tr key={d.id} className="border-t border-border">
                <td className="p-2 capitalize">{d.kind}</td>
                <td className="p-2">{d.reason}</td>
                <td className="p-2 capitalize">{d.status}</td>
                <td className="p-2 text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</td>
                <td className="p-2 space-x-1">
                  <button onClick={() => setStatus(d.id, "investigating")} className="text-[10px] px-2 py-1 rounded bg-muted">Investigate</button>
                  <button onClick={() => setStatus(d.id, "resolved")} className="text-[10px] px-2 py-1 rounded bg-primary text-primary-foreground">Resolve</button>
                  <button onClick={() => setStatus(d.id, "rejected")} className="text-[10px] px-2 py-1 rounded border border-destructive text-destructive">Reject</button>
                </td>
              </tr>
            ))}
            {!isLoading && data?.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No disputes.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDisputes;
