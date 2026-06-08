import { useState, useCallback } from "react";
import { toast } from "sonner";
import { fetchDirections, type DirectionsResult } from "@/lib/directions";
import { loadGoogleMaps, syntheticCoord } from "@/lib/googleMaps";

const DEFAULT_ORIGIN = { lat: 6.6018, lng: 3.3515 }; // Ikeja, Lagos fallback

export type TravelMode = "DRIVE" | "WALK" | "TWO_WHEELER";

export interface DirectionsTarget {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
}

export type LocationErrorKind = "denied" | "unavailable" | "timeout" | "unsupported" | null;

function getOriginOnce(): Promise<{ coords: { lat: number; lng: number }; error: LocationErrorKind }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ coords: DEFAULT_ORIGIN, error: "unsupported" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ coords: { lat: p.coords.latitude, lng: p.coords.longitude }, error: null }),
      (err) => {
        const kind: LocationErrorKind =
          err.code === err.PERMISSION_DENIED
            ? "denied"
            : err.code === err.POSITION_UNAVAILABLE
            ? "unavailable"
            : err.code === err.TIMEOUT
            ? "timeout"
            : "unavailable";
        resolve({ coords: DEFAULT_ORIGIN, error: kind });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  });
}

export const LOCATION_ERROR_MESSAGE: Record<NonNullable<LocationErrorKind>, string> = {
  denied: "Location permission denied. Using Ikeja as a fallback.",
  unavailable: "Couldn't read your GPS. Using Ikeja as a fallback.",
  timeout: "GPS took too long. Using Ikeja as a fallback.",
  unsupported: "Your browser doesn't support geolocation. Using Ikeja as a fallback.",
};

export function useDirections() {
  const [target, setTarget] = useState<DirectionsTarget | null>(null);
  const [directions, setDirections] = useState<DirectionsResult | null>(null);
  const [path, setPath] = useState<{ lat: number; lng: number }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [travelMode, setTravelMode] = useState<TravelMode>("DRIVE");
  const [swapped, setSwapped] = useState(false);
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<LocationErrorKind>(null);

  const compute = useCallback(
    async (t: DirectionsTarget, mode: TravelMode, swap: boolean, originOverride?: { lat: number; lng: number } | null) => {
      const destCoords =
        t.lat != null && t.lng != null ? { lat: t.lat, lng: t.lng } : syntheticCoord(t.id);

      let me = originOverride ?? originCoords;
      if (!me) {
        const { coords, error } = await getOriginOnce();
        me = coords;
        setOriginCoords(coords);
        setLocationError(error);
      }

      const origin = swap ? destCoords : me;
      const destination = swap ? me : destCoords;

      setLoading(true);
      try {
        const [res, g] = await Promise.all([fetchDirections(origin, destination, mode), loadGoogleMaps()]);
        const decoded = g.maps.geometry.encoding
          .decodePath(res.polyline)
          .map((p) => ({ lat: p.lat(), lng: p.lng() }));
        setDirections(res);
        setPath(decoded);
      } catch (e: any) {
        toast.error(e?.message ?? "Could not load directions");
        setDirections(null);
        setPath(null);
      } finally {
        setLoading(false);
      }
    },
    [originCoords]
  );

  const start = useCallback(
    async (t: DirectionsTarget) => {
      setTarget(t);
      setSwapped(false);
      await compute(t, travelMode, false);
    },
    [compute, travelMode]
  );

  const changeMode = useCallback(
    async (mode: TravelMode) => {
      setTravelMode(mode);
      if (target) await compute(target, mode, swapped);
    },
    [compute, target, swapped]
  );

  const swap = useCallback(async () => {
    if (!target) return;
    const next = !swapped;
    setSwapped(next);
    await compute(target, travelMode, next);
  }, [compute, target, swapped, travelMode]);

  const retryLocation = useCallback(async () => {
    setLocationError(null);
    setOriginCoords(null);
    const { coords, error } = await getOriginOnce();
    setOriginCoords(coords);
    setLocationError(error);
    if (target) await compute(target, travelMode, swapped, coords);
  }, [compute, target, swapped, travelMode]);

  const clear = useCallback(() => {
    setTarget(null);
    setDirections(null);
    setPath(null);
    setSwapped(false);
  }, []);

  const destCoords =
    target?.lat != null && target?.lng != null ? { lat: target.lat, lng: target.lng } : null;

  return {
    target,
    directions,
    path,
    loading,
    travelMode,
    swapped,
    originCoords,
    destCoords,
    locationError,
    start,
    changeMode,
    swap,
    retryLocation,
    clear,
  };
}
