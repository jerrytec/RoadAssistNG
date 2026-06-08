import { useState, useCallback } from "react";
import { toast } from "sonner";
import { fetchDirections, type DirectionsResult } from "@/lib/directions";
import { loadGoogleMaps, syntheticCoord } from "@/lib/googleMaps";

const DEFAULT_ORIGIN = { lat: 6.6018, lng: 3.3515 };

export interface DirectionsTarget {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
}

export function useDirections() {
  const [target, setTarget] = useState<DirectionsTarget | null>(null);
  const [directions, setDirections] = useState<DirectionsResult | null>(null);
  const [path, setPath] = useState<{ lat: number; lng: number }[] | null>(null);
  const [loading, setLoading] = useState(false);

  const getOrigin = () =>
    new Promise<{ lat: number; lng: number }>((resolve) => {
      if (!navigator.geolocation) return resolve(DEFAULT_ORIGIN);
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => resolve(DEFAULT_ORIGIN),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    });

  const start = useCallback(async (t: DirectionsTarget) => {
    const dest =
      t.lat != null && t.lng != null
        ? { lat: t.lat, lng: t.lng }
        : syntheticCoord(t.id);
    setTarget(t);
    setDirections(null);
    setPath(null);
    setLoading(true);
    try {
      const origin = await getOrigin();
      const [res, g] = await Promise.all([fetchDirections(origin, dest), loadGoogleMaps()]);
      const decoded = g.maps.geometry.encoding
        .decodePath(res.polyline)
        .map((p) => ({ lat: p.lat(), lng: p.lng() }));
      setDirections(res);
      setPath(decoded);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not load directions");
      setTarget(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setTarget(null);
    setDirections(null);
    setPath(null);
  }, []);

  return { target, directions, path, loading, start, clear };
}
