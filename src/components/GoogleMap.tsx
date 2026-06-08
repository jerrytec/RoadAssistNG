/// <reference types="google.maps" />
import { useEffect, useRef, useState, memo } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { loadGoogleMaps } from "@/lib/googleMaps";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  /** Marker color hint: primary (provider), accent (you), destructive (SOS) */
  variant?: "primary" | "accent" | "destructive" | "muted";
  onClick?: () => void;
}

interface Props {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  /** Draw a polyline through these coords */
  route?: { lat: number; lng: number }[];
  /** Cluster markers when dense */
  cluster?: boolean;
  /** Track the browser's geolocation and add a "You" marker */
  trackUser?: boolean;
  className?: string;
  height?: number | string;
  /** Fit bounds to all markers on mount/update */
  fitBounds?: boolean;
}

const COLOR: Record<NonNullable<MapMarker["variant"]>, string> = {
  primary: "#0F6E56",
  accent: "#2563eb",
  destructive: "#dc2626",
  muted: "#64748b",
};

const DEFAULT_CENTER = { lat: 6.6018, lng: 3.3515 }; // Ikeja, Lagos

function GoogleMapBase({
  center,
  zoom = 12,
  markers = [],
  route,
  cluster = false,
  trackUser = false,
  className = "",
  height = 260,
  fitBounds = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerObjsRef = useRef<google.maps.Marker[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  // Initialise map once.
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps(["maps", "marker"])
      .then((g) => {
        if (cancelled || !ref.current) return;
        mapRef.current = new g.maps.Map(ref.current, {
          center: center ?? DEFAULT_CENTER,
          zoom,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          gestureHandling: "greedy",
        });
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
      if (watchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync markers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;
    markerObjsRef.current.forEach((m) => m.setMap(null));
    clustererRef.current?.clearMarkers();
    markerObjsRef.current = [];

    const objs = markers.map((m) => {
      const marker = new google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        title: m.title,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: COLOR[m.variant ?? "primary"],
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      if (m.onClick) marker.addListener("click", m.onClick);
      return marker;
    });
    markerObjsRef.current = objs;

    if (cluster && objs.length > 0) {
      clustererRef.current = new MarkerClusterer({ map, markers: objs });
    } else {
      objs.forEach((o) => o.setMap(map));
    }

    if (fitBounds && objs.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      objs.forEach((o) => {
        const p = o.getPosition();
        if (p) bounds.extend(p);
      });
      map.fitBounds(bounds, 48);
    }
  }, [markers, cluster, fitBounds, status]);

  // Sync route polyline.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== "ready") return;
    polylineRef.current?.setMap(null);
    polylineRef.current = null;
    if (route && route.length > 1) {
      polylineRef.current = new google.maps.Polyline({
        path: route,
        geodesic: true,
        strokeColor: COLOR.primary,
        strokeOpacity: 0.9,
        strokeWeight: 4,
        map,
      });
    }
  }, [route, status]);

  // Recenter when center prop changes.
  useEffect(() => {
    if (mapRef.current && center) mapRef.current.panTo(center);
  }, [center?.lat, center?.lng]);

  // Track user location.
  useEffect(() => {
    if (!trackUser || status !== "ready" || !navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const map = mapRef.current;
        if (!map) return;
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (!userMarkerRef.current) {
          userMarkerRef.current = new google.maps.Marker({
            position: p,
            map,
            title: "You",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: COLOR.destructive,
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 2,
            },
          });
        } else {
          userMarkerRef.current.setPosition(p);
        }
      },
      undefined,
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      userMarkerRef.current?.setMap(null);
      userMarkerRef.current = null;
    };
  }, [trackUser, status]);

  return (
    <div
      className={`relative rounded-xl overflow-hidden border border-border bg-muted ${className}`}
      style={{ height }}
    >
      <div ref={ref} className="w-full h-full" />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground bg-muted">
          Loading map…
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground bg-muted p-4 text-center">
          <span>Map unavailable.</span>
          <button
            onClick={() => window.location.reload()}
            className="text-primary font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

const GoogleMap = memo(GoogleMapBase);
export default GoogleMap;
