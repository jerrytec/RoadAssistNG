import { useEffect, useState } from "react";
import type { Provider } from "@/components/ProviderCard";
import {
  fetchProvidersPage,
  PAGE_SIZE,
  type PageResult,
  type ProviderQuery,
} from "@/lib/pagedQuery";

const EMPTY: PageResult<Provider> = {
  items: [],
  total: 0,
  page: 1,
  pageSize: PAGE_SIZE,
  totalPages: 1,
  from: 0,
  to: 0,
};

/**
 * Fetches one page of providers from the data layer. Filtering/searching and
 * counting happen there over the full dataset, so this only holds a page.
 */
export const usePagedProviders = (query: ProviderQuery & { page: number }) => {
  const { page, category = "all", search = "", verifiedOnly = false, mixed = false } = query;
  const [result, setResult] = useState<PageResult<Provider>>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchProvidersPage({ page, category, search, verifiedOnly, mixed })
      .then((r) => {
        if (active) setResult(r);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, category, search, verifiedOnly, mixed]);

  return { ...result, loading };
};
