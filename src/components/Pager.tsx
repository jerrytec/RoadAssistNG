import type React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  totalPages: number;
  total?: number;
  from?: number;
  to?: number;
  /** Noun for the summary line, e.g. "mechanics" */
  label?: string;
  onChange: (p: number) => void;
}

/**
 * Sliding window of up to 5 consecutive page numbers, centered on the active
 * page where possible. Never overflows on narrow screens — deeper pages are
 * reached via the Next button.
 * e.g. page 1 of 25 → [1,2,3,4,5], page 12 of 25 → [10,11,12,13,14]
 */
export const buildPageWindow = (page: number, total: number, size = 5): number[] => {
  const count = Math.min(size, total);
  const start = Math.min(Math.max(1, page - Math.floor(count / 2)), Math.max(1, total - count + 1));
  return Array.from({ length: count }, (_, i) => start + i);
};

const Pager = ({ page, totalPages, total, from, to, label = "results", onChange }: Props) => {
  const pages = buildPageWindow(page, totalPages);
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  const disabledCls =
    "disabled:opacity-40 disabled:cursor-not-allowed disabled:border-border/60 disabled:text-muted-foreground/60 disabled:hover:border-border/60 disabled:pointer-events-none";

  /** Left/Right arrows step pages, Home/End jump to the ends. */
  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    let next: number | null = null;
    if (e.key === "ArrowLeft") next = page - 1;
    else if (e.key === "ArrowRight") next = page + 1;
    else if (e.key === "Home") next = 1;
    else if (e.key === "End") next = totalPages;
    if (next === null) return;
    e.preventDefault();
    const clamped = Math.min(Math.max(1, next), totalPages);
    if (clamped !== page) onChange(clamped);
  };

  return (
    <div className="mt-3 space-y-2">
      {typeof total === "number" && total > 0 && (
        <p className="text-[10px] text-muted-foreground text-center" data-testid="pager-summary">
          Showing {from}–{to} of {total} onboarded {label} · Page {page} of {totalPages}
        </p>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          data-testid="pager"
          onKeyDown={onKeyDown}
          className="flex items-center justify-center gap-1 max-w-full overflow-hidden"
        >
          <button
            type="button"
            onClick={() => onChange(Math.max(1, page - 1))}
            disabled={isFirst}
            aria-disabled={isFirst}
            aria-label="Previous page"
            className={`h-9 sm:h-8 px-2.5 shrink-0 rounded-lg border border-border bg-card text-[11px] font-medium inline-flex items-center gap-0.5 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-colors ${disabledCls}`}
          >
            <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="flex items-center gap-1 min-w-0">
            {pages.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onChange(p)}
                aria-current={p === page ? "page" : undefined}
                aria-label={`Page ${p}`}
                className={`w-9 h-9 sm:w-8 sm:h-8 shrink-0 rounded-lg border text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                  p === page
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onChange(Math.min(totalPages, page + 1))}
            disabled={isLast}
            aria-disabled={isLast}
            aria-label="Next page"
            className={`h-9 sm:h-8 px-2.5 shrink-0 rounded-lg border border-border bg-card text-[11px] font-medium inline-flex items-center gap-0.5 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-colors ${disabledCls}`}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
};

export default Pager;
