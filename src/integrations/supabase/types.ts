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
      admin_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
          user_id?: string
        }
        Relationships: []
      }
      disputes: {
        Row: {
          assigned_admin: string | null
          created_at: string
          description: string | null
          id: string
          kind: Database["public"]["Enums"]["dispute_kind"]
          opened_by: string
          reason: string
          reference_id: string
          resolution: string | null
          status: Database["public"]["Enums"]["dispute_status"]
          updated_at: string
        }
        Insert: {
          assigned_admin?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind: Database["public"]["Enums"]["dispute_kind"]
          opened_by: string
          reason: string
          reference_id: string
          resolution?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Update: {
          assigned_admin?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["dispute_kind"]
          opened_by?: string
          reason?: string
          reference_id?: string
          resolution?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
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
      provider_availability: {
        Row: {
          base_location: string | null
          is_online: boolean
          service_radius_km: number
          updated_at: string
          user_id: string
          weekly_schedule: Json
        }
        Insert: {
          base_location?: string | null
          is_online?: boolean
          service_radius_km?: number
          updated_at?: string
          user_id: string
          weekly_schedule?: Json
        }
        Update: {
          base_location?: string | null
          is_online?: boolean
          service_radius_km?: number
          updated_at?: string
          user_id?: string
          weekly_schedule?: Json
        }
        Relationships: []
      }
      service_chat_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_id: string
          thread_id: string
          thread_type: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender_id: string
          thread_id: string
          thread_type: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_id?: string
          thread_id?: string
          thread_type?: string
        }
        Relationships: []
      }
      service_offers: {
        Row: {
          created_at: string
          eta_minutes: number | null
          id: string
          message: string | null
          price_kobo: number
          provider_id: string
          request_id: string
          status: Database["public"]["Enums"]["offer_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          eta_minutes?: number | null
          id?: string
          message?: string | null
          price_kobo: number
          provider_id: string
          request_id: string
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          eta_minutes?: number | null
          id?: string
          message?: string | null
          price_kobo?: number
          provider_id?: string
          request_id?: string
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_offers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          accepted_at: string | null
          accepted_offer_id: string | null
          amount_kobo: number | null
          assigned_provider_id: string | null
          buyer_id: string
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          paid_at: string | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["svc_payment_status"]
          price_estimate_kobo: number | null
          rating: number | null
          review: string | null
          service_type: Database["public"]["Enums"]["service_kind"]
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          vehicle: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_offer_id?: string | null
          amount_kobo?: number | null
          assigned_provider_id?: string | null
          buyer_id: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          paid_at?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["svc_payment_status"]
          price_estimate_kobo?: number | null
          rating?: number | null
          review?: string | null
          service_type: Database["public"]["Enums"]["service_kind"]
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          vehicle?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_offer_id?: string | null
          amount_kobo?: number | null
          assigned_provider_id?: string | null
          buyer_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          paid_at?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["svc_payment_status"]
          price_estimate_kobo?: number | null
          rating?: number | null
          review?: string | null
          service_type?: Database["public"]["Enums"]["service_kind"]
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          vehicle?: string | null
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
      vendor_onboarding: {
        Row: {
          completed: boolean
          payload: Json
          step: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          payload?: Json
          step?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          payload?: Json
          step?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          address: string | null
          bank_name: string | null
          business_name: string
          bvn: string | null
          created_at: string
          id: string
          nin: string | null
          payout_account: string | null
          phone: string | null
          status: Database["public"]["Enums"]["vendor_status"]
          updated_at: string
          user_id: string
          verification_notes: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          address?: string | null
          bank_name?: string | null
          business_name: string
          bvn?: string | null
          created_at?: string
          id?: string
          nin?: string | null
          payout_account?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["vendor_status"]
          updated_at?: string
          user_id: string
          verification_notes?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          address?: string | null
          bank_name?: string | null
          business_name?: string
          bvn?: string | null
          created_at?: string
          id?: string
          nin?: string | null
          payout_account?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["vendor_status"]
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_thread: {
        Args: { _thread: string; _type: string; _uid: string }
        Returns: boolean
      }
      has_admin_role: {
        Args: {
          _role: Database["public"]["Enums"]["admin_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_any_admin: { Args: { _user_id: string }; Returns: boolean }
      role_for_service: {
        Args: { _k: Database["public"]["Enums"]["service_kind"] }
        Returns: Database["public"]["Enums"]["app_role"]
      }
    }
    Enums: {
      admin_role:
        | "super_admin"
        | "operations"
        | "finance"
        | "compliance"
        | "fraud"
        | "support"
        | "analytics"
      app_role:
        | "buyer"
        | "vendor"
        | "tow_operator"
        | "vulcanizer"
        | "mechanic"
        | "admin"
      dispute_kind: "service" | "order"
      dispute_status: "open" | "investigating" | "resolved" | "rejected"
      offer_status: "pending" | "accepted" | "declined" | "withdrawn"
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
      request_status:
        | "pending"
        | "offered"
        | "accepted"
        | "enroute"
        | "arrived"
        | "in_progress"
        | "completed"
        | "cancelled"
      service_kind: "tow" | "vulcanizer" | "mechanic"
      svc_payment_status: "unpaid" | "pending" | "paid" | "refunded" | "failed"
      vendor_status: "pending" | "verified" | "suspended"
      verification_status: "pending" | "approved" | "rejected"
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
      admin_role: [
        "super_admin",
        "operations",
        "finance",
        "compliance",
        "fraud",
        "support",
        "analytics",
      ],
      app_role: [
        "buyer",
        "vendor",
        "tow_operator",
        "vulcanizer",
        "mechanic",
        "admin",
      ],
      dispute_kind: ["service", "order"],
      dispute_status: ["open", "investigating", "resolved", "rejected"],
      offer_status: ["pending", "accepted", "declined", "withdrawn"],
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
      request_status: [
        "pending",
        "offered",
        "accepted",
        "enroute",
        "arrived",
        "in_progress",
        "completed",
        "cancelled",
      ],
      service_kind: ["tow", "vulcanizer", "mechanic"],
      svc_payment_status: ["unpaid", "pending", "paid", "refunded", "failed"],
      vendor_status: ["pending", "verified", "suspended"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
