import { supabase } from "@/integrations/supabase/client";

export type LedgerEntry = {
  id: string;
  transaction_id: string;
  transaction_kind: "service" | "parts";
  gross_amount_kobo: number;
  platform_fee_kobo: number;
  compliance_fee_kobo: number;
  net_payout_kobo: number;
  fee_label: string;
  fee_percentage_applied: number;
};

export async function applyComplianceFee(input: {
  transaction_id: string;
  transaction_kind: "service" | "parts";
}): Promise<LedgerEntry | null> {
  try {
    const { data, error } = await supabase.functions.invoke("apply-compliance-fee", { body: input });
    if (error) { console.error("[compliance]", error); return null; }
    return (data as any)?.ledger ?? null;
  } catch (e) {
    console.error("[compliance]", e);
    return null;
  }
}
