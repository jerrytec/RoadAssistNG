// Sends SMS to a user's trusted contacts when SOS is triggered.
// Uses Twilio via the Lovable connector gateway when available; otherwise no-ops.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const userId = userData.user.id;

    const { request_id, share_token } = await req.json().catch(() => ({}));
    if (!request_id) return new Response(JSON.stringify({ error: "request_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: sos } = await admin.from("service_requests").select("id, buyer_id, sos_lat, sos_lng, service_type").eq("id", request_id).maybeSingle();
    if (!sos || sos.buyer_id !== userId) return new Response(JSON.stringify({ error: "not allowed" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: profile } = await admin.from("profiles").select("full_name").eq("id", userId).maybeSingle();
    const { data: contacts } = await admin.from("trusted_contacts").select("name, phone").eq("user_id", userId).eq("notify_on_sos", true);

    const trackUrl = share_token ? `${Deno.env.get("APP_URL") ?? "https://app.roadassistng.com"}/sos/track/${share_token}` : "";
    const name = profile?.full_name ?? "Someone you know";
    const loc = sos.sos_lat && sos.sos_lng ? `https://maps.google.com/?q=${sos.sos_lat},${sos.sos_lng}` : "location pending";
    const body = `🚨 ${name} triggered an SOS on RoadAssistNG (${sos.service_type}). Live: ${trackUrl || loc}`;

    const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
    const TWILIO_FROM = Deno.env.get("TWILIO_FROM_NUMBER");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    let sent = 0;
    const skipped: string[] = [];

    if (!contacts?.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0, total: 0, mode: "no_contacts" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!TWILIO_API_KEY || !TWILIO_FROM || !LOVABLE_API_KEY) {
      // Log only — Twilio not configured yet
      await admin.from("sos_events").insert({ request_id, kind: "notify_contacts_pending", payload: { count: contacts.length, reason: "twilio_not_configured" }, actor_id: userId });
      return new Response(JSON.stringify({ ok: true, sent: 0, total: contacts.length, mode: "preview", message: "Twilio not connected — contacts not messaged" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    for (const c of contacts) {
      try {
        const res = await fetch(`https://connector-gateway.lovable.dev/twilio/Messages.json`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": TWILIO_API_KEY,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ To: c.phone, From: TWILIO_FROM, Body: body }),
        });
        if (res.ok) sent++; else skipped.push(`${c.phone}:${res.status}`);
      } catch (e) {
        skipped.push(`${c.phone}:err`);
      }
    }

    await admin.from("sos_events").insert({ request_id, kind: "notify_contacts_sent", payload: { sent, total: contacts.length, skipped }, actor_id: userId });

    return new Response(JSON.stringify({ ok: true, sent, total: contacts.length, skipped }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
