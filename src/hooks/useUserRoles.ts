import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "buyer" | "vendor" | "tow_operator" | "vulcanizer" | "mechanic" | "admin";

export const useUserRoles = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-roles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });
};

export const useMyVendor = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-vendor", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("vendors").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
};
