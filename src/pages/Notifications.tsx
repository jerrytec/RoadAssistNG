import { useNavigate } from "react-router-dom";
import PageNav from "@/components/PageNav";
import { ArrowLeft, Bell, CheckCheck } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

const Notifications = () => {
  const navigate = useNavigate();
  const { items, markAllRead, loading } = useNotifications();

  return (
    <main className="min-h-screen bg-background">
      <PageNav />
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container max-w-[720px] flex items-center gap-3 h-14">
          <button onClick={() => navigate(-1)} aria-label="Back" className="w-9 h-9 rounded-lg hover:bg-muted flex items-center justify-center"><ArrowLeft className="w-4 h-4" /></button>
          <h1 className="text-base font-semibold flex-1">Notifications</h1>
          <button onClick={markAllRead} className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline"><CheckCheck className="w-4 h-4"/>Mark all read</button>
        </div>
      </header>
      <section className="container max-w-[720px] py-5">
        {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {!loading && (!items || items.length === 0) && (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto"><Bell className="w-6 h-6 text-muted-foreground"/></div>
            <p className="text-sm text-muted-foreground mt-3">You're all caught up.</p>
          </div>
        )}
        <ul className="space-y-2">
          {items?.map((n: any) => (
            <li key={n.id} className={`bg-card border rounded-xl p-4 shadow-card ${n.read_at ? "border-border" : "border-primary/30 bg-primary/[.03]"}`}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Bell className="w-4 h-4" /></div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {n.link && <button onClick={() => navigate(n.link)} className="text-xs text-primary font-semibold">Open</button>}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
};

export default Notifications;
