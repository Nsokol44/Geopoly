'use client'
// components/home/StoriesExplorer.tsx
// The story feed with a location filter. Pick a country and
// the cards narrow to stories from there. Voice stories
// carry no location — they live under "No location" and
// always show under "Everywhere". (The map itself is the
// full-screen MapSection above the daily drop.)
import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Story } from '@/types'

const ALL = 'ALL'
const NONE = '__none'

interface Country { key: string; label: string; count: number }

function countryOf(s: Story): { key: string; label: string } | null {
  const label = (s.country_name ?? '').trim()
  if (!label) return null
  return { key: (s.country_code ?? label).trim().toUpperCase(), label }
}

export function StoriesExplorer({ stories }: { stories: Story[] }) {
  const [filter, setFilter] = useState<string>(ALL)

  const countries = useMemo<Country[]>(() => {
    const map = new Map<string, Country>()
    let none = 0
    for (const s of stories) {
      const c = countryOf(s)
      if (!c) { none++; continue }
      const cur = map.get(c.key)
      if (cur) cur.count++
      else map.set(c.key, { key: c.key, label: c.label, count: 1 })
    }
    const list = [...map.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    if (none > 0) list.push({ key: NONE, label: 'No location', count: none })
    return list
  }, [stories])

  const visible = useMemo(() => {
    if (filter === ALL) return stories
    if (filter === NONE) return stories.filter(s => !countryOf(s))
    return stories.filter(s => countryOf(s)?.key === filter)
  }, [stories, filter])

  const activeLabel = filter === ALL ? null : countries.find(c => c.key === filter)?.label

  return (
    <section id="latest" className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <h2 className="font-black text-2xl text-white">Latest Stories</h2>
        {activeLabel && (
          <p className="text-zinc-500 text-sm">{visible.length} {visible.length === 1 ? 'story' : 'stories'} · {activeLabel}</p>
        )}
      </div>

      {countries.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6" role="group" aria-label="Filter stories by country">
          <FilterChip active={filter === ALL} onClick={() => setFilter(ALL)} label="🌍 Everywhere" count={stories.length} />
          {countries.map(c => (
            <FilterChip key={c.key} active={filter === c.key} onClick={() => setFilter(c.key)}
              label={c.key === NONE ? '📍 No location' : c.label} count={c.count} />
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-500 text-lg mb-4">No stories here yet. Be the first.</p>
          <Link href="/create" className="text-yellow-400 font-black hover:text-yellow-300">Share yours →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map(s => <StoryCard key={s.id} story={s} />)}
        </div>
      )}
    </section>
  )
}

function FilterChip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button onClick={onClick} aria-pressed={active}
      className={`text-xs font-black px-4 py-2 rounded-full border transition-colors ${
        active
          ? 'bg-yellow-400 text-zinc-950 border-yellow-400'
          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200'
      }`}>
      {label} <span className={active ? 'text-zinc-700' : 'text-zinc-600'}>{count}</span>
    </button>
  )
}

function StoryCard({ story }: { story: Story }) {
  const where = [story.location_name, story.country_name].filter(Boolean).join(', ')
  return (
    <Link href={`/story/${story.id}`}
      className="group block bg-zinc-900 border border-zinc-800 hover:border-yellow-400/50 rounded-2xl overflow-hidden transition-all hover:scale-[1.01]">
      <div className="h-40 bg-zinc-800 flex items-center justify-center overflow-hidden relative">
        {story.cover_image_url
          ? <img src={story.cover_image_url} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
              </div>
              <span className="text-zinc-600 text-xs">Voice Story</span>
            </div>
        }
      </div>
      <div className="p-5">
        <h3 className="font-black text-white text-lg leading-tight mb-1 line-clamp-2 group-hover:text-yellow-400 transition-colors">{story.title}</h3>
        <p className="text-zinc-500 text-sm mb-3">by {story.author_name}{where && <span className="text-zinc-600"> · 📍 {where}</span>}</p>
        {story.transcript && <p className="text-zinc-600 text-sm line-clamp-2">{story.transcript}</p>}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
          <span className="text-yellow-400 font-black text-sm">
            {story.tip_count > 0 ? `${story.tip_count} tip${story.tip_count !== 1 ? 's' : ''} · $${Number(story.tip_total).toFixed(0)}` : '💛 Send a dolla'}
          </span>
          <span className="text-zinc-700 text-xs">{new Date(story.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  )
}
