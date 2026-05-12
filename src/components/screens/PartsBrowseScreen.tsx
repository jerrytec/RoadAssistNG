import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/format";

interface Props {
  onOpenCart: () => void;
  cartCount: number;
}

const PartsBrowseScreen = ({ onOpenCart, cartCount }: Props) => {
  const navigate = useNavigate();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const categoriesQ = useQuery({
    queryKey: ["parts-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parts_categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const partsQ = useQuery({
    queryKey: ["parts-list", categoryId, search],
    queryFn: async () => {
      let q = supabase
        .from("parts")
        .select("id, title, brand, price_kobo, stock, condition, images, vendor:vendors(business_name)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(60);
      if (categoryId) q = q.eq("category_id", categoryId);
      if (search.trim()) q = q.ilike("title", `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="p-3.5 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-[15px] font-semibold">🧰 Spare parts</h2>
          <p className="text-[11px] text-muted-foreground">Buy genuine parts from verified vendors near you</p>
        </div>
        <button
          onClick={onOpenCart}
          className="relative bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 rounded-full"
        >
          🛒 Cart
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search batteries, brake pads, tyres…"
        className="w-full py-2.5 px-3.5 border border-border rounded-xl text-sm bg-background outline-none focus:border-primary mb-3"
      />

      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-3.5 px-3.5">
        <button
          onClick={() => setCategoryId(null)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
            categoryId === null ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"
          }`}
        >
          All
        </button>
        {categoriesQ.data?.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryId(c.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
              categoryId === c.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"
            }`}
          >
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {partsQ.isLoading ? (
        <p className="text-center text-xs text-muted-foreground py-10">Loading parts…</p>
      ) : partsQ.data && partsQ.data.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5">
          {partsQ.data.map((p: any) => (
            <button
              key={p.id}
              onClick={() => navigate(`/parts/${p.id}`)}
              className="text-left bg-card border border-border rounded-xl overflow-hidden hover:border-primary transition-colors"
            >
              <div className="aspect-square bg-muted flex items-center justify-center text-3xl">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  "📦"
                )}
              </div>
              <div className="p-2">
                <div className="text-[12px] font-semibold line-clamp-2">{p.title}</div>
                {p.brand && <div className="text-[10px] text-muted-foreground">{p.brand}</div>}
                <div className="text-[13px] font-bold text-primary mt-1">{formatNaira(p.price_kobo)}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {p.stock > 0 ? `In stock · ${p.condition}` : "Out of stock"}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border border-dashed border-border rounded-xl">
          <div className="text-4xl mb-2">📦</div>
          <p className="text-xs text-muted-foreground">
            No parts listed yet{categoryId ? " in this category" : ""}.
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Vendors can list parts from the Vendor portal.</p>
        </div>
      )}
    </div>
  );
};

export default PartsBrowseScreen;
