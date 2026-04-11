// app/page.tsx
import { getFeaturedStories, getCountryStats } from '@/lib/queries'
import { MapSection } from '@/components/map/MapSection'
import { FeaturedStories } from '@/components/stories/FeaturedStories'
import { GlobalStats } from '@/components/stories/GlobalStats'
import { SiteHeader } from '@/components/ui/SiteHeader'
import { SiteFooter } from '@/components/ui/SiteFooter'
import { ScrollDown } from '@/components/ui/ScrollDown'

export const revalidate = 300

export default async function HomePage() {
  let featuredStories: any[] = []
  let countryStats: any[] = []
  try {
    ;[featuredStories, countryStats] = await Promise.all([
      getFeaturedStories(6),
      getCountryStats(),
    ])
  } catch (e) {
    console.error('Supabase fetch error (non-fatal):', e)
  }

  const totalStories   = countryStats.reduce((sum: number, c: any) => sum + (c.story_count ?? 0), 0)
  const totalCountries = countryStats.length

  return (
    <div className="min-h-screen bg-ink-950">
      <SiteHeader />

      {/* ── FULL-SCREEN MAP HERO ──────────────────────────── */}
      {/*
        The map section uses pointer-events-none on the text overlay
        so map interactions work. The scroll button sits OUTSIDE the
        map's stacking context so it's always clickable.
      */}
      <section id="map-hero" className="relative" style={{ height: '100vh', minHeight: 600 }}>

        {/* Map — fills viewport, handles its own pointer events */}
        <div className="absolute inset-0" style={{ zIndex: 0 }}>
          <MapSection stories={[]} countryStats={[]} />
        </div>

        {/* Text overlay — pointer-events-none so map scrolls through it */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            zIndex: 15,
            background: 'linear-gradient(to top, rgba(8,14,26,0.88) 0%, rgba(8,14,26,0.3) 45%, transparent 100%)',
            padding: '5rem 1.5rem 5rem',
          }}
        >
          <div className="max-w-2xl">
            <p className="font-mono text-xs tracking-[0.3em] text-brand-400 uppercase mb-3">
              National Geographic × The Climate Pledge
            </p>
            <h1 className="font-display font-bold text-white mb-3 leading-tight"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
              A Living Atlas<br />
              <span className="text-brand-400">of Resilience</span>
            </h1>
            <p className="text-white/60 max-w-lg leading-relaxed"
              style={{ fontSize: 'clamp(0.875rem, 1.2vw, 1.05rem)' }}>
              {totalStories > 0
                ? `${totalStories.toLocaleString()} stories from ${totalCountries} countries. Click any light to read.`
                : 'Real voices from communities navigating a warming world. Click any light to read.'}
            </p>
          </div>
        </div>

        {/* Scroll down button — sits at z-20, pointer events enabled, outside map */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2" style={{ zIndex: 20 }}>
          <ScrollDown targetId="below-map" />
        </div>
      </section>

      {/* ── EVERYTHING BELOW THE MAP ────────────────────── */}
      <div id="below-map">
        <GlobalStats totalStories={totalStories} totalCountries={totalCountries} countryStats={countryStats} />

        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="font-mono text-xs tracking-[0.3em] text-brand-400 uppercase mb-3">Editor's Selection</p>
              <h2 className="font-display text-4xl md:text-5xl text-ink-50">Featured Stories</h2>
            </div>
            <a href="/stories" className="hidden md:flex items-center gap-2 text-brand-400 hover:text-brand-300 transition-colors font-mono text-sm tracking-wider uppercase">
              All Stories →
            </a>
          </div>
          <FeaturedStories stories={featuredStories} />
        </section>

        <section className="border-t border-ink-800">
          <div className="max-w-4xl mx-auto px-6 py-24 text-center">
            <p className="font-mono text-xs tracking-[0.3em] text-brand-400 uppercase mb-4">Your Story Matters</p>
            <h2 className="font-display text-4xl md:text-5xl text-ink-50 mb-6">Add Your Voice to the Atlas</h2>
            <p className="text-ink-300 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              Are you witnessing climate change firsthand? Share your story — every voice strengthens the case for action.
            </p>
            <a href="/submit" className="inline-block bg-brand-500 hover:bg-brand-400 text-white font-semibold px-10 py-4 transition-colors font-mono tracking-wider uppercase text-sm rounded-sm">
              Submit Your Story
            </a>
          </div>
        </section>

        <SiteFooter />
      </div>
    </div>
  )
}
