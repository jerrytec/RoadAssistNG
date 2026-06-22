import { useState } from "react";
import { Phone, MessageCircle, Mail, Smartphone, ArrowLeft, ArrowRight, X, CheckCircle2, type LucideIcon } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Channel = "phone" | "chat" | "email";

const channels: { id: Channel; Icon: LucideIcon; label: string; desc: string; color: string }[] = [
  { id: "phone", Icon: Phone,         label: "Phone Support", desc: "Talk to an agent now",     color: "bg-primary-light text-primary" },
  { id: "chat",  Icon: MessageCircle, label: "Live Chat",     desc: "Average wait: ~2 min",     color: "bg-secondary-light text-secondary" },
  { id: "email", Icon: Mail,          label: "Email Support", desc: "Response within 24 hrs",   color: "bg-accent-light text-accent" },
];

const channelMeta = (id: Channel | null) => channels.find((c) => c.id === id);

const ContactSupportPanel = ({ open, onClose }: Props) => {
  const [selected, setSelected] = useState<Channel | null>(null);
  const [chatMessages, setChatMessages] = useState([
    { me: false, text: "Hi! Welcome to RoadAssist NG support. How can I help you today?", time: "Now" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [emailForm, setEmailForm] = useState({ subject: "", message: "" });
  const [emailSent, setEmailSent] = useState(false);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [...prev, { me: true, text: chatInput.trim(), time: "Now" }]);
    setChatInput("");
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { me: false, text: "Thank you for reaching out. A support agent will be with you shortly. Your ticket ID is #RA-" + Math.random().toString(36).slice(2, 8).toUpperCase(), time: "Now" },
      ]);
    }, 1500);
  };

  const sendEmail = () => {
    if (!emailForm.subject.trim() || !emailForm.message.trim()) return;
    setEmailSent(true);
  };

  const handleBack = () => {
    setSelected(null);
    setEmailSent(false);
  };

  if (!open) return null;

  const SelectedIcon = channelMeta(selected)?.Icon;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="relative bg-card rounded-t-2xl sm:rounded-2xl w-full max-w-[420px] max-h-[80vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between z-10 rounded-t-2xl">
          <div className="flex items-center gap-2">
            {selected && (
              <button onClick={handleBack} aria-label="Back" className="text-muted-foreground hover:text-foreground bg-transparent border-none cursor-pointer transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              {SelectedIcon && <SelectedIcon className="w-4 h-4 text-primary" aria-hidden="true" />}
              {selected === "phone" ? "Phone Support" : selected === "chat" ? "Live Chat" : selected === "email" ? "Email Support" : "Contact Support"}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground cursor-pointer transition-colors hover:text-foreground hover:border-foreground/40">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4">
          {/* Channel selection */}
          {!selected && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">Choose your preferred support channel:</p>
              {channels.map((ch) => {
                const ChIcon = ch.Icon;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setSelected(ch.id)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border bg-background hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer transition-all duration-200 text-left group"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${ch.color}`}>
                      <ChIcon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-foreground">{ch.label}</div>
                      <div className="text-[11px] text-muted-foreground">{ch.desc}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </button>
                );
              })}
              <div className="mt-4 p-3 bg-background rounded-lg border border-border">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">Operating hours:</span> Mon–Sat, 7:00 AM – 10:00 PM WAT. Emergency roadside support available 24/7.
                </p>
              </div>
            </div>
          )}

          {/* Phone support */}
          {selected === "phone" && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary-light flex items-center justify-center text-primary">
                <Phone className="w-7 h-7" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">Call Our Support Team</h3>
              <p className="text-xs text-muted-foreground mb-4">Available Mon–Sat, 7 AM – 10 PM WAT</p>
              <div className="space-y-2 mb-4">
                {[
                  { label: "General Support", number: "+234 800 ROAD HELP" },
                  { label: "Emergency Line", number: "+234 901 234 5678" },
                  { label: "WhatsApp", number: "+234 812 345 6789" },
                ].map((line) => (
                  <a
                    key={line.label}
                    href={`tel:${line.number.replace(/\s/g, "")}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-background hover:border-primary/40 hover:shadow-sm transition-all duration-200 no-underline"
                  >
                    <div className="text-left">
                      <div className="text-[11px] text-muted-foreground">{line.label}</div>
                      <div className="text-sm font-semibold text-foreground">{line.number}</div>
                    </div>
                    <Smartphone className="w-4 h-4 text-primary" aria-hidden="true" />
                  </a>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">Standard call rates apply. WhatsApp messages are free.</p>
            </div>
          )}

          {/* Live chat */}
          {selected === "chat" && (
            <div>
              <div className="bg-background rounded-lg p-2.5 mb-2.5 min-h-[180px] max-h-[280px] overflow-y-auto flex flex-col gap-2">
                {chatMessages.map((m, i) => (
                  <div
                    key={i}
                    className={`max-w-[80%] py-2 px-3 rounded-xl text-xs leading-relaxed ${
                      m.me
                        ? "self-end bg-primary text-primary-foreground rounded-br-sm"
                        : "self-start bg-card text-foreground border border-border rounded-bl-sm"
                    }`}
                  >
                    {m.text}
                    <div className="text-[9px] opacity-70 mt-0.5">{m.time}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  className="flex-1 py-2 px-3 border border-border rounded-lg text-xs outline-none bg-background text-foreground focus:border-primary"
                  placeholder="Describe your issue..."
                />
                <button onClick={sendChat} className="px-4 py-2 rounded-lg border-none bg-primary text-primary-foreground text-xs font-semibold cursor-pointer transition-opacity hover:opacity-90">
                  Send
                </button>
              </div>
            </div>
          )}

          {/* Email support */}
          {selected === "email" && !emailSent && (
            <div>
              <p className="text-xs text-muted-foreground mb-3">We'll respond within 24 hours to your registered email.</p>
              <div className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Subject</label>
                  <input
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="e.g. Billing issue, Service complaint"
                    className="w-full py-2.5 px-3 border border-border rounded-lg text-xs bg-background text-foreground outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Message</label>
                  <textarea
                    value={emailForm.message}
                    onChange={(e) => setEmailForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Describe your issue in detail..."
                    className="w-full py-2.5 px-3 border border-border rounded-lg text-xs bg-background text-foreground outline-none focus:border-primary resize-none h-24"
                  />
                </div>
              </div>
              <button
                onClick={sendEmail}
                disabled={!emailForm.subject.trim() || !emailForm.message.trim()}
                className="w-full mt-3 py-3 rounded-lg border-none bg-primary text-primary-foreground text-sm font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
              >
                Send Email <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {selected === "email" && emailSent && (
            <div className="text-center py-4">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-success" aria-hidden="true" />
              <h3 className="text-base font-bold text-foreground mb-1">Email Sent!</h3>
              <p className="text-xs text-muted-foreground mb-2">
                Your ticket ID is <span className="font-mono font-semibold text-primary">#{("RA-" + Math.random().toString(36).slice(2, 8)).toUpperCase()}</span>
              </p>
              <p className="text-[11px] text-muted-foreground">We'll respond to your registered email within 24 hours.</p>
              <button onClick={onClose} className="mt-4 px-6 py-2.5 rounded-lg border-none bg-primary text-primary-foreground text-xs font-bold cursor-pointer transition-opacity hover:opacity-90">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactSupportPanel;
