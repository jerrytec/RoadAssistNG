import { useState, useMemo } from "react";
import ProviderCard from "@/components/ProviderCard";
import GoogleMap, { type MapMarker } from "@/components/GoogleMap";
import DirectionsPanel from "@/components/DirectionsPanel";
import { useDirections } from "@/hooks/useDirections";
import { syntheticCoord } from "@/lib/googleMaps";
import { mechanics } from "@/data/providers";
import type { Provider } from "@/components/ProviderCard";

const faults = [
  { icon: "⚡", label: "Won't start" },
  { icon: "🔋", label: "Dead battery" },
  { icon: "🌡️", label: "Overheating" },
  { icon: "💨", label: "Flat tyre" },
  { icon: "🛞", label: "Brake issue" },
  { icon: "💡", label: "Electrical" },
  { icon: "🚗", label: "Engine noise" },
  { icon: "💧", label: "Fluid leak" },
  { icon: "❓", label: "Not sure" },
];

interface Props {
  onSelectProvider: (p: Provider) => void;
}

const MechanicScreen = ({ onSelectProvider }: Props) => {
  const [selectedFault, setSelectedFault] = useState<string | null>(null);
  const dir = useDirections();

  const startFor = (m: Provider) => {
    const c = syntheticCoord(m.id);
    dir.start({ id: m.id, name: m.name, lat: c.lat, lng: c.lng });
  };

  const mapMarkers: MapMarker[] = useMemo(() => {
    if (dir.target) {
      return [{ id: dir.target.id, lat: dir.target.lat!, lng: dir.target.lng!, title: dir.target.name, variant: "accent" }];
    }
    return mechanics.map((m) => {
      const { lat, lng } = syntheticCoord(m.id);
      return {
        id: m.id,
        lat,
        lng,
        title: m.name,
        variant: "accent" as const,
        onClick: () => startFor(m),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dir.target]);

  const bookSelected = () => {
    const m = mechanics.find((x) => x.id === dir.target?.id);
    if (m) onSelectProvider(m);
  };

  return (
    <div className="p-3.5 animate-fade-in">
      <h2 className="text-[15px] font-semibold mb-1">Find a roadside mechanic</h2>
      <p className="text-[11px] text-muted-foreground mb-3">
        Stranded with a fault? Pick your issue and we'll connect you to a verified mobile mechanic nearby. Tap a pin for turn-by-turn directions.
      </p>

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

      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        📍 Ikeja, Lagos · {mechanics.length} mechanics nearby
      </p>

      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">What's the problem?</p>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {faults.map((f) => (
          <button
            key={f.label}
            onClick={() => setSelectedFault(selectedFault === f.label ? null : f.label)}
            className={`bg-card border rounded-lg p-2.5 text-center cursor-pointer transition-all ${
              selectedFault === f.label
                ? "border-secondary bg-secondary-light"
                : "border-border hover:border-secondary"
            }`}
          >
            <div className="text-lg mb-0.5">{f.icon}</div>
            <div className={`text-[10px] font-medium ${selectedFault === f.label ? "text-secondary" : "text-foreground"}`}>
              {f.label}
            </div>
          </button>
        ))}
      </div>

      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Nearest verified mechanics</p>

      {mechanics.map((m) => (
        <div key={m.id} className="relative">
          <ProviderCard provider={m} onClick={() => onSelectProvider(m)} />
          <button
            onClick={(e) => { e.stopPropagation(); startFor(m); }}
            className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-1 rounded-full bg-primary-light text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            🧭 Directions
          </button>
        </div>
      ))}

      <p className="text-center text-[10px] text-muted-foreground pt-3 border-t border-border mt-2">
        Tap any mechanic to book · Tap 🧭 for turn-by-turn navigation
      </p>
    </div>
  );
};

export default MechanicScreen;
