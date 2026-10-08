'use client'
// components/map/MapControls.tsx
// Map overlay chrome: story count, pins/heatmap toggle, and
// locate-me. (Category filters were removed at the owner's
// request — the map is pins + heat, nothing else.)
import { MapPin, Flame, Locate, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type ViewMode = 'points' | 'heatmap'

interface Props {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onLocate: () => void
  isLocating: boolean
  storyCount: number
}

export function MapControls({
  viewMode, onViewModeChange, onLocate, isLocating, storyCount
}: Props) {
  return (
    <>
      {/* Top-left: story count */}
      <div className="absolute top-24 left-4 z-20 pointer-events-none">
        <div className="bg-ink-900/80 backdrop-blur-sm border border-ink-700 rounded-sm px-3 py-1.5">
          <span className="font-mono text-xs text-ink-300">
            <span className="text-brand-400 font-semibold">{storyCount.toLocaleString()}</span> {storyCount === 1 ? 'story' : 'stories'}
          </span>
        </div>
      </div>

      {/* Top-right: pins / heatmap toggle + locate */}
      <div className="absolute top-24 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
        <div className="bg-ink-900/80 backdrop-blur-sm border border-ink-700 rounded-sm overflow-hidden flex">
          <button
            onClick={() => onViewModeChange('points')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-mono tracking-wider transition-colors',
              viewMode === 'points'
                ? 'bg-brand-600 text-ink-50'
                : 'text-ink-300 hover:text-ink-100 hover:bg-ink-800'
            )}
            title="Pin view"
          >
            <MapPin size={12} />
            <span className="hidden sm:inline">Pins</span>
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
          className="bg-ink-900/80 backdrop-blur-sm border border-ink-700 rounded-sm p-2 text-ink-300 hover:text-brand-400 hover:border-brand-700 transition-colors disabled:opacity-50 self-end"
          title="Zoom to my location"
        >
          {isLocating
            ? <Loader2 size={16} className="animate-spin" />
            : <Locate size={16} />
          }
        </button>
      </div>
    </>
  )
}
