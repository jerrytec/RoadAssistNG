import { useMemo } from "react";
import { Truck, Disc3, MapPin, Navigation, type LucideIcon } from "lucide-react";
import ProviderCard, { type Provider } from "@/components/ProviderCard";
import GoogleMap, { type MapMarker } from "@/components/GoogleMap";
import DirectionsPanel from "@/components/DirectionsPanel";
import { useDirections } from "@/hooks/useDirections";
import { syntheticCoord } from "@/lib/googleMaps";
import { allProviders } from "@/data/providers";

interface Props {
  serviceType: "tow" | "vulcanizer";
  onSelectProvider: (p: Provider) => void;
}

const META: Record<Props["serviceType"], { Icon: LucideIcon; title: string; subtitle: string; filter: (p: Provider) => boolean; variant: "primary" }> = {
  tow: {
    Icon: Truck,
    title: "Tow van operators",
    subtitle: "Verified tow vans available near you",
    filter: (p) => p.type.toLowerCase().includes("tow"),
    variant: "primary",
  },
  vulcanizer: {
    Icon: Disc3,
    title: "Vulcanizers",
    subtitle: "Mobile & fixed-shop vulcanizers ready to help",
    filter: (p) => p.type.toLowerCase().includes("vulcanizer"),
    variant: "primary",
  },
};

const ServiceListScreen = ({ serviceType, onSelectProvider }: Props) => {
  const meta = META[serviceType];
  const list = allProviders.filter(meta.filter);
  const dir = useDirections();

  const startFor = (p: Provider) => {
    const c = syntheticCoord(p.id);
    dir.start({ id: p.id, name: p.name, lat: c.lat, lng: c.lng });
  };

  const bookSelected = () => {
    const p = list.find((x) => x.id === dir.target?.id);
    if (p) onSelectProvider(p);
  };

  const markers: MapMarker[] = useMemo(() => {
    if (dir.target) {
      return [{ id: dir.target.id, lat: dir.target.lat!, lng: dir.target.lng!, title: dir.target.name, variant: meta.variant }];
    }
    return list.map((p) => {
      const { lat, lng } = syntheticCoord(p.id);
      return {
        id: p.id,
        lat,
        lng,
        title: p.name,
        variant: meta.variant,
        onClick: () => startFor(p),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, dir.target, meta.variant]);

  const HeaderIcon = meta.Icon;
  return (
    <div className="p-3.5 animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center">
          <HeaderIcon className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <h2 className="text-[15px] font-semibold">{meta.title}</h2>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">{meta.subtitle}</p>

      <div className="mb-3">
        <GoogleMap
          markers={markers}
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
        <MapPin className="w-3 h-3" aria-hidden="true" /> Ikeja, Lagos · {list.length} available
      </p>

      {list.length === 0 ? (
        <div className="text-center text-[12px] text-muted-foreground border border-dashed border-border rounded-lg py-8">
          No providers available right now. Try again shortly.
        </div>
      ) : (
        list.map((p) => (
          <div key={p.id} className="relative">
            <ProviderCard provider={p} onClick={() => onSelectProvider(p)} />
            <button
              onClick={(e) => { e.stopPropagation(); startFor(p); }}
              className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-1 rounded-full bg-primary-light text-primary hover:bg-primary hover:text-primary-foreground transition-colors inline-flex items-center gap-1"
              aria-label={`Directions to ${p.name}`}
            >
              <Navigation className="w-3 h-3" aria-hidden="true" /> Directions
            </button>
          </div>
        ))
      )}

      <p className="text-center text-[10px] text-muted-foreground pt-3 border-t border-border mt-2 inline-flex items-center justify-center gap-1 w-full">
        Tap any provider to book · Tap <Navigation className="w-3 h-3 inline" aria-hidden="true" /> for turn-by-turn navigation
      </p>
    </div>
  );
};

export default ServiceListScreen;
