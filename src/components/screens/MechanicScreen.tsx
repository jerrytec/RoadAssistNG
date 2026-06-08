import { useState, useMemo, useEffect } from "react";
import ProviderCard from "@/components/ProviderCard";
import GoogleMap, { type MapMarker } from "@/components/GoogleMap";
import { syntheticCoord, loadGoogleMaps } from "@/lib/googleMaps";
import { mechanics } from "@/data/providers";
import type { Provider } from "@/components/ProviderCard";
import {
  fetchDirections,
  formatDistance,
  formatDuration,
  stripHtml,
  type DirectionsResult,
} from "@/lib/directions";
import { toast } from "sonner";

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

const DEFAULT_ORIGIN = { lat: 6.6018, lng: 3.3515 };

interface Props {
  onSelectProvider: (p: Provider) => void;
}

const MechanicScreen = ({ onSelectProvider }: Props) => {
  const [selectedFault, setSelectedFault] = useState<string | null>(null);
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [routeFor, setRouteFor] = useState<Provider | null>(null);
  const [directions, setDirections] = useState<DirectionsResult | null>(null);
  const [routePath, setRoutePath] = useState<{ lat: number; lng: number }[] | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Get user's location once.
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setOrigin({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setOrigin(DEFAULT_ORIGIN),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  }, []);

  const startDirections = async (m: Provider) => {
    const from = origin ?? DEFAULT_ORIGIN;
    const to = syntheticCoord(m.id);
    setRouteFor(m);
    setDirections(null);
    setRoutePath(null);
    setLoadingRoute(true);
    try {
      const [res, g] = await Promise.all([fetchDirections(from, to), loadGoogleMaps()]);
      const path = g.maps.geometry.encoding
        .decodePath(res.polyline)
        .map((p) => ({ lat: p.lat(), lng: p.lng() }));
      setDirections(res);
      setRoutePath(path);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not load directions");
      setRouteFor(null);
    } finally {
      setLoadingRoute(false);
    }
  };

  const clearRoute = () => {
    setRouteFor(null);
    setDirections(null);
    setRoutePath(null);
  };

  const mapMarkers: MapMarker[] = useMemo(() => {
    if (routeFor) {
      const to = syntheticCoord(routeFor.id);
      return [{ id: routeFor.id, lat: to.lat, lng: to.lng, title: routeFor.name, variant: "accent" }];
    }
    return mechanics.map((m) => {
      const { lat, lng } = syntheticCoord(m.id);
      return {
        id: m.id,
        lat,
        lng,
        title: m.name,
        variant: "accent" as const,
        onClick: () => startDirections(m),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeFor, origin]);

  return (
    <div className="p-3.5 animate-fade-in">
      <h2 className="text-[15px] font-semibold mb-1">Find a roadside mechanic</h2>
      <p className="text-[11px] text-muted-foreground mb-3">
        Stranded with a fault? Pick your issue and we'll connect you to a verified mobile mechanic nearby. Tap a pin for turn-by-turn directions.
      </p>

      {/* Live map */}
      <div className="mb-3">
        <GoogleMap
          markers={mapMarkers}
          route={routePath ?? undefined}
          cluster={!routeFor}
          trackUser
          fitBounds
          height={routeFor ? 240 : 180}
        />
      </div>

      {/* Directions panel */}
      {routeFor && (
        <div className="bg-card border border-border rounded-xl p-3 mb-3 animate-fade-in">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Directions to
              </p>
              <h3 className="text-sm font-bold">{routeFor.name}</h3>
              {directions && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {formatDistance(directions.distance_meters)} ·{" "}
                  <span className="text-primary font-semibold">{formatDuration(directions.duration_seconds)}</span>
                </p>
              )}
            </div>
            <button
              onClick={clearRoute}
              className="text-[11px] text-muted-foreground hover:text-foreground"
              aria-label="Clear directions"
            >
              ✕
            </button>
          </div>

          {loadingRoute && (
            <p className="text-[11px] text-muted-foreground py-4 text-center">Calculating route…</p>
          )}

          {directions && (
            <>
              <ol className="max-h-60 overflow-y-auto divide-y divide-border border border-border rounded-lg">
                {directions.steps.map((s, i) => (
                  <li key={i} className="p-2.5 flex gap-2 items-start">
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] leading-snug">{stripHtml(s.instruction) || s.maneuver}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDistance(s.distance_meters)} · {formatDuration(s.duration_seconds)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <button
                onClick={() => onSelectProvider(routeFor)}
                className="w-full mt-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold"
              >
                Book {routeFor.name}
              </button>
            </>
          )}
        </div>
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
            onClick={(e) => { e.stopPropagation(); startDirections(m); }}
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
