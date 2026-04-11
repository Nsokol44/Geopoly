'use client'
// components/stories/GlobalStats.tsx
import type { CountryStats } from '@/types'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/utils'

interface Props {
  totalStories: number
  totalCountries: number
  countryStats: CountryStats[]
}

const CATEGORIES = ['energy_transition', 'nature_land', 'built_human', 'extreme_weather'] as const

export function GlobalStats({ totalStories, totalCountries, countryStats }: Props) {
  // Aggregate category counts
  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = countryStats.reduce((sum, c) => sum + (c.categories[cat] ?? 0), 0)
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="border-y border-ink-800 bg-ink-900/60 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 items-center">
          {/* Total stories */}
          <div className="text-center">
            <div className="font-display text-3xl text-ink-50">{totalStories.toLocaleString()}</div>
            <div className="font-mono text-xs text-ink-500 uppercase tracking-widest mt-1">Stories</div>
          </div>

          {/* Total countries */}
          <div className="text-center">
            <div className="font-display text-3xl text-ink-50">{totalCountries}</div>
            <div className="font-mono text-xs text-ink-500 uppercase tracking-widest mt-1">Countries</div>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-10 bg-ink-700 mx-auto" />

          {/* Per-category counts */}
          {CATEGORIES.map(cat => (
            <div key={cat} className="text-center">
              <div
                className="font-display text-3xl"
                style={{ color: CATEGORY_COLORS[cat] }}
              >
                {(categoryCounts[cat] ?? 0).toLocaleString()}
              </div>
              <div className="font-mono text-xs text-ink-500 uppercase tracking-widest mt-1 leading-tight">
                {CATEGORY_LABELS[cat].split(' ').map((w, i) => (
                  <span key={i} className="block">{w}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Top countries bar */}
        {countryStats.length > 0 && (
          <div className="mt-6 pt-6 border-t border-ink-800">
            <p className="font-mono text-xs text-ink-500 uppercase tracking-widest mb-3">
              Top regions by story count
            </p>
            <div className="flex flex-wrap gap-2">
              {countryStats.slice(0, 10).map(c => (
                <a
                  key={c.country_code}
                  href={`/stories?country=${c.country_code}`}
                  className="flex items-center gap-1.5 bg-ink-800 hover:bg-ink-700 border border-ink-700 rounded-sm px-3 py-1.5 transition-colors"
                >
                  <span className="text-ink-200 text-xs font-mono">{c.country_name}</span>
                  <span className="text-ink-500 text-xs">{c.story_count}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
