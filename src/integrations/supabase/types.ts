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
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          product_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          product_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          product_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_checkin: {
        Row: {
          created_at: string
          date: string
          id: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      download_history: {
        Row: {
          created_at: string
          id: string
          link_type: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link_type: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link_type?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "download_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          message: string
          product_id: string | null
          read: boolean
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          message: string
          product_id?: string | null
          read?: boolean
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          message?: string
          product_id?: string | null
          read?: boolean
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          code_css: string | null
          code_html: string | null
          code_js: string | null
          created_at: string
          demo_image_url: string | null
          description: string
          download_count: number
          embed_url: string | null
          framework: string | null
          id: string
          language: string | null
          link_bypass1: string | null
          link_bypass2: string | null
          link_direct: string | null
          reject_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          search_tsv: unknown
          status: Database["public"]["Enums"]["product_status"]
          tags: string[]
          title: string
          updated_at: string
          user_id: string
          view_count: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["product_category"]
          code_css?: string | null
          code_html?: string | null
          code_js?: string | null
          created_at?: string
          demo_image_url?: string | null
          description: string
          download_count?: number
          embed_url?: string | null
          framework?: string | null
          id?: string
          language?: string | null
          link_bypass1?: string | null
          link_bypass2?: string | null
          link_direct?: string | null
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          search_tsv?: unknown
          status?: Database["public"]["Enums"]["product_status"]
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
          view_count?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          code_css?: string | null
          code_html?: string | null
          code_js?: string | null
          created_at?: string
          demo_image_url?: string | null
          description?: string
          download_count?: number
          embed_url?: string | null
          framework?: string | null
          id?: string
          language?: string | null
          link_bypass1?: string | null
          link_bypass2?: string | null
          link_direct?: string | null
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          search_tsv?: unknown
          status?: Database["public"]["Enums"]["product_status"]
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
          view_count?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          github_url: string | null
          id: string
          last_checkin_at: string | null
          level: number
          streak: number
          twitter_url: string | null
          updated_at: string
          website_url: string | null
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          github_url?: string | null
          id: string
          last_checkin_at?: string | null
          level?: number
          streak?: number
          twitter_url?: string | null
          updated_at?: string
          website_url?: string | null
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          github_url?: string | null
          id?: string
          last_checkin_at?: string | null
          level?: number
          streak?: number
          twitter_url?: string | null
          updated_at?: string
          website_url?: string | null
          xp?: number
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string
          id: string
          product_id: string
          stars: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          stars: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          stars?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          product_id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          product_id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          product_id?: string
          reason?: Database["public"]["Enums"]["report_reason"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_xp: { Args: { _amount: number; _user: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_view: { Args: { _product: string }; Returns: undefined }
      suggest_products: {
        Args: { _limit?: number; _q: string }
        Returns: {
          category: Database["public"]["Enums"]["product_category"]
          download_count: number
          id: string
          title: string
        }[]
      }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user"
      notification_type:
        | "like"
        | "follow"
        | "comment"
        | "approve"
        | "reject"
        | "reply"
      product_category: "game" | "shop" | "comic" | "other"
      product_status: "pending" | "approved" | "rejected"
      report_reason:
        | "dead_link"
        | "broken_code"
        | "inappropriate"
        | "spam"
        | "other"
      report_status: "open" | "resolved" | "dismissed"
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
      app_role: ["admin", "user"],
      notification_type: [
        "like",
        "follow",
        "comment",
        "approve",
        "reject",
        "reply",
      ],
      product_category: ["game", "shop", "comic", "other"],
      product_status: ["pending", "approved", "rejected"],
      report_reason: [
        "dead_link",
        "broken_code",
        "inappropriate",
        "spam",
        "other",
      ],
      report_status: ["open", "resolved", "dismissed"],
    },
  },
} as const
