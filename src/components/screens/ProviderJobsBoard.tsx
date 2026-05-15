import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useAvailability } from "@/hooks/useAvailability";
import { useProviderJobs, useSendOffer, useUpdateRequestStatus, type ServiceKind, type RequestStatus, type ServiceRequest } from "@/hooks/useServiceRequests";
import { useOpenSOSForProvider, useClaimSOS } from "@/hooks/useSOS";
import { formatNaira } from "@/lib/format";
import ChatDrawer from "@/components/ChatDrawer";
import AvailabilityEditor from "@/components/AvailabilityEditor";
import { Siren } from "lucide-react";

const ROLE_TO_KIND: Record<string, ServiceKind> = {
  tow_operator: "tow",
  vulcanizer: "vulcanizer",
  mechanic: "mechanic",
};

const KIND_LABEL: Record<ServiceKind, string> = {
  tow: "Tow Van",
  vulcanizer: "Vulcanizer",
  mechanic: "Mechanic",
};

const NEXT_STATUS: Partial<Record<RequestStatus, { next: RequestStatus; label: string }>> = {
  accepted: { next: "enroute", label: "I'm on the way" },
  enroute: { next: "arrived", label: "I've arrived" },
  arrived: { next: "in_progress", label: "Start service" },
  in_progress: { next: "completed", label: "Mark complete" },
};

const ProviderJobsBoard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: roles } = useUserRoles();
  const techRole = roles?.find((r) => ["tow_operator", "vulcanizer", "mechanic"].includes(r));
  const kind = techRole ? ROLE_TO_KIND[techRole] : null;

  const { availability, update: updateAvail } = useAvailability();
  const isOnline = availability?.is_online ?? false;
  const { data: jobs } = useProviderJobs(kind);
  const sendOffer = useSendOffer();
  const updateStatus = useUpdateRequestStatus();
  const { data: sosOpen } = useOpenSOSForProvider(kind);
  const claimSOS = useClaimSOS();

  const [tab, setTab] = useState<"open" | "active" | "schedule">("open");
  const [quoting, setQuoting] = useState<ServiceRequest | null>(null);
  const [chatJob, setChatJob] = useState<ServiceRequest | null>(null);
  const [sosToAccept, setSosToAccept] = useState<any | null>(null);

  const myOfferIds = useMemo(() => new Set((jobs?.myOffers ?? []).map((o) => o.request_id)), [jobs]);
  const openWithoutOffer = (jobs?.open ?? []).filter((r) => !myOfferIds.has(r.id) && r.assigned_provider_id !== user?.id);
  const activeJobs = jobs?.active ?? [];

  const stats = {
    open: openWithoutOffer.length,
    pending: (jobs?.myOffers ?? []).filter((o) => o.status === "pending").length,
    inflight: activeJobs.filter((j) => j.status !== "completed" && j.status !== "cancelled").length,
  };

  return (
    <div className="p-3.5 animate-fade-in">
      {(sosOpen?.length ?? 0) > 0 && (
        <div className="border-2 border-destructive bg-destructive/5 rounded-xl p-3 mb-3 animate-pulse">
          <div className="flex items-center gap-2 mb-2">
            <Siren className="w-4 h-4 text-destructive" />
            <span className="text-xs font-bold text-destructive uppercase tracking-wider">{sosOpen!.length} SOS alert{sosOpen!.length > 1 ? "s" : ""} nearby</span>
          </div>
          <div className="space-y-2">
            {sosOpen!.map((s) => (
              <div key={s.id} className="bg-card border border-destructive/30 rounded-lg p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold capitalize truncate">🚨 {s.service_type} — {s.vehicle ?? "vehicle"}</p>
                    <p className="text-[10px] text-muted-foreground truncate">📍 {s.sos_lat ? `${s.sos_lat.toFixed(3)}, ${s.sos_lng?.toFixed(3)}` : s.location ?? "Unknown"}</p>
                  </div>
                  <button
                    onClick={() => setSosToAccept(s)}
                    className="px-3 py-2 rounded-md bg-destructive text-destructive-foreground text-xs font-bold whitespace-nowrap"
                  >
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isOnline && (
        <div className="bg-accent-light border border-accent/30 rounded-lg p-2.5 text-[11px] text-accent flex items-center gap-2 mb-3">
          ⚠️ You're offline — turn on availability to receive new jobs
        </div>
      )}

      {/* Status card */}
      <div className="bg-card border border-border rounded-lg p-4 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[15px] font-semibold">{KIND_LABEL[kind ?? "tow"]} dashboard</div>
            <div className="text-[11px] text-muted-foreground">Jobs near you · radius {availability?.service_radius_km ?? 10} km</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">{isOnline ? "Online" : "Offline"}</span>
            <button
              onClick={() => updateAvail({ is_online: !isOnline }).then(() => toast.success(isOnline ? "Going offline" : "You're online — accepting jobs"))}
              className={`w-[42px] h-6 rounded-xl border-none cursor-pointer relative transition-colors ${isOnline ? "bg-primary" : "bg-muted"}`}
              aria-label="Toggle availability"
            >
              <span className={`absolute w-[18px] h-[18px] rounded-full bg-card top-[3px] transition-[left] ${isOnline ? "left-[21px]" : "left-[3px]"}`} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <Stat n={stats.open} l="Open" />
          <Stat n={stats.pending} l="My quotes" />
          <Stat n={stats.inflight} l="Active" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-3">
        {(["open", "active", "schedule"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 text-[12px] font-semibold capitalize ${tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}>
            {t === "open" ? "Open requests" : t === "active" ? "Active jobs" : "My schedule"}
          </button>
        ))}
      </div>

      {tab === "open" && (
        <>
          {openWithoutOffer.length === 0 ? (
            <Empty icon="📭" text={isOnline ? "No open requests right now. We'll notify you." : "Go online to see open requests."} />
          ) : openWithoutOffer.map((r) => (
            <div key={r.id} className="bg-card border border-border border-l-[3px] border-l-primary rounded-lg p-3 mb-2">
              <div className="text-[13px] font-semibold capitalize">{r.service_type} — {r.vehicle ?? "vehicle"}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">📍 {r.location ?? "Location not specified"}</div>
              {r.description && <div className="text-[11px] mt-1">{r.description}</div>}
              <div className="flex gap-2 mt-2">
                <button onClick={() => setQuoting(r)} className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold">
                  Send quote
                </button>
                <button onClick={() => toast("You can ignore — it'll just disappear from your list when assigned")} className="flex-1 py-2 rounded-md border border-border text-xs font-medium text-muted-foreground">
                  Skip
                </button>
              </div>
            </div>
          ))}

          {(jobs?.myOffers ?? []).filter((o) => o.status === "pending").length > 0 && (
            <>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-4 mb-2">My pending quotes</p>
              {jobs!.myOffers.filter((o) => o.status === "pending").map((o) => (
                <div key={o.id} className="bg-muted rounded-lg p-2.5 mb-1.5 text-[11px] flex justify-between">
                  <span>Request #{o.request_id.slice(0, 8)}</span>
                  <span className="font-semibold text-primary">{formatNaira(o.price_kobo)}</span>
                </div>
              ))}
            </>
          )}
        </>
      )}

      {tab === "active" && (
        <>
          {activeJobs.length === 0 ? (
            <Empty icon="🛠️" text="No active jobs." />
          ) : activeJobs.map((r) => {
            const step = NEXT_STATUS[r.status];
            return (
              <div key={r.id} className="bg-card border border-border rounded-lg p-3 mb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[13px] font-semibold capitalize">{r.service_type} — {r.vehicle ?? "vehicle"}</div>
                    <div className="text-[11px] text-muted-foreground">📍 {r.location ?? "—"}</div>
                    <div className="text-[11px] mt-0.5">Agreed: <span className="font-semibold text-primary">{formatNaira(r.price_estimate_kobo)}</span></div>
                  </div>
                  <span className="text-[9px] font-bold bg-muted px-1.5 py-0.5 rounded uppercase">{r.status}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setChatJob(r)} className="flex-1 py-2 rounded-md border border-border text-xs font-medium">💬 Chat</button>
                  {step && (
                    <button
                      onClick={async () => { try { await updateStatus.mutateAsync({ id: r.id, status: step.next }); toast.success("Status updated"); } catch (e: any) { toast.error(e.message); } }}
                      className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-xs font-bold"
                    >
                      {step.label}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}

      {tab === "schedule" && <AvailabilityEditor />}

      {quoting && (
        <QuoteModal
          request={quoting}
          onClose={() => setQuoting(null)}
          onSubmit={async ({ price_kobo, eta_minutes, message }) => {
            try {
              await sendOffer.mutateAsync({ request_id: quoting.id, price_kobo, eta_minutes, message });
              toast.success("Quote sent");
              setQuoting(null);
            } catch (e: any) { toast.error(e.message); }
          }}
        />
      )}

      <ChatDrawer
        open={!!chatJob}
        onClose={() => setChatJob(null)}
        threadType="request"
        threadId={chatJob?.id ?? ""}
        title="Chat with customer"
      />

      {sosToAccept && (
        <SOSAcceptModal
          sos={sosToAccept}
          loading={claimSOS.isPending}
          onClose={() => setSosToAccept(null)}
          onConfirm={async () => {
            try { await claimSOS.mutateAsync(sosToAccept.id); toast.success("SOS accepted — head out now"); setSosToAccept(null); navigate(`/sos/${sosToAccept.id}`); }
            catch (e: any) { toast.error(e.message); }
          }}
        />
      )}
    </div>
  );
};

const Stat = ({ n, l }: { n: number; l: string }) => (
  <div className="bg-background rounded-md p-2.5 text-center">
    <div className="text-lg font-bold text-primary">{n}</div>
    <div className="text-[10px] text-muted-foreground font-medium mt-0.5">{l}</div>
  </div>
);

const Empty = ({ icon, text }: { icon: string; text: string }) => (
  <div className="text-center py-10 border border-dashed border-border rounded-xl">
    <div className="text-3xl mb-2">{icon}</div>
    <p className="text-xs text-muted-foreground">{text}</p>
  </div>
);

const QuoteModal = ({ request, onClose, onSubmit }: { request: ServiceRequest; onClose: () => void; onSubmit: (v: { price_kobo: number; eta_minutes?: number; message?: string }) => void }) => {
  const [priceN, setPriceN] = useState("");
  const [eta, setEta] = useState("15");
  const [msg, setMsg] = useState("");
  const submit = () => {
    const p = parseFloat(priceN);
    if (!p || p <= 0) return toast.error("Enter a price");
    onSubmit({ price_kobo: Math.round(p * 100), eta_minutes: parseInt(eta) || undefined, message: msg || undefined });
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-bold mb-1">Send a quote</h3>
        <p className="text-[11px] text-muted-foreground mb-3 capitalize">{request.service_type} · {request.vehicle ?? "vehicle"}</p>
        <div className="space-y-2.5">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Price (₦)</label>
            <input type="number" value={priceN} onChange={(e) => setPriceN(e.target.value)} placeholder="e.g. 12000" className="w-full py-2.5 px-3 border border-border rounded-lg text-sm bg-background outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">ETA (minutes)</label>
            <input type="number" value={eta} onChange={(e) => setEta(e.target.value)} className="w-full py-2.5 px-3 border border-border rounded-lg text-sm bg-background outline-none focus:border-primary" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Message (optional)</label>
            <textarea rows={2} value={msg} onChange={(e) => setMsg(e.target.value)} className="w-full py-2.5 px-3 border border-border rounded-lg text-sm bg-background outline-none focus:border-primary resize-none" />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-xs font-semibold">Cancel</button>
          <button onClick={submit} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold">Send quote</button>
        </div>
      </div>
    </div>
  );
};

export default ProviderJobsBoard;
