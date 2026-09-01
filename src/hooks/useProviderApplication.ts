import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface ProviderApplication {
  id: string;
  user_id: string;
  name: string;
  type: string;
  location: string | null;
  operator: string | null;
  plate: string | null;
  shop_type: string | null;
  phone: string | null;
  services: string[];
  specializations: string[];
  base_fee_kobo: number | null;
  per_km_kobo: number | null;
  capacity_tonnes: number | null;
  status: ApplicationStatus;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ApplicationDraft = Omit<
  ProviderApplication,
  "id" | "user_id" | "status" | "review_notes" | "created_at" | "updated_at"
>;

/** The signed-in user's own directory application (one per account). */
export const useMyProviderApplication = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["provider-application", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("provider_applications")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as ProviderApplication) ?? null;
    },
  });

  const submit = useMutation({
    mutationFn: async (draft: ApplicationDraft) => {
      const payload = { ...draft, user_id: user!.id };
      const existing = query.data;
      if (existing) {
        const { error } = await (supabase as any)
          .from("provider_applications")
          .update(payload)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("provider_applications").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["provider-application", user?.id] }),
  });

  return { application: query.data ?? null, loading: query.isLoading, submit: submit.mutateAsync, submitting: submit.isPending };
};

/** Admin review queue. */
export const useProviderApplications = () => {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["admin-provider-applications"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("provider_applications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as ProviderApplication[];
    },
  });

  const review = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: ApplicationStatus; notes?: string }) => {
      const { error } = await (supabase as any)
        .from("provider_applications")
        .update({ status, review_notes: notes ?? null, reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-provider-applications"] }),
  });

  return { applications: query.data ?? [], loading: query.isLoading, review: review.mutateAsync, reviewing: review.isPending };
};
