'use client'
// app/admin/AdminPublished.tsx
// Published (approved) stories with the two management
// actions: Unpublish (back to the review queue, records kept)
// and Delete (permanent; the API refuses when the story has
// paid tips so the payment ledger is never destroyed).
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Story } from '@/types'
import { needsTranscript } from '@/lib/transcribe'
import { convertStoryAudio, isMp3Name } from '@/lib/convert-client'

export function AdminPublished({ stories: init }: { stories: Story[] }) {
  const router = useRouter()
  const [stories, setStories] = useState(init)
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [transcribing, setTranscribing] = useState<Record<string, boolean>>({})
  const [converting, setConverting] = useState<Record<string, boolean>>({})

  const convert = async (story: Story) => {
    if (!story.audio_upload_path) return
    setConverting(c => ({ ...c, [story.id]: true }))
    setErrors(e => ({ ...e, [story.id]: '' }))
    try {
      const path = await convertStoryAudio(story.id, story.audio_upload_path)
      setStories(list => list.map(x => x.id === story.id ? { ...x, audio_upload_path: path } : x))
    } catch (e: any) {
      setErrors(er => ({ ...er, [story.id]: e?.message ?? 'Conversion failed' }))
    } finally {
      setConverting(c => ({ ...c, [story.id]: false }))
    }
  }

  const transcribe = async (story: Story) => {
    setTranscribing(t => ({ ...t, [story.id]: true }))
    setErrors(e => ({ ...e, [story.id]: '' }))
    try {
      const res = await fetch('/api/admin/transcribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: story.id }) })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? 'Transcription failed')
      setStories(list => list.map(x => x.id === story.id ? { ...x, transcript: json.transcript } : x))
    } catch (e: any) {
      setErrors(er => ({ ...er, [story.id]: e?.message ?? 'Transcription failed' }))
    } finally {
      setTranscribing(t => ({ ...t, [story.id]: false }))
    }
  }

  const act = async (story: Story, action: 'unpublish' | 'delete') => {
    if (action === 'delete' && !window.confirm(`Delete "${story.title}" permanently? This removes the story and its audio. This cannot be undone.`)) return
    setBusy(b => ({ ...b, [story.id]: true }))
    setErrors(e => ({ ...e, [story.id]: '' }))
    try {
      const res = action === 'unpublish'
        ? await fetch('/api/admin/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: story.id, status: 'pending' }) })
        : await fetch(`/api/admin/story?id=${encodeURIComponent(story.id)}`, { method: 'DELETE' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? 'Action failed')
      setStories(s => s.filter(x => x.id !== story.id))
      router.refresh()
    } catch (e: any) {
      setErrors(er => ({ ...er, [story.id]: e?.message ?? 'Action failed' }))
    } finally {
      setBusy(b => ({ ...b, [story.id]: false }))
    }
  }

  if (stories.length === 0) return null

  return (
    <section className="mt-16">
      <h2 className="font-black text-2xl text-white mb-2">Published</h2>
      <p className="text-zinc-500 mb-6">{stories.length} live {stories.length === 1 ? 'story' : 'stories'} · Unpublish sends a story back to the review queue. Delete is permanent.</p>
      <div className="space-y-3">
        {stories.map(story => (
          <div key={story.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="font-black text-white truncate">{story.title}</p>
                <p className="text-zinc-500 text-xs">
                  by {story.author_name} · {new Date(story.created_at).toLocaleDateString()}
                  {story.country_name && <> · 📍 {story.country_name}</>}
                  {story.tip_count > 0 && <> · {story.tip_count} tips · ${Number(story.tip_total).toFixed(0)}</>}
                  {story.featured && <> · ★ featured</>}
                </p>
              </div>
              {needsTranscript(story) && (
                <button onClick={() => transcribe(story)} disabled={transcribing[story.id]}
                  className="text-xs font-black bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-zinc-950 px-4 py-2 rounded-full transition-colors">
                  {transcribing[story.id] ? 'Transcribing…' : '✨ Transcribe'}
                </button>
              )}
              {story.audio_upload_path && !isMp3Name(story.audio_upload_path) && (
                <button onClick={() => convert(story)} disabled={converting[story.id]}
                  className="text-xs font-black border border-zinc-700 hover:border-yellow-400 disabled:opacity-40 text-zinc-200 px-4 py-2 rounded-full transition-colors">
                  {converting[story.id] ? 'Converting…' : '🎵 To MP3'}
                </button>
              )}
              <a href={`/story/${story.id}`} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-zinc-300 text-xs font-black transition-colors">👁 View</a>
              <button onClick={() => act(story, 'unpublish')} disabled={busy[story.id]}
                className="text-xs font-black text-amber-400 hover:text-amber-300 border border-amber-900 hover:border-amber-700 px-4 py-2 rounded-full transition-colors disabled:opacity-50">
                Unpublish
              </button>
              <button onClick={() => act(story, 'delete')} disabled={busy[story.id]}
                className="text-xs font-black text-red-400 hover:text-red-300 border border-red-900 hover:border-red-700 px-4 py-2 rounded-full transition-colors disabled:opacity-50">
                {busy[story.id] ? 'Working…' : 'Delete'}
              </button>
            </div>
            {errors[story.id] && <p className="text-red-400 text-xs mt-3 bg-red-950/30 border border-red-900 rounded-xl px-3 py-2">{errors[story.id]}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}
