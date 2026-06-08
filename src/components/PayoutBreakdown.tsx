import { formatNaira } from "@/lib/format";

type Props = {
  gross_kobo: number;
  platform_fee_kobo?: number | null;
  compliance_fee_kobo?: number | null;
  net_payout_kobo?: number | null;
  fee_label?: string | null;
  variant?: "provider" | "customer";
};

const PayoutBreakdown = ({
  gross_kobo, platform_fee_kobo, compliance_fee_kobo, net_payout_kobo, fee_label, variant = "provider",
}: Props) => {
  const label = fee_label || "Compliance Fee";
  const platform = platform_fee_kobo ?? 0;
  const compliance = compliance_fee_kobo ?? 0;
  const net = net_payout_kobo ?? Math.max(0, gross_kobo - platform - compliance);

  return (
    <div className="border border-border rounded-xl bg-card p-3 space-y-1.5 text-xs">
      <div className="flex justify-between"><span className="text-muted-foreground">Gross {variant === "customer" ? "amount paid" : "earnings"}</span><span className="font-semibold">{formatNaira(gross_kobo)}</span></div>
      {platform > 0 && (
        <div className="flex justify-between"><span className="text-muted-foreground">Platform fee</span><span>−{formatNaira(platform)}</span></div>
      )}
      <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span>−{formatNaira(compliance)}</span></div>
      <div className="border-t border-border pt-1.5 flex justify-between font-bold">
        <span>{variant === "customer" ? "Provider receives" : "Net payout"}</span>
        <span className="text-primary">{formatNaira(net)}</span>
      </div>
    </div>
  );
};

export default PayoutBreakdown;
