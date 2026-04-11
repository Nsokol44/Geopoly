// types/index.ts

export type StoryStatus = 'pending' | 'approved' | 'rejected'

export type StoryCategory =
  | 'energy_transition'
  | 'nature_land'
  | 'built_human'
  | 'extreme_weather'

export interface Story {
  id: string
  created_at: string
  updated_at: string

  // Content
  title: string
  excerpt: string
  body: string
  category: StoryCategory

  // Media
  cover_image_url: string | null
  video_url: string | null       // YouTube/Vimeo embed URL
  video_upload_path: string | null  // Supabase storage path

  // Location
  latitude: number
  longitude: number
  location_name: string          // "Dhaka, Bangladesh"
  country_code: string           // ISO 3166-1 alpha-2
  country_name: string

  // Author
  author_name: string
  author_bio: string | null
  author_email: string

  // Meta
  status: StoryStatus
  featured: boolean
  view_count: number
  tags: string[]
}

export interface StorySubmission {
  title: string
  excerpt: string
  body: string
  category: StoryCategory
  cover_image_url?: string
  video_url?: string
  video_upload_path?: string
  latitude: number
  longitude: number
  location_name: string
  country_code: string
  country_name: string
  author_name: string
  author_bio?: string
  author_email: string
  tags?: string[]
}

export interface CountryStats {
  country_code: string
  country_name: string
  story_count: number
  categories: Record<StoryCategory, number>
  latest_story_date: string
}

export interface MapStory {
  id: string
  title: string
  excerpt: string
  category: StoryCategory
  latitude: number
  longitude: number
  location_name: string
  country_name: string
  cover_image_url: string | null
  author_name: string
  created_at: string
}

export const CATEGORY_LABELS: Record<StoryCategory, string> = {
  energy_transition: 'Energy Transition',
  nature_land: 'Nature & Land',
  built_human: 'Built & Human Systems',
  extreme_weather: 'Extreme Weather',
}

export const CATEGORY_COLORS: Record<StoryCategory, string> = {
  energy_transition: '#0b90e4',
  nature_land: '#22c55e',
  built_human: '#38bdf8',
  extreme_weather: '#ef4444',
}
