// app/admin/preview/[id]/page.tsx
// Admin-only preview — shows pending stories with audio player + transcript editor
import { redirect, notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, ArrowLeft, Calendar, Eye } from 'lucide-react'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { getVideoEmbedUrl, getStorageUrl, formatDate } from '@/lib/utils'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { SiteHeader } from '@/components/ui/SiteHeader'
import { StoryBody } from '@/components/stories/StoryBody'
import { AdminTranscriptEditor } from '@/app/admin/AdminTranscriptEditor'

export const dynamic = 'force-dynamic'

const categoryColor: Record<string, string> = {
  energy_transition: '#0b90e4',
  nature_land: '#22c55e',
  built_human: '#38bdf8',
  extreme_weather: '#ef4444',
}

export default async function AdminPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Must be logged in admin
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const adminDb = createAdminClient()
  const { data: admin } = await adminDb
    .from('admins').select('email').eq('email', user.email!).single()
  if (!admin) redirect('/admin/login')

  // Fetch story regardless of status
  const { data: story } = await adminDb
    .from('stories')
    .select('*')
    .eq('id', id)
    .single()

  if (!story) notFound()

  const videoEmbedUrl = story.video_url
    ? getVideoEmbedUrl(story.video_url)
    : story.video_upload_path
    ? getStorageUrl(story.video_upload_path)
    : null
  const isUploadedVideo = !story.video_url && !!story.video_upload_path
  const accentColor = categoryColor[story.category] ?? '#0b90e4'

  return (
    <div className="min-h-screen bg-ink-950">
      <SiteHeader />
      <main>

        {/* Admin banner */}
        <div className="fixed top-16 left-0 right-0 z-40 bg-amber-900/90 backdrop-blur border-b border-amber-700 px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-amber-200 text-xs font-mono uppercase tracking-wider">
              🔒 Admin Preview — Status: <strong className="text-white">{story.status.toUpperCase()}</strong>
            </span>
            {story.submitted_for && (
              <span className="text-amber-300 text-xs">· On behalf of: {story.submitted_for}</span>
            )}
            {story.age_range && (
              <span className="text-amber-300 text-xs">· Age: {story.age_range}</span>
            )}
          </div>
          <Link href="/admin" className="text-amber-200 hover:text-white text-xs font-mono uppercase tracking-wider flex items-center gap-1">
            <ArrowLeft size={11} /> Back to Queue
          </Link>
        </div>

        {/* Hero */}
        <div className="relative min-h-[60vh] flex flex-col justify-end overflow-hidden pt-24">
          {story.cover_image_url ? (
            <div className="absolute inset-0">
              <Image src={story.cover_image_url} alt={story.title} fill className="object-cover" priority sizes="100vw" />
              <div className="absolute inset-0" style={{
                background: `linear-gradient(to bottom, rgba(8,14,26,0.3) 0%, rgba(8,14,26,0.0) 30%, rgba(8,14,26,0.6) 65%, rgba(8,14,26,0.95) 100%)`
              }} />
            </div>
          ) : (
            <div className="absolute inset-0 bg-ink-900">
              <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: `linear-gradient(${accentColor} 1px, transparent 1px), linear-gradient(90deg, ${accentColor} 1px, transparent 1px)`,
                backgroundSize: '60px 60px'
              }} />
            </div>
          )}

          <div className="relative z-10 px-6 pb-14 pt-16">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <CategoryBadge category={story.category as any} />
                <span className="flex items-center gap-1.5 text-white/50 text-xs font-mono">
                  <MapPin size={10} /> {story.location_name}
                </span>
              </div>
              <h1 className="font-display font-bold leading-tight mb-5 text-white"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
                {story.title}
              </h1>
              <p className="text-white/75 leading-relaxed mb-5 max-w-2xl text-lg">
                {story.excerpt}
              </p>
              <div className="flex items-center gap-4 text-white/40 text-xs font-mono">
                <span>by {story.author_name}</span>
                {story.author_email && <span>· {story.author_email}</span>}
                <span className="flex items-center gap-1"><Calendar size={11} /> {formatDate(story.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Video */}
        {videoEmbedUrl && (
          <div className="bg-black">
            {isUploadedVideo ? (
              <video src={videoEmbedUrl} controls className="w-full max-h-[60vh] object-contain" />
            ) : (
              <div className="relative w-full" style={{ paddingBottom: '46%', minHeight: 280 }}>
                <iframe src={videoEmbedUrl} className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen title={story.title} />
              </div>
            )}
          </div>
        )}

        {/* Body + Audio/Transcript */}
        <div className="max-w-4xl mx-auto px-6 py-16 space-y-10">

          {/* Audio player + transcript editor */}
          {story.audio_upload_path && (
            <AdminTranscriptEditor
              storyId={story.id}
              audioPath={story.audio_upload_path}
              initialTranscript={story.transcript ?? ''}
            />
          )}

          {/* Story body */}
          {story.body && story.body !== '[Voice recording — pending transcription]' && (
            <StoryBody body={story.body} accentColor={accentColor} />
          )}

          {/* Meta */}
          <div className="bg-ink-900 border border-ink-800 rounded-lg p-6 text-sm space-y-2 text-ink-400">
            <p className="text-ink-300 font-bold mb-3 font-mono text-xs uppercase tracking-wider">Story Details</p>
            <p><span className="text-ink-500">Location:</span> {story.location_name}, {story.country_name}</p>
            <p><span className="text-ink-500">Coords:</span> {story.latitude.toFixed(4)}, {story.longitude.toFixed(4)}</p>
            {story.age_range && <p><span className="text-ink-500">Age Range:</span> {story.age_range}</p>}
            {story.submitted_for && <p><span className="text-ink-500">Submitted For:</span> {story.submitted_for}</p>}
            {story.tags?.length > 0 && <p><span className="text-ink-500">Tags:</span> {story.tags.join(', ')}</p>}
          </div>

          {/* Approve / Reject buttons */}
          <div className="flex items-center gap-4 pt-4 border-t border-ink-800">
            <AdminApproveButtons storyId={story.id} />
          </div>

        </div>
      </main>
    </div>
  )
}

// Inline approve/reject buttons — client component below
import { AdminApproveButtons } from '@/app/admin/AdminApproveButtons'
