// Prembly (Identitypass) BVN/NIN verification
// Docs: https://docs.prembly.com/docs/identity-services
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PREMBLY_BASE = "https://api.prembly.com/identitypass/verification";

async function premblyCall(path: string, body: Record<string, string>) {
  const apiKey = Deno.env.get("PREMBLY_API_KEY");
  const appId = Deno.env.get("PREMBLY_APP_ID");
  if (!apiKey || !appId) {
    return { ok: false, mock: true, message: "PREMBLY credentials not configured — saved as pending for manual review." };
  }
  const res = await fetch(`${PREMBLY_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "app-id": appId,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && (data.status === true || data.status === "success"), data, status: res.status };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const nin = String(body.nin ?? "").trim();
    const bvn = String(body.bvn ?? "").trim();
    const union_id = String(body.union_id ?? "").trim() || null;
    const union_name = String(body.union_name ?? "").trim() || null;

    if (!/^\d{11}$/.test(nin)) return new Response(JSON.stringify({ error: "NIN must be 11 digits" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!/^\d{11}$/.test(bvn)) return new Response(JSON.stringify({ error: "BVN must be 11 digits" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const ninRes = await premblyCall("/nin", { number: nin });
    const bvnRes = await premblyCall("/bvn_validation", { number: bvn });

    const nin_verified = !!ninRes.ok;
    const bvn_verified = !!bvnRes.ok;
    const allVerified = nin_verified && bvn_verified;

    // Service role for write so we don't depend on user RLS for admin fields
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error } = await admin.from("provider_kyc").upsert({
      user_id: u.user.id,
      nin, bvn, union_id, union_name,
      nin_verified, bvn_verified,
      nin_data: ninRes.data ?? null,
      bvn_data: bvnRes.data ?? null,
      verification_status: allVerified ? "approved" : "pending",
      verified_at: allVerified ? new Date().toISOString() : null,
    });
    if (error) throw error;

    // Mirror onto vendors table for parts sellers
    await admin.from("vendors").update({
      nin, bvn, union_id, union_name,
      verification_status: allVerified ? "approved" : "pending",
      verified_at: allVerified ? new Date().toISOString() : null,
    }).eq("user_id", u.user.id);

    return new Response(JSON.stringify({
      success: true, nin_verified, bvn_verified,
      status: allVerified ? "approved" : "pending",
      mock: ninRes.mock || bvnRes.mock || false,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
