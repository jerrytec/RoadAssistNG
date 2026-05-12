import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface CartItemRow {
  id: string;
  qty: number;
  part: {
    id: string;
    title: string;
    brand: string | null;
    price_kobo: number;
    stock: number;
    images: string[];
    vendor_id: string;
  };
}

const ensureCart = async (userId: string) => {
  const { data: existing } = await supabase
    .from("parts_carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from("parts_carts")
    .insert({ user_id: userId })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
};

export const useCart = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const cartQuery = useQuery({
    queryKey: ["cart", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<CartItemRow[]> => {
      if (!user) return [];
      const cartId = await ensureCart(user.id);
      const { data, error } = await supabase
        .from("parts_cart_items")
        .select("id, qty, part:parts(id, title, brand, price_kobo, stock, images, vendor_id)")
        .eq("cart_id", cartId);
      if (error) throw error;
      return (data ?? []) as any;
    },
  });

  const addItem = useMutation({
    mutationFn: async ({ partId, qty }: { partId: string; qty: number }) => {
      if (!user) throw new Error("Sign in required");
      const cartId = await ensureCart(user.id);
      const { data: existing } = await supabase
        .from("parts_cart_items")
        .select("id, qty")
        .eq("cart_id", cartId)
        .eq("part_id", partId)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase
          .from("parts_cart_items")
          .update({ qty: existing.qty + qty })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("parts_cart_items")
          .insert({ cart_id: cartId, part_id: partId, qty });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Added to cart");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not add to cart"),
  });

  const updateQty = useMutation({
    mutationFn: async ({ itemId, qty }: { itemId: string; qty: number }) => {
      if (qty <= 0) {
        const { error } = await supabase.from("parts_cart_items").delete().eq("id", itemId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("parts_cart_items").update({ qty }).eq("id", itemId);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const clear = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const cartId = await ensureCart(user.id);
      await supabase.from("parts_cart_items").delete().eq("cart_id", cartId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const items = cartQuery.data ?? [];
  const totalKobo = items.reduce((sum, i) => sum + i.qty * (i.part?.price_kobo ?? 0), 0);
  const totalCount = items.reduce((sum, i) => sum + i.qty, 0);

  return { items, totalKobo, totalCount, isLoading: cartQuery.isLoading, addItem, updateQty, clear };
};
