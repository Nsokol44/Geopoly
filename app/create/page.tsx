'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type Stage = 'record' | 'details' | 'submitting' | 'success'

export default function CreatePage() {
  const [stage, setStage] = useState<Stage>('record')
  const [audio, setAudio] = useState<{ blob: Blob; url: string; mime: string; duration: number } | null>(null)
  const [title, setTitle] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [image, setImage] = useState<{ file: File; preview: string } | null>(null)
  const [error, setError] = useState('')
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : ''
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      const actualMime = mr.mimeType || 'audio/webm'
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: actualMime })
        setAudio({ blob, url: URL.createObjectURL(blob), mime: actualMime, duration: seconds })
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start(); mediaRef.current = mr; setRecording(true); setSeconds(0)
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } catch { alert('Microphone access denied.') }
  }

  const stopRec = () => {
    mediaRef.current?.stop()
    if (timerRef.current) clearInterval(timerRef.current)
    setRecording(false)
  }

  const submit = async () => {
    setStage('submitting'); setError('')
    try {
      const db = createClient()
      let audio_path: string | null = null
      let img_url: string | null = null

      if (audio) {
        const ext = audio.mime.includes('mp4') ? 'mp4' : 'webm'
        const path = `audio/${Date.now()}.${ext}`
        const { error: e } = await db.storage.from('story-media').upload(path, audio.blob, { contentType: audio.mime })
        if (e) throw new Error('Audio upload failed')
        audio_path = path
      }
      if (image) {
        const ext = image.file.name.split('.').pop()
        const path = `covers/${Date.now()}.${ext}`
        const { error: e } = await db.storage.from('story-media').upload(path, image.file)
        if (e) throw new Error('Image upload failed')
        img_url = db.storage.from('story-media').getPublicUrl(path).data.publicUrl
      }

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, author_name: name, author_email: email, audio_upload_path: audio_path, cover_image_url: img_url }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setStage('success')
    } catch (e: any) { setError(e.message); setStage('details') }
  }

  if (stage === 'success') return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">💛</div>
        <h1 className="font-black text-4xl text-white mb-3">Story Submitted!</h1>
        <p className="text-zinc-400 mb-8">Thanks {name}! Our team reviews stories within 24–48 hours. Once approved, people can listen and send you a dolla.</p>
        <Link href="/" className="inline-block border border-zinc-700 text-zinc-300 font-bold px-6 py-3 rounded-full hover:border-zinc-500 transition-colors">Browse Stories</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-lg mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-yellow-400 text-zinc-950 font-black text-xs px-2 py-1 rounded">$1</div>
            <span className="font-black text-white hidden sm:inline">JustGimmeADolla</span>
          </Link>
          <Link href="/" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">← Back</Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-12">
        <div className="text-center mb-8">
          <div className="inline-block bg-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-widest px-3 py-1 rounded-full mb-4">Share Your Story</div>
          <h1 className="font-black text-4xl text-white">Tell Your Story.<br />Ask for a Dolla.</h1>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['Record', 'Details'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-colors
                ${(stage === 'record' && i === 0) || ((stage === 'details' || stage === 'submitting') && i === 1)
                  ? 'bg-yellow-400 text-zinc-950' : 'bg-zinc-800 text-zinc-600'}`}>
                {stage !== 'record' && i === 0 ? '✓ ' : `${i + 1} `}{s}
              </div>
              {i === 0 && <div className="w-6 h-px bg-zinc-700" />}
            </div>
          ))}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
          {stage === 'record' && (
            <div className="text-center">
              <h2 className="font-black text-3xl text-white mb-2">Record Your Story</h2>
              <p className="text-zinc-400 mb-2">Speak from the heart. No script needed.</p>
              <p className="text-zinc-500 text-sm mb-8">What happened? How did it affect you? What do you want people to know?</p>

              {!audio ? (
                <div className="flex flex-col items-center gap-6">
                  <button onClick={recording ? stopRec : startRec}
                    className={`w-40 h-40 rounded-full flex flex-col items-center justify-center gap-3 transition-all shadow-2xl
                      ${recording ? 'bg-red-600 animate-pulse scale-110' : 'bg-yellow-400 hover:bg-yellow-300 active:scale-95'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width={recording ? 40 : 48} height={recording ? 40 : 48} viewBox="0 0 24 24" fill="none" stroke={recording ? "white" : "#09090b"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {recording
                        ? <><rect width="18" height="18" x="3" y="3" rx="2"/></>
                        : <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></>}
                    </svg>
                    <span className={`text-sm font-black uppercase tracking-wider ${recording ? 'text-white' : 'text-zinc-950'}`}>
                      {recording ? 'Tap to Stop' : 'Tap to Record'}
                    </span>
                  </button>
                  {recording && (
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-red-400 font-bold">Recording…</span>
                      </div>
                      <span className="font-mono text-red-300 text-2xl tabular-nums">{fmt(seconds)}</span>
                    </div>
                  )}
                  {!recording && <p className="text-zinc-500">👆 Tap to begin</p>}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <p className="text-yellow-400 font-black text-lg">✅ Saved! ({fmt(audio.duration)})</p>
                  <audio controls src={audio.url} className="w-full max-w-xs rounded-xl" />
                  <button onClick={() => setAudio(null)} className="text-zinc-500 hover:text-zinc-300 text-sm border border-zinc-700 rounded-full px-5 py-2 transition-colors">
                    Re-record
                  </button>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-zinc-800">
                <button onClick={() => setStage('details')} disabled={!audio}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-zinc-950 font-black text-lg py-4 rounded-full transition-colors">
                  Next Step →
                </button>
                {!audio && <p className="text-zinc-600 text-sm mt-2">Record your story first</p>}
              </div>
            </div>
          )}

          {(stage === 'details' || stage === 'submitting') && (
            <div>
              <h2 className="font-black text-3xl text-white mb-2">About Your Story</h2>
              <p className="text-zinc-400 text-sm mb-6">Give it a title and tell us who you are.</p>

              {[
                { label: 'Story Title *', val: title, set: setTitle, ph: 'e.g. The day the river flooded our town', type: 'text' },
                { label: 'Your Name *', val: name, set: setName, ph: 'Full name', type: 'text' },
                { label: 'Email — optional', val: email, set: setEmail, ph: 'you@example.com', type: 'email' },
              ].map(({ label, val, set, ph, type }) => (
                <div key={label} className="mb-5">
                  <label className="block text-sm font-black text-zinc-300 mb-2">{label}</label>
                  <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph}
                    className="w-full bg-zinc-950 border border-zinc-700 focus:border-yellow-400 rounded-xl px-4 py-4 text-base text-white placeholder:text-zinc-700 outline-none transition-colors" />
                </div>
              ))}

              <div className="mb-6">
                <label className="block text-sm font-black text-zinc-300 mb-2">Cover Photo — optional</label>
                {image ? (
                  <div className="relative">
                    <img src={image.preview} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
                    <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-zinc-900/80 text-zinc-300 rounded-full w-7 h-7 flex items-center justify-center">✕</button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border border-dashed border-zinc-700 hover:border-zinc-500 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
                    + Add a Photo
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) setImage({ file: f, preview: URL.createObjectURL(f) }) }} />
              </div>

              {error && <div className="mb-5 text-red-400 bg-red-950/30 border border-red-900 rounded-xl p-4 text-sm">{error}</div>}

              <div className="flex gap-3 pt-4 border-t border-zinc-800">
                <button onClick={() => setStage('record')} disabled={stage === 'submitting'}
                  className="border border-zinc-700 text-zinc-400 font-bold text-sm px-5 py-3 rounded-full hover:border-zinc-500 transition-colors">
                  ← Back
                </button>
                <button onClick={submit} disabled={!title.trim() || !name.trim() || stage === 'submitting'}
                  className="flex-1 flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-zinc-950 font-black text-lg py-4 rounded-full transition-colors">
                  {stage === 'submitting' ? 'Submitting…' : '✅ Submit My Story'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
