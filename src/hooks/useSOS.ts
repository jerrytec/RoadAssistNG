import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type SOSStatus = "dispatching" | "assigned" | "enroute" | "on_scene" | "resolved" | "escalated" | "cancelled" | "false_alarm";

export interface SOSRequest {
  id: string;
  buyer_id: string;
  service_type: "tow" | "vulcanizer" | "mechanic";
  vehicle: string | null;
  description: string | null;
  location: string | null;
  status: string;
  sos_status: SOSStatus | null;
  is_sos: boolean;
  sos_lat: number | null;
  sos_lng: number | null;
  sos_accuracy_m: number | null;
  sos_triggered_at: string | null;
  danger_flag: boolean;
  assigned_provider_id: string | null;
  amount_kobo: number | null;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

const getPosition = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("Geolocation not supported"));
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
  });

export const useTriggerSOS = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input?: { service_type?: "tow" | "vulcanizer" | "mechanic"; vehicle?: string; description?: string }) => {
      if (!user) throw new Error("Sign in required");
      // Block if user already has an active SOS
      const { data: active } = await (supabase as any)
        .from("service_requests")
        .select("id, sos_status")
        .eq("buyer_id", user.id)
        .eq("is_sos", true)
        .in("sos_status", ["dispatching", "assigned", "enroute", "on_scene", "escalated"])
        .limit(1)
        .maybeSingle();
      if (active) return { id: active.id as string, existing: true };

      let lat: number | null = null, lng: number | null = null, acc: number | null = null;
      try {
        const pos = await getPosition();
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        acc = pos.coords.accuracy ?? null;
      } catch { /* allow without location */ }

      const device_info = { ua: navigator.userAgent, lang: navigator.language, ts: new Date().toISOString() };

      const { data, error } = await (supabase as any)
        .from("service_requests")
        .insert({
          buyer_id: user.id,
          service_type: input?.service_type ?? "tow",
          vehicle: input?.vehicle ?? null,
          description: input?.description ?? "🚨 SOS emergency",
          location: lat && lng ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : "Unknown",
          is_sos: true,
          priority: 100,
          sos_status: "dispatching",
          sos_lat: lat, sos_lng: lng, sos_accuracy_m: acc,
          sos_triggered_at: new Date().toISOString(),
          device_info,
          status: "pending",
        })
        .select("id")
        .single();
      if (error) throw error;
      return { id: data.id as string, existing: false };
    },
  });
};

export const useSOSRequest = (id: string | undefined) => {
  const qc = useQueryClient();
  useEffect(() => {
    if (!id) return;
    const ch = supabase
      .channel(`sos-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests", filter: `id=eq.${id}` }, () => qc.invalidateQueries({ queryKey: ["sos", id] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, qc]);

  return useQuery({
    queryKey: ["sos", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("service_requests").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data as SOSRequest | null;
    },
  });
};

export const useFlagDanger = () =>
  useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("service_requests")
        .update({ danger_flag: true, sos_status: "escalated", sos_escalated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      await (supabase as any).from("sos_events").insert({ request_id: id, kind: "danger" });
    },
  });

export const useCancelSOS = () =>
  useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("service_requests")
        .update({ sos_status: "cancelled", status: "cancelled" })
        .eq("id", id);
      if (error) throw error;
    },
  });

export const useResolveSOS = () =>
  useMutation({
    mutationFn: async ({ id, amount_kobo }: { id: string; amount_kobo: number }) => {
      const { error } = await (supabase as any)
        .from("service_requests")
        .update({ sos_status: "resolved", status: "completed", completed_at: new Date().toISOString(), amount_kobo })
        .eq("id", id);
      if (error) throw error;
    },
  });

export const useClaimSOS = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Sign in required");
      const { error } = await (supabase as any)
        .from("service_requests")
        .update({ assigned_provider_id: user.id, sos_status: "assigned", status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", id)
        .is("assigned_provider_id", null);
      if (error) throw error;
      await (supabase as any).from("sos_events").insert({ request_id: id, kind: "accepted", actor_id: user.id });
    },
  });
};

export const useUpdateSOSStatus = () =>
  useMutation({
    mutationFn: async ({ id, status }: { id: string; status: SOSStatus }) => {
      const patch: any = { sos_status: status };
      if (status === "enroute") patch.status = "enroute";
      if (status === "on_scene") patch.status = "arrived";
      if (status === "resolved") { patch.status = "completed"; patch.completed_at = new Date().toISOString(); }
      const { error } = await (supabase as any).from("service_requests").update(patch).eq("id", id);
      if (error) throw error;
    },
  });

export const useOpenSOSForProvider = (serviceType: "tow" | "vulcanizer" | "mechanic" | null) => {
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase
      .channel(`open-sos`)
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests" }, () => qc.invalidateQueries({ queryKey: ["open-sos"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);
  return useQuery({
    queryKey: ["open-sos", serviceType],
    enabled: !!serviceType,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("service_requests")
        .select("*")
        .eq("is_sos", true)
        .eq("service_type", serviceType!)
        .is("assigned_provider_id", null)
        .in("sos_status", ["dispatching", "escalated"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SOSRequest[];
    },
  });
};

export const useCreateShareToken = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (request_id: string) => {
      const token = crypto.randomUUID().replace(/-/g, "");
      const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const { error } = await (supabase as any)
        .from("sos_share_tokens")
        .insert({ token, request_id, created_by: user!.id, expires_at });
      if (error) throw error;
      return token;
    },
  });
};

export const useTrustedContacts = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["trusted-contacts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("trusted_contacts").select("*").order("created_at");
      if (error) throw error;
      return data as { id: string; name: string; phone: string; relation: string | null; notify_on_sos: boolean }[];
    },
  });
  const add = useMutation({
    mutationFn: async (c: { name: string; phone: string; relation?: string }) => {
      const { error } = await (supabase as any).from("trusted_contacts").insert({ user_id: user!.id, ...c });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trusted-contacts"] }),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("trusted_contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trusted-contacts"] }),
  });
  return { ...list, add, remove };
};
