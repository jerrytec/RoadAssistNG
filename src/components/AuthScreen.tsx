import { useState } from "react";

interface AuthScreenProps {
  onComplete: () => void;
}

const AuthScreen = ({ onComplete }: AuthScreenProps) => {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    // Simulated auth — proceed to app
    onComplete();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end animate-slide-up"
      style={{ backgroundColor: "#E7EFE6" }}
    >
      {/* Brand header */}
      <div className="flex-1 flex items-center justify-center">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#1a1a18" }}>
          RoadAssist<span style={{ color: "#0F6E56" }}>NG</span>
        </h1>
      </div>

      {/* Auth card slides up */}
      <div className="bg-card rounded-t-3xl p-6 pb-8 shadow-2xl animate-slide-up-card">
        {/* Toggle */}
        <div className="flex bg-muted rounded-lg p-1 mb-5">
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all ${
              mode === "signup"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => setMode("login")}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition-all ${
              mode === "login"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Log In
          </button>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-3">
          {mode === "signup" && (
            <>
              <input
                type="text"
                placeholder="Full name"
                value={formData.name}
                onChange={(e) => update("name", e.target.value)}
                className="w-full py-3 px-4 border border-border rounded-xl text-sm bg-background text-foreground outline-none focus:border-primary transition-colors"
              />
              <input
                type="tel"
                placeholder="Phone number"
                value={formData.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="w-full py-3 px-4 border border-border rounded-xl text-sm bg-background text-foreground outline-none focus:border-primary transition-colors"
              />
            </>
          )}
          <input
            type="email"
            placeholder="Email address"
            value={formData.email}
            onChange={(e) => update("email", e.target.value)}
            className="w-full py-3 px-4 border border-border rounded-xl text-sm bg-background text-foreground outline-none focus:border-primary transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => update("password", e.target.value)}
            className="w-full py-3 px-4 border border-border rounded-xl text-sm bg-background text-foreground outline-none focus:border-primary transition-colors"
          />
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold mt-5 transition-transform active:scale-[0.98]"
        >
          {mode === "signup" ? "Create Account" : "Log In"}
        </button>

        {mode === "login" && (
          <p className="text-center text-xs text-muted-foreground mt-3 cursor-pointer hover:underline">
            Forgot password?
          </p>
        )}

        <p className="text-center text-[11px] text-muted-foreground mt-4">
          {mode === "signup"
            ? "Already have an account? "
            : "Don't have an account? "}
          <span
            onClick={() => setMode(mode === "signup" ? "login" : "signup")}
            className="text-primary font-semibold cursor-pointer"
          >
            {mode === "signup" ? "Log In" : "Sign Up"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
