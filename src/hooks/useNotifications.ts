import { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export interface AppNotification {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export const NOTIFS_PAGE_SIZE = 10;

// Module-level singleton: one channel per user, shared across mounts.
const channels = new Map<string, { channel: RealtimeChannel; refs: number }>();
type Listener = (n: AppNotification) => void;
const listeners = new Map<string, Set<Listener>>();

const acquireChannel = (userId: string) => {
  const existing = channels.get(userId);
  if (existing) {
    existing.refs += 1;
    return;
  }
  const channel = supabase
    .channel(`notifs:${userId}`) // stable key
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      (payload) => {
        const n = payload.new as AppNotification;
        listeners.get(userId)?.forEach((fn) => fn(n));
      },
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      () => listeners.get(userId)?.forEach((fn) => fn(null as unknown as AppNotification)),
    )
    .subscribe();
  channels.set(userId, { channel, refs: 1 });
};

const releaseChannel = (userId: string) => {
  const entry = channels.get(userId);
  if (!entry) return;
  entry.refs -= 1;
  if (entry.refs <= 0) {
    supabase.removeChannel(entry.channel);
    channels.delete(userId);
  }
};

export const useNotifications = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    acquireChannel(userId);
    const set = listeners.get(userId) ?? new Set<Listener>();
    const handler: Listener = (n) => {
      qc.invalidateQueries({ queryKey: ["notifications", userId] });
      if (n && n.id) {
        toast({ title: n.title, description: n.body ?? undefined });
      }
    };
    set.add(handler);
    listeners.set(userId, set);
    return () => {
      set.delete(handler);
      if (set.size === 0) listeners.delete(userId);
      releaseChannel(userId);
    };
  }, [user, qc]);

  const listQ = useQuery({
    queryKey: ["notifications", user?.id, page],
    enabled: !!user,
    queryFn: async () => {
      const from = page * NOTIFS_PAGE_SIZE;
      const to = from + NOTIFS_PAGE_SIZE - 1;
      const { data, error, count } = await supabase
        .from("notifications")
        .select("*", { count: "exact" })
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { items: (data ?? []) as AppNotification[], count: count ?? 0 };
    },
  });

  const unreadQ = useQuery({
    queryKey: ["notifications-unread", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .is("read_at", null);
      if (error) throw error;
      return count ?? 0;
    },
  });

  // Keep unread badge fresh when realtime fires.
  useEffect(() => {
    qc.invalidateQueries({ queryKey: ["notifications-unread", user?.id] });
  }, [listQ.data, qc, user?.id]);

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user!.id)
        .is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
      qc.invalidateQueries({ queryKey: ["notifications-unread", user?.id] });
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
      qc.invalidateQueries({ queryKey: ["notifications-unread", user?.id] });
    },
  });

  const items = listQ.data?.items ?? [];
  const total = listQ.data?.count ?? 0;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / NOTIFS_PAGE_SIZE)), [total]);

  return {
    items,
    unread: unreadQ.data ?? 0,
    loading: listQ.isLoading,
    markAllRead: () => markAllRead.mutate(),
    markRead: (id: string) => markRead.mutate(id),
    page,
    totalPages,
    total,
    pageSize: NOTIFS_PAGE_SIZE,
    setPage,
    hasPrev: page > 0,
    hasNext: (page + 1) * NOTIFS_PAGE_SIZE < total,
  };
};
