'use client'
// app/stories/StoriesFilter.tsx
import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, MapPin, ArrowRight, X } from 'lucide-react'
import type { Story, StoryCategory, CountryStats } from '@/types'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/utils'
import { CategoryBadge } from '@/components/ui/CategoryBadge'

const CATEGORIES = ['energy_transition', 'nature_land', 'built_human', 'extreme_weather'] as const

interface Props {
  stories: Story[]
  countryStats: CountryStats[]
  initialCategory?: StoryCategory
  initialCountry?: string
  initialTag?: string // eslint-disable-line
}

export function StoriesFilter({ stories, countryStats, initialCategory, initialCountry, initialTag }: Props) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<StoryCategory | ''>( initialCategory || '')
  const [country, setCountry] = useState(initialCountry || '')

  const filtered = useMemo(() => {
    let result = stories
    if (category) result = result.filter(s => s.category === category)
    if (country)  result = result.filter(s => s.country_code === country)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.excerpt.toLowerCase().includes(q) ||
        s.location_name.toLowerCase().includes(q) ||
        s.author_name.toLowerCase().includes(q) ||
        s.tags?.some(t => t.toLowerCase().includes(q))
      )
    }
    return result
  }, [stories, category, country, search])

  const hasFilters = !!(search || category || country)

  return (
    <div>
      {/* Filter toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            type="text"
            placeholder="Search stories, places, authors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-ink-900 border border-ink-700 focus:border-brand-600 rounded-sm pl-9 pr-4 py-2.5 text-sm text-ink-200 placeholder:text-ink-600 outline-none transition-colors font-body"
          />
        </div>

        {/* Category filter */}
        <select
          value={category}
          onChange={e => setCategory(e.target.value as StoryCategory | '')}
          className="bg-ink-900 border border-ink-700 focus:border-brand-600 rounded-sm px-4 py-2.5 text-sm text-ink-200 outline-none transition-colors font-mono min-w-48"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>

        {/* Country filter */}
        <select
          value={country}
          onChange={e => setCountry(e.target.value)}
          className="bg-ink-900 border border-ink-700 focus:border-brand-600 rounded-sm px-4 py-2.5 text-sm text-ink-200 outline-none transition-colors font-mono min-w-44"
        >
          <option value="">All Countries</option>
          {countryStats.map(c => (
            <option key={c.country_code} value={c.country_code}>
              {c.country_name} ({c.story_count})
            </option>
          ))}
        </select>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setCategory(''); setCountry('') }}
            className="flex items-center gap-1.5 px-4 py-2.5 text-ink-400 hover:text-ink-200 border border-ink-700 hover:border-ink-500 rounded-sm text-sm font-mono transition-colors"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Result count */}
      <p className="font-mono text-xs text-ink-500 mb-6">
        {filtered.length.toLocaleString()} {filtered.length === 1 ? 'story' : 'stories'}
        {hasFilters ? ' matching filters' : ''}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-ink-500">
          <p className="text-lg mb-2">No stories found.</p>
          <p className="text-sm">Try adjusting your filters or <Link href="/submit" className="text-brand-400 hover:underline">submit a new one</Link>.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(story => (
            <StoryGridCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </div>
  )
}

function StoryGridCard({ story }: { story: Story }) {
  return (
    <Link
      href={`/story/${story.id}`}
      className="group bg-ink-900 border border-ink-800 hover:border-ink-600 rounded-sm overflow-hidden flex flex-col transition-colors"
    >
      {/* Cover */}
      <div className="relative h-44 bg-ink-800 overflow-hidden flex-shrink-0">
        {story.cover_image_url ? (
          <Image
            src={story.cover_image_url}
            alt={story.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-12 h-12 rounded-full opacity-20"
              style={{ background: CATEGORY_COLORS[story.category as StoryCategory] }}
            />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <CategoryBadge category={story.category as StoryCategory} />
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-display text-base text-ink-50 mb-2 line-clamp-2 leading-snug group-hover:text-brand-300 transition-colors flex-1">
          {story.title}
        </h3>
        <p className="text-ink-400 text-sm line-clamp-2 leading-relaxed mb-4">
          {story.excerpt}
        </p>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-ink-800">
          <span className="text-ink-500 text-xs font-mono flex items-center gap-1">
            <MapPin size={9} /> {story.location_name}
          </span>
          <span className="text-brand-400 text-xs font-mono flex items-center gap-1 group-hover:gap-2 transition-all">
            Read <ArrowRight size={10} />
          </span>
        </div>
      </div>
    </Link>
  )
}
