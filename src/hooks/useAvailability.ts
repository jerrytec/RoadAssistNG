import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const DEFAULT_SCHEDULE = {
  mon: { on: true, start: "08:00", end: "18:00" },
  tue: { on: true, start: "08:00", end: "18:00" },
  wed: { on: true, start: "08:00", end: "18:00" },
  thu: { on: true, start: "08:00", end: "18:00" },
  fri: { on: true, start: "08:00", end: "18:00" },
  sat: { on: true, start: "09:00", end: "16:00" },
  sun: { on: false, start: "10:00", end: "14:00" },
};

export type WeeklySchedule = typeof DEFAULT_SCHEDULE;

export interface ProviderAvailability {
  user_id: string;
  is_online: boolean;
  weekly_schedule: WeeklySchedule;
  service_radius_km: number;
  base_location: string | null;
}

export const useAvailability = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["availability", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("provider_availability").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      if (!data) {
        // initialize
        const init = { user_id: user!.id, is_online: false, weekly_schedule: DEFAULT_SCHEDULE, service_radius_km: 10, base_location: null };
        await supabase.from("provider_availability").insert(init as any);
        return init as ProviderAvailability;
      }
      return data as unknown as ProviderAvailability;
    },
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<ProviderAvailability>) => {
      const { error } = await supabase.from("provider_availability").upsert({ user_id: user!.id, ...patch } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["availability", user?.id] }),
  });

  return { availability: q.data, loading: q.isLoading, update: update.mutateAsync, defaultSchedule: DEFAULT_SCHEDULE };
};
