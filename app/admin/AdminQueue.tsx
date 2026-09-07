'use client'
import { useState } from 'react'
import type { Story } from '@/types'

export function AdminQueue({ stories: init }: { stories: Story[] }) {
  const [stories, setStories] = useState(init)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [transcripts, setTranscripts] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

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
                    <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-3 mb-3 text-xs text-zinc-400 leading-relaxed">
                      <p className="font-black text-yellow-300 mb-1">📋 To transcribe:</p>
                      <ol className="list-decimal list-inside space-y-0.5">
                        <li>Export Audio → upload to <a href="https://claude.ai" target="_blank" rel="noreferrer" className="text-yellow-400 hover:underline">Claude.ai</a> or <a href="https://chat.openai.com" target="_blank" rel="noreferrer" className="text-yellow-400 hover:underline">ChatGPT</a></li>
                        <li>Ask: "Please transcribe this audio accurately."</li>
                        <li>Paste below and save</li>
                      </ol>
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
              <button onClick={() => review(story.id, 'approved')} disabled={loading[story.id]}
                className="text-xs font-black text-green-400 border border-green-900 hover:border-green-700 px-4 py-2 rounded-full transition-colors disabled:opacity-50">
                ✓ Approve
              </button>
              <button onClick={() => review(story.id, 'approved', true)} disabled={loading[story.id]}
                className="text-xs font-black bg-yellow-400 hover:bg-yellow-300 text-zinc-950 px-4 py-2 rounded-full transition-colors disabled:opacity-50">
                ★ Approve & Feature
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
