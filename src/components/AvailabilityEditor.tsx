import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAvailability, type WeeklySchedule } from "@/hooks/useAvailability";

const DAYS: { id: keyof WeeklySchedule; label: string }[] = [
  { id: "mon", label: "Monday" },
  { id: "tue", label: "Tuesday" },
  { id: "wed", label: "Wednesday" },
  { id: "thu", label: "Thursday" },
  { id: "fri", label: "Friday" },
  { id: "sat", label: "Saturday" },
  { id: "sun", label: "Sunday" },
];

const AvailabilityEditor = () => {
  const { availability, update, defaultSchedule } = useAvailability();
  const [schedule, setSchedule] = useState<WeeklySchedule>(defaultSchedule);
  const [radius, setRadius] = useState(10);
  const [base, setBase] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (availability) {
      setSchedule(availability.weekly_schedule ?? defaultSchedule);
      setRadius(availability.service_radius_km ?? 10);
      setBase(availability.base_location ?? "");
    }
  }, [availability, defaultSchedule]);

  const save = async () => {
    setBusy(true);
    try {
      await update({ weekly_schedule: schedule, service_radius_km: radius, base_location: base || null });
      toast.success("Schedule saved");
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      <div className="bg-card border border-border rounded-xl p-3">
        <p className="text-[11px] font-semibold text-muted-foreground mb-2">Service area</p>
        <input
          value={base}
          onChange={(e) => setBase(e.target.value)}
          placeholder="Base location (e.g. Ikeja, Lagos)"
          className="w-full py-2 px-3 border border-border rounded-lg text-xs bg-background outline-none focus:border-primary mb-2"
        />
        <label className="text-[11px] text-muted-foreground">Coverage radius: <span className="font-semibold text-foreground">{radius} km</span></label>
        <input type="range" min={1} max={50} value={radius} onChange={(e) => setRadius(parseInt(e.target.value))} className="w-full" />
      </div>

      <div className="bg-card border border-border rounded-xl p-3">
        <p className="text-[11px] font-semibold text-muted-foreground mb-2">Weekly hours</p>
        <div className="space-y-1.5">
          {DAYS.map((d) => {
            const day = schedule[d.id];
            return (
              <div key={d.id} className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSchedule((s) => ({ ...s, [d.id]: { ...s[d.id], on: !s[d.id].on } }))}
                  className={`w-9 h-5 rounded-full relative shrink-0 ${day.on ? "bg-primary" : "bg-muted"}`}
                  aria-label={`Toggle ${d.label}`}
                >
                  <span className={`absolute w-3.5 h-3.5 bg-card rounded-full top-[3px] transition-[left] ${day.on ? "left-[19px]" : "left-[3px]"}`} />
                </button>
                <span className="w-20 font-medium">{d.label}</span>
                <input
                  type="time" value={day.start} disabled={!day.on}
                  onChange={(e) => setSchedule((s) => ({ ...s, [d.id]: { ...s[d.id], start: e.target.value } }))}
                  className="py-1 px-2 border border-border rounded text-[11px] bg-background disabled:opacity-50"
                />
                <span>–</span>
                <input
                  type="time" value={day.end} disabled={!day.on}
                  onChange={(e) => setSchedule((s) => ({ ...s, [d.id]: { ...s[d.id], end: e.target.value } }))}
                  className="py-1 px-2 border border-border rounded text-[11px] bg-background disabled:opacity-50"
                />
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={save} disabled={busy} className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-60">
        {busy ? "Saving…" : "Save schedule"}
      </button>
    </div>
  );
};

export default AvailabilityEditor;
