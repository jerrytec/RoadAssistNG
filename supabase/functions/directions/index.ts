// Computes driving directions via Google Routes API (through the Lovable connector gateway).
// Input:  { origin: {lat,lng}, destination: {lat,lng} }
// Output: { polyline: string, distance_meters: number, duration_seconds: number, steps: [{instruction, distance_meters, duration_seconds, polyline}] }

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing Google Maps connector credentials" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { origin, destination, travelMode = "DRIVE" } = await req.json();
    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
      return new Response(JSON.stringify({ error: "origin and destination {lat,lng} required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = {
      origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
      destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
      travelMode,
      routingPreference: travelMode === "DRIVE" ? "TRAFFIC_AWARE" : undefined,
      computeAlternativeRoutes: false,
      languageCode: "en-US",
      units: "METRIC",
    };

    const fieldMask = [
      "routes.distanceMeters",
      "routes.duration",
      "routes.polyline.encodedPolyline",
      "routes.legs.steps.navigationInstruction",
      "routes.legs.steps.distanceMeters",
      "routes.legs.steps.staticDuration",
      "routes.legs.steps.polyline.encodedPolyline",
    ].join(",");

    const upstream = await fetch(`${GATEWAY_URL}/routes/directions/v2:computeRoutes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
        "Content-Type": "application/json",
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify(body),
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: "Routes API failed", status: upstream.status, body: text }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = JSON.parse(text);
    const route = data.routes?.[0];
    if (!route) {
      return new Response(JSON.stringify({ error: "No route found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const steps = (route.legs?.[0]?.steps ?? []).map((s: any) => ({
      instruction: s.navigationInstruction?.instructions ?? "",
      maneuver: s.navigationInstruction?.maneuver ?? "",
      distance_meters: s.distanceMeters ?? 0,
      duration_seconds: parseInt((s.staticDuration ?? "0s").replace("s", ""), 10) || 0,
      polyline: s.polyline?.encodedPolyline ?? "",
    }));

    return new Response(
      JSON.stringify({
        polyline: route.polyline?.encodedPolyline ?? "",
        distance_meters: route.distanceMeters ?? 0,
        duration_seconds: parseInt((route.duration ?? "0s").replace("s", ""), 10) || 0,
        steps,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
