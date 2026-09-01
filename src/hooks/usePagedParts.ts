import { useEffect, useState } from "react";
import type { SeedPart } from "@/data/seedParts";
import {
  fetchPartsPage,
  fetchPartCategories,
  PAGE_SIZE,
  type PageResult,
  type PartsQuery,
} from "@/lib/pagedQuery";

const EMPTY: PageResult<SeedPart> = {
  items: [],
  total: 0,
  page: 1,
  pageSize: PAGE_SIZE,
  totalPages: 1,
  from: 0,
  to: 0,
};

/**
 * Fetches one page of spare-parts listings from the backend. Filtering,
 * searching and counting happen server-side over the full catalogue.
 */
export const usePagedParts = (query: PartsQuery & { page: number }) => {
  const { page, category = null, search = "" } = query;
  const [result, setResult] = useState<PageResult<SeedPart>>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchPartsPage({ page, category, search })
      .then((r) => {
        if (active) setResult(r);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, category, search]);

  return { ...result, loading };
};

/** Distinct part categories for the filter chips. */
export const usePartCategories = () => {
  const [categories, setCategories] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    fetchPartCategories().then((c) => {
      if (active) setCategories(c);
    });
    return () => {
      active = false;
    };
  }, []);
  return categories;
};
