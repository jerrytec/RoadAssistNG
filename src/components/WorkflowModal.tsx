import { useState } from "react";
import type { Provider } from "@/components/ProviderCard";

const steps = ["Book", "Quote", "Chat", "Pay", "Review"];

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
  const [selectedPay, setSelectedPay] = useState(0);
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { me: false, text: "Hi! I've seen your request. I'm at Awolowo Way in about 7 minutes. Please stay with your vehicle.", time: "2:14 PM" },
    { me: true, text: "Thank you! I'm at the bus stop junction. I have a white Toyota Camry.", time: "2:15 PM" },
    { me: false, text: "Perfect, I can see you on the map. On my way now!", time: "2:15 PM" },
  ]);

  const next = () => setStep((s) => Math.min(s + 1, 4));

  const toggleTag = (t: string) =>
    setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages((prev) => [...prev, { me: true, text: chatInput.trim(), time: "Now" }]);
    setChatInput("");
  };

  const ProviderMini = () => (
    <div className="flex items-center gap-2.5 p-2.5 bg-background rounded-lg mb-3">
      <div className={`w-[38px] h-[38px] rounded-lg flex items-center justify-center text-base shrink-0 ${avatarColors[provider.avatarBg]}`}>
        {provider.icon}
      </div>
      <div className="flex-1">
        <div className="text-[13px] font-semibold">{provider.name}</div>
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
        <div className="p-4">
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

          {/* Step 4: Pay */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="bg-primary-light rounded-lg p-3 flex justify-between items-center mb-3">
                <div>
                  <div className="text-xs text-primary font-medium">Amount due</div>
                  <div className="text-[10px] text-muted-foreground">Agreed total</div>
                </div>
                <div className="text-lg font-bold text-primary">₦12,128</div>
              </div>

              <p className="text-[11px] text-muted-foreground mb-2">Select payment method</p>

              <div className="flex flex-col gap-2 mb-3">
                {[
                  { icon: "🏦", label: "Bank transfer", sub: "GTB, Zenith, First Bank & more" },
                  { icon: "💳", label: "Card payment", sub: "Visa, Mastercard via Paystack" },
                  { icon: "📱", label: "USSD / mobile money", sub: "*737#, *770# and others" },
                  { icon: "💵", label: "Cash on completion", sub: "Pay provider directly" },
                ].map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedPay(i)}
                    className={`flex items-center gap-2.5 p-2.5 px-3 border rounded-lg cursor-pointer transition-colors text-left ${
                      selectedPay === i
                        ? "border-primary-mid bg-primary-light"
                        : "border-border bg-card hover:border-primary-mid"
                    }`}
                  >
                    <span className="text-lg w-[30px] text-center">{p.icon}</span>
                    <div className="flex-1">
                      <div className="text-xs font-medium">{p.label}</div>
                      <div className="text-[10px] text-muted-foreground">{p.sub}</div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center text-[9px] ${
                      selectedPay === i
                        ? "bg-primary-mid border-primary-mid text-primary-foreground"
                        : "border-border"
                    }`}>
                      {selectedPay === i && "✓"}
                    </div>
                  </button>
                ))}
              </div>

              <button onClick={next} className="w-full py-3 rounded-lg border-none bg-primary-mid text-primary-foreground text-sm font-semibold cursor-pointer">
                Confirm payment →
              </button>
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
