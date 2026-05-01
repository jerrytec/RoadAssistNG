import { useState } from "react";
import ProviderCard from "@/components/ProviderCard";
import { mechanics } from "@/data/providers";
import type { Provider } from "@/components/ProviderCard";

const faults = [
  { icon: "⚡", label: "Won't start" },
  { icon: "🔋", label: "Dead battery" },
  { icon: "🌡️", label: "Overheating" },
  { icon: "💨", label: "Flat tyre" },
  { icon: "🛞", label: "Brake issue" },
  { icon: "💡", label: "Electrical" },
  { icon: "🚗", label: "Engine noise" },
  { icon: "💧", label: "Fluid leak" },
  { icon: "❓", label: "Not sure" },
];

interface Props {
  onSelectProvider: (p: Provider) => void;
}

const MechanicScreen = ({ onSelectProvider }: Props) => {
  const [selectedFault, setSelectedFault] = useState<string | null>(null);

  return (
    <div className="p-3.5 animate-fade-in">
      <h2 className="text-[15px] font-semibold mb-1">Find a roadside mechanic</h2>
      <p className="text-[11px] text-muted-foreground mb-3">
        Stranded with a fault? Pick your issue and we'll connect you to a verified mobile mechanic nearby.
      </p>

      {/* Map */}
      <div className="rounded-lg h-[120px] flex items-center justify-center mb-3 relative overflow-hidden border border-border bg-secondary-light">
        <span className="text-3xl">🔩</span>
        <div className="absolute w-[7px] h-[7px] rounded-full bg-secondary" style={{ top: "30%", left: "35%" }} />
        <div className="absolute w-[7px] h-[7px] rounded-full bg-secondary" style={{ top: "55%", left: "70%" }} />
        <div className="absolute w-[7px] h-[7px] rounded-full bg-secondary" style={{ top: "65%", left: "45%" }} />
      </div>

      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        📍 Ikeja, Lagos · {mechanics.length} mechanics nearby
      </p>

      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">What's the problem?</p>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {faults.map((f) => (
          <button
            key={f.label}
            onClick={() => setSelectedFault(selectedFault === f.label ? null : f.label)}
            className={`bg-card border rounded-lg p-2.5 text-center cursor-pointer transition-all ${
              selectedFault === f.label
                ? "border-secondary bg-secondary-light"
                : "border-border hover:border-secondary"
            }`}
          >
            <div className="text-lg mb-0.5">{f.icon}</div>
            <div className={`text-[10px] font-medium ${selectedFault === f.label ? "text-secondary" : "text-foreground"}`}>
              {f.label}
            </div>
          </button>
        ))}
      </div>

      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Nearest verified mechanics</p>

      {mechanics.map((m) => (
        <ProviderCard key={m.id} provider={m} onClick={() => onSelectProvider(m)} />
      ))}

      <p className="text-center text-[10px] text-muted-foreground pt-3 border-t border-border mt-2">
        Tap any mechanic to start the booking workflow
      </p>
    </div>
  );
};

export default MechanicScreen;
