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
  info: "bg-info-light",
  accent: "bg-accent-light",
  secondary: "bg-secondary-light",
};

const ProviderCard = ({ provider, onClick }: ProviderCardProps) => (
  <div
    onClick={onClick}
    className="bg-card border border-border rounded-lg p-3 flex items-start gap-2.5 mb-2 cursor-pointer transition-colors hover:border-primary-mid animate-fade-in"
  >
    <div className={`w-[42px] h-[42px] rounded-lg flex items-center justify-center text-lg shrink-0 ${avatarColors[provider.avatarBg]}`}>
      {provider.icon}
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

export default ProviderCard;
