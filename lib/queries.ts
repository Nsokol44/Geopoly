// lib/queries.ts
import { createServerSupabaseClient } from './supabase-server'
import type { Story, MapStory, CountryStats, StorySubmission } from '@/types'

// ── Map pins (lightweight) ─────────────────────────────────
export async function getMapStories(): Promise<MapStory[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('map_stories')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) { console.error('getMapStories:', error); return [] }
  return (data ?? []) as MapStory[]
}

// ── Featured stories ───────────────────────────────────────
export async function getFeaturedStories(limit = 6): Promise<Story[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('status', 'approved')
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) { console.error('getFeaturedStories:', error); return [] }
  return (data ?? []) as Story[]
}

// ── Recent stories ─────────────────────────────────────────
export async function getRecentStories(limit = 12, offset = 0): Promise<Story[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) { console.error('getRecentStories:', error); return [] }
  return (data ?? []) as Story[]
}

// ── Single story ───────────────────────────────────────────
export async function getStory(id: string): Promise<Story | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .eq('status', 'approved')
    .single()

  if (error) { return null }

  // Increment view count asynchronously
  supabase.rpc('increment_view_count', { story_id: id }).then(() => {})

  return data as Story
}

// ── Country stats ──────────────────────────────────────────
export async function getCountryStats(): Promise<CountryStats[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('country_stats')
    .select('*')
    .order('story_count', { ascending: false })

  if (error) { console.error('getCountryStats:', error); return [] }
  return (data ?? []).map((row: any) => ({
    country_code: row.country_code,
    country_name: row.country_name,
    story_count: row.story_count,
    categories: {
      energy_transition: row.energy_transition,
      nature_land: row.nature_land,
      built_human: row.built_human,
      extreme_weather: row.extreme_weather,
    },
    latest_story_date: row.latest_story_date,
  })) as CountryStats[]
}

// ── Submit story ───────────────────────────────────────────
export async function submitStory(submission: StorySubmission): Promise<{ id: string } | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('stories')
    .insert({ ...submission, status: 'pending' })
    .select('id')
    .single()

  if (error) { console.error('submitStory:', error); return null }
  return data
}

// ── Admin: pending stories ─────────────────────────────────
export async function getPendingStories(): Promise<Story[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) { console.error('getPendingStories:', error); return [] }
  return (data ?? []) as Story[]
}

// ── Admin: update story status ─────────────────────────────
export async function updateStoryStatus(
  id: string,
  status: 'approved' | 'rejected',
  featured = false
): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase
    .from('stories')
    .update({ status, featured } as any)
    .eq('id', id)

  if (error) { console.error('updateStoryStatus:', error); return false }
  return true
}

// ── Search stories ─────────────────────────────────────────
export async function searchStories(query: string, limit = 20): Promise<Story[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('status', 'approved')
    .textSearch('fts', query, { type: 'websearch' })
    .limit(limit)

  if (error) { console.error('searchStories:', error); return [] }
  return (data ?? []) as Story[]
}

// ── Stories by country ─────────────────────────────────────
export async function getStoriesByCountry(countryCode: string): Promise<Story[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('status', 'approved')
    .eq('country_code', countryCode)
    .order('created_at', { ascending: false })

  if (error) { return [] }
  return (data ?? []) as Story[]
}
