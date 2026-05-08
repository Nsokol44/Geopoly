'use client'
// app/admin/AdminQueue.tsx
import { useState } from 'react'
import {
  CheckCircle, XCircle, Eye, Star, MapPin,
  ChevronDown, ChevronUp, Mic, Download,
  FileText, Save, Loader2, User
} from 'lucide-react'
import type { Story, StoryCategory } from '@/types'
import { CATEGORY_LABELS, CATEGORY_COLORS, formatDate } from '@/lib/utils'

interface Props { stories: Story[] }

export function AdminQueue({ stories: initialStories }: Props) {
  const [stories, setStories] = useState(initialStories)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [transcripts, setTranscripts] = useState<Record<string, string>>({})
  const [savingTranscript, setSavingTranscript] = useState<Record<string, boolean>>({})
  const [transcriptSaved, setTranscriptSaved] = useState<Record<string, boolean>>({})

  const action = async (id: string, status: 'approved' | 'rejected', featured = false) => {
    setLoading(l => ({ ...l, [id]: true }))
    try {
      const res = await fetch('/api/admin/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, featured }),
      })
      if (res.ok) setStories(s => s.filter(story => story.id !== id))
    } finally {
      setLoading(l => ({ ...l, [id]: false }))
    }
  }

  const saveTranscript = async (story: Story) => {
    const text = transcripts[story.id] ?? story.transcript ?? ''
    setSavingTranscript(s => ({ ...s, [story.id]: true }))
    try {
      const res = await fetch('/api/admin/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: story.id, transcript: text }),
      })
      if (res.ok) {
        setTranscriptSaved(s => ({ ...s, [story.id]: true }))
        setTimeout(() => setTranscriptSaved(s => ({ ...s, [story.id]: false })), 2000)
      }
    } finally {
      setSavingTranscript(s => ({ ...s, [story.id]: false }))
    }
  }

  // Download audio as MP3-compatible file for AI transcription
  const downloadAudio = async (story: Story) => {
    if (!story.audio_upload_path) return
    const res = await fetch(`/api/admin/audio?path=${encodeURIComponent(story.audio_upload_path)}`)
    if (!res.ok) return
    const blob = await res.blob()
    const ext = story.audio_upload_path.split('.').pop() ?? 'mp3'
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `story-${story.id.slice(0, 8)}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (stories.length === 0) {
    return (
      <div className="text-center py-20 border border-ink-800 rounded-sm">
        <CheckCircle size={32} className="mx-auto text-nature-500 mb-4" />
        <p className="text-ink-400 font-display text-xl">Queue is clear</p>
        <p className="text-ink-600 text-sm mt-2">No stories awaiting review.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {stories.map(story => {
        const color = CATEGORY_COLORS[story.category as StoryCategory] ?? '#F59E0B'
        const isExpanded = expanded === story.id
        const isLoading = loading[story.id]
        const isVoice = !!story.audio_upload_path
        const transcriptText = transcripts[story.id] ?? story.transcript ?? ''

        return (
          <div key={story.id} className="bg-ink-900 border border-ink-800 hover:border-ink-700 rounded-sm overflow-hidden transition-colors">

            {/* Header row */}
            <div className="flex items-start gap-4 p-5">
              <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <span
                    className="text-[10px] font-mono tracking-[0.15em] uppercase px-2 py-0.5 border rounded-sm"
                    style={{ color, background: `${color}18`, borderColor: `${color}44` }}
                  >
                    {CATEGORY_LABELS[story.category as StoryCategory]}
                  </span>
                  {isVoice && (
                    <span className="text-[10px] font-mono tracking-[0.15em] uppercase px-2 py-0.5 border rounded-sm text-brand-400 bg-brand-950/30 border-brand-800">
                      🎙 Voice
                    </span>
                  )}
                  {story.submitted_for && (
                    <span className="text-[10px] font-mono tracking-[0.15em] uppercase px-2 py-0.5 border rounded-sm text-amber-400 bg-amber-950/30 border-amber-800">
                      <User size={8} className="inline mr-1" />On Behalf Of
                    </span>
                  )}
                  <span className="text-ink-500 text-xs font-mono flex items-center gap-1">
                    <MapPin size={9} /> {story.location_name}
                  </span>
                  <span className="text-ink-600 text-xs">{formatDate(story.created_at)}</span>
                  {story.age_range && (
                    <span className="text-ink-600 text-xs">· Age: {story.age_range}</span>
                  )}
                </div>

                <h3 className="font-display text-lg text-ink-100 mb-1">{story.title}</h3>
                <p className="text-ink-400 text-sm">
                  by {story.author_name}
                  {story.submitted_for && (
                    <span className="text-amber-500 ml-2">→ on behalf of {story.submitted_for}</span>
                  )}
                  <span className="text-ink-600 ml-2">· {story.author_email}</span>
                </p>
                {!isExpanded && (
                  <p className="text-ink-500 text-sm mt-2 line-clamp-2">{story.excerpt}</p>
                )}
              </div>

              <button
                onClick={() => setExpanded(isExpanded ? null : story.id)}
                className="text-ink-500 hover:text-ink-200 transition-colors p-1 flex-shrink-0"
              >
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {/* Expanded body */}
            {isExpanded && (
              <div className="px-5 pb-5 border-t border-ink-800 pt-4 space-y-4">

                {/* Meta grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {story.cover_image_url && (
                    <img src={story.cover_image_url} alt="Cover" className="w-full h-40 object-cover rounded-sm" />
                  )}
                  <div className="text-sm space-y-2 text-ink-400">
                    <p><span className="text-ink-500">Coords:</span> {story.latitude.toFixed(4)}, {story.longitude.toFixed(4)}</p>
                    <p><span className="text-ink-500">Country:</span> {story.country_name} ({story.country_code})</p>
                    {story.author_bio && <p><span className="text-ink-500">Bio:</span> {story.author_bio}</p>}
                    {story.age_range && <p><span className="text-ink-500">Age Range:</span> {story.age_range}</p>}
                    {story.submitted_for && <p><span className="text-ink-500">Submitted For:</span> {story.submitted_for}</p>}
                    {story.tags?.length > 0 && <p><span className="text-ink-500">Tags:</span> {story.tags.join(', ')}</p>}
                    {story.video_url && (
                      <p><span className="text-ink-500">Video:</span> <a href={story.video_url} target="_blank" rel="noreferrer" className="text-brand-400 hover:underline truncate">{story.video_url}</a></p>
                    )}
                  </div>
                </div>

                {/* ── Voice / Audio Section ── */}
                {isVoice && (
                  <div className="bg-ink-950 border border-brand-900 rounded-sm p-4">
                    <p className="text-brand-400 text-xs font-mono uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Mic size={12} /> Voice Recording
                    </p>

                    {/* Audio player + download */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                      <audio
                        controls
                        src={`/api/admin/audio?path=${encodeURIComponent(story.audio_upload_path!)}`}
                        className="flex-1 w-full"
                      />
                      <button
                        onClick={() => downloadAudio(story)}
                        className="flex items-center gap-2 bg-ink-800 hover:bg-ink-700 border border-ink-700 text-ink-200 text-xs font-mono px-4 py-2 rounded-sm transition-colors whitespace-nowrap"
                      >
                        <Download size={12} /> Export Audio
                      </button>
                    </div>

                    {/* AI transcription instructions */}
                    <div className="bg-brand-950/30 border border-brand-900/50 rounded-sm p-3 mb-4 text-xs text-ink-400 leading-relaxed">
                      <p className="font-bold text-brand-300 mb-1">📋 How to transcribe with AI:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Click <strong className="text-ink-200">Export Audio</strong> to download the file</li>
                        <li>Go to <a href="https://chat.openai.com" target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">ChatGPT</a> or <a href="https://claude.ai" target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">Claude</a></li>
                        <li>Upload the audio file and ask: <em className="text-ink-300">"Please transcribe this audio recording accurately."</em></li>
                        <li>Paste the result in the transcript box below and hit <strong className="text-ink-200">Save</strong></li>
                      </ol>
                    </div>

                    {/* Transcript editor */}
                    <div>
                      <p className="text-ink-500 text-xs font-mono uppercase tracking-wider mb-2 flex items-center gap-2">
                        <FileText size={11} /> Transcript
                        {transcriptSaved[story.id] && (
                          <span className="text-nature-400 normal-case tracking-normal">✓ Saved!</span>
                        )}
                      </p>
                      <textarea
                        value={transcriptText}
                        onChange={e => setTranscripts(t => ({ ...t, [story.id]: e.target.value }))}
                        placeholder="Paste AI-generated transcript here, or type it manually…"
                        rows={6}
                        className="w-full bg-ink-900 border border-ink-700 focus:border-brand-600 rounded-sm px-3 py-2 text-sm text-ink-200 placeholder:text-ink-700 outline-none resize-y"
                      />
                      <button
                        onClick={() => saveTranscript(story)}
                        disabled={savingTranscript[story.id] || !transcriptText}
                        className="mt-2 flex items-center gap-2 bg-brand-700 hover:bg-brand-600 disabled:opacity-40 text-ink-50 text-xs font-mono px-4 py-2 rounded-sm transition-colors"
                      >
                        {savingTranscript[story.id]
                          ? <><Loader2 size={11} className="animate-spin" /> Saving…</>
                          : <><Save size={11} /> Save Transcript</>
                        }
                      </button>
                    </div>
                  </div>
                )}

                {/* Excerpt + body */}
                {!isVoice && (
                  <>
                    <div className="bg-ink-950 rounded-sm p-4 text-sm text-ink-300 leading-relaxed max-h-48 overflow-y-auto">
                      <p className="text-ink-500 text-xs font-mono uppercase tracking-wider mb-2">Excerpt</p>
                      {story.excerpt}
                    </div>
                    <div className="bg-ink-950 rounded-sm p-4 text-sm text-ink-300 leading-relaxed max-h-64 overflow-y-auto">
                      <p className="text-ink-500 text-xs font-mono uppercase tracking-wider mb-2">Full Story</p>
                      <pre className="whitespace-pre-wrap font-body">{story.body}</pre>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Action bar */}
            <div className="flex items-center gap-3 px-5 py-3 border-t border-ink-800 bg-ink-950/40 flex-wrap">
              <a
                href={`/story/${story.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-mono text-ink-500 hover:text-ink-200 transition-colors"
              >
                <Eye size={12} /> Preview
              </a>

              <div className="flex-1" />

              <button
                onClick={() => action(story.id, 'rejected')}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-xs font-mono text-red-400 hover:text-red-300 border border-red-900 hover:border-red-700 px-4 py-2 rounded-sm transition-colors disabled:opacity-50"
              >
                <XCircle size={12} /> Reject
              </button>
              <button
                onClick={() => action(story.id, 'approved', false)}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-xs font-mono text-nature-400 hover:text-forest-300 border border-nature-900 hover:border-nature-700 px-4 py-2 rounded-sm transition-colors disabled:opacity-50"
              >
                <CheckCircle size={12} /> Approve
              </button>
              <button
                onClick={() => action(story.id, 'approved', true)}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-xs font-mono bg-brand-600 hover:bg-brand-500 text-ink-50 px-4 py-2 rounded-sm transition-colors disabled:opacity-50"
              >
                <Star size={12} /> Approve & Feature
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
