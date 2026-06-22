import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageNav from "@/components/PageNav";
import { toast } from "sonner";
import { useRequest, useAcceptOffer, useUpdateRequestStatus, useRateRequest, type RequestStatus } from "@/hooks/useServiceRequests";
import { formatNaira } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import ChatDrawer from "@/components/ChatDrawer";
import PayoutBreakdown from "@/components/PayoutBreakdown";

const STATUS_FLOW: RequestStatus[] = ["pending", "offered", "accepted", "enroute", "arrived", "in_progress", "completed"];
const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: "Looking for providers",
  offered: "Quotes received",
  accepted: "Provider assigned",
  enroute: "Provider en route",
  arrived: "Provider arrived",
  in_progress: "Service in progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const RequestTracking = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { request, offers, loading } = useRequest(id);
  const acceptOffer = useAcceptOffer();
  const updateStatus = useUpdateRequestStatus();
  const rate = useRateRequest();
  const [chatOpen, setChatOpen] = useState(false);
  const [stars, setStars] = useState(0);
  const [reviewText, setReviewText] = useState("");

  if (loading) return <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!request) return (
    <div className="p-10 text-center">
      <p className="text-sm text-muted-foreground mb-4">Request not found.</p>
      <button onClick={() => navigate("/")} className="text-primary text-sm font-semibold">← Back</button>
    </div>
  );

  const isBuyer = request.buyer_id === user?.id;
  const stepIdx = STATUS_FLOW.indexOf(request.status);
  const cancelled = request.status === "cancelled";

  const cancel = async () => {
    if (!confirm("Cancel this request?")) return;
    try { await updateStatus.mutateAsync({ id: request.id, status: "cancelled" }); toast.success("Request cancelled"); }
    catch (e: any) { toast.error(e.message); }
  };

  const submitRating = async () => {
    if (!stars) return toast.error("Pick a rating");
    try { await rate.mutateAsync({ id: request.id, rating: stars, review: reviewText }); toast.success("Thanks for the feedback!"); navigate("/"); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="max-w-[700px] mx-auto min-h-screen bg-background pb-10">
      <PageNav />
      <header className="bg-primary px-4 py-3 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-primary-foreground text-sm">←</button>
        <h1 className="text-primary-foreground text-sm font-bold">Request #{request.id.slice(0, 8)}</h1>
      </header>

      <div className="p-4 space-y-3">
        {/* Status timeline */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Status</p>
          <h2 className="text-base font-bold">{STATUS_LABEL[request.status]}</h2>
          {!cancelled && (
            <div className="flex gap-1 mt-3">
              {STATUS_FLOW.map((s, i) => (
                <div key={s} className={`flex-1 h-1.5 rounded-full ${i <= stepIdx ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
            <div><span className="text-muted-foreground">Service:</span> <span className="font-semibold capitalize">{request.service_type}</span></div>
            {request.vehicle && <div><span className="text-muted-foreground">Vehicle:</span> <span className="font-semibold">{request.vehicle}</span></div>}
            {request.location && <div className="col-span-2 inline-flex items-center gap-1"><MapPin className="w-3 h-3 text-muted-foreground" aria-hidden="true" /> <span className="font-semibold">{request.location}</span></div>}
            {request.description && <div className="col-span-2"><span className="text-muted-foreground">Notes:</span> {request.description}</div>}
            {request.price_estimate_kobo > 0 && <div className="col-span-2"><span className="text-muted-foreground">Agreed price:</span> <span className="font-semibold text-primary">{formatNaira(request.price_estimate_kobo)}</span></div>}
          </div>
        </div>

        {/* Offers (buyer view, before acceptance) */}
        {isBuyer && ["pending", "offered"].includes(request.status) && (
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
              Quotes ({offers.length})
            </p>
            {offers.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Waiting for providers to send quotes…</p>
            ) : (
              <div className="flex flex-col gap-2">
                {offers.filter((o) => o.status === "pending").map((o) => (
                  <div key={o.id} className="border border-border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <div className="text-base font-bold text-primary">{formatNaira(o.price_kobo)}</div>
                        {o.eta_minutes && <div className="text-[11px] text-muted-foreground">ETA ~{o.eta_minutes} min</div>}
                      </div>
                      <button
                        onClick={async () => { try { await acceptOffer.mutateAsync(o); toast.success("Provider booked"); } catch (e: any) { toast.error(e.message); } }}
                        className="bg-primary text-primary-foreground text-[11px] font-bold px-3 py-1.5 rounded-full"
                      >
                        Accept
                      </button>
                    </div>
                    {o.message && <p className="text-[11px] text-muted-foreground">{o.message}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active job actions */}
        {request.assigned_provider_id && !cancelled && request.status !== "completed" && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            <button
              onClick={() => setChatOpen(true)}
              className="w-full py-2.5 rounded-lg border border-primary text-primary text-xs font-bold inline-flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" /> Chat with provider
            </button>
            {isBuyer && request.status === "in_progress" && (
              <button
                onClick={async () => { try { await updateStatus.mutateAsync({ id: request.id, status: "completed" }); toast.success("Marked complete"); } catch (e: any) { toast.error(e.message); } }}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold inline-flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Confirm completion
              </button>
            )}
          </div>
        )}

        {/* Cancel */}
        {isBuyer && ["pending", "offered", "accepted"].includes(request.status) && (
          <button onClick={cancel} className="w-full py-2.5 rounded-lg border border-destructive text-destructive text-xs font-bold">
            Cancel request
          </button>
        )}

        {/* Rating */}
        {isBuyer && request.status === "completed" && !request.rating && (
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm font-bold mb-2">Rate your experience</p>
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setStars(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}>
                  <Star className={`w-6 h-6 ${n <= stars ? "fill-accent text-accent" : "text-muted-foreground opacity-40"}`} aria-hidden="true" />
                </button>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Optional review…"
              className="w-full p-2 border border-border rounded-lg text-xs bg-background outline-none focus:border-primary resize-none h-20"
            />
            <button onClick={submitRating} className="w-full mt-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold">Submit review</button>
          </div>
        )}

        {isBuyer && request.status === "completed" && (request as any).payment_status !== "paid" && (
          <button onClick={() => navigate(`/pay/service/${request.id}`)} className="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-bold inline-flex items-center justify-center gap-2">
            <CreditCard className="w-4 h-4" aria-hidden="true" /> Pay {formatNaira(request.price_estimate_kobo)}
          </button>
        )}

        {(request as any).payment_status === "paid" && (request as any).compliance_fee_kobo != null && (
          <div className="space-y-2">
            <h3 className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Payment breakdown</h3>
            <PayoutBreakdown
              gross_kobo={(request as any).amount_kobo ?? request.price_estimate_kobo ?? 0}
              platform_fee_kobo={(request as any).platform_fee_kobo}
              compliance_fee_kobo={(request as any).compliance_fee_kobo}
              net_payout_kobo={(request as any).net_payout_kobo}
              fee_label={(request as any).fee_label}
              variant={isBuyer ? "customer" : "provider"}
            />
          </div>
        )}

        {request.rating && (
          <div className="bg-primary-light border border-primary/20 rounded-xl p-4 text-center">
            <p className="text-xs text-primary font-semibold inline-flex items-center justify-center gap-1">
              You rated this
              {Array.from({ length: request.rating }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-accent text-accent" aria-hidden="true" />
              ))}
            </p>
            {request.review && <p className="text-[11px] text-muted-foreground mt-1">{request.review}</p>}
          </div>
        )}
      </div>

      <ChatDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        threadType="request"
        threadId={request.id}
        title="Chat about this request"
      />
    </div>
  );
};

export default RequestTracking;
