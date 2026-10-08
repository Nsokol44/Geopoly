'use client'
// lib/daily-client.ts
// localStorage-backed daily loop state. The app has no visitor
// accounts (only admin logins), so the loop lives on-device:
// visits (streak), today's actions (quests), and revealed charms.
import {
  dateKeyLocal,
  charmForDate,
  computeStreak,
  questProgress,
  type DailyActionId,
  type QuestProgress,
  type StreakInfo,
} from './daily-core'

const STORAGE_KEY = 'gad_daily_v1'
export const DAILY_EVENT = 'gad-daily-update'

interface DailyState {
  visits: string[]
  readIds: Record<string, string[]>
  counts: Record<string, Partial<Record<DailyActionId, number>>>
  reveals: Record<string, string> // dateKey -> charmId
}

const EMPTY: DailyState = { visits: [], readIds: {}, counts: {}, reveals: {} }

function load(): DailyState {
  if (typeof window === 'undefined') return EMPTY
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY }
    const parsed = JSON.parse(raw) as Partial<DailyState>
    return {
      visits: parsed.visits ?? [],
      readIds: parsed.readIds ?? {},
      counts: parsed.counts ?? {},
      reveals: parsed.reveals ?? {},
    }
  } catch {
    return { ...EMPTY }
  }
}

function save(state: DailyState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch { /* private mode — the loop just won't persist */ }
  window.dispatchEvent(new Event(DAILY_EVENT))
}

function bump(state: DailyState, key: string, action: DailyActionId) {
  const day = (state.counts[key] ??= {})
  day[action] = (day[action] ?? 0) + 1
}

export function todayKey(): string {
  return dateKeyLocal(new Date())
}

export function recordVisit() {
  const key = todayKey()
  const state = load()
  if (!state.visits.includes(key)) state.visits.push(key)
  bump(state, key, 'visit')
  save(state)
}

export function recordRead(storyId: string) {
  const key = todayKey()
  const state = load()
  const ids = (state.readIds[key] ??= [])
  if (!ids.includes(storyId)) {
    ids.push(storyId)
    const day = (state.counts[key] ??= {})
    day.read = ids.length
  }
  save(state)
}

export function recordReact() {
  const key = todayKey()
  const state = load()
  bump(state, key, 'react')
  save(state)
}

export function recordTip() {
  const key = todayKey()
  const state = load()
  bump(state, key, 'tip')
  save(state)
}

/** Reveal today's charm. One per day — once revealed it is collected. */
export function revealToday(): string {
  const key = todayKey()
  const state = load()
  if (!state.reveals[key]) {
    state.reveals[key] = charmForDate(key).id
    save(state)
  }
  return state.reveals[key]
}

export interface DailySnapshot {
  key: string
  streak: StreakInfo
  quests: QuestProgress[]
  allQuestsComplete: boolean
  completedQuestCount: number
  revealedToday: boolean
  reveals: Record<string, string>
}

export function snapshot(): DailySnapshot {
  const key = todayKey()
  const state = load()
  const { quests, allComplete, completedCount } = questProgress(state.counts[key] ?? {})
  return {
    key,
    streak: computeStreak(state.visits, key),
    quests,
    allQuestsComplete: allComplete,
    completedQuestCount: completedCount,
    revealedToday: Boolean(state.reveals[key]),
    reveals: state.reveals,
  }
}
