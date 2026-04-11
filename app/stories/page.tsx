// app/stories/page.tsx
import { Suspense } from 'react'
import { getRecentStories, getCountryStats } from '@/lib/queries'
import { SiteHeader } from '@/components/ui/SiteHeader'
import { SiteFooter } from '@/components/ui/SiteFooter'
import { StoriesFilter } from './StoriesFilter'

export const revalidate = 300

interface SearchParams {
  category?: string
  country?: string
  tag?: string
}

interface Props {
  searchParams: Promise<SearchParams>
}

export default async function StoriesPage({ searchParams }: Props) {
  const params = await searchParams
  const [stories, countryStats] = await Promise.all([
    getRecentStories(48),
    getCountryStats(),
  ])

  // Client-side filtering happens in StoriesFilter, but we pass all data
  return (
    <div className="min-h-screen bg-ink-950">
      <SiteHeader />
      <main className="pt-16">
        {/* Header */}
        <div className="border-b border-ink-800 bg-ink-900/30">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <p className="font-mono text-xs tracking-[0.3em] text-brand-400 uppercase mb-3">
              The Collection
            </p>
            <h1 className="font-display text-4xl md:text-5xl text-ink-50 mb-4">
              All Stories
            </h1>
            <p className="text-ink-400 text-lg max-w-2xl">
              {stories.length} stories from {countryStats.length} countries, charting climate
              resilience and solutions from every corner of the world.
            </p>
          </div>
        </div>

        {/* Filter + Grid */}
        <div className="max-w-7xl mx-auto px-6 py-10">
          <Suspense fallback={<StoriesGridSkeleton />}>
            <StoriesFilter
              stories={stories}
              countryStats={countryStats}
              initialCategory={params.category as StoryCategory}
              initialCountry={params.country}
              initialTag={params.tag}
            />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

function StoriesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="bg-ink-900 rounded-sm h-64 animate-pulse" />
      ))}
    </div>
  )
}
