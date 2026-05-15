import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/format";

const AdminPayments = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const [{ data: orders }, { data: requests }] = await Promise.all([
        supabase.from("parts_orders").select("id,total_kobo,status,created_at,buyer_id").order("created_at", { ascending: false }).limit(100),
        supabase.from("service_requests").select("id,amount_kobo,price_estimate_kobo,payment_status,paid_at,created_at,buyer_id").order("created_at", { ascending: false }).limit(100),
      ]);
      const flow = [
        ...(orders ?? []).map((o: any) => ({ kind: "Parts order", id: o.id, amount: o.total_kobo, status: o.status, date: o.created_at })),
        ...(requests ?? []).map((r: any) => ({ kind: "Service", id: r.id, amount: r.amount_kobo ?? r.price_estimate_kobo ?? 0, status: r.payment_status ?? "unpaid", date: r.paid_at ?? r.created_at })),
      ].sort((a, b) => +new Date(b.date) - +new Date(a.date));
      return flow;
    },
  });

  const total = (data ?? []).filter((d) => d.status === "paid").reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Payments</h1>
        <div className="bg-primary/10 px-3 py-1.5 rounded-lg text-xs"><b>Paid total:</b> {formatNaira(total)}</div>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Reference</th>
              <th className="text-left p-2">Amount</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Loading…</td></tr>}
            {(data ?? []).map((d) => (
              <tr key={d.kind + d.id} className="border-t border-border">
                <td className="p-2">{d.kind}</td>
                <td className="p-2 font-mono text-[10px]">{d.id.slice(0,8)}</td>
                <td className="p-2 font-semibold">{formatNaira(d.amount)}</td>
                <td className="p-2 capitalize">{d.status}</td>
                <td className="p-2 text-muted-foreground">{new Date(d.date).toLocaleString()}</td>
              </tr>
            ))}
            {!isLoading && data?.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No payments yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPayments;
