import { NavLink, Outlet, Navigate, useLocation } from "react-router-dom";
import { useAdminRoles } from "@/hooks/useAdminRoles";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Users, Wrench, ListTodo, CreditCard,
  AlertTriangle, ShieldCheck, Settings, Siren, Receipt,
} from "lucide-react";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/sos", label: "SOS", icon: Siren },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/operators", label: "Operators", icon: Wrench },
  { to: "/admin/requests", label: "Requests", icon: ListTodo },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/compliance", label: "Compliance", icon: Receipt },
  { to: "/admin/disputes", label: "Disputes", icon: AlertTriangle },
  { to: "/admin/verification", label: "Verification", icon: ShieldCheck },
  { to: "/admin/roles", label: "Admin Roles", icon: Settings },
];

const AdminLayout = () => {
  const { user, loading } = useAuth();
  const { data: roles, isLoading } = useAdminRoles();
  const location = useLocation();

  if (loading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!user) return <Navigate to="/" state={{ from: location }} replace />;
  if (!roles || roles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-2">
          <ShieldCheck className="w-10 h-10 mx-auto text-muted-foreground" />
          <h2 className="text-lg font-bold">Admin access required</h2>
          <p className="text-xs text-muted-foreground">Your account does not have any admin role assigned. Contact a super admin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-56 shrink-0 border-r border-border bg-card hidden md:flex flex-col">
        <div className="px-4 py-4 border-b border-border">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Admin</p>
          <p className="text-sm font-bold">RoadAssist<span className="opacity-70">NG</span></p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"}`
              }
            >
              <n.icon className="w-4 h-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border text-[10px] text-muted-foreground">
          {roles.join(" · ")}
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <header className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-border bg-card overflow-x-auto">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `px-2.5 py-1.5 rounded-md text-[11px] whitespace-nowrap ${isActive ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {n.label}
            </NavLink>
          ))}
        </header>
        <div className="p-4 md:p-6 max-w-[1100px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
