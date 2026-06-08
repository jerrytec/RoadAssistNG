import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ComplianceConfig = {
  fee_percentage: number;
  fee_label: string;
  platform_service_fee_percentage: number;
  platform_parts_fee_percentage: number;
  min_fee: number;
  max_fee: number;
  updated_at: string;
};

export const useComplianceConfig = () =>
  useQuery({
    queryKey: ["compliance-config"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("compliance_config").select("*").eq("id", true).maybeSingle();
      if (error) throw error;
      return data as ComplianceConfig | null;
    },
  });

export const useUpdateComplianceConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<ComplianceConfig>) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await (supabase as any).from("compliance_config")
        .update({ ...patch, updated_by: u.user?.id ?? null, updated_at: new Date().toISOString() })
        .eq("id", true);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compliance-config"] }),
  });
};
