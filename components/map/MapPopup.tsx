'use client'
// components/map/MapPopup.tsx
import { X, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import type { MapStory, StoryCategory } from '@/types'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/utils'

interface Props {
  story: MapStory
  onClose: () => void
}

export function MapPopup({ story, onClose }: Props) {
  const color = CATEGORY_COLORS[story.category as StoryCategory] ?? '#F59E0B'
  const label = CATEGORY_LABELS[story.category as StoryCategory] ?? story.category

  return (
    <div className="absolute bottom-8 right-4 z-30 w-80 max-w-[calc(100vw-2rem)]">
      <div className="bg-ink-900/95 backdrop-blur-md border border-ink-700 rounded-sm shadow-2xl overflow-hidden animate-fade-up">
        {/* Cover image */}
        {story.cover_image_url && (
          <div className="relative h-36 bg-ink-800">
            <Image
              src={story.cover_image_url}
              alt={story.title}
              fill className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900/60 to-transparent" />
          </div>
        )}

        <div className="p-4">
          {/* Category badge */}
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-[10px] font-mono tracking-[0.2em] uppercase px-2 py-0.5 rounded-sm border"
              style={{ color, background: `${color}18`, borderColor: `${color}44` }}
            >
              {label}
            </span>
            <button
              onClick={onClose}
              className="text-ink-500 hover:text-ink-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Title */}
          <h3 className="font-display text-base text-ink-50 mb-1 leading-snug line-clamp-2">
            {story.title}
          </h3>

          {/* Location */}
          <p className="text-ink-400 text-xs mb-3 font-mono">
            📍 {story.location_name}
          </p>

          {/* Excerpt */}
          <p className="text-ink-300 text-sm leading-relaxed line-clamp-3 mb-4">
            {story.excerpt}
          </p>

          {/* Author + Link */}
          <div className="flex items-center justify-between">
            <span className="text-ink-500 text-xs">{story.author_name}</span>
            <a
              href={`/story/${story.id}`}
              className="flex items-center gap-1 text-xs font-mono tracking-wider text-brand-400 hover:text-brand-300 transition-colors uppercase"
            >
              Read <ArrowRight size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
