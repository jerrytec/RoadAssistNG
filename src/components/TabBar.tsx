interface Tab {
  id: string;
  icon: string;
  label: string;
}

const tabs: Tab[] = [
  { id: "help", icon: "🚗", label: "Need help" },
  { id: "tow", icon: "🚐", label: "Tow vans" },
  { id: "vulcanizer", icon: "🔧", label: "Vulcanizers" },
  { id: "mechanic", icon: "🔩", label: "Mechanic" },
  { id: "parts", icon: "🧰", label: "Parts" },
  { id: "support", icon: "🎧", label: "Support" },
  { id: "history", icon: "📜", label: "History" },
];

interface TabBarProps {
  active: string;
  onChange: (id: string) => void;
}

const TabBar = ({ active, onChange }: TabBarProps) => (
  <nav className="bg-card border-b border-border sticky top-14 z-20">
    <div className="container max-w-[960px] flex overflow-x-auto px-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex-1 min-w-[72px] py-2.5 text-center text-[11px] font-medium cursor-pointer border-b-[2.5px] transition-all whitespace-nowrap ${
            active === t.id
              ? "text-primary border-primary"
              : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          <span className="text-base block mb-0.5">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  </nav>
);

export default TabBar;
