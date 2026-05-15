import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Phone, MessageCircle, Share2, AlertOctagon, X, MapPin, Clock, ShieldAlert, Users } from "lucide-react";
import { useSOSRequest, useFlagDanger, useCancelSOS, useCreateShareToken, useTrustedContacts } from "@/hooks/useSOS";
import { useAuth } from "@/hooks/useAuth";
import { formatNaira } from "@/lib/format";

const STATUS_COPY: Record<string, { title: string; sub: string; tone: "warn" | "info" | "ok" | "danger" }> = {
  dispatching: { title: "Finding nearest help…", sub: "We're alerting all available operators near you", tone: "warn" },
  assigned: { title: "Operator assigned", sub: "Help is being prepared and will be on the way", tone: "info" },
  enroute: { title: "Operator is on the way", sub: "Stay where you are — they're heading to your location", tone: "info" },
  on_scene: { title: "Operator has arrived", sub: "Please confirm and stay safe", tone: "ok" },
  resolved: { title: "Service complete", sub: "Please review and complete payment", tone: "ok" },
  escalated: { title: "Escalated to control room", sub: "Operations team is handling your case", tone: "danger" },
  cancelled: { title: "SOS cancelled", sub: "You can trigger a new one any time", tone: "info" },
  false_alarm: { title: "Marked as false alarm", sub: "If this is a mistake, contact support", tone: "danger" },
};

const SOSTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: req, isLoading } = useSOSRequest(id);
  const danger = useFlagDanger();
  const cancel = useCancelSOS();
  const share = useCreateShareToken();
  const { data: contacts } = useTrustedContacts();

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!req?.sos_triggered_at) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - new Date(req.sos_triggered_at!).getTime()) / 1000)), 1000);
    return () => clearInterval(t);
  }, [req?.sos_triggered_at]);

  if (isLoading || !req) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading SOS…</div>;
  }

  const status = req.sos_status ?? "dispatching";
  const copy = STATUS_COPY[status] ?? STATUS_COPY.dispatching;
  const isOwner = user?.id === req.buyer_id;
  const showPay = status === "resolved" && req.payment_status !== "paid" && isOwner;

  const onShare = async () => {
    try {
      const token = await share.mutateAsync(req.id);
      const url = `${window.location.origin}/sos/track/${token}`;
      const text = `🚨 I've triggered SOS on RoadAssistNG. Track me live: ${url}`;
      if (navigator.share) {
        await navigator.share({ title: "Live SOS trip", text, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Live tracking link copied");
      }
    } catch (e: any) { toast.error(e.message ?? "Could not share"); }
  };

  const onWhatsApp = () => {
    const msg = `🚨 SOS on RoadAssistNG. Location: ${req.sos_lat ?? "?"}, ${req.sos_lng ?? "?"}. Status: ${status}.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const onDanger = async () => {
    if (!confirm("Flag this as a real danger? Operations admins will be alerted immediately.")) return;
    try { await danger.mutateAsync(req.id); toast.success("Operations team alerted"); } catch (e: any) { toast.error(e.message); }
  };

  const onCancel = async () => {
    if (!confirm("Cancel this SOS? Only do this if you no longer need help.")) return;
    try { await cancel.mutateAsync(req.id); toast.success("SOS cancelled"); navigate("/"); } catch (e: any) { toast.error(e.message); }
  };

  const toneClass = copy.tone === "danger" ? "bg-destructive text-destructive-foreground"
    : copy.tone === "ok" ? "bg-secondary text-secondary-foreground"
    : copy.tone === "info" ? "bg-primary text-primary-foreground"
    : "bg-destructive/90 text-destructive-foreground";

  const min = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const sec = (elapsed % 60).toString().padStart(2, "0");

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className={`${toneClass} px-4 py-3 flex items-center gap-2`}>
        <button onClick={() => navigate("/")} className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center" aria-label="Back">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider opacity-80 font-bold">🚨 Active SOS</p>
          <h1 className="text-base font-bold truncate">{copy.title}</h1>
        </div>
        <div className="text-right">
          <p className="text-[10px] opacity-80">Elapsed</p>
          <p className="font-mono font-bold tabular-nums">{min}:{sec}</p>
        </div>
      </header>

      <div className="container max-w-[720px] px-4 py-4 space-y-3">
        <p className="text-xs text-muted-foreground">{copy.sub}</p>

        {/* Map placeholder */}
        <div className="rounded-xl h-[200px] flex items-center justify-center relative overflow-hidden border border-border bg-primary-light">
          <div className="absolute top-1/2 left-1/2 w-20 h-20 border-2 border-destructive/30 rounded-full animate-pulse-ring" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-destructive border-2 border-card z-10" />
          {req.assigned_provider_id && (
            <div className="absolute top-[35%] left-[30%] w-2.5 h-2.5 rounded-full bg-primary border border-card" />
          )}
          <div className="absolute bottom-2 left-2 bg-card/90 backdrop-blur px-2 py-1 rounded text-[10px] flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {req.sos_lat && req.sos_lng ? `${req.sos_lat.toFixed(4)}, ${req.sos_lng.toFixed(4)}` : "Location pending"}
          </div>
        </div>

        {/* Trip details */}
        <div className="bg-card border border-border rounded-xl p-3 space-y-2">
          <Row label="Service" value={<span className="capitalize">{req.service_type}</span>} />
          <Row label="Vehicle" value={req.vehicle ?? "—"} />
          <Row label="Triggered" value={<><Clock className="inline w-3 h-3 mr-1" />{new Date(req.sos_triggered_at ?? req.created_at).toLocaleTimeString()}</>} />
          {req.assigned_provider_id && <Row label="Operator ID" value={<span className="font-mono text-[10px]">{req.assigned_provider_id.slice(0, 8)}…</span>} />}
        </div>

        {/* Pay CTA */}
        {showPay && (
          <button onClick={() => navigate(`/pay/service/${req.id}`)} className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
            Pay {formatNaira(req.amount_kobo ?? 0)} for service
          </button>
        )}

        {/* Action grid */}
        {isOwner && status !== "cancelled" && status !== "resolved" && (
          <div className="grid grid-cols-2 gap-2">
            <ActionBtn icon={<Phone className="w-4 h-4" />} label="Call operator" onClick={() => toast("Calling — connect your phone")} disabled={!req.assigned_provider_id} />
            <ActionBtn icon={<MessageCircle className="w-4 h-4" />} label="WhatsApp" onClick={onWhatsApp} />
            <ActionBtn icon={<Share2 className="w-4 h-4" />} label="Share live trip" onClick={onShare} />
            <ActionBtn icon={<Users className="w-4 h-4" />} label="Trusted contacts" onClick={() => navigate("/profile/trusted-contacts")} />
            <ActionBtn icon={<AlertOctagon className="w-4 h-4" />} label="I'm in danger" onClick={onDanger} variant="danger" />
            <ActionBtn icon={<X className="w-4 h-4" />} label="Cancel SOS" onClick={onCancel} variant="muted" />
          </div>
        )}

        {/* Trusted contacts hint */}
        {isOwner && (contacts?.length ?? 0) === 0 && status !== "cancelled" && (
          <div className="bg-accent-light border border-accent/30 rounded-lg p-3 text-[11px] text-accent flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Add trusted contacts</p>
              <p className="opacity-80">Save family or friends so they get notified the moment you trigger SOS.</p>
              <button onClick={() => navigate("/profile/trusted-contacts")} className="underline mt-1 font-semibold">Add now →</button>
            </div>
          </div>
        )}

        {status === "escalated" && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-[11px] text-destructive">
            <p className="font-bold">Operations control room engaged</p>
            <p className="opacity-90 mt-0.5">A senior dispatcher is reviewing your case manually. Stay on this screen.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between text-xs">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

const ActionBtn = ({ icon, label, onClick, variant = "default", disabled }: { icon: React.ReactNode; label: string; onClick: () => void; variant?: "default" | "danger" | "muted"; disabled?: boolean }) => {
  const cls = variant === "danger"
    ? "bg-destructive text-destructive-foreground"
    : variant === "muted"
      ? "bg-muted text-muted-foreground border border-border"
      : "bg-card border border-border text-foreground";
  return (
    <button onClick={onClick} disabled={disabled} className={`${cls} rounded-xl py-3 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50`}>
      {icon} {label}
    </button>
  );
};

export default SOSTracking;
