import { useState } from "react";
import ProviderCard from "@/components/ProviderCard";
import SOSButton from "@/components/SOSButton";
import { allProviders } from "@/data/providers";
import type { Provider } from "@/components/ProviderCard";

const filters = ["All nearby", "🚐 Tow vans", "🔧 Vulcanizers", "🔩 Mechanics", "✅ Verified"];

interface Props {
  onSelectProvider: (p: Provider) => void;
}

const NeedHelpScreen = ({ onSelectProvider }: Props) => {
  const [activeFilter, setActiveFilter] = useState("All nearby");

  const mixed = (() => {
    const tows = allProviders.filter((p) => p.type.includes("Tow"));
    const vulcs = allProviders.filter((p) => p.type.includes("Vulcanizer"));
    const mechs = allProviders.filter((p) => p.type.includes("mechanic"));
    const out: Provider[] = [];
    const max = Math.max(tows.length, vulcs.length, mechs.length);
    for (let i = 0; i < max && out.length < 10; i++) {
      if (tows[i] && out.length < 10) out.push(tows[i]);
      if (vulcs[i] && out.length < 10) out.push(vulcs[i]);
      if (mechs[i] && out.length < 10) out.push(mechs[i]);
    }
    return out;
  })();

  const filtered = (
    activeFilter === "All nearby"
      ? mixed
      : allProviders.filter((p) => {
          if (activeFilter === "🚐 Tow vans") return p.type.includes("Tow");
          if (activeFilter === "🔧 Vulcanizers") return p.type.includes("Vulcanizer");
          if (activeFilter === "🔩 Mechanics") return p.type.includes("mechanic");
          if (activeFilter === "✅ Verified") return p.verified;
          return true;
        })
  ).slice(0, 10);

  return (
    <div className="p-3.5 animate-fade-in">
      <SOSButton variant="hero" />

      {/* Map */}
      <div className="rounded-lg h-[120px] flex items-center justify-center mb-3 relative overflow-hidden border border-border bg-primary-light">
        <div className="absolute top-1/2 left-1/2 w-9 h-9 border-2 border-destructive/35 rounded-full animate-pulse-ring" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-destructive border-2 border-card z-10" />
        {/* Nearby dots */}
        <div className="absolute w-[7px] h-[7px] rounded-full bg-primary-mid" style={{ top: "30%", left: "40%" }} />
        <div className="absolute w-[7px] h-[7px] rounded-full bg-primary-mid" style={{ top: "60%", left: "65%" }} />
        <div className="absolute w-[7px] h-[7px] rounded-full bg-secondary" style={{ top: "35%", left: "70%" }} />
        {/* Legend */}
        <div className="absolute bottom-2 right-2 flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-[10px] text-primary">
            <span className="w-[7px] h-[7px] rounded-full bg-primary-mid shrink-0" /> Tow/Vulc
          </div>
          <div className="flex items-center gap-1 text-[10px] text-secondary">
            <span className="w-[7px] h-[7px] rounded-full bg-secondary shrink-0" /> Mechanic
          </div>
          <div className="flex items-center gap-1 text-[10px] text-destructive">
            <span className="w-[7px] h-[7px] rounded-full bg-destructive shrink-0" /> You
          </div>
        </div>
      </div>

      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">📍 Ikeja, Lagos</p>

      {/* Filters */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1 rounded-full text-[11px] font-medium cursor-pointer border transition-all ${
              activeFilter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Nearest providers</p>

      {filtered.map((p) => (
        <ProviderCard key={p.id} provider={p} onClick={() => onSelectProvider(p)} />
      ))}

      <p className="text-center text-[10px] text-muted-foreground pt-3 border-t border-border mt-2">
        Tap any provider to start the booking workflow · All prices confirmed before payment
      </p>
    </div>
  );
};

export default NeedHelpScreen;
