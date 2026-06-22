import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { Wallet, Route, MessageCircle, Package, Bell, BellOff, X, ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const KIND_ICON: Record<string, LucideIcon> = {
  "offer.new":       Wallet,
  "request.status":  Route,
  "chat.new":        MessageCircle,
  "order.status":    Package,
};

const NotificationsPanel = ({ open, onClose }: Props) => {
  const navigate = useNavigate();
  const {
    items, unread, loading, markAllRead, markRead,
    page, totalPages, total, setPage, hasPrev, hasNext,
    filter, setFilter,
  } = useNotifications({ markReadOnOpen: open });

  if (!open) return null;

  const handleClick = (n: { id: string; link: string | null }) => {
    markRead(n.id);
    if (n.link) {
      onClose();
      navigate(n.link);
    }
  };

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.round(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} hr ago`;
    const d = Math.round(h / 24);
    return `${d} day${d > 1 ? "s" : ""} ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center" onClick={onClose}>
      <div className="w-full max-w-[700px] relative">
        <div className="absolute inset-0 bg-foreground/30" />
        <div
          className="absolute top-0 right-0 w-full max-w-[380px] h-full bg-card shadow-xl animate-slide-up overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-[15px] font-semibold flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-primary" aria-hidden="true" />
                Notifications
              </h2>
              {unread > 0 && <span className="text-[10px] text-muted-foreground">{unread} unread</span>}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-[11px] text-primary font-medium hover:underline">
                  Mark all read
                </button>
              )}
              <button onClick={onClose} aria-label="Close" className="w-7 h-7 rounded-full bg-background flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="px-3 pt-3 flex items-center gap-1.5">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  filter === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {f === "all" ? "All" : `Unread${unread > 0 ? ` (${unread})` : ""}`}
              </button>
            ))}
          </div>

          <div className="p-3">
            {loading && <p className="text-center text-xs text-muted-foreground py-10">Loading…</p>}
            {!loading && items.length === 0 && (
              <div className="text-center py-12">
                <BellOff className="w-8 h-8 mx-auto mb-2 text-muted-foreground" aria-hidden="true" />
                <p className="text-xs text-muted-foreground">No notifications yet.</p>
              </div>
            )}
            {items.map((n) => {
              const KindIcon = KIND_ICON[n.kind] ?? Bell;
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left bg-card border border-border rounded-lg rounded-l-none border-l-[3px] border-l-primary p-3 mb-2 transition-all hover:shadow-sm ${
                    !n.read_at ? "bg-background" : ""
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="shrink-0 w-8 h-8 rounded-md bg-primary-light text-primary flex items-center justify-center">
                      <KindIcon className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold">{n.title}</span>
                        {!n.read_at && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      {n.body && <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>}
                      <span className="text-[10px] text-muted-foreground mt-1 block">{formatTime(n.created_at)}</span>
                    </div>
                  </div>
                </button>
              );
            })}

            {!loading && total > 0 && (
              <div className="flex items-center justify-between mt-3 px-1">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={!hasPrev}
                  className="text-[11px] px-2.5 py-1 rounded-md border border-border bg-background disabled:opacity-40 inline-flex items-center gap-1 hover:border-primary/40 transition-colors"
                >
                  <ChevronLeft className="w-3 h-3" /> Prev
                </button>
                <span className="text-[10px] text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!hasNext}
                  className="text-[11px] px-2.5 py-1 rounded-md border border-border bg-background disabled:opacity-40 inline-flex items-center gap-1 hover:border-primary/40 transition-colors"
                >
                  Next <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPanel;
