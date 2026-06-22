import { Navigation } from "lucide-react";
import ProviderCard, { type Provider } from "@/components/ProviderCard";

interface Props {
  providers: Provider[];
  heading?: string;
  emptyText?: string;
  onSelect: (p: Provider) => void;
  onDirections: (p: Provider) => void;
}

/**
 * Unified list used by MechanicScreen, NeedHelpScreen and ServiceListScreen
 * so the "nearest providers" UI (cards + directions chip + footer hint)
 * stays visually and behaviourally identical everywhere.
 */
const NearestProvidersList = ({
  providers,
  heading = "Nearest providers",
  emptyText = "No providers available right now. Try again shortly.",
  onSelect,
  onDirections,
}: Props) => (
  <>
    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
      {heading}
    </p>

    {providers.length === 0 ? (
      <div className="text-center text-[12px] text-muted-foreground border border-dashed border-border rounded-lg py-8">
        {emptyText}
      </div>
    ) : (
      providers.map((p) => (
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

    <p className="text-center text-[10px] text-muted-foreground pt-3 border-t border-border mt-2 inline-flex items-center justify-center gap-1 w-full">
      Tap any provider to book · Tap{" "}
      <Navigation className="w-3 h-3 inline" aria-hidden="true" /> for turn-by-turn navigation
    </p>
  </>
);

export default NearestProvidersList;
