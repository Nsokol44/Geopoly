'use client'
// app/admin/AdminQueue.tsx
import { useState } from 'react'
import { CheckCircle, XCircle, Eye, Star, MapPin, ChevronDown, ChevronUp } from 'lucide-react'
import type { Story, StoryCategory } from '@/types'
import { CATEGORY_LABELS, CATEGORY_COLORS, formatDate } from '@/lib/utils'

interface Props { stories: Story[] }

export function AdminQueue({ stories: initialStories }: Props) {
  const [stories, setStories] = useState(initialStories)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const action = async (id: string, status: 'approved' | 'rejected', featured = false) => {
    setLoading(l => ({ ...l, [id]: true }))
    try {
      const res = await fetch('/api/admin/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, featured }),
      })
      if (res.ok) {
        setStories(s => s.filter(story => story.id !== id))
      }
    } finally {
      setLoading(l => ({ ...l, [id]: false }))
    }
  }

  if (stories.length === 0) {
    return (
      <div className="text-center py-20 border border-ink-800 rounded-sm">
        <CheckCircle size={32} className="mx-auto text-nature-500 mb-4" />
        <p className="text-ink-400 font-display text-xl">Queue is clear</p>
        <p className="text-ink-600 text-sm mt-2">No stories awaiting review.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {stories.map(story => {
        const color = CATEGORY_COLORS[story.category as StoryCategory] ?? '#F59E0B'
        const isExpanded = expanded === story.id
        const isLoading = loading[story.id]

        return (
          <div key={story.id} className="bg-ink-900 border border-ink-800 hover:border-ink-700 rounded-sm overflow-hidden transition-colors">
            {/* Header row */}
            <div className="flex items-start gap-4 p-5">
              {/* Color indicator */}
              <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: color }} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <span
                    className="text-[10px] font-mono tracking-[0.15em] uppercase px-2 py-0.5 border rounded-sm"
                    style={{ color, background: `${color}18`, borderColor: `${color}44` }}
                  >
                    {CATEGORY_LABELS[story.category as StoryCategory]}
                  </span>
                  <span className="text-ink-500 text-xs font-mono flex items-center gap-1">
                    <MapPin size={9} /> {story.location_name}
                  </span>
                  <span className="text-ink-600 text-xs">{formatDate(story.created_at)}</span>
                </div>

                <h3 className="font-display text-lg text-ink-100 mb-1">{story.title}</h3>
                <p className="text-ink-400 text-sm">
                  by {story.author_name}
                  <span className="text-ink-600 ml-2">· {story.author_email}</span>
                </p>

                {!isExpanded && (
                  <p className="text-ink-500 text-sm mt-2 line-clamp-2">{story.excerpt}</p>
                )}
              </div>

              {/* Expand toggle */}
              <button
                onClick={() => setExpanded(isExpanded ? null : story.id)}
                className="text-ink-500 hover:text-ink-200 transition-colors p-1 flex-shrink-0"
              >
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {/* Expanded body */}
            {isExpanded && (
              <div className="px-5 pb-5 border-t border-ink-800 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  {story.cover_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={story.cover_image_url} alt="Cover" className="w-full h-40 object-cover rounded-sm" />
                  )}
                  <div className="text-sm space-y-2 text-ink-400">
                    <p><span className="text-ink-500">Coords:</span> {story.latitude.toFixed(4)}, {story.longitude.toFixed(4)}</p>
                    <p><span className="text-ink-500">Country:</span> {story.country_name} ({story.country_code})</p>
                    {story.author_bio && <p><span className="text-ink-500">Bio:</span> {story.author_bio}</p>}
                    {story.tags?.length > 0 && <p><span className="text-ink-500">Tags:</span> {story.tags.join(', ')}</p>}
                    {story.video_url && <p><span className="text-ink-500">Video URL:</span> <a href={story.video_url} target="_blank" rel="noreferrer" className="text-brand-400 hover:underline truncate">{story.video_url}</a></p>}
                  </div>
                </div>

                <div className="bg-ink-950 rounded-sm p-4 text-sm text-ink-300 leading-relaxed max-h-48 overflow-y-auto mb-4">
                  <p className="text-ink-500 text-xs font-mono uppercase tracking-wider mb-2">Excerpt</p>
                  {story.excerpt}
                </div>

                <div className="bg-ink-950 rounded-sm p-4 text-sm text-ink-300 leading-relaxed max-h-64 overflow-y-auto">
                  <p className="text-ink-500 text-xs font-mono uppercase tracking-wider mb-2">Full Story</p>
                  <pre className="whitespace-pre-wrap font-body">{story.body}</pre>
                </div>
              </div>
            )}

            {/* Action bar */}
            <div className="flex items-center gap-3 px-5 py-3 border-t border-ink-800 bg-ink-950/40">
              <a
                href={`/story/${story.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-mono text-ink-500 hover:text-ink-200 transition-colors"
              >
                <Eye size={12} /> Preview
              </a>

              <div className="flex-1" />

              {/* Reject */}
              <button
                onClick={() => action(story.id, 'rejected')}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-xs font-mono text-red-400 hover:text-red-300 border border-red-900 hover:border-red-700 px-4 py-2 rounded-sm transition-colors disabled:opacity-50"
              >
                <XCircle size={12} /> Reject
              </button>

              {/* Approve */}
              <button
                onClick={() => action(story.id, 'approved', false)}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-xs font-mono text-nature-400 hover:text-forest-300 border border-nature-900 hover:border-nature-700 px-4 py-2 rounded-sm transition-colors disabled:opacity-50"
              >
                <CheckCircle size={12} /> Approve
              </button>

              {/* Approve + Feature */}
              <button
                onClick={() => action(story.id, 'approved', true)}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-xs font-mono bg-brand-600 hover:bg-brand-500 text-ink-50 px-4 py-2 rounded-sm transition-colors disabled:opacity-50"
              >
                <Star size={12} /> Approve & Feature
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
