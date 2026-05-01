import { useState } from "react";

const RegisterScreen = () => {
  const [serviceType, setServiceType] = useState("");

  return (
    <div className="p-3.5 animate-fade-in">
      <div className="mb-3">
        <label className="text-[11px] font-medium text-muted-foreground mb-1 block">👤 Personal information</label>
        <div className="mb-2.5">
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Full legal name</label>
          <input className="w-full py-2 px-3 border border-border rounded-md text-xs bg-card text-foreground outline-none focus:border-primary-mid" />
        </div>
        <div className="grid grid-cols-2 gap-2.5 mb-2.5">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Phone number</label>
            <input className="w-full py-2 px-3 border border-border rounded-md text-xs bg-card text-foreground outline-none focus:border-primary-mid" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">State of operation</label>
            <input className="w-full py-2 px-3 border border-border rounded-md text-xs bg-card text-foreground outline-none focus:border-primary-mid" />
          </div>
        </div>
        <div className="mb-2.5">
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Service type</label>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="w-full py-2 px-3 border border-border rounded-md text-xs bg-card text-foreground outline-none focus:border-primary-mid"
          >
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

      <label className="text-[11px] font-medium text-muted-foreground mb-2 block">🔐 Identity verification</label>

      <div className="flex flex-col gap-1 mb-3">
        {[
          { step: "1", name: "NIN — National ID Number", desc: "11-digit number from NIMC", status: "Enter below" },
          { step: "2", name: "BVN — Bank Verification No.", desc: "11-digit number from your bank", status: "Enter below" },
        ].map((v) => (
          <div key={v.step} className="flex items-center gap-2.5 p-2.5 border border-border rounded-md bg-background">
            <div className="w-[26px] h-[26px] rounded-full bg-gray-light text-gray flex items-center justify-center text-xs font-bold">{v.step}</div>
            <div className="flex-1">
              <div className="text-xs font-medium">{v.name}</div>
              <div className="text-[10px] text-muted-foreground">{v.desc}</div>
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground">{v.status}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div>
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">NIN</label>
          <input className="w-full py-2 px-3 border border-border rounded-md text-xs bg-card text-foreground outline-none focus:border-primary-mid" />
        </div>
        <div>
          <label className="text-[11px] font-medium text-muted-foreground mb-1 block">BVN</label>
          <input className="w-full py-2 px-3 border border-border rounded-md text-xs bg-card text-foreground outline-none focus:border-primary-mid" />
        </div>
      </div>

      <label className="text-[11px] font-medium text-muted-foreground mb-2 block">📄 Documents</label>

      {[
        { icon: "📷", title: "Driver's licence / trade certificate", desc: "Tap to upload photo or scan" },
        { icon: "📄", title: "State / Union registration certificate", desc: "Upload certificate (PDF or image)" },
        { icon: "🚐", title: "Vehicle / tool kit photos", desc: "Upload clear photos" },
      ].map((d) => (
        <div key={d.title} className="border border-dashed border-border rounded-md p-3 text-center cursor-pointer bg-background mb-2">
          <div className="text-xl mb-0.5">{d.icon}</div>
          <div className="text-[11px] font-medium text-foreground">{d.title}</div>
          <div className="text-[10px] text-muted-foreground">{d.desc}</div>
        </div>
      ))}

      <button className="w-full py-3 rounded-lg border-none bg-primary text-primary-foreground text-sm font-bold cursor-pointer mt-1">
        Submit for verification →
      </button>
      <p className="text-center text-[10px] text-muted-foreground mt-2">
        Verification takes 24–48 hours · You'll be notified via SMS & email
      </p>
    </div>
  );
};

export default RegisterScreen;
