import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRoles } from "@/hooks/useAdminRoles";

const STATUS_TONE: Record<string, string> = {
  dispatching: "bg-destructive/15 text-destructive animate-pulse",
  escalated: "bg-destructive text-destructive-foreground animate-pulse",
  assigned: "bg-primary/15 text-primary",
  enroute: "bg-primary/15 text-primary",
  on_scene: "bg-secondary/20 text-secondary-foreground",
  resolved: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
  false_alarm: "bg-muted text-muted-foreground",
};

const fmtAge = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

const AdminSOS = () => {
  const qc = useQueryClient();
  const { data: roles } = useAdminRoles();
  const canModerate = roles?.some((r) => ["super_admin", "operations", "support"].includes(r));

  useEffect(() => {
    const ch = supabase
      .channel("admin-sos")
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests" }, () => qc.invalidateQueries({ queryKey: ["admin-sos"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-sos"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("service_requests")
        .select("*")
        .eq("is_sos", true)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as any[];
    },
    refetchInterval: 10000,
  });

  const markFalseAlarm = async (id: string, user_id: string) => {
    if (!confirm("Mark this SOS as a false alarm?")) return;
    const { error } = await (supabase as any).from("service_requests").update({ sos_status: "false_alarm", status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    await (supabase as any).from("sos_abuse_log").insert({ user_id, request_id: id, reason: "false_alarm" });
    toast.success("Marked as false alarm");
  };

  const escalate = async (id: string) => {
    const { error } = await (supabase as any).from("service_requests").update({ sos_status: "escalated", sos_escalated_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Escalated");
  };

  const active = (data ?? []).filter((r) => !["resolved", "cancelled", "false_alarm"].includes(r.sos_status));
  const recent = (data ?? []).filter((r) => ["resolved", "cancelled", "false_alarm"].includes(r.sos_status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">🚨 SOS Command Center</h1>
        <p className="text-xs text-muted-foreground">Live emergency requests across the platform.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Active" value={active.length} tone="destructive" />
        <Stat label="Escalated" value={active.filter((r) => r.sos_status === "escalated").length} tone="destructive" />
        <Stat label="Last 24h" value={(data ?? []).filter((r) => new Date(r.created_at).getTime() > Date.now() - 86400000).length} />
      </div>

      <Section title="Active SOS" empty="No active SOS — all clear" loading={isLoading} rows={active}>
        {(r) => (
          <tr key={r.id} className={`border-t border-border ${r.sos_status === "escalated" ? "bg-destructive/5" : ""}`}>
            <td className="py-2 pr-2 font-mono text-[10px]">{r.id.slice(0, 8)}</td>
            <td className="py-2 pr-2"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_TONE[r.sos_status] ?? "bg-muted"}`}>{r.sos_status}</span></td>
            <td className="py-2 pr-2 capitalize text-xs">{r.service_type}</td>
            <td className="py-2 pr-2 text-[11px]">{r.sos_lat ? `${r.sos_lat.toFixed(3)}, ${r.sos_lng?.toFixed(3)}` : r.location ?? "—"}</td>
            <td className="py-2 pr-2 text-[11px]">{r.assigned_provider_id ? `${r.assigned_provider_id.slice(0,8)}…` : <span className="text-destructive">unassigned</span>}</td>
            <td className="py-2 pr-2 text-[11px] tabular-nums">{fmtAge(r.created_at)}</td>
            <td className="py-2 text-right space-x-1">
              {canModerate && r.sos_status !== "escalated" && (
                <button onClick={() => escalate(r.id)} className="px-2 py-1 rounded text-[10px] bg-destructive text-destructive-foreground font-semibold">Escalate</button>
              )}
              {canModerate && (
                <button onClick={() => markFalseAlarm(r.id, r.buyer_id)} className="px-2 py-1 rounded text-[10px] bg-muted font-semibold">False alarm</button>
              )}
            </td>
          </tr>
        )}
      </Section>

      <Section title="Recent (resolved / cancelled)" empty="None" loading={false} rows={recent.slice(0, 30)}>
        {(r) => (
          <tr key={r.id} className="border-t border-border">
            <td className="py-2 pr-2 font-mono text-[10px]">{r.id.slice(0, 8)}</td>
            <td className="py-2 pr-2"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_TONE[r.sos_status] ?? "bg-muted"}`}>{r.sos_status}</span></td>
            <td className="py-2 pr-2 capitalize text-xs">{r.service_type}</td>
            <td className="py-2 pr-2 text-[11px]">{r.location ?? "—"}</td>
            <td className="py-2 pr-2 text-[11px]">{r.assigned_provider_id?.slice(0,8) ?? "—"}</td>
            <td className="py-2 pr-2 text-[11px]">{new Date(r.updated_at).toLocaleString()}</td>
            <td />
          </tr>
        )}
      </Section>
    </div>
  );
};

const Stat = ({ label, value, tone }: { label: string; value: number; tone?: "destructive" }) => (
  <div className={`rounded-xl p-4 border ${tone === "destructive" ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"}`}>
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className={`text-2xl font-bold mt-1 ${tone === "destructive" ? "text-destructive" : ""}`}>{value}</p>
  </div>
);

const Section = ({ title, empty, loading, rows, children }: { title: string; empty: string; loading: boolean; rows: any[]; children: (r: any) => React.ReactNode }) => (
  <div>
    <h2 className="text-sm font-bold mb-2">{title}</h2>
    <div className="bg-card border border-border rounded-xl overflow-x-auto">
      {loading ? <p className="p-4 text-xs text-muted-foreground">Loading…</p> :
        rows.length === 0 ? <p className="p-4 text-xs text-muted-foreground">{empty}</p> :
        <table className="w-full text-xs">
          <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr><th className="text-left py-2 pl-3">ID</th><th className="text-left py-2">Status</th><th className="text-left py-2">Type</th><th className="text-left py-2">Location</th><th className="text-left py-2">Operator</th><th className="text-left py-2">Age / Updated</th><th className="pr-3"></th></tr>
          </thead>
          <tbody className="[&>tr>td:first-child]:pl-3 [&>tr>td:last-child]:pr-3">{rows.map(children)}</tbody>
        </table>
      }
    </div>
  </div>
);

export default AdminSOS;
