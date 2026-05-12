import ThemeToggle from "./ThemeToggle";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";

interface Props {
  onOpenNotifications: () => void;
  unreadCount: number;
}

const AppHeader = ({ onOpenNotifications, unreadCount }: Props) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { totalCount } = useCart();
  const { data: roles } = useUserRoles();
  const isProvider = roles?.some((r) => ["vendor", "tow_operator", "vulcanizer", "mechanic"].includes(r));

  return (
    <header className="bg-primary px-4 py-3 flex items-center justify-between">
      <h1 className="text-lg font-extrabold tracking-tight text-primary-foreground">
        Road<span className="text-primary-light">Assist</span> NG
      </h1>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button
          onClick={() => navigate("/cart")}
          className="relative bg-white/[.18] text-primary-foreground text-sm px-2 py-1 rounded-full border border-white/30 cursor-pointer"
          aria-label="Cart"
        >
          🛒
          {totalCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
              {totalCount}
            </span>
          )}
        </button>
        <button
          onClick={onOpenNotifications}
          className="relative bg-white/[.18] text-primary-foreground text-sm px-2 py-1 rounded-full border border-white/30 cursor-pointer"
          aria-label="Notifications"
        >
          🔔
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
        {isProvider && (
          <button onClick={() => navigate("/vendor")} className="bg-white/[.18] text-primary-foreground text-[11px] px-2.5 py-0.5 rounded-full border border-white/30" title="Open provider portal">
            Portal
          </button>
        )}
        {user && (
          <button onClick={() => signOut()} className="bg-white/[.18] text-primary-foreground text-[11px] px-2.5 py-0.5 rounded-full border border-white/30">
            Sign out
          </button>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
