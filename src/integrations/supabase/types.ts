export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      parts: {
        Row: {
          brand: string | null
          category_id: string
          compatibility: string[]
          condition: Database["public"]["Enums"]["part_condition"]
          created_at: string
          description: string | null
          id: string
          images: string[]
          price_kobo: number
          status: Database["public"]["Enums"]["part_status"]
          stock: number
          title: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          brand?: string | null
          category_id: string
          compatibility?: string[]
          condition?: Database["public"]["Enums"]["part_condition"]
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          price_kobo: number
          status?: Database["public"]["Enums"]["part_status"]
          stock?: number
          title: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          brand?: string | null
          category_id?: string
          compatibility?: string[]
          condition?: Database["public"]["Enums"]["part_condition"]
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          price_kobo?: number
          status?: Database["public"]["Enums"]["part_status"]
          stock?: number
          title?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "parts_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          part_id: string
          qty: number
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          part_id: string
          qty?: number
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          part_id?: string
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "parts_cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "parts_carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_cart_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_carts: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      parts_categories: {
        Row: {
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      parts_order_items: {
        Row: {
          id: string
          order_id: string
          part_id: string
          qty: number
          title_snapshot: string
          unit_price_kobo: number
          vendor_id: string
          vendor_status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          id?: string
          order_id: string
          part_id: string
          qty: number
          title_snapshot: string
          unit_price_kobo: number
          vendor_id: string
          vendor_status?: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          id?: string
          order_id?: string
          part_id?: string
          qty?: number
          title_snapshot?: string
          unit_price_kobo?: number
          vendor_id?: string
          vendor_status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "parts_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "parts_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_order_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_order_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_orders: {
        Row: {
          buyer_id: string
          created_at: string
          delivery_address: string | null
          delivery_fee_kobo: number
          delivery_phone: string | null
          escrow_ref: string | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal_kobo: number
          total_kobo: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          delivery_address?: string | null
          delivery_fee_kobo?: number
          delivery_phone?: string | null
          escrow_ref?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_kobo?: number
          total_kobo?: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          delivery_address?: string | null
          delivery_fee_kobo?: number
          delivery_phone?: string | null
          escrow_ref?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_kobo?: number
          total_kobo?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          address: string | null
          business_name: string
          bvn: string | null
          created_at: string
          id: string
          payout_account: string | null
          phone: string | null
          status: Database["public"]["Enums"]["vendor_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          business_name: string
          bvn?: string | null
          created_at?: string
          id?: string
          payout_account?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["vendor_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          business_name?: string
          bvn?: string | null
          created_at?: string
          id?: string
          payout_account?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["vendor_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "buyer"
        | "vendor"
        | "tow_operator"
        | "vulcanizer"
        | "mechanic"
        | "admin"
      order_status:
        | "pending_payment"
        | "paid"
        | "accepted"
        | "packed"
        | "shipped"
        | "delivered"
        | "completed"
        | "cancelled"
        | "disputed"
      part_condition: "new" | "refurbished" | "used"
      part_status: "draft" | "active" | "out_of_stock" | "archived"
      vendor_status: "pending" | "verified" | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "buyer",
        "vendor",
        "tow_operator",
        "vulcanizer",
        "mechanic",
        "admin",
      ],
      order_status: [
        "pending_payment",
        "paid",
        "accepted",
        "packed",
        "shipped",
        "delivered",
        "completed",
        "cancelled",
        "disputed",
      ],
      part_condition: ["new", "refurbished", "used"],
      part_status: ["draft", "active", "out_of_stock", "archived"],
      vendor_status: ["pending", "verified", "suspended"],
    },
  },
} as const
