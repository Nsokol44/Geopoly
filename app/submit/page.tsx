'use client'
// app/submit/page.tsx  — Elder-friendly voice submission
// Replace your existing app/submit/page.tsx with this file.

import { useState, useRef, useCallback } from 'react'
import { Mic, MicOff, MapPin, Upload, CheckCircle, Loader2, AlertCircle, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { reverseGeocode } from '@/lib/utils'
import { SiteHeader } from '@/components/ui/SiteHeader'
import { SiteFooter } from '@/components/ui/SiteFooter'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────
type Stage = 'record' | 'details' | 'submitting' | 'success' | 'error'

interface VoiceForm {
  audioBlob: Blob | null
  audioUrl: string | null
  audioDuration: number
  audioMime: string
  author_name: string
  author_email: string
  age_range: string
  latitude: number | null
  longitude: number | null
  location_name: string
  country_code: string
  country_name: string
  cover_image_file: File | null
  cover_image_preview: string | null
  video_file: File | null
}

const EMPTY: VoiceForm = {
  audioBlob: null, audioUrl: null, audioDuration: 0, audioMime: '',
  author_name: '', author_email: '', age_range: '',
  latitude: null, longitude: null,
  location_name: '', country_code: '', country_name: '',
  cover_image_file: null, cover_image_preview: null,
  video_file: null,
}

const AGE_RANGES = ['Under 18', '18–24', '25–34', '35–44', '45–54', '55–64', '65–74', '75 or older', 'Prefer not to say']

// ─── Main Component ───────────────────────────────────────────
export default function SubmitPage() {
  const [stage, setStage] = useState<Stage>('record')
  const [form, setForm] = useState<VoiceForm>(EMPTY)
  const [errorMsg, setErrorMsg] = useState('')

  const update = (p: Partial<VoiceForm>) => setForm(f => ({ ...f, ...p }))

  if (stage === 'success') return <SuccessScreen />

  return (
    <div className="min-h-screen bg-ink-950 flex flex-col">
      <SiteHeader />
      <main className="flex-1 pt-16">
        <div className="max-w-lg mx-auto px-5 py-12">

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl text-ink-50 mb-2">Share Your Story</h1>
          </div>

          {/* Step indicator — simple 2-step */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {(['record', 'details'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold font-mono transition-colors
                  ${stage === s ? 'bg-brand-500 text-white' :
                    (stage === 'details' && i === 0) || stage === 'submitting' ? 'bg-brand-800 text-brand-300' :
                    'bg-ink-800 text-ink-500'}`}>
                  {(stage === 'details' && i === 0) || stage === 'submitting' ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-mono uppercase tracking-wider ${stage === s ? 'text-ink-200' : 'text-ink-600'}`}>
                  {s === 'record' ? 'Record' : 'Details'}
                </span>
                {i === 0 && <div className="w-8 h-px bg-ink-700" />}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="bg-ink-900 border border-ink-800 rounded-lg p-6 md:p-8">
            {stage === 'record' && (
              <StageRecord form={form} update={update} onNext={() => setStage('details')} />
            )}
            {(stage === 'details' || stage === 'submitting') && (
              <StageDetails
                form={form}
                update={update}
                submitting={stage === 'submitting'}
                errorMsg={errorMsg}
                onBack={() => setStage('record')}
                onSubmit={async () => {
                  setStage('submitting')
                  setErrorMsg('')
                  const err = await handleSubmit(form)
                  if (err) { setErrorMsg(err); setStage('details') }
                  else setStage('success')
                }}
              />
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

// ─── Stage 1: Record ──────────────────────────────────────────
function StageRecord({ form, update, onNext }: {
  form: VoiceForm
  update: (p: Partial<VoiceForm>) => void
  onNext: () => void
}) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Pick best supported format — iOS Safari needs mp4, Chrome uses webm
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : ''
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      const actualMime = mr.mimeType || 'audio/webm'
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: actualMime })
        update({ audioBlob: blob, audioUrl: URL.createObjectURL(blob), audioDuration: seconds, audioMime: actualMime })
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      mediaRef.current = mr
      setRecording(true)
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } catch {
      alert('Microphone access denied. Please allow microphone and try again.')
    }
  }

  const stopRecording = () => {
    mediaRef.current?.stop()
    if (timerRef.current) clearInterval(timerRef.current)
    setRecording(false)
  }

  const clearRecording = () => {
    update({ audioBlob: null, audioUrl: null, audioDuration: 0 })
    setSeconds(0)
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="text-center">
      <h2 className="font-display text-3xl text-ink-50 mb-3">Step 1: Record Your Story</h2>
      <p className="text-ink-300 text-base mb-2 leading-relaxed">
        Press the big button below and speak your story out loud.
      </p>
      <p className="text-ink-400 text-sm mb-8 leading-relaxed">
        Tell us what you have seen or experienced with climate change in your community.
        Speak as long as you need — there is no time limit.
      </p>

      {/* Big mic button */}
      {!form.audioUrl ? (
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`w-40 h-40 rounded-full flex flex-col items-center justify-center gap-3 transition-all shadow-xl
              ${recording
                ? 'bg-red-600 hover:bg-red-500 animate-pulse scale-110'
                : 'bg-brand-600 hover:bg-brand-500 active:scale-95'
              }`}
          >
            {recording
              ? <MicOff size={48} className="text-white" />
              : <Mic size={48} className="text-white" />
            }
            <span className="text-white text-sm font-bold uppercase tracking-wider">
              {recording ? 'Tap to Stop' : 'Tap to Record'}
            </span>
          </button>

          {recording && (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 text-base font-bold">Recording…</span>
              </div>
              <span className="font-mono text-red-300 text-2xl tabular-nums">{fmt(seconds)}</span>
              <p className="text-ink-500 text-sm mt-1">Tap the button again when you are done speaking.</p>
            </div>
          )}

          {!recording && (
            <p className="text-ink-400 text-base">👆 Tap the button to begin speaking</p>
          )}
        </div>
      ) : (
        /* Playback + controls */
        <div className="flex flex-col items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-nature-900 border-2 border-nature-600 flex items-center justify-center">
            <Mic size={36} className="text-nature-400" />
          </div>
          <p className="text-nature-400 text-base font-bold">
            ✅ Your recording is saved! ({fmt(form.audioDuration)})
          </p>
          <p className="text-ink-400 text-sm">Press play below to hear your recording.</p>
          <audio controls src={form.audioUrl} className="w-full max-w-xs rounded-lg" />
          <button
            onClick={clearRecording}
            className="flex items-center gap-2 text-ink-400 hover:text-ink-200 text-sm transition-colors border border-ink-700 hover:border-ink-500 rounded-lg px-5 py-2.5 mt-1"
          >
            <X size={14} /> Not happy with it? Record again
          </button>
        </div>
      )}

      {/* Next button */}
      <div className="mt-8 pt-6 border-t border-ink-800">
        <button
          onClick={onNext}
          disabled={!form.audioUrl}
          className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg py-5 rounded-lg transition-colors"
        >
          Next Step →
        </button>
        {!form.audioUrl && (
          <p className="text-ink-500 text-sm mt-3">👆 Please record your story first, then tap Next Step.</p>
        )}
      </div>
    </div>
  )
}

// ─── Stage 2: Details ─────────────────────────────────────────
function StageDetails({ form, update, submitting, errorMsg, onBack, onSubmit }: {
  form: VoiceForm
  update: (p: Partial<VoiceForm>) => void
  submitting: boolean
  errorMsg: string
  onBack: () => void
  onSubmit: () => void
}) {
  const [locating, setLocating] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  const locate = () => {
    if (!navigator.geolocation) return alert('Location not available on this device.')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude, longitude } = pos.coords
      const geo = await reverseGeocode(latitude, longitude)
      update({
        latitude, longitude,
        location_name: geo?.location_name ?? '',
        country_code: geo?.country_code ?? '',
        country_name: geo?.country_name ?? '',
      })
      setLocating(false)
    }, () => {
      setLocating(false)
      alert('Could not detect location. Please try again.')
    })
  }

  const onImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    update({ cover_image_file: file, cover_image_preview: URL.createObjectURL(file) })
  }

  const canSubmit = !!(
    form.author_name.trim() &&
    form.author_email.trim() &&
    form.latitude &&
    form.longitude
  )

  return (
    <div>
      <h2 className="font-display text-3xl text-ink-50 mb-2">Step 2: About You</h2>
      <p className="text-ink-300 text-base mb-1 leading-relaxed">
        Almost done! We just need a few details.
      </p>
      <p className="text-ink-400 text-sm mb-6 leading-relaxed">
        Fields marked with <span className="text-brand-400 font-bold">*</span> are required. Everything else is optional.
      </p>

      {/* Name */}
      <div className="mb-6">
        <label className="block text-base font-bold text-ink-200 mb-1">Your Name <span className="text-brand-400">*</span></label>
        <p className="text-ink-500 text-sm mb-2">Enter your first and last name.</p>
        <input
          type="text"
          value={form.author_name}
          onChange={e => update({ author_name: e.target.value })}
          placeholder="Full name"
          className="w-full bg-ink-950 border border-ink-700 focus:border-brand-600 rounded-lg px-4 py-4 text-base text-ink-200 placeholder:text-ink-700 outline-none transition-colors"
        />
      </div>

      {/* Email */}
      <div className="mb-6">
        <label className="block text-base font-bold text-ink-200 mb-1">Email Address <span className="text-brand-400">*</span></label>
        <p className="text-ink-500 text-sm mb-2">We will contact you here. Your email will never be shown publicly.</p>
        <input
          type="email"
          value={form.author_email}
          onChange={e => update({ author_email: e.target.value })}
          placeholder="you@example.com"
          className="w-full bg-ink-950 border border-ink-700 focus:border-brand-600 rounded-lg px-4 py-4 text-base text-ink-200 placeholder:text-ink-700 outline-none transition-colors"
        />
      </div>

      {/* Age Range */}
      <div className="mb-6">
        <label className="block text-base font-bold text-ink-200 mb-1">Your Age Range <span className="text-ink-500 font-normal text-sm">— optional</span></label>
        <p className="text-ink-500 text-sm mb-2">This helps us understand who is sharing stories. You do not have to answer.</p>
        <select
          value={form.age_range}
          onChange={e => update({ age_range: e.target.value })}
          className="w-full bg-ink-950 border border-ink-700 focus:border-brand-600 rounded-lg px-4 py-4 text-base text-ink-200 outline-none transition-colors"
        >
          <option value="">Select your age range…</option>
          {AGE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Location */}
      <div className="mb-6">
        <label className="block text-base font-bold text-ink-200 mb-1">Your Location <span className="text-brand-400">*</span></label>
        <p className="text-ink-500 text-sm mb-3">Tap the button below and your phone will detect where you are automatically.</p>
        <button
          onClick={locate}
          disabled={locating}
          className={`w-full flex items-center justify-center gap-3 py-4 rounded-lg border font-mono text-sm uppercase tracking-wider font-bold transition-colors
            ${form.latitude
              ? 'bg-nature-900 border-nature-700 text-nature-300'
              : 'bg-ink-800 hover:bg-ink-700 border-ink-700 hover:border-brand-600 text-ink-200'
            }`}
        >
          <MapPin size={18} className={locating ? 'animate-bounce' : ''} />
          {locating
            ? 'Detecting location…'
            : form.latitude
              ? `📍 ${form.location_name || `${form.latitude.toFixed(2)}, ${form.longitude?.toFixed(2)}`}`
              : 'Use My Current Location'
          }
        </button>
        {form.latitude && (
          <button
            onClick={() => update({ latitude: null, longitude: null, location_name: '', country_code: '', country_name: '' })}
            className="text-ink-600 hover:text-ink-400 text-xs font-mono mt-1.5 transition-colors"
          >
            Clear location
          </button>
        )}
      </div>

      {/* Photo — optional */}
      <div className="mb-6">
        <label className="block text-base font-bold text-ink-200 mb-1">Photo <span className="text-ink-500 font-normal text-sm">— optional</span></label>
        <p className="text-ink-500 text-sm mb-3">You can add a photo from your phone if you have one. This is not required.</p>
        {form.cover_image_preview ? (
          <div className="relative">
            <img src={form.cover_image_preview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
            <button
              onClick={() => update({ cover_image_file: null, cover_image_preview: null })}
              className="absolute top-2 right-2 bg-ink-900/80 text-ink-300 rounded-full p-1 hover:bg-ink-800"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-lg border border-dashed border-ink-700 hover:border-ink-500 text-ink-500 hover:text-ink-300 text-sm transition-colors"
          >
            <Upload size={18} />
            Add a Photo
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onImagePick} />
      </div>

      {/* Video — optional */}
      <div className="mb-6">
        <label className="block text-base font-bold text-ink-200 mb-1">Video <span className="text-ink-500 font-normal text-sm">— optional</span></label>
        <p className="text-ink-500 text-sm mb-3">You can also add a video from your phone. This is not required.</p>
        {form.video_file ? (
          <div className="flex items-center gap-3 bg-ink-800 rounded-lg px-4 py-3">
            <span className="text-ink-300 text-sm flex-1 truncate">📹 {form.video_file.name}</span>
            <button onClick={() => update({ video_file: null })} className="text-ink-500 hover:text-ink-300">
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => videoRef.current?.click()}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-lg border border-dashed border-ink-700 hover:border-ink-500 text-ink-500 hover:text-ink-300 text-sm transition-colors"
          >
            <Upload size={18} />
            Add a Video
          </button>
        )}
        <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden"
          onChange={e => update({ video_file: e.target.files?.[0] ?? null })} />
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="mb-5 flex items-start gap-2 text-red-400 bg-red-950/30 border border-red-900 rounded-lg p-4 text-sm">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {errorMsg}
        </div>
      )}

      {/* Nav */}
      <div className="flex items-center justify-between pt-4 border-t border-ink-800 gap-4">
        <button
          onClick={onBack}
          disabled={submitting}
          className="text-ink-400 hover:text-ink-200 text-sm border border-ink-700 hover:border-ink-500 rounded-lg px-5 py-3 transition-colors"
        >
          ← Go Back
        </button>
        <button
          onClick={onSubmit}
          disabled={!canSubmit || submitting}
          className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-lg transition-colors"
        >
          {submitting && <Loader2 size={18} className="animate-spin" />}
          {submitting ? 'Submitting…' : '✅ Submit My Story'}
        </button>
      </div>
      {!canSubmit && (
        <p className="text-ink-500 text-sm text-right mt-2">
          Please fill in your name, email, and location above.
        </p>
      )}
    </div>
  )
}

// ─── Submit handler ───────────────────────────────────────────
async function handleSubmit(form: VoiceForm): Promise<string | null> {
  try {
    const supabase = createClient()

    let cover_image_url: string | null = null
    let video_upload_path: string | null = null
    let audio_upload_path: string | null = null

    // Upload audio (required)
    if (form.audioBlob) {
      const mime = form.audioMime || 'audio/webm'
      const ext = mime.includes('mp4') ? 'mp4' : mime.includes('ogg') ? 'ogg' : 'webm'
      const path = `audio/${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('story-media')
        .upload(path, form.audioBlob, { contentType: mime, cacheControl: '3600', upsert: false })
      if (error) throw new Error('Audio upload failed: ' + error.message)
      audio_upload_path = path
    }

    // Upload cover image
    if (form.cover_image_file) {
      const ext = form.cover_image_file.name.split('.').pop()
      const path = `covers/${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('story-media')
        .upload(path, form.cover_image_file, { cacheControl: '3600', upsert: false })
      if (error) throw new Error('Image upload failed: ' + error.message)
      const { data: { publicUrl } } = supabase.storage.from('story-media').getPublicUrl(path)
      cover_image_url = publicUrl
    }

    // Upload video file
    if (form.video_file) {
      const ext = form.video_file.name.split('.').pop()
      const path = `videos/${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('story-media')
        .upload(path, form.video_file, { cacheControl: '3600', upsert: false })
      if (error) throw new Error('Video upload failed: ' + error.message)
      video_upload_path = path
    }

    // Submit to API
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Required by existing API / DB schema
        title: `Voice Story — ${form.author_name}`,
        excerpt: 'Voice submission — pending transcription.',
        body: '[Voice recording — pending transcription]',
        category: 'extreme_weather', // default; admin can update during review
        cover_image_url,
        video_upload_path,
        audio_upload_path,
        latitude: form.latitude,
        longitude: form.longitude,
        location_name: form.location_name,
        country_code: form.country_code.toUpperCase(),
        country_name: form.country_name,
        author_name: form.author_name.trim(),
        author_email: form.author_email.trim(),
        age_range: form.age_range || null,
        tags: ['voice-submission'],
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || `Server error ${res.status}`)
    }

    return null
  } catch (e: any) {
    return e.message ?? 'Something went wrong. Please try again.'
  }
}

// ─── Success ──────────────────────────────────────────────────
function SuccessScreen() {
  return (
    <div className="min-h-screen bg-ink-950 flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-nature-900 border border-nature-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={36} className="text-nature-400" />
          </div>
          <h1 className="font-display text-3xl text-ink-50 mb-4">Story Received!</h1>
          <p className="text-ink-400 leading-relaxed mb-8">
            Thank you for sharing your voice. Our editors will listen to your recording,
            transcribe it, and reach out within 5–10 business days.
          </p>
          <Link
            href="/"
            className="inline-block bg-brand-500 hover:bg-brand-400 text-white font-semibold font-mono text-xs uppercase tracking-wider px-8 py-3 rounded-lg transition-colors"
          >
            Back to the Map
          </Link>
        </div>
      </div>
    </div>
  )
}
