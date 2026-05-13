import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface OnboardingState {
  user_id: string;
  step: number;
  payload: Record<string, any>;
  completed: boolean;
}

export const useOnboarding = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["onboarding", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("vendor_onboarding").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      if (!data) {
        const init = { user_id: user!.id, step: 0, payload: {}, completed: false };
        await supabase.from("vendor_onboarding").insert(init as any);
        return init as OnboardingState;
      }
      return data as unknown as OnboardingState;
    },
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<OnboardingState>) => {
      const { error } = await supabase.from("vendor_onboarding").upsert({ user_id: user!.id, ...patch } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["onboarding", user?.id] }),
  });

  return { state: q.data, loading: q.isLoading, save: update.mutateAsync };
};
