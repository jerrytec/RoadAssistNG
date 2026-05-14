import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Zap, MapPin } from "lucide-react";

interface AuthScreenProps {
  onComplete: () => void;
}

type Mode = "signup" | "login" | "forgot";
type Role = "buyer" | "tow_operator" | "vulcanizer" | "mechanic" | "vendor";

const ROLES: { id: Role; label: string; icon: string; desc: string }[] = [
  { id: "buyer", label: "User", icon: "🚗", desc: "I need help or parts" },
  { id: "tow_operator", label: "Tow van", icon: "🚛", desc: "I provide towing" },
  { id: "vulcanizer", label: "Vulcanizer", icon: "🛞", desc: "Tyre fixes on the road" },
  { id: "mechanic", label: "Mechanic", icon: "🔧", desc: "I repair vehicles" },
  { id: "vendor", label: "Parts seller", icon: "🧰", desc: "I sell spare parts" },
];

const signupSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Min 6 characters").max(72),
  phone: z.string().trim().max(20).optional(),
  business_name: z.string().trim().max(120).optional(),
});
const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.74.13-1.45.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
  </svg>
);

const AuthScreen = ({ onComplete }: AuthScreenProps) => {
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState<Role>("buyer");
  const [form, setForm] = useState({ full_name: "", email: "", password: "", phone: "", business_name: "" });

  const update = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleEmailAuth = async () => {
    setBusy(true);
    try {
      if (mode === "signup") {
        const parsed = signupSchema.safeParse(form);
        if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
        if (role === "vendor" && !parsed.data.business_name) { toast.error("Enter your business name"); return; }
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
      } else if (mode === "login") {
        const parsed = loginSchema.safeParse(form);
        if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        sessionStorage.removeItem("portal-redirected");
        toast.success("Welcome back!");
        onComplete();
      } else {
        const email = form.email.trim();
        if (!z.string().email().safeParse(email).success) { toast.error("Enter a valid email"); return; }
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Reset link sent. Check your inbox.");
        setMode("login");
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
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) { toast.error("Google sign-in failed"); return; }
      if (result.redirected) return;
      onComplete();
    } catch (e: any) {
      toast.error(e?.message ?? "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  const inputCls = "w-full h-11 px-4 border border-border rounded-lg text-sm bg-background text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="min-h-full grid lg:grid-cols-2">
        {/* Left: brand panel (desktop) */}
        <aside className="hidden lg:flex relative gradient-brand text-primary-foreground p-10 flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
            backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,255,255,.25), transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,.18), transparent 45%)",
          }} />
          <div className="relative">
            <h1 className="text-2xl font-extrabold tracking-tight">
              RoadAssist<span className="opacity-80">NG</span>
            </h1>
            <p className="text-sm opacity-80 mt-1">Premium roadside assistance, on demand.</p>
          </div>
          <div className="relative space-y-5 max-w-sm">
            <h2 className="text-3xl font-bold leading-tight tracking-tight">Help that arrives in minutes — not hours.</h2>
            <p className="text-sm/relaxed opacity-85">
              Verified tow vans, vulcanizers and mobile mechanics. Transparent pricing.
              Pay only after the job is done.
            </p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3"><Zap className="w-4 h-4 opacity-90"/>Instant matching with nearby providers</li>
              <li className="flex items-center gap-3"><ShieldCheck className="w-4 h-4 opacity-90"/>Verified, ID-checked operators</li>
              <li className="flex items-center gap-3"><MapPin className="w-4 h-4 opacity-90"/>Live tracking until they reach you</li>
            </ul>
          </div>
          <div className="relative text-xs opacity-75">© {new Date().getFullYear()} RoadAssistNG · Lagos, Nigeria</div>
        </aside>

        {/* Right: form */}
        <main className="flex items-center justify-center p-5 sm:p-8 gradient-soft">
          <div className="w-full max-w-[460px]">
            <div className="lg:hidden text-center mb-5">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                RoadAssist<span className="text-primary">NG</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-1">Premium roadside assistance</p>
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-premium p-6 sm:p-7">
              {mode !== "forgot" && (
                <div className="flex bg-muted rounded-lg p-1 mb-5">
                  <button
                    onClick={() => setMode("login")}
                    className={`flex-1 h-9 text-sm font-semibold rounded-md transition-all ${mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                  >Log In</button>
                  <button
                    onClick={() => setMode("signup")}
                    className={`flex-1 h-9 text-sm font-semibold rounded-md transition-all ${mode === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                  >Sign Up</button>
                </div>
              )}

              <div className="mb-4">
                <h2 className="text-xl font-bold text-foreground">
                  {mode === "signup" ? "Create your account" : mode === "login" ? "Welcome back" : "Reset your password"}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {mode === "signup" ? "Join thousands getting roadside help in minutes." :
                   mode === "login" ? "Sign in to request help or manage your jobs." :
                   "We'll email you a secure link to set a new password."}
                </p>
              </div>

              <div className="animate-fade-in" key={mode}>
                {mode === "signup" && (
                  <div className="mb-4">
                    <label className="text-[11px] font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">I'm joining as</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ROLES.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRole(r.id)}
                          className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                            role === r.id ? "border-primary bg-primary/5 ring-2 ring-primary/15" : "border-border bg-background hover:border-primary/40"
                          }`}
                        >
                          <div className="text-base leading-none mb-1">{r.icon}</div>
                          <div className="text-[12px] font-semibold text-foreground">{r.label}</div>
                          <div className="text-[10px] text-muted-foreground leading-tight">{r.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {mode === "signup" && (
                    <>
                      <input className={inputCls} type="text" placeholder="Full name" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
                      <input className={inputCls} type="tel" placeholder="Phone (optional)" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                      {role === "vendor" && (
                        <input className={inputCls} type="text" placeholder="Business / shop name" value={form.business_name} onChange={(e) => update("business_name", e.target.value)} />
                      )}
                    </>
                  )}
                  <input className={inputCls} type="email" placeholder="Email address" value={form.email} onChange={(e) => update("email", e.target.value)} autoComplete="email" />
                  {mode !== "forgot" && (
                    <input className={inputCls} type="password" placeholder="Password" value={form.password} onChange={(e) => update("password", e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
                  )}
                </div>

                {mode === "login" && (
                  <div className="text-right mt-2">
                    <button onClick={() => setMode("forgot")} className="text-xs font-medium text-primary hover:underline">
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  onClick={handleEmailAuth}
                  disabled={busy}
                  className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold mt-4 transition-all active:scale-[0.99] hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                  {mode === "signup" ? "Create Account" : mode === "login" ? "Log In" : "Send Reset Link"}
                </button>

                {mode !== "forgot" && (
                  <>
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[11px] text-muted-foreground">or continue with</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    <button
                      onClick={handleGoogle}
                      disabled={busy}
                      className="w-full h-11 rounded-lg border border-border text-sm font-medium text-foreground bg-background hover:bg-muted/60 flex items-center justify-center gap-2.5 disabled:opacity-60 transition-colors"
                    >
                      <GoogleIcon /> Continue with Google
                    </button>
                  </>
                )}

                <p className="text-center text-xs text-muted-foreground mt-5">
                  {mode === "forgot" ? (
                    <>Remembered it?{" "}
                      <button onClick={() => setMode("login")} className="text-primary font-semibold hover:underline">Back to log in</button>
                    </>
                  ) : mode === "signup" ? (
                    <>Already have an account?{" "}
                      <button onClick={() => setMode("login")} className="text-primary font-semibold hover:underline">Log In</button>
                    </>
                  ) : (
                    <>Don't have an account?{" "}
                      <button onClick={() => setMode("signup")} className="text-primary font-semibold hover:underline">Sign Up</button>
                    </>
                  )}
                </p>
              </div>
            </div>

            <p className="text-center text-[11px] text-muted-foreground mt-4">
              By continuing you agree to our Terms & Privacy.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuthScreen;
