import { supabase } from "@/integrations/supabase/client";
import { allProviders } from "@/data/providers";
import { seedParts, type SeedPart } from "@/data/seedParts";
import type { Provider } from "@/components/ProviderCard";

export const PAGE_SIZE = 5;

export type ProviderCategory = "all" | "tow" | "vulcanizer" | "mechanic" | "verified";

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  /** 1-based index of the first item on this page (0 when empty) */
  from: number;
  /** 1-based index of the last item on this page (0 when empty) */
  to: number;
}

/** Slice a already-filtered dataset into a single page. Page is clamped into range. */
export const paginate = <T,>(all: T[], page: number, pageSize = PAGE_SIZE): PageResult<T> => {
  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, Math.floor(page) || 1), totalPages);
  const start = (safePage - 1) * pageSize;
  const items = all.slice(start, start + pageSize);
  return {
    items,
    total,
    page: safePage,
    pageSize,
    totalPages,
    from: total === 0 ? 0 : start + 1,
    to: total === 0 ? 0 : start + items.length,
  };
};

/* ------------------------------------------------------------------ providers */

const providerHaystack = (p: Provider) =>
  [p.name, p.type, p.location, p.operator, p.plate, p.shopType, ...(p.services ?? []), ...(p.specializations ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const inCategory = (p: Provider, category: ProviderCategory) => {
  const t = p.type.toLowerCase();
  switch (category) {
    case "tow":
      return t.includes("tow");
    case "vulcanizer":
      return t.includes("vulcanizer");
    case "mechanic":
      return t.includes("mechanic");
    case "verified":
      return p.verified;
    default:
      return true;
  }
};

/** Round-robin interleave of tow / vulcanizer / mechanic so "all nearby" stays mixed. */
export const mixedProviders = (source: Provider[] = allProviders): Provider[] => {
  const buckets = [
    source.filter((p) => inCategory(p, "tow")),
    source.filter((p) => inCategory(p, "vulcanizer")),
    source.filter((p) => inCategory(p, "mechanic")),
  ];
  const out: Provider[] = [];
  const max = Math.max(...buckets.map((b) => b.length));
  for (let i = 0; i < max; i++) for (const b of buckets) if (b[i]) out.push(b[i]);
  // anything that didn't match a bucket (future types) still shows up
  for (const p of source) if (!out.includes(p)) out.push(p);
  return out;
};

export interface ProviderQuery {
  category?: ProviderCategory;
  search?: string;
  verifiedOnly?: boolean;
  /** Interleave categories instead of natural seed order (used by "All nearby") */
  mixed?: boolean;
}

/** Filter + search across the ENTIRE provider dataset (never just a page). */
export const filterProviders = ({
  category = "all",
  search = "",
  verifiedOnly = false,
  mixed = false,
}: ProviderQuery): Provider[] => {
  const q = search.trim().toLowerCase();
  const base = mixed ? mixedProviders() : allProviders;
  return base.filter((p) => {
    if (!inCategory(p, category)) return false;
    if (verifiedOnly && !p.verified) return false;
    if (q && !providerHaystack(p).includes(q)) return false;
    return true;
  });
};

/* -------------------------------------------------- server-side page fetch */

interface DirectoryRow {
  id: string;
  name: string;
  type: string;
  location: string | null;
  status: string | null;
  verified: boolean;
  distance: string | null;
  eta: string | null;
  rating: string | null;
  avatar_bg: string | null;
  operator: string | null;
  plate: string | null;
  base_fee_kobo: number | null;
  per_km_kobo: number | null;
  capacity_tonnes: number | null;
  shop_type: string | null;
  services: string[] | null;
  specializations: string[] | null;
  badges: Provider["badges"] | null;
}

const rowToProvider = (r: DirectoryRow): Provider => ({
  id: r.id,
  icon: "",
  name: r.name,
  type: r.type,
  location: r.location ?? "",
  status: r.status ?? "",
  verified: r.verified,
  badges: r.badges ?? [],
  distance: r.distance ?? "",
  eta: r.eta ?? "",
  rating: r.rating ?? "",
  avatarBg: (r.avatar_bg as Provider["avatarBg"]) ?? "info",
  operator: r.operator ?? undefined,
  plate: r.plate ?? undefined,
  baseFeeKobo: r.base_fee_kobo ?? undefined,
  perKmKobo: r.per_km_kobo ?? undefined,
  capacityTonnes: r.capacity_tonnes ?? undefined,
  shopType: r.shop_type ?? undefined,
  services: r.services ?? undefined,
  specializations: r.specializations ?? undefined,
});

const typeFilter = (category: ProviderCategory) => {
  switch (category) {
    case "tow":
      return "tow";
    case "vulcanizer":
      return "vulcanizer";
    case "mechanic":
      return "mechanic";
    default:
      return null;
  }
};

/**
 * Page fetcher. Filtering, counting and slicing happen in the BACKEND
 * (`providers_directory` with `.range()` + exact count), so the client only
 * ever downloads `pageSize` rows no matter how large the dataset grows.
 * Falls back to the bundled seed data if the backend is unreachable.
 */
export const fetchProvidersPage = async (
  q: ProviderQuery & { page: number; pageSize?: number }
): Promise<PageResult<Provider>> => {
  const pageSize = q.pageSize ?? PAGE_SIZE;
  const page = Math.max(1, Math.floor(q.page) || 1);
  const search = (q.search ?? "").trim().toLowerCase();
  const category = q.category ?? "all";

  // "All nearby" interleaves categories — that ordering only exists client-side.
  if (q.mixed) return paginate(filterProviders(q), page, pageSize);

  try {

    const build = () => {
      let b = supabase
        .from("providers_directory")
        .select(
          "id,name,type,location,status,verified,distance,eta,rating,avatar_bg,operator,plate,base_fee_kobo,per_km_kobo,capacity_tonnes,shop_type,services,specializations,badges",
          { count: "exact" }
        );
      const t = typeFilter(category);
      if (t) b = b.ilike("type", `%${t}%`);
      if (category === "verified" || q.verifiedOnly) b = b.eq("verified", true);
      if (search) b = b.ilike("search_text", `%${search}%`);
      return b;
    };

    // First pass: learn the true total so the page can be clamped into range.
    const probe = await build().range(0, 0);
    if (probe.error) throw probe.error;
    const total = probe.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;

    const { data, error } = await build()
      .order("sort_index", { ascending: true })
      .range(start, start + pageSize - 1);
    if (error) throw error;

    const items = (data ?? []).map((r) => rowToProvider(r as DirectoryRow));
    return {
      items,
      total,
      page: safePage,
      pageSize,
      totalPages,
      from: total === 0 ? 0 : start + 1,
      to: total === 0 ? 0 : start + items.length,
    };
  } catch {
    // Offline / backend unavailable → local dataset keeps the UI usable.
    return paginate(filterProviders(q), page, pageSize);
  }
};


/* ---------------------------------------------------------------------- parts */

const partHaystack = (p: SeedPart) =>
  [p.title, p.brand, p.category, p.seller_name, p.location, p.condition, ...p.compatibility]
    .join(" ")
    .toLowerCase();

export interface PartsQuery {
  category?: string | null;
  search?: string;
}

/** Filter + search across ALL spare-parts listings (local fallback). */
export const filterParts = ({ category = null, search = "" }: PartsQuery): SeedPart[] => {
  const q = search.trim().toLowerCase();
  return seedParts.filter((p) => {
    if (category && p.category !== category) return false;
    if (q && !partHaystack(p).includes(q)) return false;
    return true;
  });
};

interface PartsRow {
  id: string;
  title: string;
  brand: string | null;
  category: string;
  seller_name: string | null;
  location: string | null;
  price_kobo: number;
  condition: string;
  stock: number;
  rating: number | null;
  compatibility: string[] | null;
}

const iconBySeed = new Map(seedParts.map((p) => [p.id, p.icon]));

const rowToPart = (r: PartsRow): SeedPart => ({
  id: r.id,
  title: r.title,
  brand: r.brand ?? "",
  category: r.category,
  icon: iconBySeed.get(r.id) ?? "",
  seller_name: r.seller_name ?? "",
  location: r.location ?? "",
  price_kobo: Number(r.price_kobo),
  condition: (r.condition as SeedPart["condition"]) ?? "New",
  stock: r.stock,
  rating: Number(r.rating ?? 0),
  compatibility: r.compatibility ?? [],
});

/**
 * Page fetcher for spare parts. Filtering, counting and slicing happen in the
 * BACKEND (`parts_directory` with `.range()` + exact count) so the client only
 * downloads `pageSize` rows. Falls back to bundled seed data when offline.
 */
export const fetchPartsPage = async (
  q: PartsQuery & { page: number; pageSize?: number }
): Promise<PageResult<SeedPart>> => {
  const pageSize = q.pageSize ?? PAGE_SIZE;
  const page = Math.max(1, Math.floor(q.page) || 1);
  const search = (q.search ?? "").trim().toLowerCase();
  const category = q.category ?? null;

  try {
    const build = () => {
      let b = supabase
        .from("parts_directory")
        .select(
          "id,title,brand,category,seller_name,location,price_kobo,condition,stock,rating,compatibility",
          { count: "exact" }
        );
      if (category) b = b.eq("category", category);
      if (search) b = b.ilike("search_text", `%${search}%`);
      return b;
    };

    // First pass: learn the true total so the page can be clamped into range.
    const probe = await build().range(0, 0);
    if (probe.error) throw probe.error;
    const total = probe.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;

    const { data, error } = await build()
      .order("sort_index", { ascending: true })
      .range(start, start + pageSize - 1);
    if (error) throw error;

    const items = (data ?? []).map((r) => rowToPart(r as PartsRow));
    return {
      items,
      total,
      page: safePage,
      pageSize,
      totalPages,
      from: total === 0 ? 0 : start + 1,
      to: total === 0 ? 0 : start + items.length,
    };
  } catch {
    return paginate(filterParts(q), page, pageSize);
  }
};

/** Distinct categories, from the backend when available. */
export const fetchPartCategories = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from("parts_directory")
      .select("category")
      .order("category", { ascending: true });
    if (error) throw error;
    const set = new Set((data ?? []).map((r) => (r as { category: string }).category));
    return set.size ? [...set] : [...partCategories];
  } catch {
    return [...partCategories];
  }
};
