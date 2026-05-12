import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/format";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const PartDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);

  const { data: part, isLoading } = useQuery({
    queryKey: ["part", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parts")
        .select("*, vendor:vendors(id, business_name, status), category:parts_categories(name, icon)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="p-6 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!part) return (
    <div className="p-6 text-center">
      <p className="text-sm text-muted-foreground mb-3">Part not found.</p>
      <button onClick={() => navigate("/")} className="text-primary text-sm font-semibold">← Back</button>
    </div>
  );

  const images: string[] = part.images?.length ? part.images : [];

  const handleAdd = async () => {
    if (!user) { toast.error("Please sign in to add to cart"); return; }
    if (part.stock < qty) { toast.error("Not enough stock"); return; }
    addItem.mutate({ partId: part.id, qty });
  };

  const handleBuyNow = async () => {
    if (!user) { toast.error("Please sign in"); return; }
    if (part.stock < qty) { toast.error("Not enough stock"); return; }
    addItem.mutate({ partId: part.id, qty }, { onSuccess: () => navigate("/checkout") });
  };

  return (
    <div className="max-w-[700px] mx-auto min-h-screen bg-background">
      <header className="bg-primary px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-primary-foreground text-lg">←</button>
        <h1 className="text-primary-foreground text-sm font-semibold flex-1 truncate">{part.title}</h1>
        <button onClick={() => navigate("/cart")} className="text-primary-foreground text-lg">🛒</button>
      </header>

      <div className="aspect-square bg-muted flex items-center justify-center">
        {images[imgIdx] ? (
          <img src={images[imgIdx]} alt={part.title} className="w-full h-full object-contain" />
        ) : (
          <span className="text-6xl">📦</span>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 p-3 overflow-x-auto">
          {images.map((src, i) => (
            <button key={src} onClick={() => setImgIdx(i)} className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 ${i === imgIdx ? "border-primary" : "border-transparent"}`}>
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="p-4">
        <div className="text-[11px] text-muted-foreground">{(part as any).category?.icon} {(part as any).category?.name}</div>
        <h2 className="text-lg font-bold mt-1">{part.title}</h2>
        {part.brand && <div className="text-xs text-muted-foreground">{part.brand}</div>}
        <div className="text-2xl font-extrabold text-primary mt-2">{formatNaira(part.price_kobo)}</div>
        <div className="text-[11px] text-muted-foreground mt-1">
          {part.stock > 0 ? `${part.stock} in stock` : "Out of stock"} · Condition: {part.condition}
        </div>

        {(part as any).vendor && (
          <div className="mt-3 p-3 border border-border rounded-xl bg-card">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Sold by</div>
            <div className="text-sm font-semibold">{(part as any).vendor.business_name}</div>
            <div className="text-[10px] text-muted-foreground">
              {(part as any).vendor.status === "verified" ? "✅ Verified vendor" : "Verification pending"}
            </div>
          </div>
        )}

        {part.description && (
          <div className="mt-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Description</div>
            <p className="text-sm whitespace-pre-wrap">{part.description}</p>
          </div>
        )}

        {part.compatibility?.length > 0 && (
          <div className="mt-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Compatibility</div>
            <div className="flex flex-wrap gap-1.5">
              {part.compatibility.map((c) => (
                <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-muted">{c}</span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mt-5">
          <div className="flex items-center border border-border rounded-xl">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 text-sm">−</button>
            <span className="px-3 py-2 text-sm font-semibold">{qty}</span>
            <button onClick={() => setQty(Math.min(part.stock, qty + 1))} className="px-3 py-2 text-sm">+</button>
          </div>
          <button onClick={handleAdd} disabled={addItem.isPending || part.stock === 0} className="flex-1 py-3 rounded-xl border border-primary text-primary text-sm font-semibold disabled:opacity-50">
            {addItem.isPending ? "Adding…" : "Add to cart"}
          </button>
        </div>
        <button onClick={handleBuyNow} disabled={addItem.isPending || part.stock === 0} className="w-full mt-3 py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50">
          Buy now
        </button>
      </div>
    </div>
  );
};

export default PartDetail;
