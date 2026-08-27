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

/** Compact window that never overflows on narrow screens: 1 … 4 5 6 … 25 */
export const buildPageWindow = (page: number, total: number, span = 1): (number | "gap")[] => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "gap")[] = [1];
  const start = Math.max(2, page - span);
  const end = Math.min(total - 1, page + span);
  if (start > 2) out.push("gap");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("gap");
  out.push(total);
  return out;
};

const Pager = ({ page, totalPages, total, from, to, label = "results", onChange }: Props) => {
  const pages = buildPageWindow(page, totalPages);

  return (
    <div className="mt-3 space-y-2">
      {typeof total === "number" && total > 0 && (
        <p className="text-[10px] text-muted-foreground text-center" data-testid="pager-summary">
          Showing {from}–{to} of {total} {label} · Page {page} of {totalPages}
        </p>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          data-testid="pager"
          className="flex items-center justify-center gap-1 max-w-full overflow-hidden"
        >
          <button
            onClick={() => onChange(Math.max(1, page - 1))}
            disabled={page === 1}
            aria-label="Previous page"
            className="h-9 sm:h-8 px-2.5 shrink-0 rounded-lg border border-border bg-card text-[11px] font-medium inline-flex items-center gap-0.5 disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary/40 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="flex items-center gap-1 min-w-0">
            {pages.map((p, i) =>
              p === "gap" ? (
                <span key={`gap-${i}`} className="px-0.5 text-[11px] text-muted-foreground select-none">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onChange(p)}
                  aria-current={p === page ? "page" : undefined}
                  aria-label={`Page ${p}`}
                  className={`w-9 h-9 sm:w-8 sm:h-8 shrink-0 rounded-lg border text-[11px] font-semibold transition-colors ${
                    p === page
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <button
            onClick={() => onChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            aria-label="Next page"
            className="h-9 sm:h-8 px-2.5 shrink-0 rounded-lg border border-border bg-card text-[11px] font-medium inline-flex items-center gap-0.5 disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary/40 transition-colors"
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
