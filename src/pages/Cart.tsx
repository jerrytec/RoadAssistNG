import { useNavigate } from "react-router-dom";
import PageNav from "@/components/PageNav";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { formatNaira } from "@/lib/format";

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, totalKobo, isLoading, updateQty } = useCart();

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground mb-3">Please sign in to view your cart.</p>
        <button onClick={() => navigate("/")} className="text-primary text-sm font-semibold">← Back to home</button>
      </div>
    );
  }

  return (
    <div className="max-w-[700px] mx-auto min-h-screen bg-background">
      <PageNav />
      <header className="bg-primary px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-primary-foreground text-lg">←</button>
        <h1 className="text-primary-foreground text-sm font-semibold flex-1">My Cart</h1>
      </header>

      <div className="p-4">
        {isLoading ? (
          <p className="text-center text-xs text-muted-foreground py-10">Loading…</p>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🛒</div>
            <p className="text-sm text-muted-foreground mb-4">Your cart is empty.</p>
            <button onClick={() => navigate("/")} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
              Browse parts
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {items.map((it) => (
                <div key={it.id} className="flex gap-3 p-3 bg-card border border-border rounded-xl">
                  <div className="w-16 h-16 rounded-lg bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                    {it.part?.images?.[0] ? <img src={it.part.images[0]} alt="" className="w-full h-full object-cover" /> : "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{it.part?.title}</div>
                    <div className="text-[11px] text-muted-foreground">{it.part?.brand}</div>
                    <div className="text-sm font-bold text-primary mt-1">{formatNaira((it.part?.price_kobo ?? 0) * it.qty)}</div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button onClick={() => updateQty.mutate({ itemId: it.id, qty: 0 })} className="text-[11px] text-destructive">Remove</button>
                    <div className="flex items-center border border-border rounded-lg">
                      <button onClick={() => updateQty.mutate({ itemId: it.id, qty: it.qty - 1 })} className="px-2 text-sm">−</button>
                      <span className="px-2 text-sm font-semibold">{it.qty}</span>
                      <button onClick={() => updateQty.mutate({ itemId: it.id, qty: Math.min((it.part?.stock ?? 99), it.qty + 1) })} className="px-2 text-sm">+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 border border-border rounded-xl bg-card">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatNaira(totalKobo)}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Delivery</span>
                <span className="text-[11px] text-muted-foreground">Calculated at checkout</span>
              </div>
              <button onClick={() => navigate("/checkout")} className="w-full mt-4 py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
                Proceed to checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;
