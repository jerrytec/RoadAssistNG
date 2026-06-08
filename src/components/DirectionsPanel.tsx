import { formatDistance, formatDuration, stripHtml, type DirectionsResult } from "@/lib/directions";

interface Props {
  targetName: string;
  directions: DirectionsResult | null;
  loading: boolean;
  onClose: () => void;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
}

const DirectionsPanel = ({ targetName, directions, loading, onClose, onPrimaryAction, primaryActionLabel }: Props) => {
  return (
    <div className="bg-card border border-border rounded-xl p-3 mb-3 animate-fade-in">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Directions to</p>
          <h3 className="text-sm font-bold">{targetName}</h3>
          {directions && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {formatDistance(directions.distance_meters)} ·{" "}
              <span className="text-primary font-semibold">{formatDuration(directions.duration_seconds)}</span>
            </p>
          )}
        </div>
        <button onClick={onClose} className="text-[11px] text-muted-foreground hover:text-foreground" aria-label="Clear directions">
          ✕
        </button>
      </div>

      {loading && <p className="text-[11px] text-muted-foreground py-4 text-center">Calculating route…</p>}

      {directions && (
        <>
          <ol className="max-h-60 overflow-y-auto divide-y divide-border border border-border rounded-lg">
            {directions.steps.map((s, i) => (
              <li key={i} className="p-2.5 flex gap-2 items-start">
                <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] leading-snug">{stripHtml(s.instruction) || s.maneuver}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDistance(s.distance_meters)} · {formatDuration(s.duration_seconds)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          {onPrimaryAction && (
            <button
              onClick={onPrimaryAction}
              className="w-full mt-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold"
            >
              {primaryActionLabel ?? "Continue"}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default DirectionsPanel;
