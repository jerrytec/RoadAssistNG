import { useState } from "react";

interface AuthScreenProps {
  onComplete: () => void;
}

type UserType = null | "customer" | "provider";
type AuthMode = "signup" | "login";

const AuthScreen = ({ onComplete }: AuthScreenProps) => {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [userType, setUserType] = useState<UserType>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    // Provider fields
    state: "",
    serviceType: "",
    nin: "",
    bvn: "",
    licence: null as File | null,
    unionCert: null as File | null,
    vehiclePhotos: null as File | null,
  });

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleFileChange = (field: string, file: File | null) =>
    setFormData((prev) => ({ ...prev, [field]: file }));

  const handleSubmit = () => {
    onComplete();
  };

  const resetToTypeSelection = () => {
    setUserType(null);
  };

  // Login view
  if (mode === "login") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ backgroundColor: "#E7EFE6" }}>
        <div className="flex-1 flex items-center justify-center">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#1a1a18" }}>
            RoadAssist<span style={{ color: "#0F6E56" }}>NG</span>
          </h1>
        </div>
        <div className="bg-card rounded-t-3xl p-6 pb-8 shadow-2xl animate-slide-up-card">
          <div className="flex bg-muted rounded-lg p-1 mb-5">
            <button onClick={() => { setMode("signup"); setUserType(null); }} className="flex-1 py-2.5 text-sm font-semibold rounded-md transition-all text-muted-foreground">Sign Up</button>
            <button className="flex-1 py-2.5 text-sm font-semibold rounded-md transition-all bg-primary text-primary-foreground shadow-sm">Log In</button>
          </div>
          <div className="flex flex-col gap-3">
            <input type="email" placeholder="Email address" value={formData.email} onChange={(e) => update("email", e.target.value)} className="w-full py-3 px-4 border border-border rounded-xl text-sm bg-background text-foreground outline-none focus:border-primary transition-colors" />
            <input type="password" placeholder="Password" value={formData.password} onChange={(e) => update("password", e.target.value)} className="w-full py-3 px-4 border border-border rounded-xl text-sm bg-background text-foreground outline-none focus:border-primary transition-colors" />
          </div>
          <button onClick={handleSubmit} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold mt-5 transition-transform active:scale-[0.98]">Log In</button>
          <p className="text-center text-xs text-muted-foreground mt-3 cursor-pointer hover:underline">Forgot password?</p>
          <p className="text-center text-[11px] text-muted-foreground mt-4">
            Don't have an account?{" "}
            <span onClick={() => { setMode("signup"); setUserType(null); }} className="text-primary font-semibold cursor-pointer">Sign Up</span>
          </p>
        </div>
      </div>
    );
  }

  // Signup - choose user type
  if (mode === "signup" && userType === null) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ backgroundColor: "#E7EFE6" }}>
        <div className="flex-1 flex items-center justify-center">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#1a1a18" }}>
            RoadAssist<span style={{ color: "#0F6E56" }}>NG</span>
          </h1>
        </div>
        <div className="bg-card rounded-t-3xl p-6 pb-8 shadow-2xl animate-slide-up-card">
          <div className="flex bg-muted rounded-lg p-1 mb-5">
            <button className="flex-1 py-2.5 text-sm font-semibold rounded-md transition-all bg-primary text-primary-foreground shadow-sm">Sign Up</button>
            <button onClick={() => setMode("login")} className="flex-1 py-2.5 text-sm font-semibold rounded-md transition-all text-muted-foreground">Log In</button>
          </div>
          <h2 className="text-base font-bold text-foreground mb-1">How will you use RoadAssistNG?</h2>
          <p className="text-xs text-muted-foreground mb-4">Choose your account type to get started</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => setUserType("customer")} className="w-full p-4 border-2 border-border rounded-2xl text-left hover:border-primary transition-colors bg-background">
              <div className="text-lg mb-1">🚗</div>
              <div className="text-sm font-bold text-foreground">I need roadside help</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Find mechanics, tow vans & vulcanizers near you</div>
            </button>
            <button onClick={() => setUserType("provider")} className="w-full p-4 border-2 border-border rounded-2xl text-left hover:border-primary transition-colors bg-background">
              <div className="text-lg mb-1">🔧</div>
              <div className="text-sm font-bold text-foreground">I provide roadside services</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Register as a mechanic, tow operator or vulcanizer</div>
            </button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground mt-4">
            Already have an account?{" "}
            <span onClick={() => setMode("login")} className="text-primary font-semibold cursor-pointer">Log In</span>
          </p>
        </div>
      </div>
    );
  }

  // Customer signup - simple form
  if (mode === "signup" && userType === "customer") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ backgroundColor: "#E7EFE6" }}>
        <div className="flex-1 flex items-center justify-center">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#1a1a18" }}>
            RoadAssist<span style={{ color: "#0F6E56" }}>NG</span>
          </h1>
        </div>
        <div className="bg-card rounded-t-3xl p-6 pb-8 shadow-2xl animate-slide-up-card">
          <button onClick={resetToTypeSelection} className="text-xs text-muted-foreground mb-3 flex items-center gap-1 hover:text-foreground transition-colors">← Back</button>
          <h2 className="text-base font-bold text-foreground mb-4">🚗 Create your account</h2>
          <div className="flex flex-col gap-3">
            <input type="text" placeholder="Full name" value={formData.name} onChange={(e) => update("name", e.target.value)} className="w-full py-3 px-4 border border-border rounded-xl text-sm bg-background text-foreground outline-none focus:border-primary transition-colors" />
            <input type="email" placeholder="Email address" value={formData.email} onChange={(e) => update("email", e.target.value)} className="w-full py-3 px-4 border border-border rounded-xl text-sm bg-background text-foreground outline-none focus:border-primary transition-colors" />
            <input type="password" placeholder="Password" value={formData.password} onChange={(e) => update("password", e.target.value)} className="w-full py-3 px-4 border border-border rounded-xl text-sm bg-background text-foreground outline-none focus:border-primary transition-colors" />
          </div>
          <button onClick={handleSubmit} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold mt-5 transition-transform active:scale-[0.98]">Create Account</button>
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-[11px] text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>
          <button className="w-full py-3 rounded-xl border border-border text-sm font-medium text-foreground bg-background hover:bg-muted transition-colors flex items-center justify-center gap-2">
            📧 Sign up with Email Link
          </button>
          <p className="text-center text-[11px] text-muted-foreground mt-4">
            Already have an account?{" "}
            <span onClick={() => setMode("login")} className="text-primary font-semibold cursor-pointer">Log In</span>
          </p>
        </div>
      </div>
    );
  }

  // Provider signup - full registration form
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto" style={{ backgroundColor: "#E7EFE6" }}>
      <div className="flex items-center justify-center py-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1a1a18" }}>
          RoadAssist<span style={{ color: "#0F6E56" }}>NG</span>
        </h1>
      </div>
      <div className="bg-card rounded-t-3xl p-5 pb-8 shadow-2xl animate-slide-up-card flex-1">
        <button onClick={resetToTypeSelection} className="text-xs text-muted-foreground mb-3 flex items-center gap-1 hover:text-foreground transition-colors">← Back</button>
        <h2 className="text-base font-bold text-foreground mb-4">🔧 Service Provider Registration</h2>

        {/* Personal Information */}
        <label className="text-[11px] font-semibold text-muted-foreground mb-2 block">👤 Personal information</label>
        <div className="flex flex-col gap-2.5 mb-4">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Full legal name *</label>
            <input type="text" value={formData.name} onChange={(e) => update("name", e.target.value)} className="w-full py-2.5 px-3.5 border border-border rounded-xl text-sm bg-background text-foreground outline-none focus:border-primary transition-colors" placeholder="Enter your full name" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Phone number *</label>
              <input type="tel" value={formData.phone} onChange={(e) => update("phone", e.target.value)} className="w-full py-2.5 px-3.5 border border-border rounded-xl text-sm bg-background text-foreground outline-none focus:border-primary transition-colors" placeholder="080XXXXXXXX" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">State of operation *</label>
              <input type="text" value={formData.state} onChange={(e) => update("state", e.target.value)} className="w-full py-2.5 px-3.5 border border-border rounded-xl text-sm bg-background text-foreground outline-none focus:border-primary transition-colors" placeholder="e.g. Lagos" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Email address *</label>
            <input type="email" value={formData.email} onChange={(e) => update("email", e.target.value)} className="w-full py-2.5 px-3.5 border border-border rounded-xl text-sm bg-background text-foreground outline-none focus:border-primary transition-colors" placeholder="you@email.com" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Password *</label>
            <input type="password" value={formData.password} onChange={(e) => update("password", e.target.value)} className="w-full py-2.5 px-3.5 border border-border rounded-xl text-sm bg-background text-foreground outline-none focus:border-primary transition-colors" placeholder="Min 8 characters" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Service type *</label>
            <select value={formData.serviceType} onChange={(e) => update("serviceType", e.target.value)} className="w-full py-2.5 px-3.5 border border-border rounded-xl text-sm bg-background text-foreground outline-none focus:border-primary transition-colors">
              <option value="">Select your service</option>
              <option>Tow van operator</option>
              <option>Vulcanizer (mobile)</option>
              <option>Vulcanizer (fixed shop)</option>
              <option>Mobile mechanic</option>
              <option>Towing & vulcanizing</option>
              <option>Mechanic & vulcanizing</option>
              <option>All services</option>
            </select>
          </div>
        </div>

        {/* Identity Verification */}
        <label className="text-[11px] font-semibold text-muted-foreground mb-2 block">🔐 Identity verification</label>
        <div className="flex flex-col gap-1.5 mb-3">
          {[
            { step: "1", name: "NIN — National ID Number", desc: "11-digit number from NIMC" },
            { step: "2", name: "BVN — Bank Verification No.", desc: "11-digit number from your bank" },
          ].map((v) => (
            <div key={v.step} className="flex items-center gap-2.5 p-2.5 border border-border rounded-xl bg-background">
              <div className="w-7 h-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold">{v.step}</div>
              <div className="flex-1">
                <div className="text-xs font-medium text-foreground">{v.name}</div>
                <div className="text-[10px] text-muted-foreground">{v.desc}</div>
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground">Required</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">NIN *</label>
            <input type="text" maxLength={11} value={formData.nin} onChange={(e) => update("nin", e.target.value.replace(/\D/g, ""))} className="w-full py-2.5 px-3.5 border border-border rounded-xl text-sm bg-background text-foreground outline-none focus:border-primary transition-colors" placeholder="11-digit NIN" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">BVN *</label>
            <input type="text" maxLength={11} value={formData.bvn} onChange={(e) => update("bvn", e.target.value.replace(/\D/g, ""))} className="w-full py-2.5 px-3.5 border border-border rounded-xl text-sm bg-background text-foreground outline-none focus:border-primary transition-colors" placeholder="11-digit BVN" />
          </div>
        </div>

        {/* Documents */}
        <label className="text-[11px] font-semibold text-muted-foreground mb-2 block">📄 Documents upload</label>
        <div className="flex flex-col gap-2 mb-4">
          {[
            { icon: "📷", field: "licence", title: "Driver's licence (FRSC) *", desc: "Tap to upload photo or scan", accept: "image/*" },
            { icon: "📄", field: "unionCert", title: "State / Union registration certificate *", desc: "Upload certificate (PDF or image)", accept: "image/*,.pdf" },
            { icon: "🚐", field: "vehiclePhotos", title: "Vehicle / Van photos (optional)", desc: "Upload clear photos of your vehicle", accept: "image/*" },
          ].map((d) => (
            <label key={d.field} className="border border-dashed border-border rounded-xl p-3.5 text-center cursor-pointer bg-background hover:border-primary transition-colors block">
              <input type="file" accept={d.accept} className="hidden" onChange={(e) => handleFileChange(d.field, e.target.files?.[0] || null)} />
              <div className="text-xl mb-0.5">{d.icon}</div>
              <div className="text-[11px] font-medium text-foreground">{d.title}</div>
              <div className="text-[10px] text-muted-foreground">{d.desc}</div>
              {(formData as any)[d.field] && (
                <div className="text-[10px] text-primary font-semibold mt-1">✓ {(formData as any)[d.field].name}</div>
              )}
            </label>
          ))}
        </div>

        <button onClick={handleSubmit} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold transition-transform active:scale-[0.98]">
          Submit for Verification →
        </button>
        <p className="text-center text-[10px] text-muted-foreground mt-2">
          Verification takes 24–48 hours · You'll be notified via SMS & email
        </p>
        <p className="text-center text-[11px] text-muted-foreground mt-3">
          Already have an account?{" "}
          <span onClick={() => setMode("login")} className="text-primary font-semibold cursor-pointer">Log In</span>
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
