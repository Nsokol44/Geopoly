import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { AdminActions } from './AdminActions'

export const dynamic = 'force-dynamic'

export default async function AdminPreview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const db = createAdminClient()
  const { data: admin } = await db.from('admins').select('email').eq('email', user.email!).single()
  if (!admin) redirect('/admin/login')

  const { data: story } = await db.from('stories').select('*').eq('id', id).single()
  if (!story) notFound()

  const audioUrl = story.audio_upload_path
    ? `/api/admin/audio?path=${encodeURIComponent(story.audio_upload_path)}`
    : null

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-900/95 backdrop-blur border-b border-amber-700 px-6 py-2 flex items-center justify-between">
        <span className="text-amber-200 text-xs font-black uppercase tracking-wider">
          🔒 Admin Preview · Status: {story.status.toUpperCase()}
        </span>
        <Link href="/admin" className="text-amber-200 hover:text-white text-xs font-black transition-colors">← Back to Queue</Link>
      </div>

      <main className="max-w-2xl mx-auto px-6 pt-24 pb-16">
        <h1 className="font-black text-4xl text-white mb-3 leading-tight">{story.title}</h1>
        <p className="text-zinc-400 mb-8">by {story.author_name} · {new Date(story.created_at).toLocaleDateString()}</p>

        {story.cover_image_url && <img src={story.cover_image_url} alt={story.title} className="w-full h-56 object-cover rounded-2xl mb-8" />}

        {audioUrl && (
          <div className="bg-zinc-900 border border-yellow-400/20 rounded-2xl p-6 mb-8">
            <p className="text-yellow-400 text-xs font-black uppercase tracking-wider mb-3">🎙 Voice Recording</p>
            <audio controls src={audioUrl} className="w-full mb-3" />
            <a href={audioUrl} download={`story-${id.slice(0,8)}.webm`}
              className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-black px-4 py-2 rounded-xl transition-colors">
              ⬇️ Export Audio for Transcription
            </a>
          </div>
        )}

        {story.transcript && story.transcript !== '[Voice recording — pending transcription]' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
            <p className="text-zinc-500 text-xs font-black uppercase tracking-wider mb-3">Transcript</p>
            <p className="text-zinc-200 leading-relaxed whitespace-pre-wrap">{story.transcript}</p>
          </div>
        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-8 text-sm text-zinc-400 space-y-1">
          {story.author_email && <p><span className="text-zinc-500">Email:</span> {story.author_email}</p>}
        </div>

        <AdminActions storyId={story.id} />
      </main>
    </div>
  )
}
