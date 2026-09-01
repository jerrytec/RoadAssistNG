import { useNavigate } from "react-router-dom";
import { PackageOpen, ShoppingCart, SlidersHorizontal, Search, Package, Star } from "lucide-react";
import { formatNaira } from "@/lib/format";
import Pager from "@/components/Pager";
import { usePagedParams } from "@/hooks/usePagedParams";
import { usePagedParts, usePartCategories } from "@/hooks/usePagedParts";

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
  // page / search / category live in the URL so refresh + sharing restore the view
  const { page, search, filter, setPage, setSearch, setFilter } = usePagedParams({
    prefix: "parts",
    defaultFilter: "all",
  });
  const categories = usePartCategories();
  const category = filter === "all" ? null : filter;
  const { items, total, totalPages, from, to, loading } = usePagedParts({ page, category, search });

  return (
    <div className="p-3.5 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-lg bg-primary-light text-primary flex items-center justify-center">
            <PackageOpen className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold">Spare parts marketplace</h2>
            <p className="text-[11px] text-muted-foreground">Verified Lagos sellers</p>
          </div>
        </div>
        <button
          onClick={onOpenCart}
          aria-label="Open cart"
          className="relative bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 rounded-full inline-flex items-center gap-1.5 transition-opacity hover:opacity-90"
        >
          <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" /> Cart
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
          aria-label="Search spare parts"
          className="flex-1 py-2.5 px-3.5 border border-border rounded-xl text-sm bg-background outline-none focus:border-primary"
        />
        <button
          className="px-3 rounded-xl border border-border text-sm inline-flex items-center justify-center hover:border-primary/40 transition-colors"
          aria-label="Filters"
        >
          <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-3.5 px-3.5">
        <button
          onClick={() => setFilter("all")}
          aria-pressed={filter === "all"}
          className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
            filter === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card border-border text-muted-foreground"
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            aria-pressed={filter === c}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
              filter === c
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-2.5" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="aspect-square bg-muted animate-pulse" />
              <div className="p-2 space-y-1.5">
                <div className="h-3 bg-muted rounded animate-pulse" />
                <div className="h-2.5 w-2/3 bg-muted rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5">
          {items.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/parts/${p.id}`)}
              className="text-left bg-card border border-border rounded-xl overflow-hidden hover:border-primary hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="aspect-square bg-muted flex items-center justify-center text-muted-foreground">
                <Package className="w-10 h-10" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <div className="p-2">
                <div className="text-[12px] font-semibold line-clamp-2">{p.title}</div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {p.brand} · {p.category}
                </div>
                <div className="text-[13px] font-bold text-primary mt-1">{formatNaira(p.price_kobo)}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${condColor[p.condition]}`}>
                    {p.condition}
                  </span>
                  <span className="text-[9px] text-muted-foreground inline-flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-accent text-accent" aria-hidden="true" /> {p.rating}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  {p.seller_name} · {p.location}
                </div>
                <div className="text-[9px] text-muted-foreground">Stock: {p.stock}</div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border border-dashed border-border rounded-xl">
          <Search className="w-8 h-8 mx-auto mb-2 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
          <p className="text-xs text-muted-foreground">No parts match your search.</p>
        </div>
      )}

      <Pager
        page={page}
        totalPages={totalPages}
        total={total}
        from={from}
        to={to}
        label="listings"
        onChange={setPage}
      />
    </div>
  );
};

export default PartsBrowseScreen;
