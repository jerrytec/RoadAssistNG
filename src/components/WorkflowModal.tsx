import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { Provider } from "@/components/ProviderCard";
import { useCreateRequest, type ServiceKind } from "@/hooks/useServiceRequests";

/**
 * Workflow Steps:
 * 0 - Book: User fills in details
 * 1 - Quote: Provider sends quote breakdown
 * 2 - Chat: User & provider negotiate and agree
 * 3 - Hold: Escrow / authorization hold on payment method
 * 4 - Service: Provider en route → in progress → completed
 * 5 - Confirm & Pay: User confirms satisfaction, funds released
 * 6 - Review: Rate and review
 */

const steps = ["Book", "Quote", "Chat", "Hold", "Service", "Confirm", "Review"];

type PayMethod = "card" | "bank" | "ussd" | "cash";
type HoldStatus = "idle" | "authorizing" | "held" | "failed";
type ServicePhase = "en_route" | "arrived" | "in_progress" | "completed";
type ReleaseStatus = "idle" | "releasing" | "released" | "failed";

const banks = [
  { name: "GTBank", code: "058", icon: "🏦" },
  { name: "First Bank", code: "011", icon: "🏦" },
  { name: "Zenith Bank", code: "057", icon: "🏦" },
  { name: "Access Bank", code: "044", icon: "🏦" },
  { name: "UBA", code: "033", icon: "🏦" },
  { name: "Kuda Bank", code: "090267", icon: "🏦" },
];

const ussdCodes = [
  { bank: "GTBank", code: "*737*Amount*MerchantCode#" },
  { bank: "First Bank", code: "*894*Amount#" },
  { bank: "Zenith Bank", code: "*966*Amount*MerchantCode#" },
  { bank: "Access Bank", code: "*901*Amount#" },
  { bank: "UBA", code: "*919*Amount#" },
  { bank: "Stanbic IBTC", code: "*909*Amount#" },
];

export interface PrefillData {
  serviceType?: string;
  vehicle?: string;
  description?: string;
  previousAmount?: number;
  preferSameProvider?: boolean;
  previousProvider?: string;
}

interface Props {
  provider: Provider;
  onClose: () => void;
  prefill?: PrefillData;
}

const avatarColors: Record<string, string> = {
  info: "bg-info-light",
  accent: "bg-accent-light",
  secondary: "bg-secondary-light",
};

const generateTxnRef = () => `RA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const quoteItems = [
  { l: "Call-out fee", v: 2000 },
  { l: "Service charge", v: 8500 },
  { l: "Distance surcharge (2.1 km)", v: 1050 },
  { l: "Platform fee (5%)", v: 578 },
];
const TOTAL_AMOUNT = quoteItems.reduce((sum, i) => sum + i.v, 0);

const STORAGE_KEY = "roadassist_booking";

interface BookingState {
  providerId: string;
  step: number;
  payMethod: PayMethod;
  formData: { name: string; phone: string; location: string; description: string };
  txnRef: string;
  timestamp: number;
}

const saveBooking = (state: BookingState) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
};

const loadBooking = (providerId: string): BookingState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as BookingState;
    if (state.providerId === providerId && Date.now() - state.timestamp < 2 * 60 * 60 * 1000) return state;
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  return null;
};

const clearBooking = () => {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
};

const WorkflowModal = ({ provider, onClose, prefill }: Props) => {
  const saved = loadBooking(provider.name);

  const [step, setStep] = useState(saved?.step ?? 0);
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { me: false, text: "Hi! I've seen your request. I'm about 7 minutes away. What exactly happened to your vehicle?", time: "2:14 PM" },
    { me: true, text: "My tyre blew out on the expressway. White Toyota Camry at the bus stop junction.", time: "2:15 PM" },
    { me: false, text: "Okay, I can handle that. The quoted price looks right. Shall we proceed?", time: "2:15 PM" },
  ]);

  const [formData, setFormData] = useState(saved?.formData ?? {
    name: "",
    phone: "",
    location: prefill ? "📍 Using current GPS location" : "",
    description: prefill?.description ?? "",
  });

  // Payment method for escrow hold
  const [payMethod, setPayMethod] = useState<PayMethod>(saved?.payMethod ?? "card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedUssd, setSelectedUssd] = useState("");

  // Escrow hold state
  const [holdStatus, setHoldStatus] = useState<HoldStatus>("idle");

  // Service tracking state
  const [servicePhase, setServicePhase] = useState<ServicePhase>("en_route");

  // Release/confirm state
  const [releaseStatus, setReleaseStatus] = useState<ReleaseStatus>("idle");
  const [showReceipt, setShowReceipt] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);

  const [txnRef] = useState(() => saved?.txnRef ?? generateTxnRef());
  const amount = TOTAL_AMOUNT;

  const persistState = useCallback(() => {
    saveBooking({
      providerId: provider.name,
      step,
      payMethod,
      formData,
      txnRef,
      timestamp: Date.now(),
    });
  }, [provider.name, step, payMethod, formData, txnRef]);

  useEffect(() => { persistState(); }, [persistState]);

  const [showResumeNotice, setShowResumeNotice] = useState(!!saved && saved.step > 0);

  const next = () => setStep((s) => Math.min(s + 1, 6));

  const toggleTag = (t: string) =>
    setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages((prev) => [...prev, { me: true, text: chatInput.trim(), time: "Now" }]);
    setChatInput("");
  };

  const formatCard = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  const canHoldProceed = () => {
    if (payMethod === "card") return cardNumber.replace(/\s/g, "").length === 16 && expiry.length === 5 && cvv.length >= 3 && cardName.length > 1;
    if (payMethod === "bank") return selectedBank !== "";
    if (payMethod === "ussd") return selectedUssd !== "";
    if (payMethod === "cash") return true;
    return false;
  };

  // Simulate escrow authorization hold
  const handleAuthorizeHold = () => {
    if (payMethod === "cash") {
      setHoldStatus("held");
      setTimeout(() => next(), 500);
      return;
    }
    setHoldStatus("authorizing");
    setTimeout(() => {
      const success = Math.random() > 0.1;
      if (success) {
        setHoldStatus("held");
        setTimeout(() => next(), 800);
      } else {
        setHoldStatus("failed");
      }
    }, 2000);
  };

  // Simulate service progress
  const startServiceTracking = useCallback(() => {
    setServicePhase("en_route");
    setTimeout(() => setServicePhase("arrived"), 3000);
    setTimeout(() => setServicePhase("in_progress"), 6000);
    setTimeout(() => setServicePhase("completed"), 10000);
  }, []);

  useEffect(() => {
    if (step === 4) startServiceTracking();
  }, [step, startServiceTracking]);

  // Release escrow (confirm & pay)
  const handleConfirmRelease = () => {
    if (payMethod === "cash") {
      setReleaseStatus("released");
      return;
    }
    setReleaseStatus("releasing");
    setTimeout(() => {
      const success = Math.random() > 0.05;
      if (success) {
        setReleaseStatus("released");
      } else {
        setReleaseStatus("failed");
      }
    }, 2000);
  };

  const handleClose = () => {
    if (step === 6) clearBooking();
    onClose();
  };

  const ProviderMini = () => (
    <div className="flex items-center gap-2.5 p-2.5 bg-background rounded-lg mb-3">
      <div className={`w-[38px] h-[38px] rounded-lg flex items-center justify-center text-base shrink-0 ${avatarColors[provider.avatarBg]}`}>
        {provider.icon}
      </div>
      <div className="flex-1">
        <div className="text-[13px] font-semibold text-foreground">{provider.name}</div>
        <div className="text-[11px] text-muted-foreground">{provider.type} · {provider.location}</div>
      </div>
      <div className="text-right">
        <div className="text-xs font-semibold text-primary">{provider.distance}</div>
        <div className="text-[10px] text-muted-foreground">{provider.eta}</div>
      </div>
    </div>
  );

  const Receipt = () => (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="text-center mb-3">
        <div className="text-2xl mb-1">🧾</div>
        <h3 className="text-sm font-bold text-foreground">Payment Receipt</h3>
        <p className="text-[10px] text-muted-foreground font-mono">{txnRef}</p>
      </div>
      <div className="border-t border-dashed border-border pt-3 space-y-1.5">
        {quoteItems.map((item) => (
          <div key={item.l} className="flex justify-between text-xs">
            <span className="text-muted-foreground">{item.l}</span>
            <span className="text-foreground">₦{item.v.toLocaleString()}</span>
          </div>
        ))}
        <div className="flex justify-between text-xs font-bold pt-1.5 border-t border-border">
          <span className="text-foreground">Total Paid</span>
          <span className="text-primary">₦{amount.toLocaleString()}</span>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        {[
          { l: "Method", v: payMethod === "ussd" ? "USSD" : payMethod === "bank" ? "Bank Transfer" : payMethod === "cash" ? "Cash" : "Debit Card" },
          { l: "Date", v: new Date().toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) },
          { l: "Provider", v: provider.name },
          { l: "Status", v: "✅ Funds Released" },
        ].map((r) => (
          <div key={r.l} className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">{r.l}</span>
            <span className="font-medium text-foreground">{r.v}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 p-2 bg-primary-light rounded-lg text-center">
        <p className="text-[10px] text-primary font-medium">Receipt sent via SMS to your registered number</p>
      </div>
    </div>
  );

  const servicePhaseData: Record<ServicePhase, { icon: string; title: string; desc: string; progress: number }> = {
    en_route: { icon: "🚗", title: "Provider En Route", desc: `${provider.name} is heading to your location`, progress: 25 },
    arrived: { icon: "📍", title: "Provider Arrived", desc: `${provider.name} has arrived at your location`, progress: 50 },
    in_progress: { icon: "🔧", title: "Service In Progress", desc: "Work is being done on your vehicle", progress: 75 },
    completed: { icon: "✅", title: "Service Completed", desc: "The provider has finished the work", progress: 100 },
  };

  return (
    <div className="bg-foreground/40 min-h-[500px] flex items-start justify-center p-5 rounded-lg mb-3">
      <div className="bg-card rounded-xl w-full max-w-[420px] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-primary px-4 py-3.5 flex items-center justify-between">
          <span className="text-primary-foreground text-sm font-bold">Book {provider.name}</span>
          <button onClick={handleClose} className="bg-white/20 border-none text-primary-foreground w-[26px] h-[26px] rounded-full cursor-pointer text-sm flex items-center justify-center">
            ✕
          </button>
        </div>

        {showResumeNotice && (
          <div className="bg-accent-light px-4 py-2 flex items-center justify-between">
            <p className="text-[11px] text-accent font-medium">📌 Resuming your previous booking</p>
            <button onClick={() => { setShowResumeNotice(false); setStep(0); clearBooking(); }} className="text-[10px] text-accent underline bg-transparent border-none cursor-pointer">Start over</button>
          </div>
        )}

        {/* Steps indicator */}
        <div className="flex px-3 py-3 border-b border-border overflow-x-auto">
          {steps.map((s, i) => (
            <div key={s} className="flex-1 text-center relative min-w-0">
              {i < steps.length - 1 && (
                <div className="absolute top-[11px] left-1/2 w-full h-[1.5px] bg-border" />
              )}
              <div className={`w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center text-[10px] font-bold mx-auto mb-1 relative z-10 ${
                i < step ? "bg-primary-mid border-primary-mid text-primary-foreground"
                  : i === step ? "bg-primary border-primary text-primary-foreground"
                  : "bg-card border-border text-muted-foreground"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-[8px] font-medium ${i === step ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                {s}
              </span>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">

          {/* Step 0: Book */}
          {step === 0 && (
            <div className="animate-fade-in">
              {prefill && (
                <div className="bg-primary-light border border-primary/20 rounded-lg p-3 mb-3">
                  <div className="text-[11px] font-semibold text-primary mb-1">🔄 Prefilled from previous booking</div>
                  <div className="text-[10px] text-muted-foreground space-y-0.5">
                    <div>Service: <span className="font-medium text-foreground">{prefill.serviceType}</span></div>
                    {prefill.vehicle && <div>Vehicle: <span className="font-medium text-foreground">{prefill.vehicle}</span></div>}
                    {prefill.previousAmount !== undefined && prefill.previousAmount > 0 && (
                      <div>Previous price: <span className="font-medium text-foreground">₦{prefill.previousAmount.toLocaleString()}</span> <span className="text-muted-foreground">(may vary)</span></div>
                    )}
                    {prefill.preferSameProvider && (
                      <div>Provider preference: <span className="font-medium text-foreground">{prefill.previousProvider}</span></div>
                    )}
                  </div>
                </div>
              )}
              <ProviderMini />
              {([
                { key: "name", label: "Your name", type: "text" },
                { key: "phone", label: "Phone number", type: "tel" },
                { key: "location", label: "Location / landmark", type: "text" },
              ] as const).map((field) => (
                <div key={field.key} className="mb-2.5">
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">{field.label}</label>
                  <input
                    value={formData[field.key]}
                    onChange={(e) => setFormData((f) => ({ ...f, [field.key]: e.target.value }))}
                    type={field.type}
                    className="w-full py-2 px-3 border border-border rounded-md text-xs bg-card text-foreground outline-none focus:border-primary-mid"
                  />
                </div>
              ))}
              <div className="mb-2.5">
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Vehicle & problem description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                  className="w-full py-2 px-3 border border-border rounded-md text-xs bg-card text-foreground outline-none focus:border-primary-mid resize-none h-16"
                />
              </div>
              <button
                onClick={next}
                disabled={!formData.name.trim() || !formData.phone.trim() || !formData.location.trim()}
                className="w-full py-3 rounded-lg border-none bg-primary text-primary-foreground text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Request service →
              </button>
            </div>
          )}

          {/* Step 1: Quote */}
          {step === 1 && (
            <div className="animate-fade-in">
              <p className="text-[11px] text-muted-foreground mb-3">Provider has reviewed your request and sent a quote.</p>
              <ProviderMini />
              <div className="border border-border rounded-lg overflow-hidden mb-3">
                {quoteItems.map((item, i) => (
                  <div key={i} className="flex justify-between p-2.5 px-3 text-xs border-b border-border last:border-b-0">
                    <span className="text-muted-foreground">{item.l}</span>
                    <span className="font-medium text-foreground">₦{item.v.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between p-2.5 px-3 text-xs font-semibold bg-primary-light text-primary">
                  <span>Total estimate</span>
                  <span>₦{TOTAL_AMOUNT.toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-background rounded-lg p-2 mb-3 flex items-center gap-2">
                <span className="text-[10px]">🔖</span>
                <p className="text-[10px] text-muted-foreground">Ref: <span className="font-mono font-semibold text-foreground">{txnRef}</span></p>
              </div>
              <div className="bg-accent-light rounded-lg p-2.5 mb-3 flex items-start gap-2">
                <span className="text-sm">🛡️</span>
                <p className="text-[10px] text-accent leading-relaxed font-medium">
                  Your payment will be held in escrow and only released after you confirm the service is complete. You won't be charged until you're satisfied.
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={next} className="flex-1 py-2 rounded-md border border-border bg-card text-muted-foreground text-xs font-medium cursor-pointer">
                  💬 Chat & negotiate
                </button>
                <button onClick={() => setStep(2)} className="flex-1 py-2 rounded-md border-none bg-primary-mid text-primary-foreground text-xs font-semibold cursor-pointer">
                  Accept quote →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Chat & Agree */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="bg-accent-light rounded-lg p-2 mb-2.5 flex items-center gap-2">
                <span className="text-[10px]">💬</span>
                <p className="text-[10px] text-accent font-medium">Discuss pricing and details with your provider before authorizing payment hold.</p>
              </div>
              <div className="bg-background rounded-lg p-2.5 mb-2.5 min-h-[140px] flex flex-col gap-2">
                {messages.map((m, i) => (
                  <div key={i} className={`max-w-[76%] py-2 px-3 rounded-xl text-xs leading-relaxed ${
                    m.me
                      ? "self-end bg-primary-mid text-primary-foreground rounded-br-sm"
                      : "self-start bg-card text-foreground border border-border rounded-bl-sm"
                  }`}>
                    {m.text}
                    <div className="text-[9px] opacity-70 mt-0.5">{m.time}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mb-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1 py-2 px-3 border border-border rounded-md text-xs outline-none bg-card text-foreground"
                  placeholder="Type a message..."
                />
                <button onClick={sendMessage} className="px-3.5 py-2 rounded-md border-none bg-primary-mid text-primary-foreground text-xs font-semibold cursor-pointer">
                  Send
                </button>
              </div>
              <button onClick={next} className="w-full py-2.5 rounded-md border-none bg-primary text-primary-foreground text-xs font-semibold cursor-pointer">
                ✅ Agreed — proceed to authorize payment hold →
              </button>
            </div>
          )}

          {/* Step 3: Escrow / Authorization Hold */}
          {step === 3 && (
            <div className="animate-fade-in">
              {holdStatus === "authorizing" && (
                <div className="py-8 text-center">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-primary-light flex items-center justify-center">
                    <div className="w-7 h-7 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-1">Authorizing Hold</h3>
                  <p className="text-[11px] text-muted-foreground mb-3">Placing ₦{amount.toLocaleString()} in escrow...</p>
                  <p className="text-[10px] text-muted-foreground">Your card will not be charged yet. This is an authorization hold only.</p>
                </div>
              )}

              {holdStatus === "held" && (
                <div className="py-6 text-center">
                  <div className="text-4xl mb-3">🔒</div>
                  <h3 className="text-sm font-bold text-primary mb-1">Funds Held in Escrow</h3>
                  <p className="text-[11px] text-muted-foreground mb-3">₦{amount.toLocaleString()} is securely held. Provider is being notified.</p>
                  <div className="bg-primary-light rounded-lg p-2.5 text-[10px] text-primary font-medium">
                    Funds will only be released after you confirm the service is satisfactorily completed.
                  </div>
                </div>
              )}

              {holdStatus === "failed" && (
                <div className="py-6 text-center">
                  <div className="text-4xl mb-3">❌</div>
                  <h3 className="text-sm font-bold text-destructive mb-1">Authorization Failed</h3>
                  <p className="text-xs text-muted-foreground mb-3">We couldn't place a hold on your payment method. Please try again or use a different method.</p>
                  <button onClick={() => setHoldStatus("idle")} className="w-full py-2.5 rounded-lg border border-border bg-card text-foreground text-xs font-medium cursor-pointer">
                    Try Again
                  </button>
                </div>
              )}

              {holdStatus === "idle" && (
                <>
                  <div className="bg-accent-light rounded-lg p-3 mb-3 flex items-start gap-2">
                    <span className="text-lg">🛡️</span>
                    <div>
                      <p className="text-xs font-semibold text-accent mb-0.5">Escrow Protection</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        We'll place an authorization hold of <strong className="text-foreground">₦{amount.toLocaleString()}</strong> on your chosen payment method. 
                        Your money stays protected in escrow and will only be released after you confirm the service is complete and satisfactory.
                      </p>
                    </div>
                  </div>

                  <div className="bg-background rounded-lg p-2 mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px]">🔖</span>
                      <span className="text-[10px] text-muted-foreground">Ref:</span>
                      <span className="text-[10px] font-mono font-semibold text-foreground">{txnRef}</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 bg-accent-light text-accent rounded font-medium">Escrow</span>
                  </div>

                  {/* Payment method tabs */}
                  <div className="flex gap-1.5 mb-3">
                    {([
                      { id: "card" as PayMethod, icon: "💳", label: "Card" },
                      { id: "bank" as PayMethod, icon: "🏦", label: "Bank" },
                      { id: "ussd" as PayMethod, icon: "📱", label: "USSD" },
                      { id: "cash" as PayMethod, icon: "💵", label: "Cash" },
                    ]).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setPayMethod(m.id)}
                        className={`flex-1 py-2 rounded-lg text-[11px] font-semibold border cursor-pointer transition-all ${
                          payMethod === m.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:border-primary/40"
                        }`}
                      >
                        {m.icon} {m.label}
                      </button>
                    ))}
                  </div>

                  {/* Card form */}
                  {payMethod === "card" && (
                    <div className="space-y-2 mb-3">
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Card Number</label>
                        <input value={cardNumber} onChange={(e) => setCardNumber(formatCard(e.target.value))} placeholder="0000 0000 0000 0000" className="w-full py-2 px-3 border border-border rounded-md text-xs bg-background text-foreground outline-none focus:border-primary font-mono" maxLength={19} />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Expiry</label>
                          <input value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} placeholder="MM/YY" className="w-full py-2 px-3 border border-border rounded-md text-xs bg-background text-foreground outline-none focus:border-primary font-mono" maxLength={5} />
                        </div>
                        <div className="flex-1">
                          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">CVV</label>
                          <input value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="***" type="password" className="w-full py-2 px-3 border border-border rounded-md text-xs bg-background text-foreground outline-none focus:border-primary font-mono" maxLength={4} />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Cardholder Name</label>
                        <input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="As shown on card" className="w-full py-2 px-3 border border-border rounded-md text-xs bg-background text-foreground outline-none focus:border-primary" />
                      </div>
                      <div className="flex gap-1 mt-1">
                        {["Visa", "Mastercard", "Verve"].map((b) => (
                          <span key={b} className="text-[9px] bg-background px-1.5 py-0.5 rounded text-muted-foreground border border-border">{b}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bank transfer */}
                  {payMethod === "bank" && (
                    <div className="mb-3">
                      <p className="text-[11px] text-muted-foreground mb-2">Select your bank for escrow authorization</p>
                      <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                        {banks.map((b) => (
                          <button key={b.code} onClick={() => setSelectedBank(b.code)} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-left transition-all ${selectedBank === b.code ? "border-primary bg-primary-light" : "border-border bg-background hover:border-primary/40"}`}>
                            <span>{b.icon}</span>
                            <span className="text-[11px] font-medium text-foreground">{b.name}</span>
                          </button>
                        ))}
                      </div>
                      {selectedBank && (
                        <div className="bg-background rounded-lg p-3 border border-border">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5">Escrow hold account</p>
                          {[
                            { l: "Bank", v: banks.find((b) => b.code === selectedBank)?.name },
                            { l: "Account", v: "8012345678" },
                            { l: "Name", v: "RoadAssist NG Escrow" },
                            { l: "Hold Amount", v: `₦${amount.toLocaleString()}` },
                          ].map((r) => (
                            <div key={r.l} className="flex justify-between text-xs py-1">
                              <span className="text-muted-foreground">{r.l}</span>
                              <span className="font-medium text-foreground">{r.v}</span>
                            </div>
                          ))}
                          <div className="mt-2 p-1.5 bg-accent-light rounded flex items-center gap-1.5">
                            <span className="text-[10px]">🛡️</span>
                            <p className="text-[9px] text-accent font-medium">Funds held until you confirm service completion.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* USSD */}
                  {payMethod === "ussd" && (
                    <div className="mb-3">
                      <p className="text-[11px] text-muted-foreground mb-2">Authorize escrow hold via USSD</p>
                      <div className="space-y-1.5 mb-2.5">
                        {ussdCodes.map((u) => (
                          <button key={u.bank} onClick={() => setSelectedUssd(u.bank)} className={`w-full flex items-center justify-between p-2.5 rounded-lg border cursor-pointer text-left transition-all ${selectedUssd === u.bank ? "border-primary bg-primary-light" : "border-border bg-background hover:border-primary/40"}`}>
                            <div>
                              <span className="text-[11px] font-semibold text-foreground">{u.bank}</span>
                              <p className="text-[10px] font-mono text-muted-foreground">{u.code}</p>
                            </div>
                            <span>📱</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cash */}
                  {payMethod === "cash" && (
                    <div className="mb-3 bg-accent-light rounded-lg p-3 text-center">
                      <span className="text-2xl block mb-2">💵</span>
                      <p className="text-xs font-semibold text-foreground mb-1">Cash Payment</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        You'll pay ₦{amount.toLocaleString()} directly to the provider after service is confirmed complete. No escrow hold needed.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 mb-2.5">
                    <span className="text-[9px] text-muted-foreground">🔒 SSL</span>
                    <span className="text-[9px] text-muted-foreground">🛡️ Escrow Protected</span>
                    <span className="text-[9px] text-muted-foreground">✅ CBN Licensed</span>
                  </div>

                  <button
                    onClick={handleAuthorizeHold}
                    disabled={!canHoldProceed()}
                    className="w-full py-3 rounded-lg border-none bg-primary text-primary-foreground text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {payMethod === "cash" ? "Proceed without hold →" : `Authorize ₦${amount.toLocaleString()} hold →`}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Step 4: Service Tracking */}
          {step === 4 && (
            <div className="animate-fade-in">
              <div className="bg-primary-light rounded-lg p-3 mb-3 flex items-center gap-2.5">
                <span className="text-[10px]">🔒</span>
                <p className="text-[10px] text-primary font-medium">
                  ₦{amount.toLocaleString()} held in escrow · Ref: <span className="font-mono">{txnRef}</span>
                </p>
              </div>

              <ProviderMini />

              {/* Progress tracker */}
              <div className="bg-background rounded-lg p-4 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-foreground">Service Progress</h3>
                  <span className="text-[10px] font-mono text-muted-foreground">{servicePhaseData[servicePhase].progress}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-border rounded-full mb-4 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-1000"
                    style={{ width: `${servicePhaseData[servicePhase].progress}%` }}
                  />
                </div>

                {/* Phase steps */}
                <div className="space-y-3">
                  {(["en_route", "arrived", "in_progress", "completed"] as ServicePhase[]).map((phase) => {
                    const phaseOrder = ["en_route", "arrived", "in_progress", "completed"];
                    const currentIdx = phaseOrder.indexOf(servicePhase);
                    const phaseIdx = phaseOrder.indexOf(phase);
                    const isDone = phaseIdx < currentIdx;
                    const isCurrent = phase === servicePhase;

                    return (
                      <div key={phase} className={`flex items-center gap-3 ${isCurrent ? "opacity-100" : isDone ? "opacity-60" : "opacity-30"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                          isDone ? "bg-primary-light" : isCurrent ? "bg-primary-light ring-2 ring-primary" : "bg-border"
                        }`}>
                          {isDone ? "✅" : servicePhaseData[phase].icon}
                        </div>
                        <div>
                          <p className={`text-xs font-semibold ${isCurrent ? "text-primary" : "text-foreground"}`}>
                            {servicePhaseData[phase].title}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{servicePhaseData[phase].desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {servicePhase === "completed" ? (
                <button onClick={next} className="w-full py-3 rounded-lg border-none bg-primary text-primary-foreground text-sm font-bold cursor-pointer">
                  Service done — confirm & release payment →
                </button>
              ) : (
                <div className="bg-accent-light rounded-lg p-2.5 text-center">
                  <p className="text-[10px] text-accent font-medium">⏳ Waiting for service to complete before payment can be released...</p>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Confirm & Pay (Release Escrow) */}
          {step === 5 && (
            <div className="animate-fade-in">
              {releaseStatus === "idle" && !disputeOpen && (
                <>
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">🔍</div>
                    <h3 className="text-sm font-bold text-foreground mb-1">Confirm Service Completion</h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Please verify that {provider.name} has completed the service to your satisfaction before releasing payment.
                    </p>
                  </div>

                  <ProviderMini />

                  <div className="border border-border rounded-lg overflow-hidden mb-3">
                    {quoteItems.map((item, i) => (
                      <div key={i} className="flex justify-between p-2 px-3 text-xs border-b border-border last:border-b-0">
                        <span className="text-muted-foreground">{item.l}</span>
                        <span className="font-medium text-foreground">₦{item.v.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between p-2 px-3 text-xs font-semibold bg-primary-light text-primary">
                      <span>Total to release</span>
                      <span>₦{TOTAL_AMOUNT.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="bg-accent-light rounded-lg p-2.5 mb-3 flex items-start gap-2">
                    <span className="text-sm">⚠️</span>
                    <p className="text-[10px] text-accent leading-relaxed font-medium">
                      Once you confirm, ₦{amount.toLocaleString()} will be released from escrow to the provider. This action cannot be undone.
                    </p>
                  </div>

                  <button
                    onClick={handleConfirmRelease}
                    className="w-full py-3 rounded-lg border-none bg-primary text-primary-foreground text-sm font-bold cursor-pointer mb-2"
                  >
                    ✅ I'm satisfied — release ₦{amount.toLocaleString()}
                  </button>
                  <button
                    onClick={() => setDisputeOpen(true)}
                    className="w-full py-2.5 rounded-lg border border-destructive bg-card text-destructive text-xs font-medium cursor-pointer"
                  >
                    ⚠️ I have an issue — raise dispute
                  </button>
                </>
              )}

              {disputeOpen && (
                <div className="py-4">
                  <div className="text-center mb-3">
                    <div className="text-3xl mb-2">⚠️</div>
                    <h3 className="text-sm font-bold text-destructive mb-1">Raise a Dispute</h3>
                    <p className="text-[11px] text-muted-foreground">Your escrow funds are safe. Our support team will review and mediate.</p>
                  </div>
                  <div className="mb-3">
                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Describe the issue</label>
                    <textarea className="w-full py-2 px-3 border border-border rounded-md text-xs bg-card text-foreground outline-none focus:border-destructive resize-none h-20" placeholder="e.g., Service was incomplete, provider left early..." />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setDisputeOpen(false)} className="flex-1 py-2.5 rounded-lg border border-border bg-card text-foreground text-xs font-medium cursor-pointer">
                      ← Go back
                    </button>
                    <button onClick={() => { setDisputeOpen(false); }} className="flex-1 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold border-none cursor-pointer">
                      Submit dispute
                    </button>
                  </div>
                </div>
              )}

              {releaseStatus === "releasing" && (
                <div className="py-8 text-center">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-primary-light flex items-center justify-center">
                    <div className="w-7 h-7 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-1">Releasing Payment</h3>
                  <p className="text-[11px] text-muted-foreground">Transferring ₦{amount.toLocaleString()} from escrow to {provider.name}...</p>
                </div>
              )}

              {releaseStatus === "released" && !showReceipt && (
                <div className="text-center py-4">
                  <div className="text-5xl mb-3">✅</div>
                  <h3 className="text-base font-bold text-primary mb-1">Payment Released!</h3>
                  <p className="text-xs text-muted-foreground mb-1">₦{amount.toLocaleString()} has been released to {provider.name}.</p>
                  <p className="text-[10px] font-mono text-muted-foreground mb-4">{txnRef}</p>
                  <div className="flex gap-2 mb-3">
                    <button onClick={() => setShowReceipt(true)} className="flex-1 py-2.5 rounded-lg border border-border bg-card text-foreground text-xs font-medium cursor-pointer">
                      🧾 View Receipt
                    </button>
                    <button onClick={next} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold border-none cursor-pointer">
                      Rate provider →
                    </button>
                  </div>
                </div>
              )}

              {releaseStatus === "released" && showReceipt && (
                <div className="animate-fade-in">
                  <Receipt />
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setShowReceipt(false)} className="flex-1 py-2.5 rounded-lg border border-border bg-card text-foreground text-xs font-medium cursor-pointer">
                      ← Back
                    </button>
                    <button onClick={next} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold border-none cursor-pointer">
                      Rate provider →
                    </button>
                  </div>
                </div>
              )}

              {releaseStatus === "failed" && (
                <div className="text-center py-4">
                  <div className="text-5xl mb-3">❌</div>
                  <h3 className="text-base font-bold text-destructive mb-1">Release Failed</h3>
                  <p className="text-xs text-muted-foreground mb-3">Could not release funds. Please try again.</p>
                  <button onClick={() => setReleaseStatus("idle")} className="w-full py-2.5 rounded-lg border border-border bg-card text-foreground text-xs font-medium cursor-pointer">
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 6: Review */}
          {step === 6 && (
            <div className="animate-fade-in">
              <div className="text-center text-[44px] my-2">🎉</div>
              <div className="text-center text-base font-bold text-primary mb-1.5">Service Complete & Paid!</div>
              <p className="text-center text-[10px] font-mono text-muted-foreground mb-1">{txnRef}</p>
              <p className="text-center text-xs text-muted-foreground leading-relaxed mb-3">
                Your receipt has been sent via SMS. Now rate your experience with {provider.name}.
              </p>

              <div className="flex gap-1.5 justify-center my-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setRating(s)}
                    className={`text-[28px] cursor-pointer transition-transform hover:scale-110 bg-transparent border-none ${
                      s <= rating ? "grayscale-0" : "grayscale"
                    }`}
                    style={{ color: s <= rating ? "#EF9F27" : "#D3D1C7" }}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p className="text-center text-[13px] font-semibold text-foreground mb-2.5">
                {rating === 0 ? "Tap a star to rate" : `${rating} star${rating > 1 ? "s" : ""}`}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-3 justify-center">
                {["Fast arrival", "Professional", "Fair pricing", "Friendly", "Well equipped", "Great communication"].map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTag(t)}
                    className={`px-3 py-1 rounded-full text-[11px] border cursor-pointer transition-all ${
                      selectedTags.includes(t)
                        ? "bg-primary-light border-primary-mid text-primary"
                        : "bg-card border-border text-muted-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="mb-3">
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Leave a comment (optional)</label>
                <textarea className="w-full py-2 px-3 border border-border rounded-md text-xs bg-card text-foreground outline-none focus:border-primary-mid resize-none h-16" />
              </div>

              <button onClick={() => { clearBooking(); onClose(); }} className="w-full py-3 rounded-lg border-none bg-primary text-primary-foreground text-sm font-bold cursor-pointer">
                Submit review →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowModal;
