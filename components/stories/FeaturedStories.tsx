'use client'
// components/stories/FeaturedStories.tsx
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import type { Story, StoryCategory } from '@/types'
import { CATEGORY_COLORS, CATEGORY_LABELS, formatDate } from '@/lib/utils'

interface Props { stories: Story[] }

export function FeaturedStories({ stories }: Props) {
  if (stories.length === 0) {
    return (
      <div className="text-center py-16 text-ink-500">
        <p className="font-mono text-sm">No featured stories yet.</p>
        <p className="text-sm mt-2">Be the first to <Link href="/submit" className="text-brand-400 hover:underline">submit yours</Link>.</p>
      </div>
    )
  }

  const [hero, ...rest] = stories

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Hero card */}
      <StoryCard story={hero} size="hero" />

      {/* Side cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:grid-cols-1">
        {rest.slice(0, 2).map(story => (
          <StoryCard key={story.id} story={story} size="small" />
        ))}
      </div>

      {/* Bottom row */}
      {rest.slice(2).map(story => (
        <StoryCard key={story.id} story={story} size="small" />
      ))}
    </div>
  )
}

function StoryCard({ story, size }: { story: Story; size: 'hero' | 'small' }) {
  const color = CATEGORY_COLORS[story.category as StoryCategory] ?? '#F59E0B'
  const label = CATEGORY_LABELS[story.category as StoryCategory] ?? story.category

  if (size === 'hero') {
    return (
      <Link href={`/story/${story.id}`} className="group block relative overflow-hidden rounded-sm" style={{ minHeight: 420 }}>
        {/* Background */}
        <div className="absolute inset-0 bg-ink-800">
          {story.cover_image_url && (
            <Image
              src={story.cover_image_url}
              alt={story.title}
              fill className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex items-center gap-3 mb-4">
            <span
              className="text-[10px] font-mono tracking-[0.2em] uppercase px-2.5 py-1 rounded-sm border"
              style={{ color, background: `${color}18`, borderColor: `${color}44` }}
            >
              {label}
            </span>
            <span className="text-ink-400 text-xs font-mono flex items-center gap-1">
              <MapPin size={10} /> {story.location_name}
            </span>
          </div>

          <h3 className="font-display text-2xl md:text-3xl text-ink-50 mb-3 leading-tight group-hover:text-brand-300 transition-colors">
            {story.title}
          </h3>
          <p className="text-ink-300 text-sm leading-relaxed line-clamp-2 mb-4">{story.excerpt}</p>

          <div className="flex items-center justify-between">
            <span className="text-ink-500 text-xs">{story.author_name} · {formatDate(story.created_at)}</span>
            <span className="flex items-center gap-1 text-brand-400 text-xs font-mono uppercase tracking-wider group-hover:gap-2 transition-all">
              Read <ArrowRight size={12} />
            </span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/story/${story.id}`} className="group flex flex-col bg-ink-900 border border-ink-800 hover:border-ink-600 rounded-sm overflow-hidden transition-colors">
      {story.cover_image_url && (
        <div className="relative h-40 bg-ink-800 overflow-hidden">
          <Image
            src={story.cover_image_url}
            alt={story.title}
            fill className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-[10px] font-mono tracking-[0.15em] uppercase px-2 py-0.5 rounded-sm border"
            style={{ color, background: `${color}15`, borderColor: `${color}44` }}
          >
            {label}
          </span>
        </div>
        <h3 className="font-display text-lg text-ink-50 mb-2 leading-snug line-clamp-2 group-hover:text-brand-300 transition-colors flex-1">
          {story.title}
        </h3>
        <p className="text-ink-400 text-xs mb-3 line-clamp-2 leading-relaxed">{story.excerpt}</p>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-ink-800">
          <span className="text-ink-500 text-xs font-mono flex items-center gap-1">
            <MapPin size={9} /> {story.location_name}
          </span>
          <span className="text-brand-400 text-xs font-mono">
            {story.author_name}
          </span>
        </div>
      </div>
    </Link>
  )
}
