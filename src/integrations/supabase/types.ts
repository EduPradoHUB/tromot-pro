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
      app_chat_conversations: {
        Row: {
          city: string | null
          contact_info: string | null
          created_at: string
          distributor_id: string | null
          escalation_reason: string | null
          id: string
          last_message_at: string
          needs_human: boolean
          session_id: string
          state: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          city?: string | null
          contact_info?: string | null
          created_at?: string
          distributor_id?: string | null
          escalation_reason?: string | null
          id?: string
          last_message_at?: string
          needs_human?: boolean
          session_id: string
          state?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          city?: string | null
          contact_info?: string | null
          created_at?: string
          distributor_id?: string | null
          escalation_reason?: string | null
          id?: string
          last_message_at?: string
          needs_human?: boolean
          session_id?: string
          state?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_chat_conversations_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "distributors"
            referencedColumns: ["id"]
          },
        ]
      }
      app_chat_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "app_chat_conversations"
            referencedColumns: ["id"]
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
      bling_tokens: {
        Row: {
          access_token: string | null
          created_at: string
          expires_at: string | null
          id: number
          refresh_token: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id: number
          refresh_token?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          id?: number
          refresh_token?: string | null
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
      clientes: {
        Row: {
          bling_id: number
          cep: string | null
          cidade: string | null
          created_at: string
          documento: string | null
          email: string | null
          endereco: string | null
          id: string
          nome: string
          situacao: string | null
          synced_at: string | null
          telefone: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          bling_id: number
          cep?: string | null
          cidade?: string | null
          created_at?: string
          documento?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          situacao?: string | null
          synced_at?: string | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          bling_id?: number
          cep?: string | null
          cidade?: string | null
          created_at?: string
          documento?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          situacao?: string | null
          synced_at?: string | null
          telefone?: string | null
          uf?: string | null
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
      documents: {
        Row: {
          category: string
          created_at: string
          description: string | null
          file_type: string | null
          file_url: string
          id: string
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
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
          visible: boolean | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          section: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
          visible?: boolean | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          section?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
          visible?: boolean | null
        }
        Relationships: []
      }
      email_notification_settings: {
        Row: {
          id: boolean
          manual_atualizado_modo: string
          novo_produto_modo: string
          produto_alterado_modo: string
          updated_at: string
        }
        Insert: {
          id?: boolean
          manual_atualizado_modo?: string
          novo_produto_modo?: string
          produto_alterado_modo?: string
          updated_at?: string
        }
        Update: {
          id?: boolean
          manual_atualizado_modo?: string
          novo_produto_modo?: string
          produto_alterado_modo?: string
          updated_at?: string
        }
        Relationships: []
      }
      instalacao_sucesso: {
        Row: {
          created_at: string | null
          id: string
          produto_nome: string
          publico: boolean | null
          user_id: string | null
          veiculo_ano: number | null
          veiculo_marca: string | null
          veiculo_modelo: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          produto_nome: string
          publico?: boolean | null
          user_id?: string | null
          veiculo_ano?: number | null
          veiculo_marca?: string | null
          veiculo_modelo?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          produto_nome?: string
          publico?: boolean | null
          user_id?: string | null
          veiculo_ano?: number | null
          veiculo_marca?: string | null
          veiculo_modelo?: string | null
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          embedding: string | null
          id: string
          image_url: string | null
          product_id: string | null
          situation: string
          solution: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          embedding?: string | null
          id?: string
          image_url?: string | null
          product_id?: string | null
          situation: string
          solution: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          embedding?: string | null
          id?: string
          image_url?: string | null
          product_id?: string | null
          situation?: string
          solution?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          bling_id: number | null
          cliente_bling_id: number | null
          cliente_nome: string | null
          comissao: number
          created_at: string
          id: string
          itens_json: Json | null
          observacoes: string | null
          status: string
          updated_at: string
          valor_total: number
          vendedor_id: string
        }
        Insert: {
          bling_id?: number | null
          cliente_bling_id?: number | null
          cliente_nome?: string | null
          comissao?: number
          created_at?: string
          id?: string
          itens_json?: Json | null
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor_total?: number
          vendedor_id?: string
        }
        Update: {
          bling_id?: number | null
          cliente_bling_id?: number | null
          cliente_nome?: string | null
          comissao?: number
          created_at?: string
          id?: string
          itens_json?: Json | null
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor_total?: number
          vendedor_id?: string
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
          photo_url: string | null
          photos_urls: string[] | null
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
          photo_url?: string | null
          photos_urls?: string[] | null
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
          photo_url?: string | null
          photos_urls?: string[] | null
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
      product_notifications: {
        Row: {
          created_at: string
          event_type: string
          id: string
          product_id: string
          recipients_count: number | null
          sent_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          product_id: string
          recipients_count?: number | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          product_id?: string
          recipients_count?: number | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_notifications_product_id_fkey"
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
          store_url: string | null
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
          store_url?: string | null
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
          store_url?: string | null
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
          email_notifications_opt_in: boolean
          id: string
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          state: string | null
          unsubscribe_token: string
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
          email_notifications_opt_in?: boolean
          id?: string
          name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          state?: string | null
          unsubscribe_token?: string
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
          email_notifications_opt_in?: boolean
          id?: string
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          state?: string | null
          unsubscribe_token?: string
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
      security_audit_log: {
        Row: {
          actor_user_id: string | null
          created_at: string | null
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          target_user_id: string | null
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          target_user_id?: string | null
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      service_ratings: {
        Row: {
          comment: string | null
          conversation_id: string
          created_at: string
          id: string
          phone: string
          rating: number
        }
        Insert: {
          comment?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          phone: string
          rating: number
        }
        Update: {
          comment?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          phone?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_ratings_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
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
      whatsapp_conversations: {
        Row: {
          city: string | null
          created_at: string
          customer_name: string | null
          customer_type: Database["public"]["Enums"]["customer_type"] | null
          distributor_id: string | null
          escalation_reason: string | null
          id: string
          last_message_at: string
          needs_human: boolean
          phone: string
          state: string | null
          status: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          customer_name?: string | null
          customer_type?: Database["public"]["Enums"]["customer_type"] | null
          distributor_id?: string | null
          escalation_reason?: string | null
          id?: string
          last_message_at?: string
          needs_human?: boolean
          phone: string
          state?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          customer_name?: string | null
          customer_type?: Database["public"]["Enums"]["customer_type"] | null
          distributor_id?: string | null
          escalation_reason?: string | null
          id?: string
          last_message_at?: string
          needs_human?: boolean
          phone?: string
          state?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_distributor_id_fkey"
            columns: ["distributor_id"]
            isOneToOne: false
            referencedRelation: "distributors"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          id: string
          media_type: string | null
          media_url: string | null
          role: string
          tool_name: string | null
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          role: string
          tool_name?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          role?: string
          tool_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: { Args: never; Returns: string }
      get_distributor_contact_secure: {
        Args: { distributor_id: string }
        Returns: {
          city: string
          cover_entire_state: boolean
          id: string
          name: string
          phone: string
          state: string
          whatsapp: string
        }[]
      }
      get_distributor_full_contact: {
        Args: { distributor_id: string }
        Returns: {
          city: string
          cover_entire_state: boolean
          id: string
          name: string
          phone: string
          state: string
          whatsapp: string
        }[]
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
      is_admin: { Args: never; Returns: boolean }
      is_authenticated_user: { Args: never; Returns: boolean }
      is_profile_owner: { Args: { profile_user_id: string }; Returns: boolean }
      is_system_operation: { Args: never; Returns: boolean }
      is_verified_admin: { Args: never; Returns: boolean }
      log_distributor_access: {
        Args: {
          p_access_type: string
          p_distributor_id: string
          p_user_location?: Json
        }
        Returns: undefined
      }
      mask_sensitive_data: {
        Args: { phone_input: string; whatsapp_input: string }
        Returns: Json
      }
      match_knowledge_base: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          category: string
          id: string
          image_url: string
          product_id: string
          similarity: number
          situation: string
          solution: string
          title: string
        }[]
      }
      recalc_product_rating: {
        Args: { p_product_id: string }
        Returns: undefined
      }
      search_distributors_masked: {
        Args: { p_city?: string; p_state?: string }
        Returns: {
          active: boolean
          city: string
          cover_entire_state: boolean
          created_at: string
          has_contact: boolean
          id: string
          name: string
          phone_display: string
          state: string
          whatsapp_display: string
        }[]
      }
      search_distributors_secure: {
        Args: { p_city?: string; p_state?: string }
        Returns: {
          active: boolean
          city: string
          cover_entire_state: boolean
          created_at: string
          has_contact: boolean
          id: string
          name: string
          phone_display: string
          state: string
          whatsapp_display: string
        }[]
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
      user_role:
        | "ADM"
        | "Técnico Tromot"
        | "Cliente"
        | "Suporte Tromot"
        | "Vendedor"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      user_role: [
        "ADM",
        "Técnico Tromot",
        "Cliente",
        "Suporte Tromot",
        "Vendedor",
      ],
    },
  },
} as const
