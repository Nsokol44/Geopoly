'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Story } from '@/types'
import { needsTranscript } from '@/lib/transcribe'
import { convertStoryAudio, isMp3Name } from '@/lib/convert-client'

export function AdminQueue({ stories: init }: { stories: Story[] }) {
  const router = useRouter()
  const [stories, setStories] = useState(init)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [transcripts, setTranscripts] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [transcribing, setTranscribing] = useState<Record<string, boolean>>({})
  const [transcribeMsg, setTranscribeMsg] = useState<Record<string, string>>({})
  const [converting, setConverting] = useState<Record<string, boolean>>({})
  const [convertMsg, setConvertMsg] = useState<Record<string, string>>({})

  const convert = async (story: Story) => {
    if (!story.audio_upload_path) return
    setConverting(c => ({ ...c, [story.id]: true }))
    setConvertMsg(m => ({ ...m, [story.id]: '' }))
    try {
      const path = await convertStoryAudio(story.id, story.audio_upload_path)
      setStories(list => list.map(x => x.id === story.id ? { ...x, audio_upload_path: path } : x))
      setConvertMsg(m => ({ ...m, [story.id]: '✓ Converted to MP3 — plays everywhere now.' }))
    } catch (e: any) {
      setConvertMsg(m => ({ ...m, [story.id]: e?.message ?? 'Conversion failed' }))
    } finally {
      setConverting(c => ({ ...c, [story.id]: false }))
    }
  }
  const [allBusy, setAllBusy] = useState(false)
  const [allMsg, setAllMsg] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const transcribe = async (story: Story) => {
    setTranscribing(t => ({ ...t, [story.id]: true }))
    setTranscribeMsg(m => ({ ...m, [story.id]: '' }))
    try {
      const res = await fetch('/api/admin/transcribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: story.id }) })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? 'Transcription failed')
      setTranscripts(t => ({ ...t, [story.id]: json.transcript }))
      setStories(list => list.map(x => x.id === story.id ? { ...x, transcript: json.transcript } : x))
      setTranscribeMsg(m => ({ ...m, [story.id]: '✓ Transcribed — review the text, then Save.' }))
    } catch (e: any) {
      setTranscribeMsg(m => ({ ...m, [story.id]: e?.message ?? 'Transcription failed' }))
    } finally {
      setTranscribing(t => ({ ...t, [story.id]: false }))
    }
  }

  const missingCount = stories.filter(s => needsTranscript(s)).length

  const transcribeAll = async () => {
    setAllBusy(true); setAllMsg('')
    try {
      const res = await fetch('/api/admin/transcribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? 'Transcription failed')
      setAllMsg(`✓ Transcribed ${json.transcribed} of ${json.attempted} stories${json.failures?.length ? ` · ${json.failures.length} failed` : ''}`)
      router.refresh()
    } catch (e: any) {
      setAllMsg(e?.message ?? 'Transcription failed')
    } finally {
      setAllBusy(false)
    }
  }

  const deleteStory = async (story: Story) => {
    if (!window.confirm(`Delete "${story.title}" permanently? This removes the story and its audio. This cannot be undone.`)) return
    setLoading(l => ({ ...l, [story.id]: true }))
    setErrors(e => ({ ...e, [story.id]: '' }))
    try {
      const res = await fetch(`/api/admin/story?id=${encodeURIComponent(story.id)}`, { method: 'DELETE' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? 'Delete failed')
      setStories(s => s.filter(x => x.id !== story.id))
    } catch (e: any) {
      setErrors(er => ({ ...er, [story.id]: e?.message ?? 'Delete failed' }))
    } finally {
      setLoading(l => ({ ...l, [story.id]: false }))
    }
  }

  const review = async (id: string, status: 'approved' | 'rejected', featured = false) => {
    setLoading(l => ({ ...l, [id]: true }))
    const res = await fetch('/api/admin/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status, featured }) })
    if (res.ok) setStories(s => s.filter(x => x.id !== id))
    setLoading(l => ({ ...l, [id]: false }))
  }

  const saveTranscript = async (story: Story) => {
    const text = transcripts[story.id] ?? story.transcript ?? ''
    setSaving(s => ({ ...s, [story.id]: true }))
    const res = await fetch('/api/admin/transcript', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: story.id, transcript: text }) })
    if (res.ok) { setSaved(s => ({ ...s, [story.id]: true })); setTimeout(() => setSaved(s => ({ ...s, [story.id]: false })), 2000) }
    setSaving(s => ({ ...s, [story.id]: false }))
  }

  const downloadAudio = async (story: Story) => {
    if (!story.audio_upload_path) return
    const res = await fetch(`/api/admin/audio?path=${encodeURIComponent(story.audio_upload_path)}`)
    if (!res.ok) return
    const blob = await res.blob()
    const ext = story.audio_upload_path.split('.').pop() ?? 'webm'
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `story-${story.id.slice(0,8)}.${ext}`; a.click()
    URL.revokeObjectURL(url)
  }

  if (stories.length === 0) return (
    <div className="text-center py-20 border border-zinc-800 rounded-2xl">
      <p className="text-4xl mb-4">✅</p>
      <p className="text-zinc-400 font-black text-xl">Queue is clear</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {missingCount > 0 && (
        <div className="flex items-center gap-3 flex-wrap bg-zinc-900 border border-yellow-400/30 rounded-2xl px-5 py-4">
          <p className="text-sm text-zinc-300 flex-1 min-w-[200px]">
            <span className="font-black text-white">{missingCount} {missingCount === 1 ? 'story is' : 'stories are'}</span> missing {missingCount === 1 ? 'its' : 'their'} text.
          </p>
          <button onClick={transcribeAll} disabled={allBusy}
            className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-zinc-950 text-xs font-black px-4 py-2 rounded-full transition-colors">
            {allBusy ? 'Transcribing…' : '✨ Transcribe all'}
          </button>
          {allMsg && <p className="w-full text-xs text-zinc-400">{allMsg}</p>}
        </div>
      )}
      {stories.map(story => {
        const isExpanded = expanded === story.id
        const isVoice = !!story.audio_upload_path
        const transcriptText = transcripts[story.id] ?? story.transcript ?? ''

        return (
          <div key={story.id} className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden transition-colors">
            {/* Header */}
            <div className="flex items-start gap-4 p-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {isVoice && <span className="text-xs font-black bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 px-2 py-0.5 rounded-full">🎙 Voice</span>}
                  <span className="text-zinc-500 text-xs">{new Date(story.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="font-black text-white text-lg mb-1">{story.title}</h3>
                <p className="text-zinc-400 text-sm">by {story.author_name} {story.author_email && <span className="text-zinc-600">· {story.author_email}</span>}</p>
              </div>
              <button onClick={() => setExpanded(isExpanded ? null : story.id)} className="text-zinc-600 hover:text-zinc-300 transition-colors p-1 text-lg">
                {isExpanded ? '▲' : '▼'}
              </button>
            </div>

            {/* Expanded */}
            {isExpanded && (
              <div className="px-5 pb-5 border-t border-zinc-800 pt-4 space-y-4">
                {story.cover_image_url && <img src={story.cover_image_url} alt="Cover" className="w-full h-40 object-cover rounded-xl" />}

                {isVoice && (
                  <div className="bg-zinc-950 border border-yellow-400/20 rounded-xl p-4">
                    <p className="text-yellow-400 text-xs font-black uppercase tracking-wider mb-3">🎙 Voice Recording</p>
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <audio controls src={`/api/admin/audio?path=${encodeURIComponent(story.audio_upload_path!)}`} className="flex-1 w-full" />
                      <button onClick={() => downloadAudio(story)} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-black px-4 py-2 rounded-xl transition-colors whitespace-nowrap">
                        ⬇️ Export Audio
                      </button>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap mb-3">
                      <button onClick={() => transcribe(story)} disabled={transcribing[story.id]}
                        className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-zinc-950 text-xs font-black px-4 py-2 rounded-full transition-colors">
                        {transcribing[story.id] ? 'Transcribing…' : needsTranscript(story) ? '✨ Transcribe' : '✨ Re-transcribe'}
                      </button>
                      {!isMp3Name(story.audio_upload_path) && (
                        <button onClick={() => convert(story)} disabled={converting[story.id]}
                          className="border border-zinc-700 hover:border-yellow-400 disabled:opacity-40 text-zinc-200 text-xs font-black px-4 py-2 rounded-full transition-colors">
                          {converting[story.id] ? 'Converting…' : '🎵 Convert to MP3'}
                        </button>
                      )}
                      {transcribeMsg[story.id] && <p className="text-xs text-zinc-400">{transcribeMsg[story.id]}</p>}
                      {convertMsg[story.id] && <p className="text-xs text-zinc-400">{convertMsg[story.id]}</p>}
                    </div>
                    <textarea value={transcriptText} onChange={e => setTranscripts(t => ({ ...t, [story.id]: e.target.value }))}
                      placeholder="Paste transcript here…" rows={5}
                      className="w-full bg-zinc-900 border border-zinc-700 focus:border-yellow-400 rounded-xl px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-700 outline-none resize-y" />
                    <button onClick={() => saveTranscript(story)} disabled={saving[story.id] || !transcriptText}
                      className="mt-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-zinc-950 text-xs font-black px-4 py-2 rounded-full transition-colors">
                      {saving[story.id] ? 'Saving…' : saved[story.id] ? '✓ Saved!' : 'Save Transcript'}
                    </button>
                  </div>
                )}

                {!isVoice && story.body && (
                  <div className="bg-zinc-950 rounded-xl p-4 text-sm text-zinc-300 max-h-48 overflow-y-auto">
                    <p className="text-zinc-600 text-xs font-black uppercase tracking-wider mb-2">Story</p>
                    <pre className="whitespace-pre-wrap">{story.body}</pre>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 px-5 py-3 border-t border-zinc-800 bg-zinc-950/40 flex-wrap">
              <a href={`/admin/preview/${story.id}`} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-zinc-300 text-xs font-black transition-colors">👁 Preview</a>
              <div className="flex-1" />
              <button onClick={() => review(story.id, 'rejected')} disabled={loading[story.id]}
                className="text-xs font-black text-red-400 hover:text-red-300 border border-red-900 hover:border-red-700 px-4 py-2 rounded-full transition-colors disabled:opacity-50">
                ✕ Reject
              </button>
              <button onClick={() => deleteStory(story)} disabled={loading[story.id]}
                className="text-xs font-black text-zinc-500 hover:text-red-300 border border-zinc-800 hover:border-red-700 px-4 py-2 rounded-full transition-colors disabled:opacity-50">
                Delete
              </button>
              <button onClick={() => review(story.id, 'approved')} disabled={loading[story.id]}
                className="text-xs font-black text-green-400 border border-green-900 hover:border-green-700 px-4 py-2 rounded-full transition-colors disabled:opacity-50">
                ✓ Approve
              </button>
              <button onClick={() => review(story.id, 'approved', true)} disabled={loading[story.id]}
                className="text-xs font-black bg-yellow-400 hover:bg-yellow-300 text-zinc-950 px-4 py-2 rounded-full transition-colors disabled:opacity-50">
                ★ Approve & Feature
              </button>
            </div>
            {errors[story.id] && <p className="text-red-400 text-xs px-5 py-3 border-t border-red-900/50 bg-red-950/20">{errors[story.id]}</p>}
          </div>
        )
      })}
    </div>
  )
}
