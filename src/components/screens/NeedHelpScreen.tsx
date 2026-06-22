import { useState, useMemo } from "react";
import { Layers, Truck, Disc3, Wrench, ShieldCheck, MapPin, type LucideIcon } from "lucide-react";
import NearestProvidersList from "@/components/NearestProvidersList";
import SOSButton from "@/components/SOSButton";
import GoogleMap, { type MapMarker } from "@/components/GoogleMap";
import DirectionsPanel from "@/components/DirectionsPanel";
import { useDirections } from "@/hooks/useDirections";
import { syntheticCoord } from "@/lib/googleMaps";
import { allProviders } from "@/data/providers";
import type { Provider } from "@/components/ProviderCard";

const filters: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: "all",        label: "All nearby",   Icon: Layers },
  { id: "tow",        label: "Tow vans",     Icon: Truck },
  { id: "vulcanizer", label: "Vulcanizers",  Icon: Disc3 },
  { id: "mechanic",   label: "Mechanics",    Icon: Wrench },
  { id: "verified",   label: "Verified",     Icon: ShieldCheck },
];

interface Props {
  onSelectProvider: (p: Provider) => void;
}

const NeedHelpScreen = ({ onSelectProvider }: Props) => {
  const [activeFilter, setActiveFilter] = useState("all");
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
    activeFilter === "all"
      ? mixed
      : allProviders.filter((p) => {
          if (activeFilter === "tow") return p.type.includes("Tow");
          if (activeFilter === "vulcanizer") return p.type.includes("Vulcanizer");
          if (activeFilter === "mechanic") return p.type.includes("mechanic");
          if (activeFilter === "verified") return p.verified;
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

      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 inline-flex items-center gap-1">
        <MapPin className="w-3 h-3" aria-hidden="true" /> Ikeja, Lagos
      </p>

      <div className="flex gap-1.5 mb-3 flex-wrap">
        {filters.map((f) => {
          const FIcon = f.Icon;
          const active = activeFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              aria-pressed={active}
              className={`px-3 py-1 rounded-full text-[11px] font-medium cursor-pointer border transition-all inline-flex items-center gap-1 ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/40"
              }`}
            >
              <FIcon className="w-3 h-3" aria-hidden="true" /> {f.label}
            </button>
          );
        })}
      </div>

      <NearestProvidersList
        providers={filtered}
        onSelect={onSelectProvider}
        onDirections={startFor}
      />
    </div>
  );
};

export default NeedHelpScreen;
