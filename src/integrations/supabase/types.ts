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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      advertisements: {
        Row: {
          advertiser: string
          clicks_count: number | null
          created_at: string
          creative_aspect_ratio: string
          creative_url: string
          daily_cap: number | null
          end_date: string
          id: string
          impressions_count: number | null
          slot: string
          start_date: string
          status: Database["public"]["Enums"]["content_status"] | null
          target_category: string | null
          target_products: Json | null
          target_type: string | null
          target_url: string | null
          updated_at: string
        }
        Insert: {
          advertiser: string
          clicks_count?: number | null
          created_at?: string
          creative_aspect_ratio: string
          creative_url: string
          daily_cap?: number | null
          end_date: string
          id?: string
          impressions_count?: number | null
          slot: string
          start_date: string
          status?: Database["public"]["Enums"]["content_status"] | null
          target_category?: string | null
          target_products?: Json | null
          target_type?: string | null
          target_url?: string | null
          updated_at?: string
        }
        Update: {
          advertiser?: string
          clicks_count?: number | null
          created_at?: string
          creative_aspect_ratio?: string
          creative_url?: string
          daily_cap?: number | null
          end_date?: string
          id?: string
          impressions_count?: number | null
          slot?: string
          start_date?: string
          status?: Database["public"]["Enums"]["content_status"] | null
          target_category?: string | null
          target_products?: Json | null
          target_type?: string | null
          target_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          ad_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          product_id: string | null
          user_id: string | null
        }
        Insert: {
          ad_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          product_id?: string | null
          user_id?: string | null
        }
        Update: {
          ad_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          product_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "advertisements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      banners: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          image_url: string
          link_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          image_url: string
          link_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          image_url?: string
          link_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      distributor_access_logs: {
        Row: {
          access_type: string
          created_at: string | null
          distributor_id: string
          id: string
          user_id: string
          user_location: Json | null
        }
        Insert: {
          access_type: string
          created_at?: string | null
          distributor_id: string
          id?: string
          user_id: string
          user_location?: Json | null
        }
        Update: {
          access_type?: string
          created_at?: string | null
          distributor_id?: string
          id?: string
          user_id?: string
          user_location?: Json | null
        }
        Relationships: []
      }
      distributors: {
        Row: {
          active: boolean
          city: string | null
          cover_entire_state: boolean
          created_at: string
          id: string
          name: string
          phone: string | null
          state: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          active?: boolean
          city?: string | null
          cover_entire_state?: boolean
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          state: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          active?: boolean
          city?: string | null
          cover_entire_state?: boolean
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          state?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      editable_content: {
        Row: {
          created_at: string
          description: string | null
          id: string
          section: string
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          section: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          section?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          caption: string | null
          created_at: string
          id: string
          likes_count: number | null
          photo_url: string
          product_id: string
          reports_count: number | null
          status: Database["public"]["Enums"]["content_status"] | null
          updated_at: string
        }
        Insert: {
          author_id: string
          caption?: string | null
          created_at?: string
          id?: string
          likes_count?: number | null
          photo_url: string
          product_id: string
          reports_count?: number | null
          status?: Database["public"]["Enums"]["content_status"] | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          likes_count?: number | null
          photo_url?: string
          product_id?: string
          reports_count?: number | null
          status?: Database["public"]["Enums"]["content_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "posts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode_ean: string | null
          category: string
          code: string
          compatibility: Json | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          manual_type: string | null
          manual_url: string | null
          name: string
          no_manual_available: boolean
          out_of_production: boolean
          rating_average: number | null
          rating_count: number | null
          status: Database["public"]["Enums"]["content_status"] | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          barcode_ean?: string | null
          category: string
          code: string
          compatibility?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          manual_type?: string | null
          manual_url?: string | null
          name: string
          no_manual_available?: boolean
          out_of_production?: boolean
          rating_average?: number | null
          rating_count?: number | null
          status?: Database["public"]["Enums"]["content_status"] | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          barcode_ean?: string | null
          category?: string
          code?: string
          compatibility?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          manual_type?: string | null
          manual_url?: string | null
          name?: string
          no_manual_available?: boolean
          out_of_production?: boolean
          rating_average?: number | null
          rating_count?: number | null
          status?: Database["public"]["Enums"]["content_status"] | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          customer_type: Database["public"]["Enums"]["customer_type"] | null
          email: string
          id: string
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          state: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          customer_type?: Database["public"]["Enums"]["customer_type"] | null
          email: string
          id?: string
          name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          state?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          customer_type?: Database["public"]["Enums"]["customer_type"] | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          state?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          answer: string | null
          answer_by: string | null
          answered_at: string | null
          author_id: string
          created_at: string
          id: string
          product_id: string
          question: string
        }
        Insert: {
          answer?: string | null
          answer_by?: string | null
          answered_at?: string | null
          author_id: string
          created_at?: string
          id?: string
          product_id: string
          question: string
        }
        Update: {
          answer?: string | null
          answer_by?: string | null
          answered_at?: string | null
          author_id?: string
          created_at?: string
          id?: string
          product_id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_answer_by_fkey"
            columns: ["answer_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "questions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "questions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          author_id: string
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
        }
        Insert: {
          author_id: string
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
        }
        Update: {
          author_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ratings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string
          created_at: string
          id: string
          model: string
          years: string[]
        }
        Insert: {
          brand: string
          created_at?: string
          id?: string
          model: string
          years: string[]
        }
        Update: {
          brand?: string
          created_at?: string
          id?: string
          model?: string
          years?: string[]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_installation_leaderboard: {
        Args: { limit_rows?: number }
        Returns: {
          avatar_url: string
          name: string
          posts_count: number
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }[]
      }
      get_user_public_info: {
        Args: { user_uuid: string }
        Returns: {
          avatar_url: string
          created_at: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }[]
      }
      log_distributor_access: {
        Args: {
          p_access_type: string
          p_distributor_id: string
          p_user_location?: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      content_status:
        | "active"
        | "inactive"
        | "pending"
        | "approved"
        | "rejected"
      customer_type:
        | "lojista_instalador"
        | "distribuidor_representante"
        | "usuario_final"
      user_role: "ADM" | "Técnico Tromot" | "Cliente"
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
      content_status: ["active", "inactive", "pending", "approved", "rejected"],
      customer_type: [
        "lojista_instalador",
        "distribuidor_representante",
        "usuario_final",
      ],
      user_role: ["ADM", "Técnico Tromot", "Cliente"],
    },
  },
} as const
