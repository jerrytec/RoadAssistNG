import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/format";
import { useComplianceConfig, useUpdateComplianceConfig } from "@/hooks/useComplianceConfig";
import { toast } from "sonner";
import { Download, Send, CheckCircle2 } from "lucide-react";

const LABEL_PRESETS = ["State Digital Service Levy", "Infrastructure Fee", "Platform Compliance Fee"];

const Stat = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="bg-card border border-border rounded-xl p-4">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="text-xl font-bold mt-1">{value}</p>
    {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
  </div>
);

const AdminCompliance = () => {
  const qc = useQueryClient();
  const { data: cfg } = useComplianceConfig();
  const updateCfg = useUpdateComplianceConfig();
  const [pct, setPct] = useState<number | null>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | "service" | "parts">("all");

  const { data: ledger } = useQuery({
    queryKey: ["compliance-ledger", from, to, kindFilter],
    queryFn: async () => {
      let q = (supabase as any).from("compliance_ledger").select("*").order("created_at", { ascending: false }).limit(500);
      if (from) q = q.gte("created_at", from);
      if (to) q = q.lte("created_at", new Date(new Date(to).getTime() + 86400000).toISOString());
      if (kindFilter !== "all") q = q.eq("transaction_kind", kindFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data: batches } = useQuery({
    queryKey: ["compliance-batches"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("compliance_remittance_batches").select("*").order("created_at", { ascending: false }).limit(50);
      return (data ?? []) as any[];
    },
  });

  const totals = useMemo(() => {
    const arr = ledger ?? [];
    const t = arr.reduce((acc, l: any) => { acc.gross += Number(l.gross_amount_kobo); acc.fee += Number(l.compliance_fee_kobo); return acc; }, { gross: 0, fee: 0 });
    const byStatus = arr.reduce((acc: any, l: any) => { acc[l.remittance_status] = (acc[l.remittance_status] || 0) + Number(l.compliance_fee_kobo); return acc; }, {});
    const byKind = arr.reduce((acc: any, l: any) => { acc[l.transaction_kind] = (acc[l.transaction_kind] || 0) + Number(l.compliance_fee_kobo); return acc; }, {});
    const byRegion: Record<string, number> = {};
    arr.forEach((l: any) => { const r = l.region || "Unknown"; byRegion[r] = (byRegion[r] || 0) + Number(l.compliance_fee_kobo); });
    return { ...t, byStatus, byKind, byRegion };
  }, [ledger]);

  const exportCSV = () => {
    if (!ledger?.length) { toast.error("No data to export"); return; }
    const headers = ["created_at", "transaction_kind", "transaction_id", "provider_id", "buyer_id", "service_type", "region", "gross_amount_kobo", "platform_fee_kobo", "compliance_fee_kobo", "net_payout_kobo", "fee_label", "fee_percentage_applied", "remittance_status"];
    const rows = ledger.map((l: any) => headers.map((h) => JSON.stringify(l[h] ?? "")).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `compliance-ledger-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  const saveConfig = async () => {
    const patch: any = {};
    if (pct != null) patch.fee_percentage = pct;
    if (label != null) patch.fee_label = label;
    if (Object.keys(patch).length === 0) return;
    try { await updateCfg.mutateAsync(patch); toast.success("Configuration updated"); setPct(null); setLabel(null); }
    catch (e: any) { toast.error(e.message ?? "Failed to update"); }
  };

  const createBatch = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("compliance-remittance", { body: { action: "create_batch" } });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      toast.success(`Remittance batch created (${(data as any).batch.entry_count} entries)`);
      qc.invalidateQueries({ queryKey: ["compliance-ledger"] });
      qc.invalidateQueries({ queryKey: ["compliance-batches"] });
    } catch (e: any) { toast.error(e.message); }
  };

  const completeBatch = async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("compliance-remittance", { body: { action: "complete_batch", batch_id: id } });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      toast.success("Batch marked completed");
      qc.invalidateQueries({ queryKey: ["compliance-ledger"] });
      qc.invalidateQueries({ queryKey: ["compliance-batches"] });
    } catch (e: any) { toast.error(e.message); }
  };

  const currentPct = pct ?? Number(cfg?.fee_percentage ?? 0.03);
  const currentLabel = label ?? cfg?.fee_label ?? "State Digital Service Levy";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Compliance Ledger</h1>
        <p className="text-xs text-muted-foreground">Tracks the {cfg?.fee_label ?? "compliance levy"} deducted from completed transactions.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total collected" value={formatNaira(totals.fee)} hint={`Gross volume ${formatNaira(totals.gross)}`} />
        <Stat label="Pending remittance" value={formatNaira(totals.byStatus?.pending ?? 0)} />
        <Stat label="Processing" value={formatNaira(totals.byStatus?.processing ?? 0)} />
        <Stat label="Remitted" value={formatNaira(totals.byStatus?.completed ?? 0)} />
      </div>

      <section className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold">Fee configuration</h2>
        <p className="text-[11px] text-muted-foreground">Runtime-adjustable. Min {(Number(cfg?.min_fee ?? 0.01) * 100).toFixed(0)}% — Max {(Number(cfg?.max_fee ?? 0.05) * 100).toFixed(0)}%.</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Percentage: <b>{(currentPct * 100).toFixed(2)}%</b></label>
            <input type="range" min={Number(cfg?.min_fee ?? 0.01)} max={Number(cfg?.max_fee ?? 0.05)} step={0.0025}
              value={currentPct} onChange={(e) => setPct(Number(e.target.value))} className="w-full" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Display label</label>
            <select value={LABEL_PRESETS.includes(currentLabel) ? currentLabel : "custom"} onChange={(e) => setLabel(e.target.value === "custom" ? currentLabel : e.target.value)}
              className="w-full mt-1 py-2 px-3 border border-border rounded-lg text-xs bg-background">
              {LABEL_PRESETS.map((l) => <option key={l} value={l}>{l}</option>)}
              <option value="custom">Custom…</option>
            </select>
            {!LABEL_PRESETS.includes(currentLabel) && (
              <input value={currentLabel} onChange={(e) => setLabel(e.target.value)} className="w-full mt-2 py-2 px-3 border border-border rounded-lg text-xs bg-background" />
            )}
          </div>
        </div>
        <button onClick={saveConfig} disabled={updateCfg.isPending || (pct == null && label == null)}
          className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50">
          Save configuration
        </button>
      </section>

      <section className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-semibold">Remittance batches</h2>
          <div className="flex gap-2">
            <button onClick={createBatch} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5"><Send className="w-3.5 h-3.5" />Create batch from pending</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted text-muted-foreground"><tr>
              <th className="text-left p-2">Batch</th><th className="text-left p-2">Entries</th>
              <th className="text-left p-2">Total</th><th className="text-left p-2">Status</th>
              <th className="text-left p-2">Created</th><th className="text-left p-2"></th>
            </tr></thead>
            <tbody>
              {(batches ?? []).map((b: any) => (
                <tr key={b.id} className="border-t border-border">
                  <td className="p-2 font-mono text-[10px]">{b.id.slice(0, 8)}</td>
                  <td className="p-2">{b.entry_count}</td>
                  <td className="p-2 font-semibold">{formatNaira(b.total_amount_kobo)}</td>
                  <td className="p-2 capitalize">{b.status}</td>
                  <td className="p-2 text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</td>
                  <td className="p-2">{b.status === "processing" && (
                    <button onClick={() => completeBatch(b.id)} className="text-primary flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Mark complete</button>
                  )}</td>
                </tr>
              ))}
              {!batches?.length && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No batches yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-semibold">Ledger entries</h2>
          <div className="flex gap-2 items-center flex-wrap">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="py-1.5 px-2 border border-border rounded-lg text-xs bg-background" />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="py-1.5 px-2 border border-border rounded-lg text-xs bg-background" />
            <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as any)} className="py-1.5 px-2 border border-border rounded-lg text-xs bg-background">
              <option value="all">All</option><option value="service">Service</option><option value="parts">Parts</option>
            </select>
            <button onClick={exportCSV} className="px-3 py-1.5 rounded-lg border border-border text-xs flex items-center gap-1.5"><Download className="w-3.5 h-3.5" />CSV</button>
            <button onClick={() => window.print()} className="px-3 py-1.5 rounded-lg border border-border text-xs flex items-center gap-1.5"><Download className="w-3.5 h-3.5" />PDF</button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div className="bg-background border border-border rounded-lg p-3">
            <p className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1">By service type</p>
            {Object.entries(totals.byKind).map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs py-0.5"><span className="capitalize">{k}</span><span className="font-semibold">{formatNaira(v as number)}</span></div>
            ))}
            {Object.keys(totals.byKind).length === 0 && <p className="text-xs text-muted-foreground">—</p>}
          </div>
          <div className="bg-background border border-border rounded-lg p-3">
            <p className="text-[10px] uppercase text-muted-foreground tracking-wider mb-1">By region</p>
            {Object.entries(totals.byRegion).slice(0, 6).map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs py-0.5"><span className="truncate pr-2">{k}</span><span className="font-semibold">{formatNaira(v as number)}</span></div>
            ))}
            {Object.keys(totals.byRegion).length === 0 && <p className="text-xs text-muted-foreground">—</p>}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted text-muted-foreground"><tr>
              <th className="text-left p-2">Date</th><th className="text-left p-2">Kind</th>
              <th className="text-left p-2">Txn</th><th className="text-left p-2">Gross</th>
              <th className="text-left p-2">Platform</th><th className="text-left p-2">{cfg?.fee_label ?? "Levy"}</th>
              <th className="text-left p-2">Payout</th><th className="text-left p-2">Status</th>
            </tr></thead>
            <tbody>
              {(ledger ?? []).map((l: any) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="p-2 text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</td>
                  <td className="p-2 capitalize">{l.transaction_kind}</td>
                  <td className="p-2 font-mono text-[10px]">{l.transaction_id.slice(0, 8)}</td>
                  <td className="p-2">{formatNaira(l.gross_amount_kobo)}</td>
                  <td className="p-2">{formatNaira(l.platform_fee_kobo)}</td>
                  <td className="p-2 font-semibold">{formatNaira(l.compliance_fee_kobo)}</td>
                  <td className="p-2">{formatNaira(l.net_payout_kobo)}</td>
                  <td className="p-2 capitalize">{l.remittance_status}</td>
                </tr>
              ))}
              {!ledger?.length && <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">No entries.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminCompliance;
