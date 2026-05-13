import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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

// Module-level singleton: ONE channel per user, shared across mounts.
// All listeners must be attached BEFORE subscribe() is called — that's why
// we register the postgres_changes handler here, not per-hook.
type Listener = (n: AppNotification | null) => void;
const channels = new Map<string, { channel: RealtimeChannel; refs: number; listeners: Set<Listener> }>();
// Module-level dedupe: every notification id is dispatched at most once
// (to all current listeners), even across re-mounts.
const dispatched = new Map<string, Set<string>>();

const acquireChannel = (userId: string, listener: Listener) => {
  let entry = channels.get(userId);
  if (!entry) {
    const listeners = new Set<Listener>();
    const channel = supabase
      .channel(`notifs:${userId}`) // stable per-user key
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const n = payload.new as AppNotification;
          const seen = dispatched.get(userId) ?? new Set<string>();
          if (seen.has(n.id)) {
            // Still notify listeners (for query refetch) but mark as dup.
            listeners.forEach((fn) => fn(null));
            return;
          }
          seen.add(n.id);
          dispatched.set(userId, seen);
          listeners.forEach((fn) => fn(n));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => listeners.forEach((fn) => fn(null)),
      )
      .subscribe();
    entry = { channel, refs: 0, listeners };
    channels.set(userId, entry);
  }
  entry.refs += 1;
  entry.listeners.add(listener);
};

const releaseChannel = (userId: string, listener: Listener) => {
  const entry = channels.get(userId);
  if (!entry) return;
  entry.listeners.delete(listener);
  entry.refs -= 1;
  if (entry.refs <= 0) {
    supabase.removeChannel(entry.channel);
    channels.delete(userId);
    dispatched.delete(userId);
  }
};

interface UseNotificationsOptions {
  /** When true, mark all unread as read once on mount (e.g. opening a panel). */
  markReadOnOpen?: boolean;
  /** When true, only return unread items in the paginated list. */
  unreadOnly?: boolean;
}

export const useNotifications = (opts: UseNotificationsOptions = {}) => {
  const { markReadOnOpen = false, unreadOnly = false } = opts;
  const { user } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread">(unreadOnly ? "unread" : "all");

  // Reset to first page when filter flips.
  useEffect(() => { setPage(0); }, [filter]);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    const handler: Listener = (n) => {
      qc.invalidateQueries({ queryKey: ["notifications", userId] });
      qc.invalidateQueries({ queryKey: ["notifications-unread", userId] });
      if (n) toast(n.title, { id: n.id, description: n.body ?? undefined });
    };
    acquireChannel(userId, handler);
    return () => releaseChannel(userId, handler);
  }, [user, qc]);

  const listQ = useQuery({
    queryKey: ["notifications", user?.id, filter, page],
    enabled: !!user,
    queryFn: async () => {
      const from = page * NOTIFS_PAGE_SIZE;
      const to = from + NOTIFS_PAGE_SIZE - 1;
      let q = supabase
        .from("notifications")
        .select("*", { count: "exact" })
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (filter === "unread") q = q.is("read_at", null);
      const { data, error, count } = await q;
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

  // Mark-read-on-open: fire once per mount when enabled and there are unread.
  const openedRef = useRef(false);
  useEffect(() => {
    if (!markReadOnOpen || openedRef.current || !user) return;
    if ((unreadQ.data ?? 0) > 0) {
      openedRef.current = true;
      markAllRead.mutate();
    }
  }, [markReadOnOpen, user, unreadQ.data, markAllRead]);

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
    filter,
    setFilter,
  };
};
