// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import type { StoryCategory } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export const CATEGORY_COLORS: Record<StoryCategory, string> = {
  energy_transition: '#0b90e4',
  nature_land: '#22c55e',
  built_human: '#f59e0b',
  extreme_weather: '#ef4444',
}

export const CATEGORY_LABELS: Record<StoryCategory, string> = {
  energy_transition: 'Energy Transition',
  nature_land: 'Nature & Land',
  built_human: 'Built & Human',
  extreme_weather: 'Extreme Weather',
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
