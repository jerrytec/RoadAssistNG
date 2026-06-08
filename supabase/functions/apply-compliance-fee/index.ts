// Backend-enforced compliance levy calculator.
// Called after a payment is confirmed; idempotent per (transaction_id, transaction_kind).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Body = {
  transaction_id: string;
  transaction_kind: "service" | "parts";
  gross_amount_kobo?: number; // optional override; we re-read from DB
  service_type?: string;
  region?: string;
  provider_id?: string | null;
  buyer_id?: string | null;
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    if (!body?.transaction_id || !body?.transaction_kind) {
      return new Response(JSON.stringify({ error: "transaction_id and transaction_kind required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Idempotency
    const { data: existing } = await supa.from("compliance_ledger")
      .select("id, gross_amount_kobo, platform_fee_kobo, compliance_fee_kobo, net_payout_kobo, fee_label")
      .eq("transaction_id", body.transaction_id).eq("transaction_kind", body.transaction_kind).maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ ok: true, idempotent: true, ledger: existing }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load config
    const { data: cfg, error: cfgErr } = await supa.from("compliance_config").select("*").eq("id", true).single();
    if (cfgErr || !cfg) throw cfgErr || new Error("Missing compliance_config");

    const pct = clamp(Number(cfg.fee_percentage), Number(cfg.min_fee), Number(cfg.max_fee));
    let gross = 0; let provider_id: string | null = null; let buyer_id: string | null = null;
    let service_type: string | null = null; let region: string | null = null;
    let platformPct = 0;

    if (body.transaction_kind === "service") {
      const { data: r, error } = await supa.from("service_requests")
        .select("id, amount_kobo, price_estimate_kobo, payment_status, assigned_provider_id, buyer_id, service_type, location")
        .eq("id", body.transaction_id).single();
      if (error || !r) throw error || new Error("Service request not found");
      if (r.payment_status !== "paid") {
        return new Response(JSON.stringify({ error: "Payment not confirmed" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      gross = r.amount_kobo ?? r.price_estimate_kobo ?? 0;
      provider_id = r.assigned_provider_id; buyer_id = r.buyer_id;
      service_type = r.service_type; region = r.location;
      platformPct = Number(cfg.platform_service_fee_percentage);
    } else {
      const { data: o, error } = await supa.from("parts_orders")
        .select("id, total_kobo, status, buyer_id")
        .eq("id", body.transaction_id).single();
      if (error || !o) throw error || new Error("Order not found");
      if (o.status !== "paid" && o.status !== "delivered") {
        return new Response(JSON.stringify({ error: "Order not paid" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      gross = o.total_kobo ?? 0;
      buyer_id = o.buyer_id;
      platformPct = Number(cfg.platform_parts_fee_percentage);
    }

    const platform_fee = Math.round(gross * platformPct);
    const compliance_fee = Math.round(gross * pct);
    const net_payout = Math.max(0, gross - platform_fee - compliance_fee);

    const { data: ledger, error: insErr } = await supa.from("compliance_ledger").insert({
      transaction_id: body.transaction_id,
      transaction_kind: body.transaction_kind,
      provider_id, buyer_id, service_type, region,
      gross_amount_kobo: gross,
      platform_fee_kobo: platform_fee,
      compliance_fee_kobo: compliance_fee,
      net_payout_kobo: net_payout,
      fee_percentage_applied: pct,
      fee_label: cfg.fee_label,
    }).select().single();
    if (insErr) throw insErr;

    const updateCols = {
      platform_fee_kobo: platform_fee,
      compliance_fee_kobo: compliance_fee,
      net_payout_kobo: net_payout,
      fee_label: cfg.fee_label,
    };
    if (body.transaction_kind === "service") {
      await supa.from("service_requests").update(updateCols).eq("id", body.transaction_id);
    } else {
      await supa.from("parts_orders").update(updateCols).eq("id", body.transaction_id);
    }

    return new Response(JSON.stringify({ ok: true, ledger }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
