// app/story/[id]/page.tsx
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, ArrowLeft, Eye, Calendar, Share2 } from 'lucide-react'
import { getStory } from '@/lib/queries'
import { getVideoEmbedUrl, getStorageUrl, formatDate } from '@/lib/utils'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { SiteHeader } from '@/components/ui/SiteHeader'
import { SiteFooter } from '@/components/ui/SiteFooter'
import { StoryBody } from '@/components/stories/StoryBody'
import type { StoryCategory } from '@/types'

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const story = await getStory(id)
  if (!story) return {}
  return {
    title: `${story.title} — Climate Stories`,
    description: story.excerpt,
    openGraph: {
      title: story.title,
      description: story.excerpt,
      images: story.cover_image_url ? [story.cover_image_url] : [],
    },
  }
}

export default async function StoryPage({ params }: Props) {
  const { id } = await params
  const story = await getStory(id)
  if (!story) notFound()

  const videoEmbedUrl = story.video_url
    ? getVideoEmbedUrl(story.video_url)
    : story.video_upload_path
    ? getStorageUrl(story.video_upload_path)
    : null
  const isUploadedVideo = !story.video_url && !!story.video_upload_path
  const categoryColor: Record<string, string> = {
    energy_transition: '#0b90e4',
    nature_land: '#22c55e',
    built_human: '#38bdf8',
    extreme_weather: '#ef4444',
  }
  const accentColor = categoryColor[story.category] ?? '#0b90e4'

  return (
    <div className="min-h-screen bg-ink-950">
      <SiteHeader />

      <main>
        {/* ════════════════════════════════════════════
            CINEMATIC HERO
        ════════════════════════════════════════════ */}
        <div className="relative min-h-[92vh] flex flex-col justify-end overflow-hidden">

          {/* Full-bleed cover image */}
          {story.cover_image_url ? (
            <div className="absolute inset-0">
              <Image
                src={story.cover_image_url}
                alt={story.title}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
              {/* Multi-layer gradient for text legibility */}
              <div className="absolute inset-0" style={{
                background: `linear-gradient(
                  to bottom,
                  rgba(8,14,26,0.3) 0%,
                  rgba(8,14,26,0.0) 30%,
                  rgba(8,14,26,0.0) 40%,
                  rgba(8,14,26,0.6) 65%,
                  rgba(8,14,26,0.92) 85%,
                  rgba(8,14,26,1) 100%
                )`
              }} />
              {/* Subtle color wash from category */}
              <div className="absolute inset-0 mix-blend-multiply opacity-20" style={{
                background: `radial-gradient(ellipse at bottom left, ${accentColor}, transparent 70%)`
              }} />
            </div>
          ) : (
            <div className="absolute inset-0" style={{
              background: `linear-gradient(135deg, #080e1a 0%, #0f172a 50%, #080e1a 100%)`
            }}>
              {/* Decorative grid pattern for no-image stories */}
              <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: `linear-gradient(${accentColor} 1px, transparent 1px), linear-gradient(90deg, ${accentColor} 1px, transparent 1px)`,
                backgroundSize: '60px 60px'
              }} />
            </div>
          )}

          {/* Back button — top left */}
          <div className="absolute top-20 left-6 z-10">
            <Link
              href="/stories"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors font-mono text-xs uppercase tracking-widest backdrop-blur-sm bg-black/20 border border-white/10 px-3 py-2 rounded-sm"
            >
              <ArrowLeft size={11} /> Stories
            </Link>
          </div>

          {/* Hero content — bottom */}
          <div className="relative z-10 px-6 pb-14 pt-32">
            <div className="max-w-4xl mx-auto">

              {/* Category + location row */}
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <CategoryBadge category={story.category as StoryCategory} />
                <span className="flex items-center gap-1.5 text-white/50 text-xs font-mono">
                  <MapPin size={10} />
                  {story.location_name}
                </span>
              </div>

              {/* Title */}
              <h1
                className="font-display font-bold leading-[1.08] mb-5"
                style={{
                  fontSize: 'clamp(2rem, 5vw, 4rem)',
                  color: '#fff',
                  textShadow: '0 2px 20px rgba(0,0,0,0.5)',
                }}
              >
                {story.title}
              </h1>

              {/* Excerpt — large pull quote style */}
              <p className="text-white/75 leading-relaxed mb-7 max-w-2xl"
                style={{ fontSize: 'clamp(1rem, 1.5vw, 1.25rem)' }}>
                {story.excerpt}
              </p>

              {/* Author + meta bar */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="flex items-center gap-3">
                  {/* Author avatar placeholder */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: `${accentColor}33`, border: `1px solid ${accentColor}66` }}
                  >
                    {story.author_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm leading-none">{story.author_name}</p>
                    {story.author_bio && (
                      <p className="text-white/50 text-xs mt-0.5">{story.author_bio}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-white/40 text-xs font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} /> {formatDate(story.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={11} /> {story.view_count.toLocaleString()} views
                  </span>
                </div>
              </div>

              {/* Accent line */}
              <div className="mt-8 h-px w-full max-w-2xl opacity-30"
                style={{ background: `linear-gradient(to right, ${accentColor}, transparent)` }} />
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════
            VIDEO — full-width cinematic player
        ════════════════════════════════════════════ */}
        {videoEmbedUrl && (
          <div className="bg-black">
            {isUploadedVideo ? (
              <video
                src={videoEmbedUrl}
                controls
                className="w-full max-h-[70vh] object-contain"
                style={{ background: '#000' }}
              />
            ) : (
              <div className="relative w-full" style={{ paddingBottom: '46%', minHeight: 280 }}>
                <iframe
                  src={videoEmbedUrl}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  title={story.title}
                />
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════
            STORY BODY — magazine two-column layout
        ════════════════════════════════════════════ */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-16">

            {/* Main text column */}
            <article>
              {/* Drop cap first paragraph */}
              <StoryBody body={story.body} accentColor={accentColor} />

              {/* Tags */}
              {story.tags?.length > 0 && (
                <div className="mt-14 pt-8 border-t border-ink-800">
                  <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-500 mb-3">Filed under</p>
                  <div className="flex flex-wrap gap-2">
                    {story.tags.map(tag => (
                      <Link
                        key={tag}
                        href={`/stories?tag=${encodeURIComponent(tag)}`}
                        className="bg-ink-900 border border-ink-700 hover:border-ink-500 text-ink-400 hover:text-ink-200 text-xs font-mono px-3 py-1.5 rounded-sm transition-colors"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </article>

            {/* Sidebar */}
            <aside className="space-y-6">

              {/* Location card */}
              <div className="bg-ink-900 border border-ink-800 rounded-sm overflow-hidden sticky top-24">
                {/* Mini map preview strip */}
                <div
                  className="h-2 w-full"
                  style={{ background: `linear-gradient(to right, ${accentColor}88, ${accentColor}22)` }}
                />
                <div className="p-5">
                  <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-500 mb-3">Story Origin</p>
                  <p className="text-ink-50 font-medium text-base">{story.location_name}</p>
                  <p className="text-ink-400 text-sm mt-1">{story.country_name}</p>
                  <p className="text-ink-600 text-xs font-mono mt-2">
                    {story.latitude.toFixed(4)}°N, {story.longitude.toFixed(4)}°E
                  </p>
                  <Link
                    href={`/?story=${story.id}`}
                    className="mt-4 flex items-center justify-center gap-2 border text-xs font-mono uppercase tracking-widest py-2.5 rounded-sm transition-colors w-full"
                    style={{ borderColor: `${accentColor}44`, color: accentColor }}
                  >
                    <MapPin size={11} /> View on Atlas
                  </Link>
                </div>
              </div>

              {/* Share card */}
              <div className="bg-ink-900 border border-ink-800 rounded-sm p-5">
                <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-500 mb-3">Share this story</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Twitter / X', href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL}/story/${story.id}`)}&text=${encodeURIComponent(story.title)}` },
                    { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL}/story/${story.id}`)}` },
                  ].map(s => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-center text-xs font-mono text-ink-400 hover:text-ink-100 border border-ink-700 hover:border-ink-500 py-2 rounded-sm transition-colors"
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Category context */}
              <div className="rounded-sm p-5 border" style={{
                background: `${accentColor}08`,
                borderColor: `${accentColor}22`
              }}>
                <p className="font-mono text-[10px] tracking-[0.25em] uppercase mb-2" style={{ color: accentColor }}>
                  Category
                </p>
                <CategoryBadge category={story.category as StoryCategory} />
                <p className="text-ink-400 text-xs mt-3 leading-relaxed">
                  {story.category === 'energy_transition' && 'Stories about the global shift to carbon-free energy and decarbonization.'}
                  {story.category === 'nature_land' && 'Stories about water stewardship, biodiversity, restoration, and regenerative agriculture.'}
                  {story.category === 'built_human' && 'Stories about communities adapting their built environments and social systems to climate change.'}
                  {story.category === 'extreme_weather' && 'Stories of communities navigating and recovering from hurricanes, heat waves, wildfires, and floods.'}
                </p>
                <Link
                  href={`/stories?category=${story.category}`}
                  className="mt-3 text-xs font-mono uppercase tracking-wider transition-colors block"
                  style={{ color: accentColor }}
                >
                  More in this category →
                </Link>
              </div>
            </aside>
          </div>
        </div>

        {/* ════════════════════════════════════════════
            SUBMIT CTA
        ════════════════════════════════════════════ */}
        <div className="border-t border-ink-800" style={{
          background: 'linear-gradient(to bottom, #080e1a, #0a1628)'
        }}>
          <div className="max-w-3xl mx-auto px-6 py-20 text-center">
            <div
              className="w-px h-16 mx-auto mb-8 opacity-30"
              style={{ background: `linear-gradient(to bottom, transparent, ${accentColor})` }}
            />
            <p className="font-mono text-xs tracking-[0.3em] uppercase mb-4" style={{ color: accentColor }}>
              Your story matters
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-ink-50 mb-4">
              Add Your Voice to the Atlas
            </h2>
            <p className="text-ink-400 leading-relaxed mb-8 max-w-lg mx-auto">
              Every pin on the map is a person. A community. A moment of resilience.
              Share yours and help change the story we tell about our planet.
            </p>
            <Link
              href="/submit"
              className="inline-block font-semibold font-mono text-xs tracking-[0.25em] uppercase px-10 py-4 transition-all hover:scale-105 text-white rounded-sm"
              style={{ background: accentColor, boxShadow: `0 0 30px ${accentColor}44` }}
            >
              Submit Your Story
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
