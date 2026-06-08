import { useState, useMemo } from "react";
import ProviderCard from "@/components/ProviderCard";
import SOSButton from "@/components/SOSButton";
import GoogleMap, { type MapMarker } from "@/components/GoogleMap";
import { syntheticCoord } from "@/lib/googleMaps";
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

  const mapMarkers: MapMarker[] = useMemo(
    () =>
      filtered.map((p) => {
        const { lat, lng } = syntheticCoord(p.id);
        const variant: MapMarker["variant"] = p.type.toLowerCase().includes("mechanic")
          ? "accent"
          : "primary";
        return {
          id: p.id,
          lat,
          lng,
          title: p.name,
          variant,
          onClick: () => onSelectProvider(p),
        };
      }),
    [filtered, onSelectProvider]
  );

  return (
    <div className="p-3.5 animate-fade-in">
      <SOSButton variant="hero" />

      {/* Live map */}
      <div className="mb-3">
        <GoogleMap
          markers={mapMarkers}
          cluster
          trackUser
          fitBounds
          height={180}
        />
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
