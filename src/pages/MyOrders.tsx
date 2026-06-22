import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageNav from "@/components/PageNav";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatNaira } from "@/lib/format";
import { toast } from "sonner";
import ChatDrawer from "@/components/ChatDrawer";

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Pending payment",
  paid: "Paid · in escrow",
  accepted: "Accepted by vendor",
  packed: "Packed",
  shipped: "On the way",
  delivered: "Delivered — confirm receipt",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed: "Disputed",
};

const MyOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`orders-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "parts_orders", filter: `buyer_id=eq.${user.id}` }, () => qc.invalidateQueries({ queryKey: ["my-orders"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "parts_order_items" }, () => qc.invalidateQueries({ queryKey: ["my-orders"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  const ordersQ = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parts_orders")
        .select("*, items:parts_order_items(*)")
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const confirmReceipt = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from("parts_orders")
        .update({ status: "completed" })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success("Receipt confirmed — funds released to vendor");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not confirm"),
  });

  const dispute = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from("parts_orders")
        .update({ status: "disputed" })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success("Dispute opened — support will reach out");
    },
  });

  if (!user) return <div className="p-6 text-center text-sm text-muted-foreground">Please sign in.</div>;

  return (
    <div className="max-w-[700px] mx-auto min-h-screen bg-background">
      <PageNav />
      <header className="bg-primary px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-primary-foreground text-lg">←</button>
        <h1 className="text-primary-foreground text-sm font-semibold flex-1">My Orders</h1>
      </header>

      <div className="p-4">
        {ordersQ.isLoading ? (
          <p className="text-center text-xs text-muted-foreground py-10">Loading…</p>
        ) : !ordersQ.data || ordersQ.data.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📦</div>
            <p className="text-sm text-muted-foreground mb-4">No orders yet.</p>
            <button onClick={() => navigate("/")} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
              Browse parts
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {ordersQ.data.map((o: any) => (
              <div key={o.id} className="border border-border rounded-xl bg-card p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Order #{o.id.slice(0, 8)}</div>
                    <div className="text-[11px] text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-light text-primary">
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                </div>
                <div className="text-[12px]">
                  {o.items?.map((it: any) => (
                    <div key={it.id} className="flex justify-between py-0.5">
                      <span>{it.qty}× {it.title_snapshot}</span>
                      <span>{formatNaira(it.unit_price_kobo * it.qty)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm font-bold mt-2">
                  <span>Total</span>
                  <span className="text-primary">{formatNaira(o.total_kobo)}</span>
                </div>

                {(o.status === "shipped" || o.status === "delivered") && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => confirmReceipt.mutate(o.id)}
                      className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
                    >
                      Confirm receipt & release payment
                    </button>
                    <button
                      onClick={() => dispute.mutate(o.id)}
                      className="px-3 py-2 rounded-lg border border-destructive text-destructive text-xs font-semibold"
                    >
                      Dispute
                    </button>
                  </div>
                )}
                <button onClick={() => setChatOrderId(o.id)} className="mt-2 w-full py-2 rounded-lg border border-border text-xs font-semibold inline-flex items-center justify-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" /> Chat with vendor
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <ChatDrawer
        open={!!chatOrderId}
        onClose={() => setChatOrderId(null)}
        threadType="order"
        threadId={chatOrderId ?? ""}
        title="Chat about this order"
      />
    </div>
  );
};

export default MyOrders;
