import { useEffect, useMemo, useState } from "react";
import { Navigation } from "lucide-react";
import ProviderCard, { type Provider } from "@/components/ProviderCard";
import Pager from "@/components/Pager";

interface Props {
  providers: Provider[];
  heading?: string;
  emptyText?: string;
  /** Noun used in the count line, e.g. "Mechanics" */
  countLabel?: string;
  pageSize?: number;
  onSelect: (p: Provider) => void;
  onDirections: (p: Provider) => void;
}

/**
 * Unified list used by MechanicScreen, NeedHelpScreen and ServiceListScreen
 * so the "nearest providers" UI (cards + directions chip + pagination)
 * stays visually and behaviourally identical everywhere.
 */
const NearestProvidersList = ({
  providers,
  heading = "Nearest providers",
  emptyText = "No providers available right now. Try again shortly.",
  countLabel = "Providers",
  pageSize = 5,
  onSelect,
  onDirections,
}: Props) => {
  const [page, setPage] = useState(1);
  const total = providers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Reset to first page whenever the dataset (filter/search) changes.
  useEffect(() => {
    setPage(1);
  }, [total, providers[0]?.id]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visible = useMemo(
    () => providers.slice((page - 1) * pageSize, page * pageSize),
    [providers, page, pageSize]
  );

  return (
    <>
      <div className="flex items-baseline justify-between gap-2 mb-2 flex-wrap">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          {heading}
        </p>
        {total > 0 && (
          <p className="text-[10px] text-muted-foreground">
            {total} {countLabel} · Page {page} of {totalPages}
          </p>
        )}
      </div>

      {total === 0 ? (
        <div className="text-center text-[12px] text-muted-foreground border border-dashed border-border rounded-lg py-8">
          {emptyText}
        </div>
      ) : (
        visible.map((p) => (
          <div key={p.id} className="relative">
            <ProviderCard provider={p} onClick={() => onSelect(p)} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDirections(p);
              }}
              className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-1 rounded-full bg-primary-light text-primary hover:bg-primary hover:text-primary-foreground transition-colors inline-flex items-center gap-1"
              aria-label={`Directions to ${p.name}`}
            >
              <Navigation className="w-3 h-3" aria-hidden="true" /> Directions
            </button>
          </div>
        ))
      )}

      <Pager page={page} totalPages={totalPages} onChange={setPage} />

      <p className="text-center text-[10px] text-muted-foreground pt-3 border-t border-border mt-3 inline-flex items-center justify-center gap-1 w-full">
        Tap any provider to book · Tap{" "}
        <Navigation className="w-3 h-3 inline" aria-hidden="true" /> for turn-by-turn navigation
      </p>
    </>
  );
};

export default NearestProvidersList;
