import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Loader2, LogOut, Users } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "" });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle();
      if (data) setForm({ full_name: data.full_name ?? "", phone: data.phone ?? "" });
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("profiles").update({ full_name: form.full_name.trim(), phone: form.phone.trim() }).eq("id", user.id);
      if (error) throw error;
      toast.success("Profile updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save");
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container max-w-[720px] flex items-center gap-3 h-14">
          <button onClick={() => navigate(-1)} aria-label="Back" className="w-9 h-9 rounded-lg hover:bg-muted flex items-center justify-center"><ArrowLeft className="w-4 h-4" /></button>
          <h1 className="text-base font-semibold">Profile & settings</h1>
        </div>
      </header>
      <section className="container max-w-[720px] py-6 space-y-5">
        <div className="bg-card border border-border rounded-xl p-5 shadow-card">
          <h2 className="text-sm font-semibold mb-4">Account</h2>
          {loading ? (
            <div className="space-y-3">
              <div className="h-11 bg-muted animate-pulse rounded-lg" />
              <div className="h-11 bg-muted animate-pulse rounded-lg" />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <label className="text-xs text-muted-foreground">Email
                <input value={user.email ?? ""} disabled className="mt-1 w-full h-11 px-4 border border-border rounded-lg text-sm bg-muted text-muted-foreground" />
              </label>
              <label className="text-xs text-muted-foreground">Full name
                <input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className="mt-1 w-full h-11 px-4 border border-border rounded-lg text-sm bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
              </label>
              <label className="text-xs text-muted-foreground">Phone
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="mt-1 w-full h-11 px-4 border border-border rounded-lg text-sm bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
              </label>
              <button onClick={save} disabled={busy} className="h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2">
                {busy && <Loader2 className="w-4 h-4 animate-spin" />} Save changes
              </button>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-card">
          <h2 className="text-sm font-semibold mb-3">Safety</h2>
          <button onClick={() => navigate("/profile/trusted-contacts")} className="h-10 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted flex items-center gap-2">
            <Users className="w-4 h-4" /> Manage trusted contacts
          </button>
          <p className="text-[11px] text-muted-foreground mt-2">Notified instantly when you trigger SOS.</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-card">
          <h2 className="text-sm font-semibold mb-3">Session</h2>
          <button onClick={async () => { await signOut(); navigate("/"); }} className="h-10 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </section>
    </main>
  );
};

export default Profile;
