import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AdminRole =
  | "super_admin"
  | "operations"
  | "finance"
  | "compliance"
  | "fraud"
  | "support"
  | "analytics";

export const useAdminRoles = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["admin-roles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_roles" as any)
        .select("role")
        .eq("user_id", user!.id);
      if (error) throw error;
      return ((data ?? []) as { role: AdminRole }[]).map((r) => r.role);
    },
  });
};

export const useIsAdmin = () => {
  const { data } = useAdminRoles();
  return (data?.length ?? 0) > 0;
};

export const useHasAdminRole = (role: AdminRole) => {
  const { data } = useAdminRoles();
  return data?.includes(role) || data?.includes("super_admin") || false;
};
