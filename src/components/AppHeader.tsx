import ThemeToggle from "./ThemeToggle";
import BrandLogo from "./BrandLogo";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, ShoppingCart, User2, LogOut, Briefcase } from "lucide-react";

interface Props {
  onOpenNotifications: () => void;
}

const IconBtn = ({ onClick, label, badge, children }: { onClick: () => void; label: string; badge?: number; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    aria-label={label}
    className="relative w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-primary-foreground flex items-center justify-center transition-colors border border-white/20"
  >
    {children}
    {!!badge && badge > 0 && (
      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">{badge}</span>
    )}
  </button>
);

const AppHeader = ({ onOpenNotifications }: Props) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { totalCount } = useCart();
  const { data: roles } = useUserRoles();
  const { unread } = useNotifications();
  const isProvider = roles?.some((r) => ["vendor", "tow_operator", "vulcanizer", "mechanic"].includes(r));

  return (
    <header className="gradient-brand sticky top-0 z-30 shadow-card">
      <div className="container max-w-[960px] flex items-center justify-between h-14 px-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-base sm:text-lg font-extrabold tracking-tight text-primary-foreground">
          <BrandLogo className="w-6 h-6 rounded-sm" />
          <span>RoadAssist<span className="opacity-80">NG</span></span>
        </button>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <IconBtn onClick={() => navigate("/cart")} label="Cart" badge={totalCount}><ShoppingCart className="w-4 h-4"/></IconBtn>
          <IconBtn onClick={onOpenNotifications} label="Notifications" badge={unread}><Bell className="w-4 h-4"/></IconBtn>
          {isProvider && (
            <IconBtn onClick={() => navigate("/vendor")} label="Provider portal"><Briefcase className="w-4 h-4"/></IconBtn>
          )}
          {user && (
            <>
              <IconBtn onClick={() => navigate("/profile")} label="Profile"><User2 className="w-4 h-4"/></IconBtn>
              <IconBtn onClick={() => { sessionStorage.removeItem("portal-redirected"); signOut(); }} label="Sign out"><LogOut className="w-4 h-4"/></IconBtn>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
