import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check, Circle, Clock, AlertOctagon } from "lucide-react";

const STEPS: { key: string; label: string }[] = [
  { key: "dispatching", label: "SOS triggered" },
  { key: "assigned", label: "Operator assigned" },
  { key: "enroute", label: "Operator en route" },
  { key: "on_scene", label: "On scene" },
  { key: "resolved", label: "Resolved" },
];

interface Props {
  requestId: string;
  currentStatus: string | null;
  triggeredAt: string | null;
  etaMinutes?: number | null;
}

const SOSTimeline = ({ requestId, currentStatus, triggeredAt, etaMinutes }: Props) => {
  const qc = useQueryClient();

  useEffect(() => {
    const ch = supabase
      .channel(`sos-events-${requestId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sos_events", filter: `request_id=eq.${requestId}` },
        () => qc.invalidateQueries({ queryKey: ["sos-events", requestId] })
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [requestId, qc]);

  const { data: events } = useQuery({
    queryKey: ["sos-events", requestId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("sos_events")
        .select("kind, created_at")
        .eq("request_id", requestId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as { kind: string; created_at: string }[];
    },
  });

  const eventTime = (kind: string) => events?.find((e) => e.kind === kind)?.created_at ?? null;

  const currentIdx = Math.max(0, STEPS.findIndex((s) => s.key === currentStatus));
  const isEscalated = currentStatus === "escalated";
  const isCancelled = currentStatus === "cancelled" || currentStatus === "false_alarm";

  const eta = (() => {
    if (!etaMinutes || !triggeredAt) return null;
    const target = new Date(triggeredAt).getTime() + etaMinutes * 60_000;
    const remaining = Math.max(0, Math.round((target - Date.now()) / 60_000));
    return remaining;
  })();

  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Trip timeline</h3>
        {eta !== null && !isCancelled && currentStatus !== "resolved" && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-primary">
            <Clock className="w-3 h-3" /> ETA {eta} min
          </span>
        )}
      </div>

      {isEscalated && (
        <div className="flex items-center gap-2 text-[11px] text-destructive font-semibold mb-2">
          <AlertOctagon className="w-3.5 h-3.5" /> Escalated to control room
        </div>
      )}

      <ol className="space-y-2.5">
        {STEPS.map((s, i) => {
          const done = i <= currentIdx && !isCancelled;
          const active = i === currentIdx && !isCancelled;
          const ts = eventTime(s.key) ?? (s.key === "dispatching" ? triggeredAt : null);
          return (
            <li key={s.key} className="flex items-start gap-2.5">
              <div className="flex flex-col items-center">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${done ? "bg-primary border-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"} ${active ? "animate-pulse" : ""}`}>
                  {done ? <Check className="w-3 h-3" /> : <Circle className="w-2 h-2" />}
                </div>
                {i < STEPS.length - 1 && <div className={`w-0.5 flex-1 min-h-[14px] ${done ? "bg-primary" : "bg-border"}`} />}
              </div>
              <div className="flex-1 pb-1">
                <p className={`text-xs font-semibold ${done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</p>
                {ts && <p className="text-[10px] text-muted-foreground tabular-nums">{new Date(ts).toLocaleTimeString()}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default SOSTimeline;
