import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/format";

const Stat = ({ label, value, hint }: { label: string; value: string | number; hint?: string }) => (
  <div className="bg-card border border-border rounded-xl p-4">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
    {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
  </div>
);

const AdminDashboard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [users, vendors, requests, orders, disputes, pendingVerify] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("vendors").select("id", { count: "exact", head: true }),
        supabase.from("service_requests").select("id,status,amount_kobo,price_estimate_kobo,payment_status"),
        supabase.from("parts_orders").select("id,total_kobo,status"),
        (supabase as any).from("disputes").select("id,status"),
        (supabase as any).from("vendors").select("id", { count: "exact", head: true }).eq("verification_status", "pending"),
      ]);
      const reqs = requests.data ?? [];
      const ord = orders.data ?? [];
      const disp = (disputes.data ?? []) as { status: string }[];
      const revenue = ord.reduce((s, o: any) => s + (o.total_kobo ?? 0), 0)
        + reqs.reduce((s, r: any) => s + (r.payment_status === "paid" ? (r.amount_kobo ?? r.price_estimate_kobo ?? 0) : 0), 0);
      return {
        users: users.count ?? 0,
        vendors: vendors.count ?? 0,
        requests: reqs.length,
        activeRequests: reqs.filter((r: any) => !["completed","cancelled"].includes(r.status)).length,
        orders: ord.length,
        revenue,
        openDisputes: disp.filter(d => d.status === "open" || d.status === "investigating").length,
        pendingVerify: pendingVerify.count ?? 0,
      };
    },
  });

  if (isLoading || !data) return <div className="text-sm text-muted-foreground">Loading overview…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-xs text-muted-foreground">Platform-wide overview.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Users" value={data.users} />
        <Stat label="Vendors" value={data.vendors} />
        <Stat label="Service requests" value={data.requests} hint={`${data.activeRequests} active`} />
        <Stat label="Parts orders" value={data.orders} />
        <Stat label="Revenue" value={formatNaira(data.revenue)} hint="Lifetime gross" />
        <Stat label="Open disputes" value={data.openDisputes} />
        <Stat label="Pending verification" value={data.pendingVerify} />
      </div>
    </div>
  );
};

export default AdminDashboard;
