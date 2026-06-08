import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageNav from "@/components/PageNav";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRequest } from "@/hooks/useServiceRequests";
import { applyComplianceFee } from "@/lib/compliance";
import { formatNaira } from "@/lib/format";
import { Landmark, ShieldCheck, ArrowLeft, Copy, Check, CreditCard } from "lucide-react";

type PayMethod = "card" | "bank";

const ROADASSIST_BANKS = [
  { id: "gtb", bank: "Guaranty Trust Bank (GTBank)", accountNumber: "0489123456", accountName: "RoadAssistNG Limited" },
  { id: "zenith", bank: "Zenith Bank", accountNumber: "1019876543", accountName: "RoadAssistNG Limited" },
  { id: "access", bank: "Access Bank", accountNumber: "0712345678", accountName: "RoadAssistNG Limited" },
];

const ServicePayment = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { request, loading } = useRequest(id);
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<PayMethod>("bank");
  const [selectedBank, setSelectedBank] = useState<string>(ROADASSIST_BANKS[0].id);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", name: "" });

  const copy = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1800);
    });
  };

  const formatCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length >= 3 ? d.slice(0, 2) + "/" + d.slice(2) : d;
  };

  if (loading) return <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!request) return <div className="p-10 text-center text-sm text-muted-foreground">Request not found.</div>;

  const amount = request.price_estimate_kobo || 0;
  const alreadyPaid = (request as any).payment_status === "paid";
  const activeBank = ROADASSIST_BANKS.find((b) => b.id === selectedBank)!;

  const cardValid = card.number.replace(/\s/g, "").length === 16 && card.expiry.length === 5 && card.cvv.length >= 3 && card.name.trim().length > 1;
  const canSubmit = method === "bank" ? !!selectedBank : cardValid;

  const pay = async () => {
    if (amount <= 0) return toast.error("No agreed amount yet");
    if (!canSubmit) return toast.error(method === "card" ? "Enter valid card details" : "Select a bank");
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
      toast.success(method === "bank" ? "Payment confirmed — funds held in escrow" : "Card authorized — funds held in escrow");
      navigate(`/requests/${request.id}`);
    } catch (e: any) {
      toast.error(e.message ?? "Payment failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-[560px] mx-auto min-h-screen bg-background pb-10">
      <PageNav />
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

        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Payment method</p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMethod("bank")}
              className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${method === "bank" ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40"}`}
            >
              <Landmark className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold">Bank Transfer</span>
            </button>
            <button
              onClick={() => setMethod("card")}
              className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${method === "card" ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40"}`}
            >
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold">Debit Card</span>
            </button>
          </div>

          {method === "bank" && (
            <div className="space-y-3">
              <p className="text-[11px] text-muted-foreground">Choose one of the RoadAssistNG escrow accounts and transfer the exact amount.</p>

              <div className="space-y-2">
                {ROADASSIST_BANKS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBank(b.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${selectedBank === b.id ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40"}`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-foreground">{b.bank}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{b.accountNumber}</p>
                    </div>
                    {selectedBank === b.id && <Check className="w-4 h-4 text-primary" />}
                  </button>
                ))}
              </div>

              <div className="bg-background border border-border rounded-xl p-4 space-y-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Transfer to this account</p>
                {[
                  { label: "Bank Name", value: activeBank.bank, field: "bank" },
                  { label: "Account Number", value: activeBank.accountNumber, field: "account", mono: true },
                  { label: "Account Name", value: activeBank.accountName, field: "name" },
                  { label: "Amount", value: formatNaira(amount), field: "amount" },
                ].map((item) => (
                  <div key={item.field} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground">{item.label}</p>
                      <p className={`text-sm font-semibold text-foreground truncate ${item.mono ? "font-mono" : ""}`}>{item.value}</p>
                    </div>
                    {item.field !== "amount" && (
                      <button
                        onClick={() => copy(item.value, item.field)}
                        className="flex items-center gap-1 text-[10px] text-primary font-medium px-2 py-1 rounded-md hover:bg-primary/10 transition-colors shrink-0"
                      >
                        {copiedField === item.field ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedField === item.field ? "Copied" : "Copy"}
                      </button>
                    )}
                  </div>
                ))}
                <div className="p-2.5 bg-accent-light rounded-lg flex items-start gap-2">
                  <span className="text-xs">⏳</span>
                  <p className="text-[10px] text-accent font-medium">Use request ID <span className="font-mono">{request.id.slice(0, 8)}</span> as transfer description for faster reconciliation.</p>
                </div>
              </div>
            </div>
          )}

          {method === "card" && (
            <div className="space-y-2.5">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Card Number</label>
                <input value={card.number} onChange={(e) => setCard({ ...card, number: formatCard(e.target.value) })} placeholder="0000 0000 0000 0000" maxLength={19} className="w-full py-2.5 px-3 border border-border rounded-lg text-sm bg-background outline-none focus:border-primary font-mono" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Expiry</label>
                  <input value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} placeholder="MM/YY" maxLength={5} className="w-full py-2.5 px-3 border border-border rounded-lg text-sm bg-background outline-none focus:border-primary font-mono" />
                </div>
                <div className="flex-1">
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">CVV</label>
                  <input value={card.cvv} type="password" onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="***" maxLength={4} className="w-full py-2.5 px-3 border border-border rounded-lg text-sm bg-background outline-none focus:border-primary font-mono" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Cardholder Name</label>
                <input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} placeholder="As shown on card" className="w-full py-2.5 px-3 border border-border rounded-lg text-sm bg-background outline-none focus:border-primary" />
              </div>
              <div className="p-2.5 bg-accent-light rounded-lg flex items-start gap-2">
                <span className="text-xs">🔐</span>
                <p className="text-[10px] text-accent font-medium">Card details are encrypted via PCI DSS Level 1 gateway. Funds are held in escrow, not charged immediately.</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5" /> Escrow protected · funds released only after your confirmation
        </div>

        <button
          onClick={pay}
          disabled={busy || alreadyPaid || amount <= 0 || !canSubmit}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50"
        >
          {alreadyPaid ? "Already paid" : busy ? "Confirming…" : method === "bank" ? "I've made the transfer — confirm payment" : `Authorize ${formatNaira(amount)} hold`}
        </button>
      </div>
    </div>
  );
};

export default ServicePayment;
