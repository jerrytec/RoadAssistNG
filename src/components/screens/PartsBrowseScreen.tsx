import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatNaira } from "@/lib/format";
import { seedParts, partCategories } from "@/data/seedParts";

interface Props {
  onOpenCart: () => void;
  cartCount: number;
}

const condColor: Record<string, string> = {
  New: "bg-primary-light text-primary",
  Used: "bg-accent-light text-accent",
  Refurbished: "bg-info-light text-info",
};

const PartsBrowseScreen = ({ onOpenCart, cartCount }: Props) => {
  const navigate = useNavigate();
  const [category, setCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return seedParts.filter((p) => {
      if (category && p.category !== category) return false;
      if (q && !(`${p.title} ${p.brand} ${p.seller_name}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [category, search]);

  return (
    <div className="p-3.5 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-[15px] font-semibold">🧰 Spare parts marketplace</h2>
          <p className="text-[11px] text-muted-foreground">{seedParts.length} listings from verified Lagos sellers</p>
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

      <div className="flex gap-2 mb-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search batteries, brake pads, tyres…"
          className="flex-1 py-2.5 px-3.5 border border-border rounded-xl text-sm bg-background outline-none focus:border-primary"
        />
        <button className="px-3 rounded-xl border border-border text-sm" aria-label="Filters">⚙️</button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-3.5 px-3.5">
        <button
          onClick={() => setCategory(null)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
            category === null ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"
          }`}
        >
          All
        </button>
        {partCategories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
              category === c ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/parts/${p.id}`)}
              className="text-left bg-card border border-border rounded-xl overflow-hidden hover:border-primary transition-colors"
            >
              <div className="aspect-square bg-muted flex items-center justify-center text-4xl">{p.icon}</div>
              <div className="p-2">
                <div className="text-[12px] font-semibold line-clamp-2">{p.title}</div>
                <div className="text-[10px] text-muted-foreground truncate">{p.brand} · {p.category}</div>
                <div className="text-[13px] font-bold text-primary mt-1">{formatNaira(p.price_kobo)}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${condColor[p.condition]}`}>{p.condition}</span>
                  <span className="text-[9px] text-muted-foreground">★ {p.rating}</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{p.seller_name} · {p.location}</div>
                <div className="text-[9px] text-muted-foreground">Stock: {p.stock}</div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border border-dashed border-border rounded-xl">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-xs text-muted-foreground">No parts match your search.</p>
        </div>
      )}
    </div>
  );
};

export default PartsBrowseScreen;
