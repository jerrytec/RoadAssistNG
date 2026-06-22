import { useState } from "react";

const ProviderDashboard = () => {
  const [isOnline, setIsOnline] = useState(false);

  return (
    <div className="p-3.5 animate-fade-in">
      <div className="bg-accent-light border border-accent/30 rounded-lg p-2.5 text-[11px] text-accent flex items-center gap-2 mb-3">
        ⚠️ Keep your location ON to receive job requests near you
      </div>

      {/* Profile card */}
      <div className="bg-card border border-border rounded-lg p-4 mb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[15px] font-semibold">Emeka Okafor</div>
            <div className="text-[11px] text-muted-foreground">Tow Van Operator · Verified</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">{isOnline ? "Online" : "Offline"}</span>
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`w-[42px] h-6 rounded-xl border-none cursor-pointer relative transition-colors ${isOnline ? "bg-primary-mid" : "bg-gray-light"}`}
            >
              <span className={`absolute w-[18px] h-[18px] rounded-full bg-card top-[3px] transition-[left] ${isOnline ? "left-[21px]" : "left-[3px]"}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[{ n: "23", l: "Jobs done" }, { n: "4.9", l: "Avg rating" }, { n: "₦41k", l: "This week" }].map((s) => (
            <div key={s.l} className="bg-background rounded-md p-2.5 text-center">
              <div className="text-lg font-bold text-primary">{s.n}</div>
              <div className="text-[10px] text-muted-foreground font-medium mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Incoming requests</p>

      {/* Request cards */}
      {[
        { title: "Tow needed — Toyota Camry, flat tyre + engine off", loc: "Awolowo Way, Ikeja", dist: "1.2 km", driver: "Ngozi A.", id: "RA-2041" },
        { title: "Mechanic needed — Honda Accord, engine won't start", loc: "Lagos-Ibadan Expressway", dist: "2.6 km", driver: "Chuka M.", id: "RA-2039" },
      ].map((r) => (
        <div key={r.id} className="bg-card border border-border rounded-lg rounded-l-none border-l-[3px] border-l-primary-mid p-3 mb-2">
          <div className="text-[13px] font-semibold">{r.title}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5 inline-flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5" aria-hidden="true" /> {r.loc} · {r.dist} · Driver: {r.driver} · Booking #{r.id}
          </div>
          <div className="flex gap-2 mt-2">
            <button className="flex-1 py-2 rounded-md border-none bg-primary-mid text-primary-foreground text-xs font-semibold cursor-pointer">
              Accept & send quote
            </button>
            <button className="flex-1 py-2 rounded-md border border-border bg-card text-muted-foreground text-xs font-medium cursor-pointer">
              Decline
            </button>
          </div>
        </div>
      ))}

      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-3">Verification status</p>

      <div className="flex flex-col gap-1">
        {[
          { n: "NIN verified", d: "National Identification Number" },
          { n: "BVN verified", d: "Bank Verification Number" },
          { n: "Driver's licence", d: "Valid FRSC licence" },
          { n: "State / Union registration", d: "Lagos State Transport registry" },
        ].map((v) => (
          <div key={v.n} className="flex items-center gap-2.5 p-2.5 border border-border rounded-md bg-background">
            <div className="w-[26px] h-[26px] rounded-full bg-primary-light text-primary flex items-center justify-center text-xs font-bold">✓</div>
            <div className="flex-1">
              <div className="text-xs font-medium">{v.n}</div>
              <div className="text-[10px] text-muted-foreground">{v.d}</div>
            </div>
            <span className="text-[10px] font-semibold text-primary">Approved</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProviderDashboard;
