import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { formatNaira } from "@/lib/format";

const schema = z.object({
  delivery_address: z.string().trim().min(8, "Enter a delivery address").max(300),
  delivery_phone: z.string().trim().min(7, "Enter a phone number").max(20),
  notes: z.string().max(500).optional(),
});

const DELIVERY_FEE_KOBO = 150000; // ₦1,500 flat fee placeholder

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, totalKobo, clear } = useCart();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ delivery_address: "", delivery_phone: "", notes: "" });

  const update = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  if (!user) {
    return <div className="p-6 text-center text-sm text-muted-foreground">Please sign in.</div>;
  }
  if (items.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground mb-3">Your cart is empty.</p>
        <button onClick={() => navigate("/")} className="text-primary text-sm font-semibold">← Browse parts</button>
      </div>
    );
  }

  const grandTotal = totalKobo + DELIVERY_FEE_KOBO;

  const placeOrder = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setBusy(true);
    try {
      const { data: order, error: orderErr } = await supabase
        .from("parts_orders")
        .insert({
          buyer_id: user.id,
          status: "paid", // simulated escrow hold succeeded
          subtotal_kobo: totalKobo,
          delivery_fee_kobo: DELIVERY_FEE_KOBO,
          total_kobo: grandTotal,
          delivery_address: parsed.data.delivery_address,
          delivery_phone: parsed.data.delivery_phone,
          notes: parsed.data.notes ?? null,
          escrow_ref: `ESC-${Date.now()}`,
        })
        .select("id")
        .single();
      if (orderErr) throw orderErr;

      const orderItems = items.map((it) => ({
        order_id: order.id,
        part_id: it.part.id,
        vendor_id: it.part.vendor_id,
        title_snapshot: it.part.title,
        unit_price_kobo: it.part.price_kobo,
        qty: it.qty,
        vendor_status: "paid" as const,
      }));
      const { error: itemsErr } = await supabase.from("parts_order_items").insert(orderItems);
      if (itemsErr) throw itemsErr;

      await clear.mutateAsync();
      toast.success("Order placed — funds held in escrow until delivery");
      navigate(`/orders`);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not place order");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-[700px] mx-auto min-h-screen bg-background">
      <header className="bg-primary px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-primary-foreground text-lg">←</button>
        <h1 className="text-primary-foreground text-sm font-semibold flex-1">Checkout</h1>
      </header>
      <div className="p-4 space-y-4">
        <section>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Delivery details</h2>
          <div className="flex flex-col gap-2.5">
            <input value={form.delivery_address} onChange={(e) => update("delivery_address", e.target.value)} placeholder="Delivery address" className="w-full py-3 px-4 border border-border rounded-xl text-sm bg-background outline-none focus:border-primary" />
            <input value={form.delivery_phone} onChange={(e) => update("delivery_phone", e.target.value)} placeholder="Contact phone" className="w-full py-3 px-4 border border-border rounded-xl text-sm bg-background outline-none focus:border-primary" />
            <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Notes for vendor (optional)" rows={2} className="w-full py-3 px-4 border border-border rounded-xl text-sm bg-background outline-none focus:border-primary" />
          </div>
        </section>

        <section>
          <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Order summary</h2>
          <div className="border border-border rounded-xl bg-card p-3">
            {items.map((it) => (
              <div key={it.id} className="flex justify-between text-sm py-1">
                <span className="truncate pr-2">{it.qty}× {it.part?.title}</span>
                <span className="font-medium">{formatNaira((it.part?.price_kobo ?? 0) * it.qty)}</span>
              </div>
            ))}
            <hr className="my-2 border-border" />
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatNaira(totalKobo)}</span></div>
            <div className="flex justify-between text-sm"><span>Delivery</span><span>{formatNaira(DELIVERY_FEE_KOBO)}</span></div>
            <div className="flex justify-between text-base font-bold mt-1"><span>Total</span><span className="text-primary">{formatNaira(grandTotal)}</span></div>
          </div>
        </section>

        <div className="text-[11px] text-muted-foreground bg-muted rounded-lg p-3">
          🔒 <strong>Escrow protection:</strong> Funds are held until you confirm delivery. Vendors get paid only after you mark the order as received.
        </div>

        <button onClick={placeOrder} disabled={busy} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-60">
          {busy ? "Placing order…" : `Authorize ${formatNaira(grandTotal)} hold`}
        </button>
      </div>
    </div>
  );
};

export default Checkout;
