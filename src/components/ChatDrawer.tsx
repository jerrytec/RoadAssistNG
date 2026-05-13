import { useState } from "react";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  open: boolean;
  onClose: () => void;
  threadType: "request" | "order";
  threadId: string;
  title?: string;
}

const ChatDrawer = ({ open, onClose, threadType, threadId, title }: Props) => {
  const { user } = useAuth();
  const { messages, send, sending } = useChat(open ? threadType : null, open ? threadId : undefined);
  const [text, setText] = useState("");

  if (!open) return null;

  const handleSend = async () => {
    if (!text.trim()) return;
    const body = text.trim();
    setText("");
    try { await send(body); } catch { setText(body); }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center" onClick={onClose}>
      <div className="w-full max-w-[700px] relative">
        <div className="absolute inset-0 bg-foreground/30" />
        <div className="absolute right-0 top-0 h-full w-full max-w-[420px] bg-card flex flex-col" onClick={(e) => e.stopPropagation()}>
          <header className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-bold">{title ?? "Chat"}</h3>
            <button onClick={onClose} className="text-muted-foreground text-lg" aria-label="Close">✕</button>
          </header>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {messages.length === 0 && (
              <p className="text-center text-[11px] text-muted-foreground py-10">No messages yet. Say hi 👋</p>
            )}
            {messages.map((m) => {
              const me = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`max-w-[78%] px-3 py-2 rounded-2xl text-[12px] ${me ? "self-end bg-primary text-primary-foreground rounded-br-md" : "self-start bg-muted text-foreground rounded-bl-md"}`}>
                  {m.body}
                  <div className={`text-[9px] mt-0.5 ${me ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
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
