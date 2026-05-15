import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AdminOperators = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-operators"],
    queryFn: async () => {
      const { data } = await supabase.from("vendors").select("*").order("created_at", { ascending: false }).limit(200);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Operators</h1>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="text-left p-2">Business</th>
              <th className="text-left p-2">Phone</th>
              <th className="text-left p-2">Bank</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Verification</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Loading…</td></tr>}
            {(data ?? []).map((v: any) => (
              <tr key={v.id} className="border-t border-border">
                <td className="p-2 font-medium">{v.business_name}</td>
                <td className="p-2">{v.phone ?? "—"}</td>
                <td className="p-2">{v.bank_name ?? "—"}</td>
                <td className="p-2 capitalize">{v.status}</td>
                <td className="p-2 capitalize">{v.verification_status ?? "pending"}</td>
              </tr>
            ))}
            {!isLoading && data?.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No operators yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOperators;
