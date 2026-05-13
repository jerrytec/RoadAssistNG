import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ServiceKind = "tow" | "vulcanizer" | "mechanic";
export type RequestStatus =
  | "pending" | "offered" | "accepted" | "enroute" | "arrived" | "in_progress" | "completed" | "cancelled";

export interface ServiceRequest {
  id: string;
  buyer_id: string;
  service_type: ServiceKind;
  vehicle: string | null;
  description: string | null;
  location: string | null;
  price_estimate_kobo: number;
  status: RequestStatus;
  assigned_provider_id: string | null;
  accepted_offer_id: string | null;
  accepted_at: string | null;
  completed_at: string | null;
  rating: number | null;
  review: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceOffer {
  id: string;
  request_id: string;
  provider_id: string;
  price_kobo: number;
  eta_minutes: number | null;
  message: string | null;
  status: "pending" | "accepted" | "declined" | "withdrawn";
  created_at: string;
}

/* Buyer: list my requests */
export const useMyRequests = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`my-requests-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests", filter: `buyer_id=eq.${user.id}` }, () => {
        qc.invalidateQueries({ queryKey: ["my-requests"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  return useQuery({
    queryKey: ["my-requests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ServiceRequest[];
    },
  });
};

/* Single request + offers (buyer or assigned provider) */
export const useRequest = (id: string | undefined) => {
  const qc = useQueryClient();
  useEffect(() => {
    if (!id) return;
    const ch = supabase
      .channel(`req-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests", filter: `id=eq.${id}` }, () => qc.invalidateQueries({ queryKey: ["request", id] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "service_offers", filter: `request_id=eq.${id}` }, () => qc.invalidateQueries({ queryKey: ["request-offers", id] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, qc]);

  const requestQ = useQuery({
    queryKey: ["request", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("service_requests").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data as ServiceRequest | null;
    },
  });
  const offersQ = useQuery({
    queryKey: ["request-offers", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("service_offers").select("*").eq("request_id", id!).order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ServiceOffer[];
    },
  });
  return { request: requestQ.data, offers: offersQ.data ?? [], loading: requestQ.isLoading };
};

/* Provider: open requests + active jobs */
export const useProviderJobs = (serviceType: ServiceKind | null) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`provider-jobs-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests" }, () => qc.invalidateQueries({ queryKey: ["provider-jobs"] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "service_offers", filter: `provider_id=eq.${user.id}` }, () => qc.invalidateQueries({ queryKey: ["provider-jobs"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  return useQuery({
    queryKey: ["provider-jobs", user?.id, serviceType],
    enabled: !!user && !!serviceType,
    queryFn: async () => {
      const [openRes, mineRes, offersRes] = await Promise.all([
        supabase.from("service_requests").select("*").eq("service_type", serviceType!).in("status", ["pending", "offered"]).order("created_at", { ascending: false }),
        supabase.from("service_requests").select("*").eq("assigned_provider_id", user!.id).order("updated_at", { ascending: false }),
        supabase.from("service_offers").select("*").eq("provider_id", user!.id),
      ]);
      if (openRes.error) throw openRes.error;
      if (mineRes.error) throw mineRes.error;
      if (offersRes.error) throw offersRes.error;
      return {
        open: (openRes.data ?? []) as ServiceRequest[],
        active: (mineRes.data ?? []) as ServiceRequest[],
        myOffers: (offersRes.data ?? []) as ServiceOffer[],
      };
    },
  });
};

/* Mutations */
export const useCreateRequest = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { service_type: ServiceKind; vehicle?: string; description?: string; location?: string; price_estimate_kobo?: number; }) => {
      const { data, error } = await supabase.from("service_requests").insert({
        buyer_id: user!.id,
        ...input,
      }).select().single();
      if (error) throw error;
      return data as ServiceRequest;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-requests"] }),
  });
};

export const useSendOffer = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { request_id: string; price_kobo: number; eta_minutes?: number; message?: string }) => {
      const { error } = await supabase.from("service_offers").insert({ provider_id: user!.id, ...input });
      if (error) throw error;
      // bump request to "offered"
      await supabase.from("service_requests").update({ status: "offered" as any }).eq("id", input.request_id).eq("status", "pending");
    },
  });
};

export const useAcceptOffer = () => {
  return useMutation({
    mutationFn: async (offer: ServiceOffer) => {
      const { error: e1 } = await supabase.from("service_offers").update({ status: "accepted" as any }).eq("id", offer.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase
        .from("service_requests")
        .update({
          status: "accepted" as any,
          assigned_provider_id: offer.provider_id,
          accepted_offer_id: offer.id,
          accepted_at: new Date().toISOString(),
          price_estimate_kobo: offer.price_kobo,
        })
        .eq("id", offer.request_id);
      if (e2) throw e2;
      // decline siblings
      await supabase.from("service_offers").update({ status: "declined" as any }).eq("request_id", offer.request_id).neq("id", offer.id);
    },
  });
};

export const useUpdateRequestStatus = () => {
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RequestStatus }) => {
      const patch: any = { status };
      if (status === "completed") patch.completed_at = new Date().toISOString();
      const { error } = await supabase.from("service_requests").update(patch).eq("id", id);
      if (error) throw error;
    },
  });
};

export const useRateRequest = () => {
  return useMutation({
    mutationFn: async ({ id, rating, review }: { id: string; rating: number; review?: string }) => {
      const { error } = await supabase.from("service_requests").update({ rating, review: review ?? null }).eq("id", id);
      if (error) throw error;
    },
  });
};
