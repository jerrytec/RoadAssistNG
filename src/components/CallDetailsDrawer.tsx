import { Phone, PhoneOff, PhoneMissed, X, Mic, Clock, User, Briefcase } from "lucide-react";
import { formatDuration, type CallRecord } from "@/lib/callHistory";
import { CallButton } from "@/components/CallDialog";

interface Props {
  call: CallRecord | null;
  onClose: () => void;
  onCallBack?: () => void;
}

const statusMeta = (s: CallRecord["status"]) => {
  switch (s) {
    case "completed": return { label: "Completed", icon: Phone, color: "text-success", bg: "bg-success/15" };
    case "missed":    return { label: "Missed",    icon: PhoneMissed, color: "text-warning", bg: "bg-warning/15" };
    case "declined":  return { label: "Declined",  icon: PhoneOff, color: "text-destructive", bg: "bg-destructive/15" };
    default:          return { label: "Failed",    icon: PhoneOff, color: "text-destructive", bg: "bg-destructive/15" };
  }
};

const Row = ({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
    <Icon className="w-4 h-4 text-muted-foreground mt-0.5" />
    <div className="flex-1 min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground break-words">{value}</p>
    </div>
  </div>
);

/** Slide-up drawer showing full metadata for a single call-history entry. */
const CallDetailsDrawer = ({ call, onClose, onCallBack }: Props) => {
  if (!call) return null;
  const meta = statusMeta(call.status);
  const Icon = meta.icon;
  const started = new Date(call.startedAt);

  return (
    <div className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center bg-foreground/50 animate-fade-in" onClick={onClose}>
      <div
        className="w-full sm:w-[400px] max-w-[96vw] bg-card text-card-foreground rounded-t-2xl sm:rounded-2xl shadow-premium overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-bold">Call details</h3>
          <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className={`flex items-center gap-3 px-5 py-4 ${meta.bg}`}>
          <span className={`w-12 h-12 rounded-full bg-card flex items-center justify-center ${meta.color}`}>
            <Icon className="w-5 h-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold truncate">{call.peerName}</p>
            <p className={`text-xs font-semibold ${meta.color}`}>{meta.label}</p>
          </div>
        </div>

        <div className="px-5 py-2">
          <Row icon={User} label="Contact" value={call.peerName} />
          {call.peerRole && <Row icon={Briefcase} label="Role" value={call.peerRole} />}
          <Row
            icon={Clock}
            label="Started"
            value={started.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
          />
          <Row
            icon={Mic}
            label="Duration"
            value={call.status === "completed" ? formatDuration(call.durationSec) : "—"}
          />
          {call.threadId && (
            <Row icon={Phone} label="Thread" value={<span className="font-mono text-[11px] text-muted-foreground">{call.threadId.slice(0, 8)}…</span>} />
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border">
          <button onClick={onClose} className="px-3 py-2 rounded-md bg-muted text-xs">Close</button>
          {onCallBack && <CallButton onClick={onCallBack} label="Call back" />}
        </div>
      </div>
    </div>
  );
};

export default CallDetailsDrawer;
