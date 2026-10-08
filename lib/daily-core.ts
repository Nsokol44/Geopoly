// lib/daily-core.ts
// Pure, deterministic daily-loop math. No Date.now(), no
// Math.random(), no window — same inputs, same outputs, so it
// runs identically on server, client, and in tests.

/** Local calendar day as YYYY-MM-DD. The loop runs on the visitor's day. */
export function dateKeyLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDaysToKey(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return dt.toISOString().slice(0, 10)
}

/** Whole days since the epoch for a YYYY-MM-DD key (DST-proof, UTC-based). */
export function dayNumber(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000)
}

/** Milliseconds from `now` until the visitor's next local midnight. */
export function msUntilNextMidnight(now: Date): number {
  const next = new Date(now)
  next.setHours(24, 0, 0, 0)
  return next.getTime() - now.getTime()
}

export interface StreakInfo {
  current: number
  longest: number
  totalDays: number
  visitedToday: boolean
  /** Visited yesterday but not yet today — today's visit saves the streak. */
  atRisk: boolean
}

export function computeStreak(visitKeys: string[], todayKey: string): StreakInfo {
  const days = [...new Set(visitKeys)].map(dayNumber).sort((a, b) => a - b)
  const today = dayNumber(todayKey)
  const set = new Set(days)

  let longest = 0
  let run = 0
  let prev = Number.NaN
  for (const d of days) {
    run = d === prev + 1 ? run + 1 : 1
    longest = Math.max(longest, run)
    prev = d
  }

  const visitedToday = set.has(today)
  const anchor = visitedToday ? today : today - 1
  let current = 0
  while (set.has(anchor - current)) current++

  return {
    current,
    longest,
    totalDays: days.length,
    visitedToday,
    atRisk: !visitedToday && current > 0,
  }
}

/** Small stable string hash (FNV-1a) — the "randomness" of the loop. */
export function hashSeed(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Deterministic pick: one story per day, same all day, rotates at midnight. */
export function dailyIndex(dateKey: string, length: number): number {
  if (length <= 0) return -1
  return hashSeed(`story:${dateKey}`) % length
}

// ── Daily charms ──────────────────────────────────────────────
// One collectible per weekday. Miss a day and that slot stays
// empty until the weekday comes around again — the collection
// grid is the reason to come back tomorrow.
export interface Charm { id: string; emoji: string; name: string }

export const CHARMS: Charm[] = [
  { id: 'ember', emoji: '🔥', name: 'Ember' }, // Sunday
  { id: 'coin', emoji: '🪙', name: 'Coin' }, // Monday
  { id: 'clover', emoji: '🍀', name: 'Clover' }, // Tuesday
  { id: 'eye', emoji: '👁️', name: 'Eye' }, // Wednesday
  { id: 'key', emoji: '🗝️', name: 'Key' }, // Thursday
  { id: 'gem', emoji: '💎', name: 'Gem' }, // Friday
  { id: 'moon', emoji: '🌙', name: 'Moon' }, // Saturday
]

export function charmForDate(key: string): Charm {
  const [y, m, d] = key.split('-').map(Number)
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return CHARMS[weekday]
}

/** The 7 date keys of the current week, Sunday-first, containing `key`. */
export function weekKeys(key: string): string[] {
  const [y, m, d] = key.split('-').map(Number)
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return Array.from({ length: 7 }, (_, i) => addDaysToKey(key, i - weekday))
}

// ── Daily quests ──────────────────────────────────────────────
export type DailyActionId = 'visit' | 'read' | 'react' | 'tip'

export interface QuestDef {
  id: DailyActionId
  emoji: string
  label: string
  target: number
}

export const QUESTS: QuestDef[] = [
  { id: 'visit', emoji: '👋', label: 'Show up', target: 1 },
  { id: 'read', emoji: '🎧', label: 'Hear 2 stories', target: 2 },
  { id: 'react', emoji: '💛', label: 'React to a story', target: 1 },
  { id: 'tip', emoji: '🪙', label: 'Send a dolla', target: 1 },
]

export interface QuestProgress extends QuestDef {
  done: number
  complete: boolean
}

export function questProgress(
  actions: Partial<Record<DailyActionId, number>>,
): { quests: QuestProgress[]; allComplete: boolean; completedCount: number } {
  const quests = QUESTS.map(q => {
    const done = Math.min(actions[q.id] ?? 0, q.target)
    return { ...q, done, complete: done >= q.target }
  })
  return {
    quests,
    allComplete: quests.every(q => q.complete),
    completedCount: quests.filter(q => q.complete).length,
  }
}
