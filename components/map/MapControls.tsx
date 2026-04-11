'use client'
// components/map/MapControls.tsx
import { MapPin, Flame, Locate, Loader2 } from 'lucide-react'
import type { StoryCategory } from '@/types'
import { CATEGORY_COLORS, CATEGORY_LABELS, cn } from '@/lib/utils'

type ViewMode = 'points' | 'heatmap'

interface Props {
  viewMode: ViewMode
  activeCategory: StoryCategory | 'all'
  onViewModeChange: (mode: ViewMode) => void
  onCategoryChange: (cat: StoryCategory | 'all') => void
  onLocate: () => void
  isLocating: boolean
  storyCount: number
}

const CATEGORIES: (StoryCategory | 'all')[] = [
  'all', 'energy_transition', 'nature_land', 'built_human', 'extreme_weather'
]

export function MapControls({
  viewMode, activeCategory, onViewModeChange, onCategoryChange,
  onLocate, isLocating, storyCount
}: Props) {
  return (
    <>
      {/* Top-left: story count */}
      <div className="absolute top-24 left-4 z-20 pointer-events-none">
        <div className="bg-ink-900/80 backdrop-blur-sm border border-ink-700 rounded-sm px-3 py-1.5">
          <span className="font-mono text-xs text-ink-300">
            <span className="text-brand-400 font-semibold">{storyCount.toLocaleString()}</span> stories
          </span>
        </div>
      </div>

      {/* Top-right: view mode toggle */}
      <div className="absolute top-24 right-4 z-20 flex flex-col gap-2">
        <div className="bg-ink-900/80 backdrop-blur-sm border border-ink-700 rounded-sm overflow-hidden flex">
          <button
            onClick={() => onViewModeChange('points')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-mono tracking-wider transition-colors',
              viewMode === 'points'
                ? 'bg-brand-600 text-ink-50'
                : 'text-ink-300 hover:text-ink-100 hover:bg-ink-800'
            )}
            title="Point view"
          >
            <MapPin size={12} />
            <span className="hidden sm:inline">Points</span>
          </button>
          <button
            onClick={() => onViewModeChange('heatmap')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-mono tracking-wider transition-colors',
              viewMode === 'heatmap'
                ? 'bg-brand-600 text-ink-50'
                : 'text-ink-300 hover:text-ink-100 hover:bg-ink-800'
            )}
            title="Heat map view"
          >
            <Flame size={12} />
            <span className="hidden sm:inline">Heat</span>
          </button>
        </div>

        {/* Locate me */}
        <button
          onClick={onLocate}
          disabled={isLocating}
          className="bg-ink-900/80 backdrop-blur-sm border border-ink-700 rounded-sm p-2 text-ink-300 hover:text-brand-400 hover:border-brand-700 transition-colors disabled:opacity-50"
          title="Zoom to my location"
        >
          {isLocating
            ? <Loader2 size={16} className="animate-spin" />
            : <Locate size={16} />
          }
        </button>
      </div>

      {/* Bottom-left: category filter */}
      <div className="absolute bottom-8 left-4 z-20 flex flex-wrap gap-1.5 max-w-xs">
        {CATEGORIES.map(cat => {
          const color = cat === 'all' ? '#b8b09e' : CATEGORY_COLORS[cat]
          const label = cat === 'all' ? 'All' : CATEGORY_LABELS[cat]
          const isActive = activeCategory === cat
          return (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              style={isActive ? {
                background: `${color}22`,
                borderColor: `${color}66`,
                color,
              } : {}}
              className={cn(
                'px-2.5 py-1 rounded-sm text-xs font-mono tracking-wider border transition-all',
                'backdrop-blur-sm',
                isActive
                  ? 'font-semibold'
                  : 'bg-ink-900/70 border-ink-700 text-ink-400 hover:text-ink-200 hover:border-ink-500'
              )}
            >
              {cat !== 'all' && (
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse-dot"
                  style={{ background: color }}
                />
              )}
              {label}
            </button>
          )
        })}
      </div>
    </>
  )
}
