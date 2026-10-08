'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Story } from '@/types'
import { dailyIndex, dateKeyLocal } from '@/lib/daily-core'

// One story owns the day: picked deterministically from the date,
// identical for every visit that day, gone at midnight.
export function StoryOfTheDay({ stories }: { stories: Story[] }) {
  const [story, setStory] = useState<Story | null>(null)

  useEffect(() => {
    if (stories.length === 0) return
    const idx = dailyIndex(dateKeyLocal(new Date()), stories.length)
    setStory(stories[idx])
  }, [stories])

  if (!story) return null

  return (
    <section className="max-w-6xl mx-auto px-6 pt-10">
      <Link href={`/story/${story.id}`}
        className="group grid md:grid-cols-2 bg-zinc-900 border border-yellow-400/30 hover:border-yellow-400/60 rounded-2xl overflow-hidden transition-all">
        <div className="h-56 md:h-full bg-zinc-800 flex items-center justify-center overflow-hidden">
          {story.cover_image_url
            ? <img src={story.cover_image_url} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            : <span className="text-6xl">🎙️</span>}
        </div>
        <div className="p-6 md:p-8 flex flex-col justify-center">
          <span className="inline-block self-start bg-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            ☀️ Story of the day
          </span>
          <h2 className="font-black text-white text-3xl leading-tight mb-2 group-hover:text-yellow-400 transition-colors">{story.title}</h2>
          <p className="text-zinc-500 text-sm mb-4">by {story.author_name}</p>
          {story.transcript && <p className="text-zinc-400 line-clamp-3 mb-5">{story.transcript}</p>}
          <span className="text-yellow-400 font-black text-sm">
            {story.tip_count > 0 ? `${story.tip_count} tip${story.tip_count !== 1 ? 's' : ''} · $${Number(story.tip_total).toFixed(0)}` : '💛 Be its first dolla'} →
          </span>
        </div>
      </Link>
    </section>
  )
}
