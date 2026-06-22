import { useState, useMemo } from "react";
import { Zap, BatteryWarning, Thermometer, Wind, Disc3, Lightbulb, Car, Droplets, HelpCircle, MapPin, type LucideIcon } from "lucide-react";
import NearestProvidersList from "@/components/NearestProvidersList";
import GoogleMap, { type MapMarker } from "@/components/GoogleMap";
import DirectionsPanel from "@/components/DirectionsPanel";
import { useDirections } from "@/hooks/useDirections";
import { syntheticCoord } from "@/lib/googleMaps";
import { mechanics } from "@/data/providers";
import type { Provider } from "@/components/ProviderCard";

const faults: { Icon: LucideIcon; label: string }[] = [
  { Icon: Zap,            label: "Won't start" },
  { Icon: BatteryWarning, label: "Dead battery" },
  { Icon: Thermometer,    label: "Overheating" },
  { Icon: Wind,           label: "Flat tyre" },
  { Icon: Disc3,          label: "Brake issue" },
  { Icon: Lightbulb,      label: "Electrical" },
  { Icon: Car,            label: "Engine noise" },
  { Icon: Droplets,       label: "Fluid leak" },
  { Icon: HelpCircle,     label: "Not sure" },
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

      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 inline-flex items-center gap-1">
        <MapPin className="w-3 h-3" aria-hidden="true" /> Ikeja, Lagos · {mechanics.length} mechanics nearby
      </p>

      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">What's the problem?</p>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {faults.map((f) => {
          const FaultIcon = f.Icon;
          const active = selectedFault === f.label;
          return (
            <button
              key={f.label}
              onClick={() => setSelectedFault(active ? null : f.label)}
              aria-pressed={active}
              className={`bg-card border rounded-lg p-2.5 flex flex-col items-center gap-1 cursor-pointer transition-all duration-200 ${
                active
                  ? "border-secondary bg-secondary-light"
                  : "border-border hover:border-secondary hover:-translate-y-0.5 hover:shadow-sm"
              }`}
            >
              <FaultIcon className={`w-5 h-5 ${active ? "text-secondary" : "text-muted-foreground"}`} strokeWidth={1.75} aria-hidden="true" />
              <div className={`text-[10px] font-medium ${active ? "text-secondary" : "text-foreground"}`}>
                {f.label}
              </div>
            </button>
          );
        })}
      </div>

      <NearestProvidersList
        providers={mechanics}
        heading="Nearest verified mechanics"
        onSelect={onSelectProvider}
        onDirections={startFor}
      />
    </div>
  );
};

export default MechanicScreen;
