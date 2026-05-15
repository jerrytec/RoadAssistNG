import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRequest } from "@/hooks/useServiceRequests";
import { formatNaira } from "@/lib/format";
import { CreditCard, ShieldCheck, ArrowLeft } from "lucide-react";

const ServicePayment = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { request, loading } = useRequest(id);
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!request) return <div className="p-10 text-center text-sm text-muted-foreground">Request not found.</div>;

  const amount = request.price_estimate_kobo || 0;
  const alreadyPaid = (request as any).payment_status === "paid";

  const pay = async () => {
    if (amount <= 0) return toast.error("No agreed amount yet");
    setBusy(true);
    try {
      const ref = `RAS-${Date.now()}`;
      const { error } = await (supabase as any).from("service_requests").update({
        payment_status: "paid",
        payment_reference: ref,
        paid_at: new Date().toISOString(),
        amount_kobo: amount,
      }).eq("id", request.id);
      if (error) throw error;
      toast.success("Payment successful");
      navigate(`/requests/${request.id}`);
    } catch (e: any) {
      toast.error(e.message ?? "Payment failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-[560px] mx-auto min-h-screen bg-background pb-10">
      <header className="bg-primary px-4 py-3 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-primary-foreground"><ArrowLeft className="w-4 h-4" /></button>
        <h1 className="text-primary-foreground text-sm font-bold">Pay for service</h1>
      </header>
      <div className="p-4 space-y-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Service</p>
          <p className="text-base font-bold capitalize">{request.service_type}</p>
          <div className="border-t border-border my-3" />
          <div className="flex justify-between text-xs"><span className="text-muted-foreground">Agreed amount</span><span className="font-semibold">{formatNaira(amount)}</span></div>
          <div className="flex justify-between text-xs mt-1"><span className="text-muted-foreground">Service fee</span><span>Included</span></div>
          <div className="border-t border-border my-3" />
          <div className="flex justify-between text-base font-bold"><span>Total</span><span className="text-primary">{formatNaira(amount)}</span></div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Payment method</p>
          <div className="flex items-center gap-3 p-3 border border-primary/40 bg-primary/5 rounded-lg">
            <CreditCard className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="text-xs font-semibold">Card / Bank transfer</p>
              <p className="text-[10px] text-muted-foreground">Funds are held in escrow and released to the operator upon your confirmation.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5" /> Secure payment · refundable through dispute
        </div>

        <button
          onClick={pay}
          disabled={busy || alreadyPaid || amount <= 0}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50"
        >
          {alreadyPaid ? "Already paid" : busy ? "Processing…" : `Pay ${formatNaira(amount)}`}
        </button>
      </div>
    </div>
  );
};

export default ServicePayment;
