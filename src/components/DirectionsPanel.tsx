import { formatDistance, formatDuration, stripHtml, type DirectionsResult } from "@/lib/directions";
import type { TravelMode, LocationErrorKind } from "@/hooks/useDirections";
import { LOCATION_ERROR_MESSAGE } from "@/hooks/useDirections";

interface Props {
  targetName: string;
  directions: DirectionsResult | null;
  loading: boolean;
  travelMode: TravelMode;
  swapped: boolean;
  locationError: LocationErrorKind;
  origin?: { lat: number; lng: number } | null;
  destination?: { lat: number; lng: number } | null;
  onChangeMode: (m: TravelMode) => void;
  onSwap: () => void;
  onRetryLocation: () => void;
  onClose: () => void;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
}

const MODES: { value: TravelMode; icon: string; label: string }[] = [
  { value: "DRIVE", icon: "🚗", label: "Drive" },
  { value: "TWO_WHEELER", icon: "🛵", label: "Bike" },
  { value: "WALK", icon: "🚶", label: "Walk" },
];

const DirectionsPanel = ({
  targetName,
  directions,
  loading,
  travelMode,
  swapped,
  locationError,
  origin,
  destination,
  onChangeMode,
  onSwap,
  onRetryLocation,
  onClose,
  onPrimaryAction,
  primaryActionLabel,
}: Props) => {
  const fromLabel = swapped ? targetName : "Your location";
  const toLabel = swapped ? "Your location" : targetName;

  const externalHref = (() => {
    if (!origin || !destination) return null;
    const o = swapped ? destination : origin;
    const d = swapped ? origin : destination;
    const mode = travelMode === "WALK" ? "walking" : travelMode === "TWO_WHEELER" ? "two-wheeler" : "driving";
    return `https://www.google.com/maps/dir/?api=1&origin=${o.lat},${o.lng}&destination=${d.lat},${d.lng}&travelmode=${mode}`;
  })();

  return (
    <div className="bg-card border border-border rounded-xl p-3 mb-3 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Directions</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[12px] truncate max-w-[120px]" title={fromLabel}>{fromLabel}</span>
            <span className="text-muted-foreground text-[11px]">→</span>
            <span className="text-[12px] font-bold truncate max-w-[140px]" title={toLabel}>{toLabel}</span>
          </div>
          {directions && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {formatDistance(directions.distance_meters)} ·{" "}
              <span className="text-primary font-semibold">{formatDuration(directions.duration_seconds)}</span>
            </p>
          )}
        </div>
        <button onClick={onClose} className="text-[14px] text-muted-foreground hover:text-foreground shrink-0" aria-label="Close directions">
          ✕
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <div className="flex gap-1 bg-muted rounded-full p-0.5">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => onChangeMode(m.value)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                travelMode === m.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
              aria-pressed={travelMode === m.value}
            >
              <span aria-hidden>{m.icon}</span> {m.label}
            </button>
          ))}
        </div>
        <button
          onClick={onSwap}
          className="px-2.5 py-1 rounded-full text-[11px] font-semibold border border-border hover:bg-muted transition-colors"
          aria-label="Swap origin and destination"
          title="Swap origin and destination"
        >
          ⇅ Swap
        </button>
        {externalHref && (
          <a
            href={externalHref}
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-[11px] font-semibold text-primary hover:underline"
          >
            Open in Google Maps ↗
          </a>
        )}
      </div>

      {/* Location error */}
      {locationError && (
        <div className="mb-2 flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-lg p-2">
          <span aria-hidden>⚠️</span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-destructive">{LOCATION_ERROR_MESSAGE[locationError]}</p>
          </div>
          <button
            onClick={onRetryLocation}
            className="text-[11px] font-semibold text-destructive underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* States */}
      {loading && <p className="text-[11px] text-muted-foreground py-4 text-center">Calculating route…</p>}

      {!loading && !directions && (
        <p className="text-[11px] text-muted-foreground py-4 text-center">
          No route available. Try a different travel mode or retry.
        </p>
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
                  <p className="text-[12px] leading-snug">{stripHtml(s.instruction) || s.maneuver || "Continue"}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDistance(s.distance_meters)} · {formatDuration(s.duration_seconds)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          {onPrimaryAction && (
            <button
              onClick={onPrimaryAction}
              className="w-full mt-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold"
            >
              {primaryActionLabel ?? "Continue"}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default DirectionsPanel;
