'use client'
// components/stories/StoryReactions.tsx
// Drop this inside your story/[id]/page.tsx
import { useState, useEffect } from 'react'
import type { ReactionType } from '@/types'
import { REACTION_LABELS } from '@/types'

interface Props {
  storyId: string
}

// Simple fingerprint — not perfect but enough to prevent accidental double-clicks
function getFingerprint(): string {
  const key = 'geopoly_fp'
  let fp = localStorage.getItem(key)
  if (!fp) {
    fp = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem(key, fp)
  }
  return fp
}

export function StoryReactions({ storyId }: Props) {
  const [counts, setCounts] = useState<Record<ReactionType, number>>({ inspired: 0, seen_this: 0, urgent: 0 })
  const [myReactions, setMyReactions] = useState<Set<ReactionType>>(new Set())
  const [loading, setLoading] = useState<ReactionType | null>(null)
  const [fingerprint, setFingerprint] = useState('')

  useEffect(() => {
    const fp = getFingerprint()
    setFingerprint(fp)
    fetch(`/api/reactions?story_id=${storyId}&fingerprint=${fp}`)
      .then(r => r.json())
      .then(data => {
        if (data.counts) setCounts(data.counts)
        if (data.mine) setMyReactions(new Set(data.mine))
      })
      .catch(() => {})
  }, [storyId])

  const toggle = async (reaction: ReactionType) => {
    if (!fingerprint || loading) return
    setLoading(reaction)

    const isRemoving = myReactions.has(reaction)
    const method = isRemoving ? 'DELETE' : 'POST'

    // Optimistic update
    setMyReactions(prev => {
      const next = new Set(prev)
      isRemoving ? next.delete(reaction) : next.add(reaction)
      return next
    })
    setCounts(prev => ({
      ...prev,
      [reaction]: Math.max(0, prev[reaction] + (isRemoving ? -1 : 1))
    }))

    try {
      await fetch('/api/reactions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story_id: storyId, reaction, fingerprint }),
      })
    } catch {
      // Revert on failure
      setMyReactions(prev => {
        const next = new Set(prev)
        isRemoving ? next.add(reaction) : next.delete(reaction)
        return next
      })
      setCounts(prev => ({
        ...prev,
        [reaction]: Math.max(0, prev[reaction] + (isRemoving ? 1 : -1))
      }))
    } finally {
      setLoading(null)
    }
  }

  const reactions: ReactionType[] = ['inspired', 'seen_this', 'urgent']

  return (
    <div className="border-t border-ink-800 pt-6 mt-6">
      <p className="text-ink-500 text-xs font-mono uppercase tracking-wider mb-4">How does this story make you feel?</p>
      <div className="flex flex-wrap gap-3">
        {reactions.map(r => {
          const { emoji, label } = REACTION_LABELS[r]
          const active = myReactions.has(r)
          const count = counts[r]
          return (
            <button
              key={r}
              onClick={() => toggle(r)}
              disabled={loading === r}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all
                ${active
                  ? 'bg-brand-600 border-brand-500 text-white scale-105'
                  : 'bg-ink-900 border-ink-700 text-ink-300 hover:border-ink-500 hover:text-ink-100'
                }`}
            >
              <span className="text-base">{emoji}</span>
              <span>{label}</span>
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-mono
                  ${active ? 'bg-brand-700 text-brand-200' : 'bg-ink-800 text-ink-400'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
