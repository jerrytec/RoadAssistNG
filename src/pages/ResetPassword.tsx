import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Supabase auto-parses the recovery hash and emits a session event.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // If user lands here without a recovery token, allow them to navigate away.
    setTimeout(() => setReady((r) => r || !!window.location.hash.includes("type=recovery")), 300);
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async () => {
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords don't match");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You're signed in.");
      navigate("/");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not reset password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center gradient-soft p-5">
      <div className="w-full max-w-[440px] bg-card border border-border rounded-2xl shadow-premium p-7">
        <h1 className="text-xl font-bold text-foreground">Set a new password</h1>
        <p className="text-xs text-muted-foreground mt-1">Choose a strong password you don't use elsewhere.</p>
        <div className="flex flex-col gap-3 mt-5">
          <input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-11 px-4 border border-border rounded-lg text-sm bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          <input type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full h-11 px-4 border border-border rounded-lg text-sm bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </div>
        <button onClick={submit} disabled={busy || !ready} className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold mt-5 hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Update password
        </button>
        {!ready && <p className="text-[11px] text-muted-foreground text-center mt-3">Waiting for recovery session…</p>}
        <button onClick={() => navigate("/")} className="w-full text-xs text-muted-foreground mt-3 hover:text-foreground">Back to app</button>
      </div>
    </main>
  );
};

export default ResetPassword;
