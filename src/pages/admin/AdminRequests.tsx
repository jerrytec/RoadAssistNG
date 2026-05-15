import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/format";

const AdminRequests = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-requests"],
    queryFn: async () => {
      const { data } = await supabase.from("service_requests").select("*").order("created_at", { ascending: false }).limit(200);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Service Requests</h1>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left p-2">ID</th>
              <th className="text-left p-2">Service</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Payment</th>
              <th className="text-left p-2">Amount</th>
              <th className="text-left p-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">Loading…</td></tr>}
            {(data ?? []).map((r: any) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-2 font-mono text-[10px]">{r.id.slice(0,8)}</td>
                <td className="p-2 capitalize">{r.service_type}</td>
                <td className="p-2 capitalize">{r.status}</td>
                <td className="p-2 capitalize">{r.payment_status ?? "unpaid"}</td>
                <td className="p-2">{formatNaira(r.amount_kobo ?? r.price_estimate_kobo ?? 0)}</td>
                <td className="p-2 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {!isLoading && data?.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No requests yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminRequests;
