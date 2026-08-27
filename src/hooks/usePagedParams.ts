import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

interface Options {
  /** Namespace so several paged lists can coexist in one URL (e.g. "mech") */
  prefix?: string;
  defaultFilter?: string;
}

/**
 * Keeps page / search term / filter in the URL so refreshing or sharing a link
 * restores the exact same page of results.
 */
export const usePagedParams = ({ prefix = "", defaultFilter = "all" }: Options = {}) => {
  const [params, setParams] = useSearchParams();
  const key = useCallback((k: string) => (prefix ? `${prefix}_${k}` : k), [prefix]);

  const rawPage = parseInt(params.get(key("page")) ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const search = params.get(key("q")) ?? "";
  const filter = params.get(key("f")) ?? defaultFilter;

  const patch = useCallback(
    (values: Record<string, string | null>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(values)) {
            if (v === null || v === "") next.delete(key(k));
            else next.set(key(k), v);
          }
          return next;
        },
        { replace: true }
      );
    },
    [key, setParams]
  );

  const setPage = useCallback((p: number) => patch({ page: p <= 1 ? null : String(p) }), [patch]);
  // Changing search or filter must reset to page 1 so counts stay coherent.
  const setSearch = useCallback((v: string) => patch({ q: v || null, page: null }), [patch]);
  const setFilter = useCallback(
    (v: string) => patch({ f: v === defaultFilter ? null : v, page: null }),
    [patch, defaultFilter]
  );

  return { page, search, filter, setPage, setSearch, setFilter };
};
