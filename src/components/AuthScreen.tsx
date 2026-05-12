import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

interface AuthScreenProps {
  onComplete: () => void;
}

type Mode = "signup" | "login";

const signupSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your name").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
  phone: z.string().trim().max(20).optional(),
});
const loginSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(1, "Enter your password"),
});

const AuthScreen = ({ onComplete }: AuthScreenProps) => {
  const [mode, setMode] = useState<Mode>("signup");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", phone: "" });

  const update = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleEmailAuth = async () => {
    setBusy(true);
    try {
      if (mode === "signup") {
        const parsed = signupSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.errors[0].message);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: parsed.data.full_name, phone: parsed.data.phone },
          },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to verify, then log in.");
        setMode("login");
      } else {
        const parsed = loginSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.errors[0].message);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        onComplete();
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Google sign-in failed");
        return;
      }
      if (result.redirected) return;
      onComplete();
    } catch (e: any) {
      toast.error(e?.message ?? "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ backgroundColor: "#E7EFE6" }}>
      <div className="flex-1 flex items-center justify-center">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#1a1a18" }}>
          RoadAssist<span style={{ color: "#0F6E56" }}>NG</span>
        </h1>
      </div>
      <div className="bg-card rounded-t-3xl p-6 pb-8 shadow-2xl animate-slide-up-card">
        <div className="flex bg-muted rounded-lg p-1 mb-5">
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all ${mode === "signup" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            Sign Up
          </button>
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all ${mode === "login" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"}`}
          >
            Log In
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {mode === "signup" && (
            <>
              <input type="text" placeholder="Full name" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} className="w-full py-3 px-4 border border-border rounded-xl text-sm bg-background text-foreground outline-none focus:border-primary" />
              <input type="tel" placeholder="Phone (optional)" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full py-3 px-4 border border-border rounded-xl text-sm bg-background text-foreground outline-none focus:border-primary" />
            </>
          )}
          <input type="email" placeholder="Email address" value={form.email} onChange={(e) => update("email", e.target.value)} className="w-full py-3 px-4 border border-border rounded-xl text-sm bg-background text-foreground outline-none focus:border-primary" />
          <input type="password" placeholder="Password" value={form.password} onChange={(e) => update("password", e.target.value)} className="w-full py-3 px-4 border border-border rounded-xl text-sm bg-background text-foreground outline-none focus:border-primary" />
        </div>

        <button onClick={handleEmailAuth} disabled={busy} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold mt-5 transition-transform active:scale-[0.98] disabled:opacity-60">
          {busy ? "Please wait…" : mode === "signup" ? "Create Account" : "Log In"}
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button onClick={handleGoogle} disabled={busy} className="w-full py-3 rounded-xl border border-border text-sm font-medium text-foreground bg-background hover:bg-muted flex items-center justify-center gap-2 disabled:opacity-60">
          <span>🟢</span> Continue with Google
        </button>

        <p className="text-center text-[11px] text-muted-foreground mt-4">
          {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
          <span onClick={() => setMode(mode === "signup" ? "login" : "signup")} className="text-primary font-semibold cursor-pointer">
            {mode === "signup" ? "Log In" : "Sign Up"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
