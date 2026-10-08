'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CHARMS, charmForDate, msUntilNextMidnight, weekKeys } from '@/lib/daily-core'
import {
  DAILY_EVENT,
  recordVisit,
  revealToday,
  snapshot,
  todayKey,
  type DailySnapshot,
} from '@/lib/daily-client'

function fmtCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = String(Math.floor(s / 3600)).padStart(2, '0')
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const sec = String(s % 60).padStart(2, '0')
  return `${h}:${m}:${sec}`
}

export function DailyLoop() {
  const [snap, setSnap] = useState<DailySnapshot | null>(null)
  const [countdown, setCountdown] = useState('')
  const [flipping, setFlipping] = useState(false)

  useEffect(() => {
    recordVisit()
    setSnap(snapshot())
    const refresh = () => setSnap(snapshot())
    window.addEventListener(DAILY_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(DAILY_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  useEffect(() => {
    let lastKey = todayKey()
    const tick = () => {
      setCountdown(fmtCountdown(msUntilNextMidnight(new Date())))
      const k = todayKey()
      if (k !== lastKey) { lastKey = k; recordVisit(); setSnap(snapshot()) }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  if (!snap) return null

  const todayCharm = charmForDate(snap.key)
  const week = weekKeys(snap.key)

  const reveal = () => {
    if (snap.revealedToday || flipping) return
    setFlipping(true)
    setTimeout(() => { revealToday(); setFlipping(false) }, 350)
  }

  return (
    <section className="max-w-6xl mx-auto px-6 pt-10">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 md:p-6">
        {/* Streak + countdown */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-3">
            <span className={`text-3xl ${snap.streak.current > 0 ? '' : 'grayscale opacity-40'}`}>🔥</span>
            <span className="font-black text-white text-2xl leading-none">{snap.streak.current}</span>
            <span className="text-zinc-500 text-xs uppercase tracking-wider">day streak{snap.streak.atRisk ? ' — save it' : ''}</span>
          </div>
          <div className="text-right">
            <span className="text-zinc-500 text-xs uppercase tracking-wider block">next drop</span>
            <span className="font-mono font-black text-yellow-400 text-lg tabular-nums">{countdown}</span>
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_1.4fr] gap-6">
          {/* Daily reveal + week collection */}
          <div>
            <button onClick={reveal} disabled={snap.revealedToday}
              className={`w-full h-32 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all duration-300
                ${snap.revealedToday
                  ? 'bg-yellow-400/10 border-yellow-400/40'
                  : 'bg-zinc-950 border-dashed border-zinc-700 hover:border-yellow-400/60 active:scale-[0.98] cursor-pointer'}`}
              style={flipping ? { transform: 'rotateY(90deg)' } : undefined}>
              {snap.revealedToday ? (
                <>
                  <span className="text-5xl">{todayCharm.emoji}</span>
                  <span className="font-black text-white text-sm">{todayCharm.name}</span>
                </>
              ) : (
                <>
                  <span className="text-5xl">❔</span>
                  <span className="text-zinc-500 text-xs uppercase tracking-wider">tap to reveal</span>
                </>
              )}
            </button>
            <div className="grid grid-cols-7 gap-1.5 mt-3">
              {week.map(k => {
                const charm = charmForDate(k)
                const got = snap.reveals[k] === charm.id
                const isToday = k === snap.key
                const isPast = k < snap.key
                return (
                  <div key={k}
                    className={`aspect-square rounded-lg border flex items-center justify-center text-lg
                      ${got ? 'bg-yellow-400/15 border-yellow-400/40' : isToday ? 'border-yellow-400/60 border-dashed' : 'border-zinc-800'}`}>
                    <span className={got ? '' : isPast ? 'grayscale opacity-20' : 'grayscale opacity-30'}>{charm.emoji}</span>
                  </div>
                )
              })}
            </div>
            <p className="text-zinc-600 text-xs mt-2 text-center">
              {CHARMS.length} charms · one a day · {Object.keys(snap.reveals).length} collected
            </p>
          </div>

          {/* Daily quests */}
          <div>
            <div className="flex flex-col gap-2.5">
              {snap.quests.map(q => (
                <div key={q.id} className="flex items-center gap-3">
                  <span className={`w-6 text-center ${q.complete ? '' : 'grayscale opacity-50'}`}>{q.complete ? '✅' : q.emoji}</span>
                  <span className={`flex-1 text-sm font-bold ${q.complete ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>{q.label}</span>
                  <div className="w-24 h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${(q.done / q.target) * 100}%` }} />
                  </div>
                  <span className="text-zinc-500 text-xs font-mono w-8 text-right">{q.done}/{q.target}</span>
                </div>
              ))}
            </div>
            {snap.allQuestsComplete ? (
              <p className="mt-4 text-yellow-400 font-black text-sm">⭐ Loop closed. New drop in {countdown}.</p>
            ) : (
              <p className="mt-4 text-zinc-500 text-sm">
                {snap.completedQuestCount}/{snap.quests.length} done ·{' '}
                <Link href="#latest" className="text-yellow-400 font-bold hover:text-yellow-300">today’s stories ↓</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
