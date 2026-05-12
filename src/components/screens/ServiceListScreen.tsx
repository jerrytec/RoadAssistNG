import ProviderCard, { type Provider } from "@/components/ProviderCard";
import { allProviders } from "@/data/providers";

interface Props {
  serviceType: "tow" | "vulcanizer";
  onSelectProvider: (p: Provider) => void;
}

const META = {
  tow: {
    icon: "🚐",
    title: "Tow van operators",
    subtitle: "Verified tow vans available near you",
    filter: (p: Provider) => p.type.toLowerCase().includes("tow"),
  },
  vulcanizer: {
    icon: "🔧",
    title: "Vulcanizers",
    subtitle: "Mobile & fixed-shop vulcanizers ready to help",
    filter: (p: Provider) => p.type.toLowerCase().includes("vulcanizer"),
  },
};

const ServiceListScreen = ({ serviceType, onSelectProvider }: Props) => {
  const meta = META[serviceType];
  const list = allProviders.filter(meta.filter);

  return (
    <div className="p-3.5 animate-fade-in">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{meta.icon}</span>
        <h2 className="text-[15px] font-semibold">{meta.title}</h2>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">{meta.subtitle}</p>

      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        📍 Ikeja, Lagos · {list.length} available
      </p>

      {list.length === 0 ? (
        <div className="text-center text-[12px] text-muted-foreground border border-dashed border-border rounded-lg py-8">
          No providers available right now. Try again shortly.
        </div>
      ) : (
        list.map((p) => (
          <ProviderCard key={p.id} provider={p} onClick={() => onSelectProvider(p)} />
        ))
      )}

      <p className="text-center text-[10px] text-muted-foreground pt-3 border-t border-border mt-2">
        Tap any provider to start the booking workflow
      </p>
    </div>
  );
};

export default ServiceListScreen;
