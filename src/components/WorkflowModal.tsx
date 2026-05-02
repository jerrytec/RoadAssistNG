import { useState } from "react";
import type { Provider } from "@/components/ProviderCard";

const steps = ["Book", "Quote", "Chat", "Pay", "Review"];

type PayMethod = "card" | "bank" | "ussd" | "cash";
type PaySubStep = "select" | "details" | "processing";

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

interface Props {
  provider: Provider;
  onClose: () => void;
}

const avatarColors: Record<string, string> = {
  info: "bg-info-light",
  accent: "bg-accent-light",
  secondary: "bg-secondary-light",
};

const WorkflowModal = ({ provider, onClose }: Props) => {
  const [step, setStep] = useState(0);
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { me: false, text: "Hi! I've seen your request. I'm at Awolowo Way in about 7 minutes. Please stay with your vehicle.", time: "2:14 PM" },
    { me: true, text: "Thank you! I'm at the bus stop junction. I have a white Toyota Camry.", time: "2:15 PM" },
    { me: false, text: "Perfect, I can see you on the map. On my way now!", time: "2:15 PM" },
  ]);

  // Payment state
  const [payMethod, setPayMethod] = useState<PayMethod>("card");
  const [paySubStep, setPaySubStep] = useState<PaySubStep>("select");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedUssd, setSelectedUssd] = useState("");
  const amount = 12128;

  const next = () => setStep((s) => Math.min(s + 1, 4));

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

  const canPayProceed = () => {
    if (payMethod === "card") return cardNumber.replace(/\s/g, "").length === 16 && expiry.length === 5 && cvv.length >= 3 && cardName.length > 1;
    if (payMethod === "bank") return selectedBank !== "";
    if (payMethod === "ussd") return selectedUssd !== "";
    if (payMethod === "cash") return true;
    return false;
  };

  const handlePayConfirm = () => {
    if (payMethod === "cash") {
      next();
      return;
    }
    setPaySubStep("processing");
    setTimeout(() => {
      setPaySubStep("select");
      next();
    }, 2500);
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

  return (
    <div className="bg-foreground/40 min-h-[500px] flex items-start justify-center p-5 rounded-lg mb-3">
      <div className="bg-card rounded-xl w-full max-w-[420px] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-primary px-4 py-3.5 flex items-center justify-between">
          <span className="text-primary-foreground text-sm font-bold">Book {provider.name}</span>
          <button onClick={onClose} className="bg-white/20 border-none text-primary-foreground w-[26px] h-[26px] rounded-full cursor-pointer text-sm flex items-center justify-center">
            ✕
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex px-4 py-3 border-b border-border">
          {steps.map((s, i) => (
            <div key={s} className="flex-1 text-center relative">
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
              <span className={`text-[9px] font-medium ${i === step ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                {s}
              </span>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Book */}
          {step === 0 && (
            <div className="animate-fade-in">
              <ProviderMini />
              {["Your name", "Phone number", "Location / landmark", "Vehicle & problem description"].map((label) => (
                <div key={label} className="mb-2.5">
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">{label}</label>
                  {label === "Vehicle & problem description" ? (
                    <textarea className="w-full py-2 px-3 border border-border rounded-md text-xs bg-card text-foreground outline-none focus:border-primary-mid resize-none h-16" />
                  ) : (
                    <input className="w-full py-2 px-3 border border-border rounded-md text-xs bg-card text-foreground outline-none focus:border-primary-mid" />
                  )}
                </div>
              ))}
              <button onClick={next} className="w-full py-3 rounded-lg border-none bg-primary text-primary-foreground text-sm font-bold cursor-pointer">
                Request service →
              </button>
            </div>
          )}

          {/* Step 2: Quote */}
          {step === 1 && (
            <div className="animate-fade-in">
              <p className="text-[11px] text-muted-foreground mb-3">Provider has reviewed your request and sent a quote.</p>
              <ProviderMini />
              <div className="border border-border rounded-lg overflow-hidden mb-3">
                {[
                  { l: "Call-out fee", v: "₦2,000" },
                  { l: "Service charge", v: "₦8,500" },
                  { l: "Distance surcharge (2.1 km)", v: "₦1,050" },
                  { l: "Platform fee (5%)", v: "₦578" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between p-2.5 px-3 text-xs border-b border-border last:border-b-0">
                    <span className="text-muted-foreground">{item.l}</span>
                    <span className="font-medium text-foreground">{item.v}</span>
                  </div>
                ))}
                <div className="flex justify-between p-2.5 px-3 text-xs font-semibold bg-primary-light text-primary">
                  <span>Total estimate</span>
                  <span>₦12,128</span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                Final price may vary based on actual work done. You won't be charged until service is complete.
              </p>
              <div className="flex gap-2">
                <button onClick={next} className="flex-1 py-2 rounded-md border border-border bg-card text-muted-foreground text-xs font-medium cursor-pointer">
                  💬 Chat & negotiate
                </button>
                <button onClick={next} className="flex-1 py-2 rounded-md border-none bg-primary-mid text-primary-foreground text-xs font-semibold cursor-pointer">
                  Accept quote →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Chat */}
          {step === 2 && (
            <div className="animate-fade-in">
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
              <button onClick={next} className="w-full py-2.5 rounded-md border-none bg-secondary text-secondary-foreground text-xs font-semibold cursor-pointer">
                Service complete — proceed to payment →
              </button>
            </div>
          )}

          {/* Step 4: Pay — Full Payment Gateway */}
          {step === 3 && (
            <div className="animate-fade-in">
              {/* Processing overlay */}
              {paySubStep === "processing" ? (
                <div className="py-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-primary-light flex items-center justify-center">
                    <div className="w-7 h-7 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-1">Processing Payment</h3>
                  <p className="text-[11px] text-muted-foreground mb-3">Please do not close this window...</p>
                  <div className="bg-background rounded-lg p-2.5 text-left">
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-semibold text-foreground">₦{amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-muted-foreground">Method</span>
                      <span className="font-medium text-foreground capitalize">{payMethod === "ussd" ? "USSD" : payMethod === "bank" ? "Bank Transfer" : "Card"}</span>
                    </div>
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-muted-foreground">Ref</span>
                      <span className="font-mono text-foreground text-[10px]">RA-{Date.now().toString(36).toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Amount + method selector */}
                  <div className="bg-primary-light rounded-lg p-3 flex justify-between items-center mb-3">
                    <div>
                      <div className="text-xs text-primary font-medium">Amount due</div>
                      <div className="text-[10px] text-muted-foreground">After service</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-primary font-medium">🔒</span>
                      <div className="text-lg font-bold text-primary">₦{amount.toLocaleString()}</div>
                    </div>
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
                        <input
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCard(e.target.value))}
                          placeholder="0000 0000 0000 0000"
                          className="w-full py-2 px-3 border border-border rounded-md text-xs bg-background text-foreground outline-none focus:border-primary font-mono"
                          maxLength={19}
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Expiry</label>
                          <input
                            value={expiry}
                            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                            placeholder="MM/YY"
                            className="w-full py-2 px-3 border border-border rounded-md text-xs bg-background text-foreground outline-none focus:border-primary font-mono"
                            maxLength={5}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">CVV</label>
                          <input
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            placeholder="***"
                            type="password"
                            className="w-full py-2 px-3 border border-border rounded-md text-xs bg-background text-foreground outline-none focus:border-primary font-mono"
                            maxLength={4}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Cardholder Name</label>
                        <input
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="As shown on card"
                          className="w-full py-2 px-3 border border-border rounded-md text-xs bg-background text-foreground outline-none focus:border-primary"
                        />
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
                      <p className="text-[11px] text-muted-foreground mb-2">Select your bank to generate a transfer account</p>
                      <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                        {banks.map((b) => (
                          <button
                            key={b.code}
                            onClick={() => setSelectedBank(b.code)}
                            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-left transition-all ${
                              selectedBank === b.code
                                ? "border-primary bg-primary-light"
                                : "border-border bg-background hover:border-primary/40"
                            }`}
                          >
                            <span>{b.icon}</span>
                            <span className="text-[11px] font-medium text-foreground">{b.name}</span>
                          </button>
                        ))}
                      </div>
                      {selectedBank && (
                        <div className="bg-background rounded-lg p-3 border border-border">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium mb-1.5">Transfer to</p>
                          {[
                            { l: "Bank", v: banks.find((b) => b.code === selectedBank)?.name },
                            { l: "Account", v: "8012345678" },
                            { l: "Name", v: "RoadAssist NG / Paystack" },
                            { l: "Amount", v: `₦${amount.toLocaleString()}` },
                          ].map((r) => (
                            <div key={r.l} className="flex justify-between text-xs py-1">
                              <span className="text-muted-foreground">{r.l}</span>
                              <span className="font-medium text-foreground">{r.v}</span>
                            </div>
                          ))}
                          <div className="mt-2 p-1.5 bg-accent-light rounded flex items-center gap-1.5">
                            <span className="text-[10px]">⏳</span>
                            <p className="text-[9px] text-accent font-medium">Expires in 30 min. Transfer exact amount.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* USSD */}
                  {payMethod === "ussd" && (
                    <div className="mb-3">
                      <p className="text-[11px] text-muted-foreground mb-2">Dial from your registered phone number</p>
                      <div className="space-y-1.5 mb-2.5">
                        {ussdCodes.map((u) => (
                          <button
                            key={u.bank}
                            onClick={() => setSelectedUssd(u.bank)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-lg border cursor-pointer text-left transition-all ${
                              selectedUssd === u.bank
                                ? "border-primary bg-primary-light"
                                : "border-border bg-background hover:border-primary/40"
                            }`}
                          >
                            <div>
                              <span className="text-[11px] font-semibold text-foreground">{u.bank}</span>
                              <p className="text-[10px] font-mono text-muted-foreground">{u.code}</p>
                            </div>
                            <span>📱</span>
                          </button>
                        ))}
                      </div>
                      {selectedUssd && (
                        <div className="bg-secondary-light rounded-lg p-2.5">
                          <p className="text-[11px] font-semibold text-secondary mb-1">How to pay:</p>
                          <ol className="text-[10px] text-muted-foreground space-y-0.5 list-decimal pl-3.5">
                            <li>Dial <span className="font-mono font-semibold text-foreground">{ussdCodes.find((u) => u.bank === selectedUssd)?.code}</span></li>
                            <li>Follow prompts & enter PIN</li>
                            <li>Click confirm below after completion</li>
                          </ol>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cash */}
                  {payMethod === "cash" && (
                    <div className="mb-3 bg-accent-light rounded-lg p-3 text-center">
                      <span className="text-2xl block mb-2">💵</span>
                      <p className="text-xs font-semibold text-foreground mb-1">Cash Payment</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Pay ₦{amount.toLocaleString()} directly to the provider after service is complete. Please have the exact amount ready.
                      </p>
                    </div>
                  )}

                  {/* Security badges */}
                  <div className="flex items-center justify-center gap-2 mb-2.5">
                    <span className="text-[9px] text-muted-foreground">🔒 SSL</span>
                    <span className="text-[9px] text-muted-foreground">🛡️ PCI DSS</span>
                    <span className="text-[9px] text-muted-foreground">✅ CBN Licensed</span>
                  </div>

                  <button
                    onClick={handlePayConfirm}
                    disabled={!canPayProceed()}
                    className="w-full py-3 rounded-lg border-none bg-primary text-primary-foreground text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {payMethod === "cash" ? "Confirm cash payment →" : payMethod === "bank" ? "I've sent the money →" : payMethod === "ussd" ? "I've completed payment →" : `Pay ₦${amount.toLocaleString()} →`}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Step 5: Review */}
          {step === 4 && (
            <div className="animate-fade-in">
              <div className="text-center text-[44px] my-2">🎉</div>
              <div className="text-center text-base font-bold text-primary mb-1.5">Payment confirmed!</div>
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

              <button onClick={onClose} className="w-full py-3 rounded-lg border-none bg-primary text-primary-foreground text-sm font-bold cursor-pointer">
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
