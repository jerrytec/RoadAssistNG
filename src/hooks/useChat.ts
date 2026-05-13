import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ChatMessage {
  id: string;
  thread_type: "request" | "order";
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export const useChat = (threadType: "request" | "order" | null, threadId: string | undefined) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    if (!threadType || !threadId) return;
    const ch = supabase
      .channel(`chat-${threadType}-${threadId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "service_chat_messages", filter: `thread_id=eq.${threadId}` }, () => {
        qc.invalidateQueries({ queryKey: ["chat", threadType, threadId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [threadType, threadId, qc]);

  const messagesQ = useQuery({
    queryKey: ["chat", threadType, threadId],
    enabled: !!threadType && !!threadId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_chat_messages")
        .select("*")
        .eq("thread_type", threadType!)
        .eq("thread_id", threadId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ChatMessage[];
    },
  });

  const send = useMutation({
    mutationFn: async (body: string) => {
      const trimmed = body.trim();
      if (!trimmed) return;
      const { error } = await supabase.from("service_chat_messages").insert({
        thread_type: threadType!,
        thread_id: threadId!,
        sender_id: user!.id,
        body: trimmed,
      });
      if (error) throw error;
    },
  });

  return { messages: messagesQ.data ?? [], loading: messagesQ.isLoading, send: send.mutateAsync, sending: send.isPending };
};
