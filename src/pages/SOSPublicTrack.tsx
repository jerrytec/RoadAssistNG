import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageNav from "@/components/PageNav";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Clock } from "lucide-react";

interface Snapshot {
  id: string;
  sos_status: string | null;
  sos_lat: number | null;
  sos_lng: number | null;
  vehicle: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
  assigned_provider_id: string | null;
}

const SOSPublicTrack = () => {
  const { token } = useParams();
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data: rows, error } = await (supabase as any).rpc("get_sos_by_token", { _token: token });
      if (!mounted) return;
      if (error) { setError(error.message); return; }
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (!row) { setError("Link expired or invalid"); return; }
      setData(row as Snapshot);
    };
    load();
    const i = setInterval(load, 10000);
    return () => { mounted = false; clearInterval(i); };
  }, [token]);

  if (error) return <div className="min-h-screen flex items-center justify-center p-6 text-center text-sm text-muted-foreground">{error}</div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-background">
      <PageNav />
      <header className="bg-destructive text-destructive-foreground px-4 py-3">
        <p className="text-[10px] uppercase tracking-wider opacity-80 font-bold">🚨 Live SOS trip</p>
        <h1 className="text-base font-bold">A loved one needs help</h1>
      </header>
      <div className="container max-w-[640px] px-4 py-4 space-y-3">
        <div className="rounded-xl h-[200px] flex items-center justify-center relative overflow-hidden border border-border bg-primary-light">
          <div className="absolute top-1/2 left-1/2 w-20 h-20 border-2 border-destructive/30 rounded-full animate-pulse-ring" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-destructive border-2 border-card z-10" />
          <div className="absolute bottom-2 left-2 bg-card/90 backdrop-blur px-2 py-1 rounded text-[10px] flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {data.sos_lat && data.sos_lng ? `${data.sos_lat.toFixed(4)}, ${data.sos_lng.toFixed(4)}` : "Pending"}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-xs space-y-2">
          <Row label="Status" value={<span className="capitalize font-semibold">{data.sos_status ?? "—"}</span>} />
          <Row label="Vehicle" value={data.vehicle ?? "—"} />
          <Row label="Operator" value={data.assigned_provider_id ? "Assigned ✓" : "Searching…"} />
          <Row label="Started" value={<><Clock className="inline w-3 h-3 mr-1" />{new Date(data.created_at).toLocaleTimeString()}</>} />
          <Row label="Updated" value={new Date(data.updated_at).toLocaleTimeString()} />
        </div>
        <p className="text-[10px] text-center text-muted-foreground">Auto-refreshes every 10 seconds · Powered by RoadAssistNG</p>
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span>{value}</span></div>
);

export default SOSPublicTrack;
