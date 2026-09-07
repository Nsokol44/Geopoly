import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-server'
import { TipSection } from './TipSection'
import type { Story } from '@/types'

export const dynamic = 'force-dynamic'

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createAdminClient()
  const { data } = await db.from('stories').select('*').eq('id', id).eq('status', 'approved').single()
  if (!data) notFound()
  const story = data as Story

  // increment views
  db.rpc('increment_view_count', { story_id: id }).then(() => {})

  const audioUrl = story.audio_upload_path
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/story-media/${story.audio_upload_path}`
    : null

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-yellow-400 text-zinc-950 font-black text-xs px-2 py-1 rounded">$1</div>
            <span className="font-black text-white hidden sm:inline">JustGimmeADolla</span>
          </Link>
          <Link href="/" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">← All Stories</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-black text-4xl md:text-5xl text-white mb-4 leading-tight">{story.title}</h1>
        <div className="flex items-center gap-4 text-zinc-500 text-sm mb-8">
          <span className="font-bold text-zinc-300">by {story.author_name}</span>
          <span>{new Date(story.created_at).toLocaleDateString()}</span>
          <span>{story.view_count} views</span>
        </div>

        {story.cover_image_url && (
          <img src={story.cover_image_url} alt={story.title} className="w-full h-64 object-cover rounded-2xl mb-8" />
        )}

        {audioUrl && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
              </div>
              <div>
                <p className="text-white font-bold text-sm">Voice Recording</p>
                <p className="text-zinc-500 text-xs">Listen to {story.author_name}&apos;s story</p>
              </div>
            </div>
            <audio controls src={audioUrl} className="w-full" />
          </div>
        )}

        {story.transcript && story.transcript !== '[Voice recording — pending transcription]' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
            <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-4">Transcript</p>
            <p className="text-zinc-200 leading-relaxed whitespace-pre-wrap">{story.transcript}</p>
          </div>
        )}

        <TipSection storyId={story.id} authorName={story.author_name} tipCount={story.tip_count} tipTotal={story.tip_total} />
      </main>
    </div>
  )
}
