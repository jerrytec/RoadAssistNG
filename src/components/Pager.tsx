import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}

/** Build a compact page window: 1 … 4 5 6 … 25 */
const buildPages = (page: number, total: number): (number | "…")[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < total - 1) out.push("…");
  out.push(total);
  return out;
};

const Pager = ({ page, totalPages, onChange }: Props) => {
  if (totalPages <= 1) return null;
  const pages = buildPages(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 flex-wrap mt-3"
    >
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="Previous page"
        className="h-7 px-2 rounded-md border border-border bg-card text-[11px] font-medium inline-flex items-center gap-0.5 disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary/40 transition-colors"
      >
        <ChevronLeft className="w-3 h-3" aria-hidden="true" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-[11px] text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={`Page ${p}`}
            className={`min-w-7 h-7 px-1.5 rounded-md border text-[11px] font-semibold transition-colors ${
              p === page
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label="Next page"
        className="h-7 px-2 rounded-md border border-border bg-card text-[11px] font-medium inline-flex items-center gap-0.5 disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary/40 transition-colors"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="w-3 h-3" aria-hidden="true" />
      </button>
    </nav>
  );
};

export default Pager;
