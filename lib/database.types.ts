// lib/database.types.ts
// Auto-generated from schema — regenerate with: npx supabase gen types typescript

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      stories: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          excerpt: string
          body: string
          category: 'energy_transition' | 'nature_land' | 'built_human' | 'extreme_weather'
          cover_image_url: string | null
          video_url: string | null
          video_upload_path: string | null
          latitude: number
          longitude: number
          location_name: string
          country_code: string
          country_name: string
          author_name: string
          author_bio: string | null
          author_email: string
          status: 'pending' | 'approved' | 'rejected'
          featured: boolean
          view_count: number
          tags: string[]
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          excerpt: string
          body: string
          category: 'energy_transition' | 'nature_land' | 'built_human' | 'extreme_weather'
          cover_image_url?: string | null
          video_url?: string | null
          video_upload_path?: string | null
          latitude: number
          longitude: number
          location_name: string
          country_code: string
          country_name: string
          author_name: string
          author_bio?: string | null
          author_email: string
          status?: 'pending' | 'approved' | 'rejected'
          featured?: boolean
          view_count?: number
          tags?: string[]
        }
        Update: Partial<Database['public']['Tables']['stories']['Insert']>
      }
      admins: {
        Row: { id: string; email: string; created_at: string }
        Insert: { id?: string; email: string; created_at?: string }
        Update: { email?: string }
      }
    }
    Views: {
      country_stats: {
        Row: {
          country_code: string
          country_name: string
          story_count: number
          energy_transition: number
          nature_land: number
          built_human: number
          extreme_weather: number
          latest_story_date: string
        }
      }
      map_stories: {
        Row: {
          id: string
          title: string
          excerpt: string
          category: string
          latitude: number
          longitude: number
          location_name: string
          country_name: string
          cover_image_url: string | null
          author_name: string
          created_at: string
        }
      }
    }
    Functions: {
      increment_view_count: { Args: { story_id: string }; Returns: void }
    }
  }
}
