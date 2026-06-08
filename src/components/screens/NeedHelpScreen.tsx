import { useState, useMemo } from "react";
import ProviderCard from "@/components/ProviderCard";
import SOSButton from "@/components/SOSButton";
import GoogleMap, { type MapMarker } from "@/components/GoogleMap";
import DirectionsPanel from "@/components/DirectionsPanel";
import { useDirections } from "@/hooks/useDirections";
import { syntheticCoord } from "@/lib/googleMaps";
import { allProviders } from "@/data/providers";
import type { Provider } from "@/components/ProviderCard";

const filters = ["All nearby", "🚐 Tow vans", "🔧 Vulcanizers", "🔩 Mechanics", "✅ Verified"];

interface Props {
  onSelectProvider: (p: Provider) => void;
}

const NeedHelpScreen = ({ onSelectProvider }: Props) => {
  const [activeFilter, setActiveFilter] = useState("All nearby");
  const dir = useDirections();

  const startFor = (p: Provider) => {
    const c = syntheticCoord(p.id);
    dir.start({ id: p.id, name: p.name, lat: c.lat, lng: c.lng });
  };

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

  const mapMarkers: MapMarker[] = useMemo(() => {
    if (dir.target) {
      return [{ id: dir.target.id, lat: dir.target.lat!, lng: dir.target.lng!, title: dir.target.name, variant: "accent" }];
    }
    return filtered.map((p) => {
      const { lat, lng } = syntheticCoord(p.id);
      const variant: MapMarker["variant"] = p.type.toLowerCase().includes("mechanic") ? "accent" : "primary";
      return {
        id: p.id,
        lat,
        lng,
        title: p.name,
        variant,
        onClick: () => startFor(p),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, dir.target]);

  const bookSelected = () => {
    const p = allProviders.find((x) => x.id === dir.target?.id);
    if (p) onSelectProvider(p);
  };

  return (
    <div className="p-3.5 animate-fade-in">
      <SOSButton variant="hero" />

      <div className="mb-3">
        <GoogleMap
          markers={mapMarkers}
          route={dir.path ?? undefined}
          cluster={!dir.target}
          trackUser
          fitBounds
          height={dir.target ? 240 : 180}
        />
      </div>

      {dir.target && (
        <DirectionsPanel
          targetName={dir.target.name}
          directions={dir.directions}
          loading={dir.loading}
          travelMode={dir.travelMode}
          swapped={dir.swapped}
          locationError={dir.locationError}
          origin={dir.originCoords}
          destination={dir.destCoords}
          onChangeMode={dir.changeMode}
          onSwap={dir.swap}
          onRetryLocation={dir.retryLocation}
          onClose={dir.clear}
          onPrimaryAction={bookSelected}
          primaryActionLabel={`Book ${dir.target.name}`}
        />
      )}

      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">📍 Ikeja, Lagos</p>

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
        <div key={p.id} className="relative">
          <ProviderCard provider={p} onClick={() => onSelectProvider(p)} />
          <button
            onClick={(e) => { e.stopPropagation(); startFor(p); }}
            className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-1 rounded-full bg-primary-light text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            🧭 Directions
          </button>
        </div>
      ))}

      <p className="text-center text-[10px] text-muted-foreground pt-3 border-t border-border mt-2">
        Tap any provider to book · Tap 🧭 for turn-by-turn navigation
      </p>
    </div>
  );
};

export default NeedHelpScreen;
