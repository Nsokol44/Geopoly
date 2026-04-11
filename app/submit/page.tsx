import Link from 'next/link'
'use client'
// app/submit/page.tsx
import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { MapPin, Upload, Link2, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { reverseGeocode, CATEGORY_LABELS, cn } from '@/lib/utils'
import { SiteHeader } from '@/components/ui/SiteHeader'
import { SiteFooter } from '@/components/ui/SiteFooter'
import type { StoryCategory, StorySubmission } from '@/types'
import dynamic from 'next/dynamic'

// Load the location picker map only on client
const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), { ssr: false })

type Step = 'story' | 'media' | 'location' | 'author' | 'review'
const STEPS: Step[] = ['story', 'media', 'location', 'author', 'review']
const STEP_LABELS: Record<Step, string> = {
  story: 'Your Story',
  media: 'Media',
  location: 'Location',
  author: 'About You',
  review: 'Review & Submit',
}

const CATEGORIES = ['energy_transition', 'nature_land', 'built_human', 'extreme_weather'] as const

interface FormData {
  title: string
  excerpt: string
  body: string
  category: StoryCategory | ''
  tags: string
  cover_image_file: File | null
  cover_image_preview: string | null
  video_url: string
  video_file: File | null
  latitude: number | null
  longitude: number | null
  location_name: string
  country_code: string
  country_name: string
  author_name: string
  author_email: string
  author_bio: string
}

const EMPTY_FORM: FormData = {
  title: '', excerpt: '', body: '', category: '', tags: '',
  cover_image_file: null, cover_image_preview: null,
  video_url: '', video_file: null,
  latitude: null, longitude: null,
  location_name: '', country_code: '', country_name: '',
  author_name: '', author_email: '', author_bio: '',
}

export default function SubmitPage() {
  const [step, setStep] = useState<Step>('story')
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentIndex = STEPS.indexOf(step)

  const update = (partial: Partial<FormData>) =>
    setForm(f => ({ ...f, ...partial }))

  // Cover image drop
  const onDrop = useCallback((files: File[]) => {
    const file = files[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    update({ cover_image_file: file, cover_image_preview: preview })
  }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxSize: 10 * 1024 * 1024, maxFiles: 1,
  })

  // Geolocation
  const [locating, setLocating] = useState(false)
  const locate = () => {
    if (!navigator.geolocation) return
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
    }, () => setLocating(false))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const supabase = createClient()
      let cover_image_url: string | null = null
      let video_upload_path: string | null = null

      // Upload cover image
      if (form.cover_image_file) {
        const ext = form.cover_image_file.name.split('.').pop()
        const path = `covers/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('story-media')
          .upload(path, form.cover_image_file, { cacheControl: '3600', upsert: false })
        if (upErr) throw new Error('Image upload failed: ' + upErr.message)
        const { data: { publicUrl } } = supabase.storage.from('story-media').getPublicUrl(path)
        cover_image_url = publicUrl
      }

      // Upload video file
      if (form.video_file) {
        const ext = form.video_file.name.split('.').pop()
        const path = `videos/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('story-media')
          .upload(path, form.video_file, { cacheControl: '3600', upsert: false })
        if (upErr) throw new Error('Video upload failed: ' + upErr.message)
        video_upload_path = path
      }

      // Submit to API
      const payload: StorySubmission = {
        title: form.title.trim(),
        excerpt: form.excerpt.trim(),
        body: form.body.trim(),
        category: form.category as StoryCategory,
        cover_image_url,
        video_url: form.video_url.trim() || undefined,
        video_upload_path,
        latitude: form.latitude!,
        longitude: form.longitude!,
        location_name: form.location_name.trim(),
        country_code: form.country_code.trim().toUpperCase(),
        country_name: form.country_name.trim(),
        author_name: form.author_name.trim(),
        author_email: form.author_email.trim(),
        author_bio: form.author_bio.trim() || undefined,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      }

      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Submission failed')

      setSubmitted(true)
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) return <SuccessScreen />

  return (
    <div className="min-h-screen bg-ink-950">
      <SiteHeader />
      <main className="pt-16">
        <div className="max-w-2xl mx-auto px-6 py-16">
          {/* Page header */}
          <div className="mb-10">
            <p className="font-mono text-xs tracking-[0.3em] text-brand-400 uppercase mb-3">
              Share Your Story
            </p>
            <h1 className="font-display text-4xl text-ink-50 mb-3">
              Add Your Voice to the Atlas
            </h1>
            <p className="text-ink-400 leading-relaxed">
              Your story will be reviewed by our editors and, if approved, plotted on the
              world map as part of a global collection of climate voices.
            </p>
          </div>

          {/* Step progress */}
          <div className="flex items-center gap-0 mb-10">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <button
                  onClick={() => i < currentIndex && setStep(s)}
                  disabled={i > currentIndex}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-colors flex-shrink-0',
                    i < currentIndex && 'bg-brand-600 text-ink-50 cursor-pointer hover:bg-brand-500',
                    i === currentIndex && 'bg-brand-500 text-white',
                    i > currentIndex && 'bg-ink-800 text-ink-600',
                  )}
                >
                  {i < currentIndex ? '✓' : i + 1}
                </button>
                <span className={cn(
                  'hidden sm:block ml-2 text-xs font-mono mr-4',
                  i === currentIndex ? 'text-ink-200' : 'text-ink-600'
                )}>
                  {STEP_LABELS[s]}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    'flex-1 h-px mx-2',
                    i < currentIndex ? 'bg-brand-700' : 'bg-ink-800'
                  )} />
                )}
              </div>
            ))}
          </div>

          {/* Step panels */}
          <div className="bg-ink-900 border border-ink-800 rounded-sm p-8">

            {/* ── Step 1: Story ── */}
            {step === 'story' && (
              <StepStory form={form} update={update} />
            )}

            {/* ── Step 2: Media ── */}
            {step === 'media' && (
              <StepMedia
                form={form} update={update}
                getRootProps={getRootProps} getInputProps={getInputProps}
                isDragActive={isDragActive}
              />
            )}

            {/* ── Step 3: Location ── */}
            {step === 'location' && (
              <StepLocation form={form} update={update} locating={locating} locate={locate} />
            )}

            {/* ── Step 4: Author ── */}
            {step === 'author' && (
              <StepAuthor form={form} update={update} />
            )}

            {/* ── Step 5: Review ── */}
            {step === 'review' && (
              <StepReview form={form} />
            )}

            {/* Navigation */}
            {error && (
              <div className="mt-6 flex items-start gap-2 text-red-400 bg-red-950/30 border border-red-900 rounded-sm p-4 text-sm">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-ink-800">
              <button
                onClick={() => setStep(STEPS[currentIndex - 1])}
                disabled={currentIndex === 0}
                className="font-mono text-xs uppercase tracking-wider text-ink-500 hover:text-ink-200 disabled:opacity-0 transition-colors"
              >
                ← Back
              </button>

              {step === 'review' ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 bg-brand-500 hover:bg-brand-400 disabled:opacity-60 text-white font-semibold font-mono text-sm uppercase tracking-wider px-8 py-3 transition-colors"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  {submitting ? 'Submitting…' : 'Submit Story'}
                </button>
              ) : (
                <button
                  onClick={() => setStep(STEPS[currentIndex + 1])}
                  disabled={!canAdvance(step, form)}
                  className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-ink-50 font-mono text-xs uppercase tracking-wider px-6 py-3 transition-colors"
                >
                  Continue →
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

// ── Validation ──────────────────────────────────────────────
function canAdvance(step: Step, form: FormData): boolean {
  if (step === 'story')    return !!(form.title.trim() && form.excerpt.trim() && form.body.trim() && form.category)
  if (step === 'media')    return true  // media is optional
  if (step === 'location') return !!(form.latitude && form.longitude && form.location_name && form.country_code)
  if (step === 'author')   return !!(form.author_name.trim() && form.author_email.trim())
  return true
}

// ── Sub-step components ─────────────────────────────────────
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-6">
      <label className="block font-mono text-xs tracking-[0.15em] uppercase text-ink-400 mb-2">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-ink-600 text-xs">{hint}</p>}
    </div>
  )
}

const inputCls = "w-full bg-ink-950 border border-ink-700 focus:border-brand-600 rounded-sm px-4 py-3 text-sm text-ink-200 placeholder:text-ink-700 outline-none transition-colors font-body"

function StepStory({ form, update }: { form: FormData; update: (p: Partial<FormData>) => void }) {
  return (
    <div>
      <h2 className="font-display text-2xl text-ink-50 mb-6">Tell your story</h2>
      <Field label="Category" hint="Choose the theme that best fits your story">
        <select value={form.category} onChange={e => update({ category: e.target.value as StoryCategory })} className={inputCls}>
          <option value="">Select a category…</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>
      </Field>
      <Field label="Story Title">
        <input type="text" value={form.title} onChange={e => update({ title: e.target.value })}
          placeholder="A compelling, specific title" className={inputCls} maxLength={120} />
      </Field>
      <Field label="Summary" hint="1–2 sentences that appear in previews and on the map popup">
        <textarea value={form.excerpt} onChange={e => update({ excerpt: e.target.value })}
          placeholder="A short, compelling summary of your story…" rows={3}
          className={inputCls + ' resize-none'} maxLength={280} />
        <p className="text-right text-ink-700 text-xs mt-1">{form.excerpt.length}/280</p>
      </Field>
      <Field label="Full Story" hint="Write in plain text. Use double line breaks for paragraphs.">
        <textarea value={form.body} onChange={e => update({ body: e.target.value })}
          placeholder="Tell the full story here…" rows={12}
          className={inputCls + ' resize-y'} />
      </Field>
      <Field label="Tags" hint="Comma-separated keywords, e.g. solar, adaptation, indigenous">
        <input type="text" value={form.tags} onChange={e => update({ tags: e.target.value })}
          placeholder="solar, adaptation, coastal, youth" className={inputCls} />
      </Field>
    </div>
  )
}

function StepMedia({ form, update, getRootProps, getInputProps, isDragActive }: any) {
  return (
    <div>
      <h2 className="font-display text-2xl text-ink-50 mb-2">Add media</h2>
      <p className="text-ink-500 text-sm mb-6">All media is optional but greatly increases engagement.</p>

      <Field label="Cover Image" hint="Max 10MB. Landscape orientation works best.">
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-colors',
            isDragActive ? 'border-brand-500 bg-brand-950/20' : 'border-ink-700 hover:border-ink-500'
          )}
        >
          <input {...getInputProps()} />
          {form.cover_image_preview ? (
            <div className="relative">
              <img src={form.cover_image_preview} alt="Preview" className="max-h-40 mx-auto rounded-sm object-cover" />
              <p className="text-ink-400 text-xs mt-3">Click or drag to replace</p>
            </div>
          ) : (
            <>
              <Upload size={24} className="mx-auto text-ink-600 mb-3" />
              <p className="text-ink-400 text-sm">Drag & drop an image, or click to browse</p>
            </>
          )}
        </div>
      </Field>

      <div className="border-t border-ink-800 pt-6 mb-6">
        <p className="font-mono text-xs tracking-[0.15em] uppercase text-ink-400 mb-4">Video</p>
        <div className="grid grid-cols-1 gap-4">
          <Field label="YouTube or Vimeo URL" hint="Paste a YouTube watch URL or Vimeo URL">
            <div className="relative">
              <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
              <input type="url" value={form.video_url} onChange={e => update({ video_url: e.target.value })}
                placeholder="https://youtube.com/watch?v=..." className={inputCls + ' pl-9'} />
            </div>
          </Field>
          <div className="text-center text-ink-600 font-mono text-xs">— or upload a video file —</div>
          <Field label="Upload Video" hint="MP4 or WebM. Max 200MB.">
            <input
              type="file" accept="video/mp4,video/webm"
              onChange={e => update({ video_file: e.target.files?.[0] ?? null })}
              className="w-full text-sm text-ink-400 file:bg-ink-800 file:border file:border-ink-700 file:text-ink-300 file:rounded-sm file:px-4 file:py-2 file:mr-4 file:text-xs file:font-mono file:cursor-pointer"
            />
            {form.video_file && <p className="text-ink-400 text-xs mt-2">📹 {form.video_file.name}</p>}
          </Field>
        </div>
      </div>
    </div>
  )
}

function StepLocation({ form, update, locating, locate }: any) {
  return (
    <div>
      <h2 className="font-display text-2xl text-ink-50 mb-2">Where is this story from?</h2>
      <p className="text-ink-500 text-sm mb-6">
        Every story must be geolocated to appear on the world map. Click a location on the map,
        use your current location, or enter coordinates manually.
      </p>

      {/* Auto-locate */}
      <button
        onClick={locate}
        disabled={locating}
        className="flex items-center gap-2 bg-ink-800 hover:bg-ink-700 border border-ink-700 hover:border-brand-700 text-ink-200 text-sm font-mono px-4 py-2.5 rounded-sm mb-6 transition-colors"
      >
        <MapPin size={14} className={locating ? 'animate-pulse text-brand-400' : ''} />
        {locating ? 'Detecting location…' : 'Use my current location'}
      </button>

      {/* Interactive map picker */}
      <div className="mb-6 rounded-sm overflow-hidden border border-ink-700" style={{ height: 280 }}>
        <LocationPicker
          lat={form.latitude}
          lng={form.longitude}
          onPick={async (lat: number, lng: number) => {
            const geo = await reverseGeocode(lat, lng)
            update({
              latitude: lat, longitude: lng,
              location_name: geo?.location_name ?? form.location_name,
              country_code: geo?.country_code ?? form.country_code,
              country_name: geo?.country_name ?? form.country_name,
            })
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Latitude">
          <input type="number" step="0.0001" value={form.latitude ?? ''} onChange={e => update({ latitude: parseFloat(e.target.value) })}
            placeholder="e.g. 23.8103" className={inputCls} />
        </Field>
        <Field label="Longitude">
          <input type="number" step="0.0001" value={form.longitude ?? ''} onChange={e => update({ longitude: parseFloat(e.target.value) })}
            placeholder="e.g. 90.4125" className={inputCls} />
        </Field>
      </div>
      <Field label="Place Name">
        <input type="text" value={form.location_name} onChange={e => update({ location_name: e.target.value })}
          placeholder="Dhaka, Bangladesh" className={inputCls} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Country Code" hint="ISO 3166 alpha-2, e.g. BD">
          <input type="text" value={form.country_code} onChange={e => update({ country_code: e.target.value.toUpperCase() })}
            placeholder="BD" maxLength={2} className={inputCls} />
        </Field>
        <Field label="Country Name">
          <input type="text" value={form.country_name} onChange={e => update({ country_name: e.target.value })}
            placeholder="Bangladesh" className={inputCls} />
        </Field>
      </div>
    </div>
  )
}

function StepAuthor({ form, update }: { form: FormData; update: (p: Partial<FormData>) => void }) {
  return (
    <div>
      <h2 className="font-display text-2xl text-ink-50 mb-6">About you</h2>
      <Field label="Your Name">
        <input type="text" value={form.author_name} onChange={e => update({ author_name: e.target.value })}
          placeholder="Full name" className={inputCls} />
      </Field>
      <Field label="Email Address" hint="For editorial communication only. Never published.">
        <input type="email" value={form.author_email} onChange={e => update({ author_email: e.target.value })}
          placeholder="you@example.com" className={inputCls} />
      </Field>
      <Field label="Short Bio" hint="Optional. Appears with your published story.">
        <textarea value={form.author_bio} onChange={e => update({ author_bio: e.target.value })}
          placeholder="Climate scientist, community organizer, or how you relate to this story…"
          rows={3} className={inputCls + ' resize-none'} maxLength={200} />
      </Field>
    </div>
  )
}

function StepReview({ form }: { form: FormData }) {
  const rows: [string, string][] = [
    ['Title', form.title],
    ['Category', CATEGORY_LABELS[form.category as StoryCategory] ?? '—'],
    ['Location', `${form.location_name} (${form.latitude?.toFixed(4)}, ${form.longitude?.toFixed(4)})`],
    ['Author', form.author_name],
    ['Email', form.author_email],
    ['Video URL', form.video_url || '—'],
    ['Uploaded Video', form.video_file?.name ?? '—'],
    ['Tags', form.tags || '—'],
  ]
  return (
    <div>
      <h2 className="font-display text-2xl text-ink-50 mb-2">Review your submission</h2>
      <p className="text-ink-500 text-sm mb-6">
        Your story will enter an editorial review queue. Approved stories are published to the world map.
        The review process typically takes 5–10 business days.
      </p>
      {form.cover_image_preview && (
        <img src={form.cover_image_preview} alt="Cover" className="w-full h-40 object-cover rounded-sm mb-6" />
      )}
      <dl className="space-y-3">
        {rows.map(([k, v]) => (
          <div key={k} className="flex gap-4 text-sm border-b border-ink-800 pb-3 last:border-0">
            <dt className="font-mono text-xs text-ink-500 uppercase tracking-wider w-32 flex-shrink-0 pt-0.5">{k}</dt>
            <dd className="text-ink-200 flex-1 break-all">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 bg-ink-800/50 rounded-sm p-4">
        <p className="text-ink-300 text-xs leading-relaxed">
          <strong className="text-ink-100">Excerpt:</strong> {form.excerpt}
        </p>
      </div>
    </div>
  )
}

function SuccessScreen() {
  return (
    <div className="min-h-screen bg-ink-950 flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-nature-900 border border-nature-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={28} className="text-nature-400" />
          </div>
          <h1 className="font-display text-3xl text-ink-50 mb-4">Story Submitted</h1>
          <p className="text-ink-400 leading-relaxed mb-8">
            Thank you. Your story has entered our editorial review queue.
            We&apos;ll be in touch via email within 5–10 business days.
          </p>
          <Link href="/" className="inline-block bg-brand-500 hover:bg-brand-400 text-white font-semibold font-mono text-xs uppercase tracking-wider px-8 py-3 transition-colors">
            Back to the Map
          </a>
        </div>
      </div>
    </div>
  )
}
