// types/index.ts

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
  transcript: string | null

  // Media
  cover_image_url: string | null
  video_url: string | null
  video_upload_path: string | null
  audio_upload_path: string | null

  // Location
  latitude: number
  longitude: number
  location_name: string
  country_code: string
  country_name: string

  // Author
  author_name: string
  author_bio: string | null
  author_email: string | null
  age_range: string | null

  // Meta
  tip_count: number
  tip_total: number
  status: 'pending' | 'approved' | 'rejected'
  featured: boolean
  view_count: number
  tags: string[]
}

export interface Tip {
  id: string
  story_id: string
  amount: number
  fee_processor: number
  net_amount: number
  processor: 'stripe' | 'paypal'
  status: 'pending' | 'completed' | 'failed'
}

// Lightweight shape returned by the `map_stories` view — used for map pins/popups
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

// Shape returned by the `country_stats` view, reshaped with a nested
// per-category breakdown for easier consumption in the UI.
export interface CountryStats {
  country_code: string
  country_name: string
  story_count: number
  categories: Record<StoryCategory, number>
  latest_story_date: string
}

export type ReactionType = 'inspired' | 'seen_this' | 'urgent'

export const REACTION_LABELS: Record<ReactionType, { emoji: string; label: string }> = {
  inspired: { emoji: '✨', label: 'Inspired' },
  seen_this: { emoji: '👀', label: "I've seen this" },
  urgent: { emoji: '⚠️', label: 'Feels urgent' },
}
