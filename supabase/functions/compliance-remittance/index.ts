// Admin remittance batch operations. Requires compliance/finance/super_admin role.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const token = auth.replace(/^Bearer\s+/i, "");
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supaAnon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false },
    });
    const { data: u } = await supaAnon.auth.getUser();
    const uid = u?.user?.id;
    if (!uid) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const { data: roleRow } = await admin.from("admin_roles").select("role").eq("user_id", uid);
    const roles = (roleRow ?? []).map((r: any) => r.role);
    const allowed = roles.some((r: string) => ["super_admin", "finance", "compliance"].includes(r));
    if (!allowed) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

    const body = await req.json();
    const action = body?.action as string;

    if (action === "create_batch") {
      const { data: pending } = await admin.from("compliance_ledger")
        .select("id, compliance_fee_kobo").eq("remittance_status", "pending");
      if (!pending || pending.length === 0) {
        return new Response(JSON.stringify({ error: "No pending entries" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const total = pending.reduce((s, p: any) => s + Number(p.compliance_fee_kobo || 0), 0);
      const { data: batch, error } = await admin.from("compliance_remittance_batches")
        .insert({ total_amount_kobo: total, entry_count: pending.length, status: "processing", notes: body.notes ?? null })
        .select().single();
      if (error) throw error;
      const ids = pending.map((p: any) => p.id);
      await admin.from("compliance_ledger").update({ remittance_status: "processing", remittance_batch_id: batch.id }).in("id", ids);
      return new Response(JSON.stringify({ ok: true, batch }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "complete_batch") {
      const batchId = body.batch_id as string;
      if (!batchId) return new Response(JSON.stringify({ error: "batch_id required" }), { status: 400, headers: corsHeaders });
      await admin.from("compliance_ledger").update({ remittance_status: "completed" }).eq("remittance_batch_id", batchId);
      await admin.from("compliance_remittance_batches").update({ status: "completed", processed_at: new Date().toISOString() }).eq("id", batchId);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
