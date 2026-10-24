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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: string | null
          id: string
          target_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: string | null
          id?: string
          target_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: string | null
          id?: string
          target_id?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          agreed_price: number | null
          booking_code: string
          booking_type: Database["public"]["Enums"]["booking_type"]
          cancel_reason: string | null
          created_at: string
          customer_budget: number | null
          customer_id: string
          id: string
          job_description: string
          locality: string
          scheduled_at: string | null
          service_address: string
          service_id: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          worker_id: string
        }
        Insert: {
          agreed_price?: number | null
          booking_code?: string
          booking_type?: Database["public"]["Enums"]["booking_type"]
          cancel_reason?: string | null
          created_at?: string
          customer_budget?: number | null
          customer_id: string
          id?: string
          job_description: string
          locality: string
          scheduled_at?: string | null
          service_address: string
          service_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          worker_id: string
        }
        Update: {
          agreed_price?: number | null
          booking_code?: string
          booking_type?: Database["public"]["Enums"]["booking_type"]
          cancel_reason?: string | null
          created_at?: string
          customer_budget?: number | null
          customer_id?: string
          id?: string
          job_description?: string
          locality?: string
          scheduled_at?: string | null
          service_address?: string
          service_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "worker_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          booking_id: string | null
          created_at: string
          description: string
          id: string
          reported_user_id: string | null
          reporter_id: string
          resolution_notes: string | null
          review_id: string | null
          status: Database["public"]["Enums"]["complaint_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          description: string
          id?: string
          reported_user_id?: string | null
          reporter_id: string
          resolution_notes?: string | null
          review_id?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          subject?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          description?: string
          id?: string
          reported_user_id?: string | null
          reporter_id?: string
          resolution_notes?: string | null
          review_id?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      favourites: {
        Row: {
          created_at: string
          customer_id: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          worker_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favourites_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_booking_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_booking_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_booking_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_booking_id_fkey"
            columns: ["related_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      price_offers: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          id: string
          message: string | null
          offered_by: string
          status: Database["public"]["Enums"]["offer_status"]
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          id?: string
          message?: string | null
          offered_by: string
          status?: Database["public"]["Enums"]["offer_status"]
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          id?: string
          message?: string | null
          offered_by?: string
          status?: Database["public"]["Enums"]["offer_status"]
        }
        Relationships: [
          {
            foreignKeyName: "price_offers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          is_suspended: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id: string
          is_suspended?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_suspended?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          is_hidden: boolean
          rating: number
          reviewer_name: string
          worker_id: string
          worker_response: string | null
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          is_hidden?: boolean
          rating: number
          reviewer_name?: string
          worker_id: string
          worker_response?: string | null
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          is_hidden?: boolean
          rating?: number
          reviewer_name?: string
          worker_id?: string
          worker_response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
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
      worker_profiles: {
        Row: {
          availability_status: Database["public"]["Enums"]["availability_status"]
          avatar_url: string | null
          bio: string | null
          city: string
          completed_jobs: number
          created_at: string
          display_name: string
          experience_years: number
          id: string
          is_demo: boolean
          languages: string[]
          latitude: number | null
          locality: string
          longitude: number | null
          rating_avg: number
          review_count: number
          service_radius_km: number
          updated_at: string
          user_id: string | null
          verification_note: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          verification_submitted_at: string | null
          working_hours: string | null
        }
        Insert: {
          availability_status?: Database["public"]["Enums"]["availability_status"]
          avatar_url?: string | null
          bio?: string | null
          city?: string
          completed_jobs?: number
          created_at?: string
          display_name: string
          experience_years?: number
          id?: string
          is_demo?: boolean
          languages?: string[]
          latitude?: number | null
          locality?: string
          longitude?: number | null
          rating_avg?: number
          review_count?: number
          service_radius_km?: number
          updated_at?: string
          user_id?: string | null
          verification_note?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verification_submitted_at?: string | null
          working_hours?: string | null
        }
        Update: {
          availability_status?: Database["public"]["Enums"]["availability_status"]
          avatar_url?: string | null
          bio?: string | null
          city?: string
          completed_jobs?: number
          created_at?: string
          display_name?: string
          experience_years?: number
          id?: string
          is_demo?: boolean
          languages?: string[]
          latitude?: number | null
          locality?: string
          longitude?: number | null
          rating_avg?: number
          review_count?: number
          service_radius_km?: number
          updated_at?: string
          user_id?: string | null
          verification_note?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verification_submitted_at?: string | null
          working_hours?: string | null
        }
        Relationships: []
      }
      worker_services: {
        Row: {
          base_price: number
          category_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          pricing_unit: Database["public"]["Enums"]["pricing_unit"]
          worker_id: string
        }
        Insert: {
          base_price: number
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          pricing_unit?: Database["public"]["Enums"]["pricing_unit"]
          worker_id: string
        }
        Update: {
          base_price?: number
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          pricing_unit?: Database["public"]["Enums"]["pricing_unit"]
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_services_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_users: {
        Args: { _search?: string }
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_suspended: boolean
          phone: string
          roles: string[]
        }[]
      }
      admin_set_suspension: {
        Args: { _reason?: string; _suspended: boolean; _user: string }
        Returns: undefined
      }
      admin_set_verification: {
        Args: {
          _note?: string
          _status: Database["public"]["Enums"]["verification_status"]
          _worker: string
        }
        Returns: undefined
      }
      admin_stats: { Args: never; Returns: Json }
      become_worker: { Args: never; Returns: undefined }
      booking_parties: {
        Args: { _booking: string }
        Returns: {
          customer_name: string
          customer_phone: string
          worker_name: string
          worker_user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_booking_worker: { Args: { _booking_worker: string }; Returns: boolean }
      make_offer: {
        Args: { _amount: number; _booking: string; _message?: string }
        Returns: string
      }
      notify: {
        Args: {
          _booking: string
          _msg: string
          _title: string
          _type: string
          _user: string
        }
        Returns: undefined
      }
      respond_offer: {
        Args: { _accept: boolean; _offer: string }
        Returns: undefined
      }
      submit_verification: { Args: never; Returns: undefined }
      update_booking_status: {
        Args: {
          _booking: string
          _reason?: string
          _status: Database["public"]["Enums"]["booking_status"]
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "customer" | "worker"
      availability_status: "available" | "busy" | "offline"
      booking_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "in_progress"
        | "completed"
        | "cancelled"
      booking_type: "immediate" | "scheduled"
      complaint_status: "open" | "in_review" | "resolved" | "dismissed"
      offer_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "countered"
        | "withdrawn"
      pricing_unit: "per_hour" | "per_visit" | "per_job" | "per_day"
      verification_status: "pending" | "verified" | "rejected"
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
      app_role: ["admin", "customer", "worker"],
      availability_status: ["available", "busy", "offline"],
      booking_status: [
        "pending",
        "accepted",
        "rejected",
        "in_progress",
        "completed",
        "cancelled",
      ],
      booking_type: ["immediate", "scheduled"],
      complaint_status: ["open", "in_review", "resolved", "dismissed"],
      offer_status: [
        "pending",
        "accepted",
        "rejected",
        "countered",
        "withdrawn",
      ],
      pricing_unit: ["per_hour", "per_visit", "per_job", "per_day"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
