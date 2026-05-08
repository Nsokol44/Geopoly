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
      admins: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          age_range: string | null
          audio_upload_path: string | null
          author_bio: string | null
          author_email: string
          author_name: string
          body: string
          category: string
          country_code: string
          country_name: string
          cover_image_url: string | null
          created_at: string
          excerpt: string
          featured: boolean
          fts: unknown
          id: string
          latitude: number
          location_name: string
          longitude: number
          status: string
          submission_token: string | null
          submitted_for: string | null
          tags: string[]
          title: string
          transcript: string | null
          updated_at: string
          video_upload_path: string | null
          video_url: string | null
          view_count: number
        }
        Insert: {
          age_range?: string | null
          audio_upload_path?: string | null
          author_bio?: string | null
          author_email: string
          author_name: string
          body: string
          category: string
          country_code: string
          country_name: string
          cover_image_url?: string | null
          created_at?: string
          excerpt: string
          featured?: boolean
          fts?: unknown
          id?: string
          latitude: number
          location_name: string
          longitude: number
          status?: string
          submission_token?: string | null
          submitted_for?: string | null
          tags?: string[]
          title: string
          transcript?: string | null
          updated_at?: string
          video_upload_path?: string | null
          video_url?: string | null
          view_count?: number
        }
        Update: {
          age_range?: string | null
          audio_upload_path?: string | null
          author_bio?: string | null
          author_email?: string
          author_name?: string
          body?: string
          category?: string
          country_code?: string
          country_name?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string
          featured?: boolean
          fts?: unknown
          id?: string
          latitude?: number
          location_name?: string
          longitude?: number
          status?: string
          submission_token?: string | null
          submitted_for?: string | null
          tags?: string[]
          title?: string
          transcript?: string | null
          updated_at?: string
          video_upload_path?: string | null
          video_url?: string | null
          view_count?: number
        }
        Relationships: []
      }
      story_reactions: {
        Row: {
          created_at: string
          fingerprint: string
          id: string
          reaction: string
          story_id: string
        }
        Insert: {
          created_at?: string
          fingerprint: string
          id?: string
          reaction: string
          story_id: string
        }
        Update: {
          created_at?: string
          fingerprint?: string
          id?: string
          reaction?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_reactions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "map_stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_reactions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      country_stats: {
        Row: {
          built_human: number | null
          country_code: string | null
          country_name: string | null
          energy_transition: number | null
          extreme_weather: number | null
          latest_story_date: string | null
          nature_land: number | null
          story_count: number | null
        }
        Relationships: []
      }
      map_stories: {
        Row: {
          author_name: string | null
          category: string | null
          country_name: string | null
          cover_image_url: string | null
          created_at: string | null
          excerpt: string | null
          id: string | null
          latitude: number | null
          location_name: string | null
          longitude: number | null
          title: string | null
        }
        Insert: {
          author_name?: string | null
          category?: string | null
          country_name?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          title?: string | null
        }
        Update: {
          author_name?: string | null
          category?: string | null
          country_name?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          title?: string | null
        }
        Relationships: []
      }
      story_reaction_counts: {
        Row: {
          inspired: number | null
          seen_this: number | null
          story_id: string | null
          total: number | null
          urgent: number | null
        }
        Relationships: [
          {
            foreignKeyName: "story_reactions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "map_stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_reactions_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      increment_view_count: { Args: { story_id: string }; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
