import { Car, Truck, Disc3, Wrench, PackageOpen, Headphones, ClipboardList, type LucideIcon } from "lucide-react";

interface Tab {
  id: string;
  Icon: LucideIcon;
  label: string;
}

const tabs: Tab[] = [
  { id: "help",       Icon: Car,            label: "Need help" },
  { id: "tow",        Icon: Truck,          label: "Tow vans" },
  { id: "vulcanizer", Icon: Disc3,          label: "Vulcanizers" },
  { id: "mechanic",   Icon: Wrench,         label: "Mechanic" },
  { id: "parts",      Icon: PackageOpen,    label: "Parts" },
  { id: "support",    Icon: Headphones,     label: "Support" },
  { id: "history",    Icon: ClipboardList,  label: "History" },
];

interface TabBarProps {
  active: string;
  onChange: (id: string) => void;
}

const TabBar = ({ active, onChange }: TabBarProps) => (
  <nav className="bg-card border-b border-border sticky top-14 z-20" aria-label="Primary">
    <div className="container max-w-[960px] flex overflow-x-auto px-2">
      {tabs.map(({ id, Icon, label }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-current={isActive ? "page" : undefined}
            aria-label={label}
            className={`flex-1 min-w-[72px] py-2.5 text-center text-[11px] font-medium cursor-pointer border-b-[2.5px] transition-colors duration-200 whitespace-nowrap flex flex-col items-center gap-1 ${
              isActive
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.25 : 1.75} aria-hidden="true" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);

export default TabBar;
