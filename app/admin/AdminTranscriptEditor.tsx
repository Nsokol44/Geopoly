'use client'
// app/admin/AdminTranscriptEditor.tsx
import { useState } from 'react'
import { Mic, Download, FileText, Save, Loader2 } from 'lucide-react'

interface Props {
  storyId: string
  audioPath: string
  initialTranscript: string
}

export function AdminTranscriptEditor({ storyId, audioPath, initialTranscript }: Props) {
  const [transcript, setTranscript] = useState(initialTranscript)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: storyId, transcript }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  const downloadAudio = async () => {
    const res = await fetch(`/api/admin/audio?path=${encodeURIComponent(audioPath)}`)
    if (!res.ok) return
    const blob = await res.blob()
    const ext = audioPath.split('.').pop() ?? 'webm'
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `story-${storyId.slice(0, 8)}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-ink-900 border border-brand-900 rounded-lg p-6">
      <p className="text-brand-400 text-xs font-mono uppercase tracking-wider mb-4 flex items-center gap-2">
        <Mic size={12} /> Voice Recording
      </p>

      {/* Audio player + download */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
        <audio
          controls
          src={`/api/admin/audio?path=${encodeURIComponent(audioPath)}`}
          className="flex-1 w-full"
        />
        <button
          onClick={downloadAudio}
          className="flex items-center gap-2 bg-ink-800 hover:bg-ink-700 border border-ink-700 text-ink-200 text-xs font-mono px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          <Download size={12} /> Export Audio
        </button>
      </div>

      {/* AI transcription instructions */}
      <div className="bg-brand-950/30 border border-brand-900/50 rounded-lg p-4 mb-5 text-xs text-ink-400 leading-relaxed">
        <p className="font-bold text-brand-300 mb-2">📋 How to transcribe with AI:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Click <strong className="text-ink-200">Export Audio</strong> to download the file</li>
          <li>Go to <a href="https://claude.ai" target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">Claude.ai</a> or <a href="https://chat.openai.com" target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">ChatGPT</a></li>
          <li>Upload the audio and ask: <em className="text-ink-300">"Please transcribe this audio recording accurately."</em></li>
          <li>Paste the transcript below and click <strong className="text-ink-200">Save Transcript</strong></li>
        </ol>
      </div>

      {/* Transcript editor */}
      <div>
        <p className="text-ink-400 text-xs font-mono uppercase tracking-wider mb-2 flex items-center gap-2">
          <FileText size={11} /> Transcript
          {saved && <span className="text-nature-400 normal-case tracking-normal font-sans">✓ Saved!</span>}
        </p>
        <textarea
          value={transcript}
          onChange={e => setTranscript(e.target.value)}
          placeholder="Paste AI-generated transcript here, or type manually…"
          rows={8}
          className="w-full bg-ink-950 border border-ink-700 focus:border-brand-600 rounded-lg px-4 py-3 text-sm text-ink-200 placeholder:text-ink-700 outline-none resize-y transition-colors"
        />
        <button
          onClick={save}
          disabled={saving || !transcript.trim()}
          className="mt-3 flex items-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-sm font-bold px-6 py-2.5 rounded-lg transition-colors"
        >
          {saving
            ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
            : <><Save size={14} /> Save Transcript</>
          }
        </button>
      </div>
    </div>
  )
}
