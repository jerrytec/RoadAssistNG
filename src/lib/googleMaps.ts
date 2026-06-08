/// <reference types="google.maps" />
// Singleton loader for the Google Maps JavaScript API.
// Loads asynchronously with a callback so google.maps is ready when the promise resolves.

let loaderPromise: Promise<typeof google> | null = null;

const BROWSER_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
const TRACKING_ID = import.meta.env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID as string | undefined;

export function loadGoogleMaps(libraries: string[] = ["maps", "marker", "geometry"]): Promise<typeof google> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if ((window as any).google?.maps) return Promise.resolve((window as any).google);
  if (loaderPromise) return loaderPromise;

  if (!BROWSER_KEY) {
    return Promise.reject(new Error("Google Maps browser key missing"));
  }

  loaderPromise = new Promise((resolve, reject) => {
    const cbName = `__gmapsInit_${Math.random().toString(36).slice(2)}`;
    (window as any)[cbName] = () => {
      resolve((window as any).google);
      delete (window as any)[cbName];
    };

    const params = new URLSearchParams({
      key: BROWSER_KEY,
      loading: "async",
      callback: cbName,
      libraries: libraries.join(","),
      v: "weekly",
    });
    if (TRACKING_ID) params.set("channel", TRACKING_ID);

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      loaderPromise = null;
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(script);
  });

  return loaderPromise;
}

// Deterministic pseudo-coordinate from an id, scattered around a center.
// Used when seed providers have no real lat/lng yet.
export function syntheticCoord(id: string, center = { lat: 6.6018, lng: 3.3515 }, spread = 0.05) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const dx = ((h & 0xffff) / 0xffff - 0.5) * spread * 2;
  const dy = (((h >> 16) & 0xffff) / 0xffff - 0.5) * spread * 2;
  return { lat: center.lat + dy, lng: center.lng + dx };
}
