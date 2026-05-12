import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

interface AuthScreenProps {
  onComplete: () => void;
}

type Mode = "signup" | "login";
type Role = "buyer" | "tow_operator" | "vulcanizer" | "mechanic" | "vendor";

const ROLES: { id: Role; label: string; icon: string; desc: string }[] = [
  { id: "buyer", label: "User", icon: "🚗", desc: "I need roadside help or parts" },
  { id: "tow_operator", label: "Tow van", icon: "🚛", desc: "I provide towing services" },
  { id: "vulcanizer", label: "Vulcanizer", icon: "🛞", desc: "I fix tyres on the road" },
  { id: "mechanic", label: "Mechanic", icon: "🔧", desc: "I repair vehicles" },
  { id: "vendor", label: "Parts seller", icon: "🧰", desc: "I sell spare parts" },
];

const signupSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your name").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
  phone: z.string().trim().max(20).optional(),
  business_name: z.string().trim().max(120).optional(),
});
const loginSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(1, "Enter your password"),
});

const AuthScreen = ({ onComplete }: AuthScreenProps) => {
  const [mode, setMode] = useState<Mode>("signup");
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState<Role>("buyer");
  const [form, setForm] = useState({ full_name: "", email: "", password: "", phone: "", business_name: "" });

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
        if (role === "vendor" && !parsed.data.business_name) {
          toast.error("Enter your business name");
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: parsed.data.full_name,
              phone: parsed.data.phone,
              role,
              business_name: parsed.data.business_name,
            },
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
        sessionStorage.removeItem("portal-redirected");
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
    <div className="fixed inset-0 z-50 flex flex-col justify-end overflow-y-auto" style={{ backgroundColor: "#E7EFE6" }}>
      <div className="flex-1 flex items-center justify-center py-8">
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

        {mode === "signup" && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-muted-foreground mb-2">I'm joining as</p>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`text-left p-2.5 rounded-xl border transition-all ${
                    role === r.id ? "border-primary bg-primary/5" : "border-border bg-background"
                  }`}
                >
                  <div className="text-lg leading-none mb-1">{r.icon}</div>
                  <div className="text-[12px] font-semibold">{r.label}</div>
                  <div className="text-[10px] text-muted-foreground leading-tight">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {mode === "signup" && (
            <>
              <input type="text" placeholder="Full name" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} className="w-full py-3 px-4 border border-border rounded-xl text-sm bg-background text-foreground outline-none focus:border-primary" />
              <input type="tel" placeholder="Phone (optional)" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full py-3 px-4 border border-border rounded-xl text-sm bg-background text-foreground outline-none focus:border-primary" />
              {role === "vendor" && (
                <input type="text" placeholder="Business / shop name" value={form.business_name} onChange={(e) => update("business_name", e.target.value)} className="w-full py-3 px-4 border border-border rounded-xl text-sm bg-background text-foreground outline-none focus:border-primary" />
              )}
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
