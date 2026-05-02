import ThemeToggle from "./ThemeToggle";

interface Props {
  onOpenNotifications: () => void;
  unreadCount: number;
}

const AppHeader = ({ onOpenNotifications, unreadCount }: Props) => (
  <header className="bg-primary px-4 py-3 flex items-center justify-between">
    <h1 className="text-lg font-extrabold tracking-tight text-primary-foreground">
      Road<span className="text-primary-light">Assist</span> NG
    </h1>
    <div className="flex items-center gap-2.5">
      <ThemeToggle />
      <button
        onClick={onOpenNotifications}
        className="relative bg-white/[.18] text-primary-foreground text-sm px-2 py-1 rounded-full border border-white/30 cursor-pointer"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      <span className="bg-white/[.18] text-primary-foreground text-[11px] px-2.5 py-0.5 rounded-full border border-white/30">
        Lagos, NG
      </span>
    </div>
  </header>
);

export default AppHeader;
