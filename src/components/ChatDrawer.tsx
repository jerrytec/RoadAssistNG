import { useState } from "react";
import { Phone, History, X } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import CallDialog, { CallButton } from "@/components/CallDialog";
import CallDetailsDrawer from "@/components/CallDetailsDrawer";
import { useAuth } from "@/hooks/useAuth";
import { getCallHistory, formatDuration, type CallRecord, type CallStatus } from "@/lib/callHistory";

interface Props {
  open: boolean;
  onClose: () => void;
  threadType: "request" | "order";
  threadId: string;
  title?: string;
}

// U+1F4DE = legacy "telephone receiver" emoji once used as a chat-call marker.
const LEGACY_CALL_GLYPH = String.fromCodePoint(0x1f4de);
const CALL_PREFIXES = ["Call · ", "Missed call", "Call declined", "Call failed"];
const isCallMessage = (body: string) =>
  body.startsWith(LEGACY_CALL_GLYPH) || CALL_PREFIXES.some((p) => body.startsWith(p));
const stripLegacyCallGlyph = (body: string) =>
  body.startsWith(LEGACY_CALL_GLYPH) ? body.slice(LEGACY_CALL_GLYPH.length).trimStart() : body;

const statusLabel = (s: CallStatus, dur: number) => {
  if (s === "completed") return `Call · ${formatDuration(dur)}`;
  if (s === "missed") return "Missed call";
  if (s === "declined") return "Call declined";
  return "Call failed";
};

const ChatDrawer = ({ open, onClose, threadType, threadId, title }: Props) => {
  const { user } = useAuth();
  const { messages, send, sending } = useChat(open ? threadType : null, open ? threadId : undefined);
  const [text, setText] = useState("");
  const [callOpen, setCallOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyTick, setHistoryTick] = useState(0);
  const [detailsCall, setDetailsCall] = useState<CallRecord | null>(null);

  if (!open) return null;

  const history = getCallHistory(threadId);

  const handleSend = async () => {
    if (!text.trim()) return;
    const body = text.trim();
    setText("");
    try { await send(body); } catch { setText(body); }
  };

  const handleCallEnded = async (info: { status: CallStatus; durationSec: number }) => {
    setHistoryTick((t) => t + 1);
    try { await send(statusLabel(info.status, info.durationSec)); } catch { /* ignore */ }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center" onClick={onClose}>
      <div className="w-full max-w-[700px] relative">
        <div className="absolute inset-0 bg-foreground/30" />
        <div className="absolute right-0 top-0 h-full w-full max-w-[420px] bg-card flex flex-col" onClick={(e) => e.stopPropagation()}>
          <header className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold truncate">{title ?? "Chat"}</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory((v) => !v)}
                className={`p-2 rounded-md text-xs ${showHistory ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
                aria-label="Call history"
                title="Call history"
              >
                <History className="w-3.5 h-3.5" />
              </button>
              <CallButton onClick={() => setCallOpen(true)} />
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Close"><X className="w-4 h-4" /></button>
            </div>
          </header>
          <CallDialog
            open={callOpen}
            onClose={() => setCallOpen(false)}
            peerName={title ?? "Contact"}
            threadId={threadId}
            onEnded={handleCallEnded}
          />
          <CallDetailsDrawer
            call={detailsCall}
            onClose={() => setDetailsCall(null)}
            onCallBack={() => { setDetailsCall(null); setCallOpen(true); }}
          />

          {showHistory && (
            <div className="border-b border-border bg-muted/40 px-3 py-2 max-h-40 overflow-y-auto" key={historyTick}>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Call history</p>
              {history.length === 0 ? (
                <p className="text-[11px] text-muted-foreground py-2">No calls yet for this thread.</p>
              ) : history.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setDetailsCall(c)}
                  className="w-full flex items-center justify-between text-[11px] py-1 hover:bg-card/60 rounded px-1 text-left"
                >
                  <span className="flex items-center gap-1.5">
                    <Phone className={`w-3 h-3 ${c.status === "completed" ? "text-success" : c.status === "missed" ? "text-warning" : "text-destructive"}`} />
                    <span className="font-semibold">{statusLabel(c.status, c.durationSec)}</span>
                  </span>
                  <span className="text-muted-foreground">{new Date(c.startedAt).toLocaleString([], { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {messages.length === 0 && (
              <p className="text-center text-[11px] text-muted-foreground py-10">No messages yet. Say hi 👋</p>
            )}
            {messages.map((m) => {
              const me = m.sender_id === user?.id;
              const isCall = isCallMessage(m.body);
              const body = isCall ? m.body.replace(/^📞\s*/, "") : m.body;
              return (
                <div
                  key={m.id}
                  className={`max-w-[78%] px-3 py-2 rounded-2xl text-[12px] ${
                    isCall
                      ? "self-center bg-success/15 text-foreground text-center italic"
                      : me
                        ? "self-end bg-primary text-primary-foreground rounded-br-md"
                        : "self-start bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5 justify-center">
                    {isCall && <Phone className="w-3 h-3" aria-hidden="true" />}
                    {body}
                  </span>
                  <div className={`text-[9px] mt-0.5 ${isCall ? "text-muted-foreground" : me ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              );
            })}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="border-t border-border p-2 flex gap-2"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 py-2 px-3 border border-border rounded-full text-xs bg-background outline-none focus:border-primary"
            />
            <button type="submit" disabled={sending || !text.trim()} className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50">
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatDrawer;
