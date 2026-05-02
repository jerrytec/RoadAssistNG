interface Tab {
  id: string;
  icon: string;
  label: string;
}

const tabs: Tab[] = [
  { id: "help", icon: "🚗", label: "Need help" },
  { id: "history", icon: "📜", label: "History" },
  { id: "payment", icon: "💳", label: "Pay" },
  { id: "provider", icon: "🚐", label: "Provider" },
  { id: "mechanic", icon: "🔩", label: "Mechanic" },
  { id: "register", icon: "📋", label: "Register" },
];

interface TabBarProps {
  active: string;
  onChange: (id: string) => void;
}

const TabBar = ({ active, onChange }: TabBarProps) => (
  <nav className="flex bg-card border-b border-border">
    {tabs.map((t) => (
      <button
        key={t.id}
        onClick={() => onChange(t.id)}
        className={`flex-1 min-w-[62px] py-2 text-center text-[10px] font-medium cursor-pointer border-b-[2.5px] transition-all whitespace-nowrap ${
          active === t.id
            ? "text-primary border-primary-mid"
            : "text-muted-foreground border-transparent"
        }`}
      >
        <span className="text-sm block mb-0.5">{t.icon}</span>
        {t.label}
      </button>
    ))}
  </nav>
);

export default TabBar;
