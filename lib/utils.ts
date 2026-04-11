// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Extract YouTube / Vimeo embed URL from any URL format
export function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null

  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`

  // Already an embed URL
  if (url.includes('/embed/') || url.includes('player.vimeo')) return url

  return null
}

// Get Supabase public URL for storage file
export function getStorageUrl(path: string | null): string | null {
  if (!path) return null
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/story-media/${path}`
}

// Format date nicely
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}

// Reverse-geocode using Nominatim (OpenStreetMap, free)
export async function reverseGeocode(lat: number, lng: number): Promise<{
  location_name: string
  country_code: string
  country_name: string
} | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'User-Agent': 'ClimateStories/1.0' } }
    )
    const data = await res.json()
    const addr = data.address ?? {}
    const city = addr.city || addr.town || addr.village || addr.county || ''
    const country = addr.country || ''
    const countryCode = (addr.country_code || '').toUpperCase()
    return {
      location_name: city ? `${city}, ${country}` : country,
      country_code: countryCode,
      country_name: country,
    }
  } catch {
    return null
  }
}

export const CATEGORY_COLORS = {
  energy_transition: '#0b90e4',
  nature_land:       '#22c55e',
  built_human:       '#38bdf8',
  extreme_weather:   '#ef4444',
} as const

export const CATEGORY_LABELS = {
  energy_transition: 'Energy Transition',
  nature_land:       'Nature & Land',
  built_human:       'Built & Human Systems',
  extreme_weather:   'Extreme Weather',
} as const
