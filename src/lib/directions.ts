import { supabase } from "@/integrations/supabase/client";

export interface DirectionsStep {
  instruction: string;
  maneuver: string;
  distance_meters: number;
  duration_seconds: number;
  polyline: string;
}

export interface DirectionsResult {
  polyline: string;
  distance_meters: number;
  duration_seconds: number;
  steps: DirectionsStep[];
}

export async function fetchDirections(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  travelMode: "DRIVE" | "WALK" | "TWO_WHEELER" = "DRIVE"
): Promise<DirectionsResult> {
  const { data, error } = await supabase.functions.invoke("directions", {
    body: { origin, destination, travelMode },
  });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as DirectionsResult;
}

export function formatDistance(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

export function formatDuration(s: number) {
  if (s < 60) return `${s}s`;
  const mins = Math.round(s / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Strip HTML tags returned by Google's navigation instructions. */
export function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, "");
}
