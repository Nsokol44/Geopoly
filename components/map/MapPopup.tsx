'use client'
// components/map/MapPopup.tsx
import { X, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import type { MapStory } from '@/types'

interface Props {
  story: MapStory
  onClose: () => void
}

export function MapPopup({ story, onClose }: Props) {

  return (
    <div className="absolute bottom-8 right-4 z-30 w-80 max-w-[calc(100vw-2rem)] pointer-events-auto">
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
          <div className="flex items-start justify-end mb-1">
            <button
              onClick={onClose}
              className="text-ink-500 hover:text-ink-200 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Title */}
          <h3 className="font-display text-base text-ink-50 mb-1 leading-snug line-clamp-2">
            {story.title}
          </h3>

          {/* Location */}
          {(story.location_name || story.country_name) && (
            <p className="text-ink-400 text-xs mb-3 font-mono">
              📍 {[story.location_name, story.country_name].filter(Boolean).join(', ')}
            </p>
          )}

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
