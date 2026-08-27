import { Navigation } from "lucide-react";
import ProviderCard, { type Provider } from "@/components/ProviderCard";
import Pager from "@/components/Pager";

interface Props {
  /** Only the current page of providers (5 by default) */
  providers: Provider[];
  heading?: string;
  emptyText?: string;
  /** Noun used in the summary line, e.g. "mechanics" */
  countLabel?: string;
  loading?: boolean;
  page: number;
  totalPages: number;
  total: number;
  from: number;
  to: number;
  onPageChange: (p: number) => void;
  onSelect: (p: Provider) => void;
  onDirections: (p: Provider) => void;
}

/**
 * Unified paginated list used by MechanicScreen, NeedHelpScreen and
 * ServiceListScreen. Receives one page at a time from the data layer.
 */
const NearestProvidersList = ({
  providers,
  heading = "Nearest providers",
  emptyText = "No providers match your search. Try a different filter.",
  countLabel = "providers",
  loading = false,
  page,
  totalPages,
  total,
  from,
  to,
  onPageChange,
  onSelect,
  onDirections,
}: Props) => (
  <>
    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
      {heading}
    </p>

    {loading && providers.length === 0 ? (
      <div className="space-y-2" aria-busy="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[74px] rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    ) : total === 0 ? (
      <div
        className="text-center text-[12px] text-muted-foreground border border-dashed border-border rounded-lg py-8"
        data-testid="empty-state"
      >
        {emptyText}
      </div>
    ) : (
      <div data-testid="provider-list" className={loading ? "opacity-60 transition-opacity" : undefined}>
        {providers.map((p) => (
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
        ))}
      </div>
    )}

    <Pager
      page={page}
      totalPages={totalPages}
      total={total}
      from={from}
      to={to}
      label={countLabel}
      onChange={onPageChange}
    />

    <p className="text-center text-[10px] text-muted-foreground pt-3 border-t border-border mt-3 inline-flex items-center justify-center gap-1 w-full">
      Tap any provider to book · Tap{" "}
      <Navigation className="w-3 h-3 inline" aria-hidden="true" /> for turn-by-turn navigation
    </p>
  </>
);

export default NearestProvidersList;
