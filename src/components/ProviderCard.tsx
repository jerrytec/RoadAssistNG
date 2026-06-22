import { getProviderIcon } from "@/lib/providerIcons";

export interface Provider {
  id: string;
  icon: string;
  name: string;
  type: string;
  location: string;
  status: string;
  verified: boolean;
  badges: { label: string; variant: "green" | "blue" | "amber" | "purple" }[];
  distance: string;
  eta: string;
  rating: string;
  avatarBg: "info" | "accent" | "secondary";
  // Optional rich metadata for tow / vulcanizer / mechanic detail flows
  operator?: string;
  plate?: string;
  baseFeeKobo?: number;
  perKmKobo?: number;
  capacityTonnes?: number;
  services?: string[];
  priceMinKobo?: number;
  priceMaxKobo?: number;
  shopType?: string;
  specializations?: string[];
  calloutFeeKobo?: number;
  hourlyRateKobo?: number;
  yearsExp?: number;
}

interface ProviderCardProps {
  provider: Provider;
  onClick?: () => void;
}

const badgeColors = {
  green: "bg-primary-light text-primary",
  blue: "bg-info-light text-info",
  amber: "bg-accent-light text-accent",
  purple: "bg-secondary-light text-secondary",
};

const avatarColors = {
  info: "bg-info-light text-info",
  accent: "bg-accent-light text-accent",
  secondary: "bg-secondary-light text-secondary",
};

const ProviderCard = ({ provider, onClick }: ProviderCardProps) => {
  const Icon = getProviderIcon(provider.type);
  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-lg p-3 flex items-start gap-2.5 mb-2 cursor-pointer transition-all duration-200 hover:border-primary-mid hover:shadow-sm hover:-translate-y-0.5 animate-fade-in"
    >
      <div className={`w-[42px] h-[42px] rounded-lg flex items-center justify-center shrink-0 ${avatarColors[provider.avatarBg]}`}>
        <Icon className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-foreground">{provider.name}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">
          {provider.type} · {provider.location} · {provider.status}
        </div>
        <div className="flex gap-1 mt-1 flex-wrap">
          {provider.badges.map((b, i) => (
            <span key={i} className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badgeColors[b.variant]}`}>
              {b.label}
            </span>
          ))}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs font-semibold text-primary">{provider.distance}</div>
        <div className="text-[10px] text-muted-foreground">{provider.eta}</div>
        <div className="text-[10px] text-accent mt-0.5">{provider.rating}</div>
      </div>
    </div>
  );
};

export default ProviderCard;

