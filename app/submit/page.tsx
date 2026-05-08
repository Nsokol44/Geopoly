'use client'
// app/submit/page.tsx — Elder-friendly voice submission (multilingual + on-behalf-of)

import { useState, useRef } from 'react'
import { Mic, MicOff, MapPin, Upload, CheckCircle, Loader2, AlertCircle, X, User } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { reverseGeocode } from '@/lib/utils'
import { SiteHeader } from '@/components/ui/SiteHeader'
import { SiteFooter } from '@/components/ui/SiteFooter'
import Link from 'next/link'

// ── Translations ─────────────────────────────────────────────
const T = {
  en: {
    pageTitle: 'Share Your Story',
    step1Title: 'Step 1: Record Your Story',
    step1Desc: 'Press the big button below and speak your story out loud.',
    step1Sub: 'Tell us what you have seen or experienced with climate change in your community. Speak as long as you need — there is no time limit.',
    tapRecord: 'Tap to Record',
    tapStop: 'Tap to Stop',
    recording: 'Recording…',
    tapAgain: 'Tap the button again when you are done speaking.',
    tapBegin: '👆 Tap the button to begin speaking',
    saved: '✅ Your recording is saved!',
    listenBack: 'Press play below to hear your recording.',
    reRecord: 'Not happy with it? Record again',
    nextStep: 'Next Step →',
    recordFirst: '👆 Please record your story first, then tap Next Step.',
    step2Title: 'Step 2: About You',
    almostDone: 'Almost done! We just need a few details.',
    required: 'Fields marked with * are required. Everything else is optional.',
    nameLabel: 'Your Name *',
    nameDesc: 'Enter your first and last name.',
    namePlaceholder: 'Full name',
    emailLabel: 'Email Address *',
    emailDesc: 'We will contact you here. Your email will never be shown publicly.',
    ageLabel: 'Your Age Range',
    ageDesc: 'This helps us understand who is sharing stories. You do not have to answer.',
    agePlaceholder: 'Select your age range…',
    onBehalfLabel: 'Submitting for someone else?',
    onBehalfDesc: "If you are helping someone else submit their story, enter their name here. Leave blank if this is your own story.",
    onBehalfPlaceholder: "Elder's name (optional)",
    locationLabel: 'Your Location *',
    locationDesc: 'Tap the button below and your phone will detect where you are automatically.',
    locating: 'Detecting location…',
    locationBtn: 'Use My Current Location',
    clearLocation: 'Clear location',
    photoLabel: 'Photo',
    photoOptional: '— optional',
    photoDesc: 'You can add a photo from your phone if you have one. This is not required.',
    addPhoto: 'Add a Photo',
    videoLabel: 'Video',
    videoDesc: 'You can also add a video from your phone. This is not required.',
    addVideo: 'Add a Video',
    back: '← Go Back',
    submit: '✅ Submit My Story',
    submitting: 'Submitting…',
    fillRequired: 'Please fill in your name, email, and location above.',
    successTitle: 'Story Received!',
    successMsg: 'Thank you for sharing your voice. Our editors will listen to your recording, transcribe it, and be in touch within 5–10 business days.',
    statusPrompt: 'Want to check your status later?',
    statusDesc: 'You can look up your story at any time using your email address:',
    backMap: 'Back to the Map',
    micDenied: 'Microphone access denied. Please allow microphone and try again.',
    locationFail: 'Could not detect location. Please try again.',
    locationNoSupport: 'Location not available on this device.',
  },
  es: {
    pageTitle: 'Comparte tu Historia',
    step1Title: 'Paso 1: Graba tu Historia',
    step1Desc: 'Presiona el botón grande y habla tu historia en voz alta.',
    step1Sub: 'Cuéntanos lo que has visto o experimentado con el cambio climático en tu comunidad. Habla todo el tiempo que necesites.',
    tapRecord: 'Toca para Grabar',
    tapStop: 'Toca para Detener',
    recording: 'Grabando…',
    tapAgain: 'Toca el botón de nuevo cuando termines de hablar.',
    tapBegin: '👆 Toca el botón para comenzar a hablar',
    saved: '✅ ¡Tu grabación está guardada!',
    listenBack: 'Presiona reproducir para escuchar tu grabación.',
    reRecord: '¿No estás satisfecho? Graba de nuevo',
    nextStep: 'Siguiente Paso →',
    recordFirst: '👆 Por favor graba tu historia primero.',
    step2Title: 'Paso 2: Sobre Ti',
    almostDone: '¡Casi listo! Solo necesitamos algunos detalles.',
    required: 'Los campos marcados con * son obligatorios.',
    nameLabel: 'Tu Nombre *',
    nameDesc: 'Ingresa tu nombre y apellido.',
    namePlaceholder: 'Nombre completo',
    emailLabel: 'Correo Electrónico *',
    emailDesc: 'Te contactaremos aquí. Tu correo nunca será publicado.',
    ageLabel: 'Tu Rango de Edad',
    ageDesc: 'Esto nos ayuda a entender quién comparte historias. No es obligatorio.',
    agePlaceholder: 'Selecciona tu rango de edad…',
    onBehalfLabel: '¿Enviando por otra persona?',
    onBehalfDesc: 'Si ayudas a alguien más, ingresa su nombre aquí.',
    onBehalfPlaceholder: 'Nombre de la persona (opcional)',
    locationLabel: 'Tu Ubicación *',
    locationDesc: 'Toca el botón para detectar tu ubicación automáticamente.',
    locating: 'Detectando ubicación…',
    locationBtn: 'Usar Mi Ubicación Actual',
    clearLocation: 'Borrar ubicación',
    photoLabel: 'Foto',
    photoOptional: '— opcional',
    photoDesc: 'Puedes agregar una foto si tienes una. No es obligatorio.',
    addPhoto: 'Agregar Foto',
    videoLabel: 'Video',
    videoDesc: 'También puedes agregar un video. No es obligatorio.',
    addVideo: 'Agregar Video',
    back: '← Volver',
    submit: '✅ Enviar mi Historia',
    submitting: 'Enviando…',
    fillRequired: 'Por favor completa nombre, correo y ubicación.',
    successTitle: '¡Historia Recibida!',
    successMsg: 'Gracias por compartir tu voz. Nuestros editores escucharán tu grabación y te contactarán en 5–10 días hábiles.',
    statusPrompt: '¿Quieres verificar tu estado más tarde?',
    statusDesc: 'Puedes consultar tu historia en cualquier momento con tu correo:',
    backMap: 'Volver al Mapa',
    micDenied: 'Acceso al micrófono denegado. Por favor permite el micrófono e intenta de nuevo.',
    locationFail: 'No se pudo detectar la ubicación. Intenta de nuevo.',
    locationNoSupport: 'Ubicación no disponible en este dispositivo.',
  },
  fr: {
    pageTitle: 'Partagez votre Histoire',
    step1Title: 'Étape 1 : Enregistrez votre Histoire',
    step1Desc: 'Appuyez sur le grand bouton et parlez à voix haute.',
    step1Sub: 'Dites-nous ce que vous avez vu ou vécu avec le changement climatique dans votre communauté.',
    tapRecord: 'Appuyez pour Enregistrer',
    tapStop: 'Appuyez pour Arrêter',
    recording: 'Enregistrement…',
    tapAgain: 'Appuyez à nouveau sur le bouton quand vous avez fini.',
    tapBegin: '👆 Appuyez sur le bouton pour commencer',
    saved: '✅ Votre enregistrement est sauvegardé !',
    listenBack: 'Appuyez sur lecture pour entendre votre enregistrement.',
    reRecord: 'Pas satisfait ? Enregistrer à nouveau',
    nextStep: 'Étape Suivante →',
    recordFirst: '👆 Veuillez d\'abord enregistrer votre histoire.',
    step2Title: 'Étape 2 : À Propos de Vous',
    almostDone: 'Presque terminé ! Nous avons juste besoin de quelques détails.',
    required: 'Les champs marqués * sont obligatoires.',
    nameLabel: 'Votre Nom *',
    nameDesc: 'Entrez votre prénom et nom de famille.',
    namePlaceholder: 'Nom complet',
    emailLabel: 'Adresse E-mail *',
    emailDesc: 'Nous vous contacterons ici. Votre e-mail ne sera jamais publié.',
    ageLabel: 'Votre Tranche d\'Âge',
    ageDesc: 'Cela nous aide à comprendre qui partage des histoires. Ce n\'est pas obligatoire.',
    agePlaceholder: 'Sélectionnez votre tranche d\'âge…',
    onBehalfLabel: 'Vous soumettez pour quelqu\'un d\'autre ?',
    onBehalfDesc: 'Si vous aidez quelqu\'un d\'autre, entrez son nom ici.',
    onBehalfPlaceholder: 'Nom de la personne (optionnel)',
    locationLabel: 'Votre Emplacement *',
    locationDesc: 'Appuyez sur le bouton pour détecter automatiquement votre position.',
    locating: 'Détection de l\'emplacement…',
    locationBtn: 'Utiliser Ma Position Actuelle',
    clearLocation: 'Effacer l\'emplacement',
    photoLabel: 'Photo',
    photoOptional: '— optionnel',
    photoDesc: 'Vous pouvez ajouter une photo si vous en avez une. Ce n\'est pas obligatoire.',
    addPhoto: 'Ajouter une Photo',
    videoLabel: 'Vidéo',
    videoDesc: 'Vous pouvez également ajouter une vidéo. Ce n\'est pas obligatoire.',
    addVideo: 'Ajouter une Vidéo',
    back: '← Retour',
    submit: '✅ Soumettre mon Histoire',
    submitting: 'Soumission…',
    fillRequired: 'Veuillez remplir votre nom, e-mail et emplacement.',
    successTitle: 'Histoire Reçue !',
    successMsg: 'Merci de partager votre voix. Nos éditeurs écouteront votre enregistrement et vous contacteront dans 5–10 jours ouvrables.',
    statusPrompt: 'Vous voulez vérifier votre statut plus tard ?',
    statusDesc: 'Vous pouvez consulter votre histoire à tout moment avec votre e-mail :',
    backMap: 'Retour à la Carte',
    micDenied: 'Accès au microphone refusé. Veuillez autoriser le microphone et réessayer.',
    locationFail: 'Impossible de détecter l\'emplacement. Veuillez réessayer.',
    locationNoSupport: 'Localisation non disponible sur cet appareil.',
  },
}

type Lang = keyof typeof T
type Stage = 'record' | 'details' | 'submitting' | 'success'

const AGE_RANGES = ['Under 18', '18–24', '25–34', '35–44', '45–54', '55–64', '65–74', '75 or older', 'Prefer not to say']

interface VoiceForm {
  audioBlob: Blob | null
  audioUrl: string | null
  audioDuration: number
  audioMime: string
  author_name: string
  author_email: string
  age_range: string
  submitted_for: string
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
  author_name: '', author_email: '', age_range: '', submitted_for: '',
  latitude: null, longitude: null, location_name: '', country_code: '', country_name: '',
  cover_image_file: null, cover_image_preview: null, video_file: null,
}

// ── Detect language from SiteHeader localStorage pref ────────
function useLang(): Lang {
  const [lang, setLang] = useState<Lang>('en')
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('geopoly_lang') as Lang
      if (saved && T[saved]) setLang(saved)
    }
  }, [])
  return lang
}

// ── Main Component ────────────────────────────────────────────
export default function SubmitPage() {
  const lang = useLang()
  const t = T[lang]
  const [stage, setStage] = useState<Stage>('record')
  const [form, setForm] = useState<VoiceForm>(EMPTY)
  const [errorMsg, setErrorMsg] = useState('')

  const update = (p: Partial<VoiceForm>) => setForm(f => ({ ...f, ...p }))

  if (stage === 'success') return <SuccessScreen t={t} />

  return (
    <div className="min-h-screen bg-ink-950 flex flex-col">
      <SiteHeader />
      <main className="flex-1 pt-16">
        <div className="max-w-lg mx-auto px-5 py-12">
          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl text-ink-50 mb-2">{t.pageTitle}</h1>
          </div>

          {/* 2-step indicator */}
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
                  {s === 'record' ? (lang === 'fr' ? 'Enreg.' : lang === 'es' ? 'Grabar' : 'Record') : (lang === 'fr' ? 'Détails' : lang === 'es' ? 'Detalles' : 'Details')}
                </span>
                {i === 0 && <div className="w-8 h-px bg-ink-700" />}
              </div>
            ))}
          </div>

          <div className="bg-ink-900 border border-ink-800 rounded-lg p-6 md:p-8">
            {stage === 'record' && (
              <StageRecord form={form} update={update} t={t} onNext={() => setStage('details')} />
            )}
            {(stage === 'details' || stage === 'submitting') && (
              <StageDetails
                form={form} update={update} t={t}
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

// ── Stage 1: Record ───────────────────────────────────────────
function StageRecord({ form, update, t, onNext }: { form: VoiceForm; update: any; t: typeof T['en']; onNext: () => void }) {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : ''
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
      alert(t.micDenied)
    }
  }

  const stopRecording = () => {
    mediaRef.current?.stop()
    if (timerRef.current) clearInterval(timerRef.current)
    setRecording(false)
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="text-center">
      <h2 className="font-display text-3xl text-ink-50 mb-3">{t.step1Title}</h2>
      <p className="text-ink-300 text-base mb-2">{t.step1Desc}</p>
      <p className="text-ink-400 text-sm mb-8 leading-relaxed">{t.step1Sub}</p>

      {!form.audioUrl ? (
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`w-40 h-40 rounded-full flex flex-col items-center justify-center gap-3 transition-all shadow-xl
              ${recording ? 'bg-red-600 hover:bg-red-500 animate-pulse scale-110' : 'bg-brand-600 hover:bg-brand-500 active:scale-95'}`}
          >
            {recording ? <MicOff size={48} className="text-white" /> : <Mic size={48} className="text-white" />}
            <span className="text-white text-sm font-bold uppercase tracking-wider">
              {recording ? t.tapStop : t.tapRecord}
            </span>
          </button>
          {recording && (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 text-base font-bold">{t.recording}</span>
              </div>
              <span className="font-mono text-red-300 text-2xl tabular-nums">{fmt(seconds)}</span>
              <p className="text-ink-500 text-sm mt-1">{t.tapAgain}</p>
            </div>
          )}
          {!recording && <p className="text-ink-400 text-base">{t.tapBegin}</p>}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-nature-900 border-2 border-nature-600 flex items-center justify-center">
            <Mic size={36} className="text-nature-400" />
          </div>
          <p className="text-nature-400 text-base font-bold">{t.saved} ({fmt(form.audioDuration)})</p>
          <p className="text-ink-400 text-sm">{t.listenBack}</p>
          <audio controls src={form.audioUrl} className="w-full max-w-xs rounded-lg" />
          <button
            onClick={() => update({ audioBlob: null, audioUrl: null, audioDuration: 0 })}
            className="flex items-center gap-2 text-ink-400 hover:text-ink-200 text-sm border border-ink-700 hover:border-ink-500 rounded-lg px-5 py-2.5"
          >
            <X size={14} /> {t.reRecord}
          </button>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-ink-800">
        <button
          onClick={onNext}
          disabled={!form.audioUrl}
          className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-bold text-lg py-5 rounded-lg transition-colors"
        >
          {t.nextStep}
        </button>
        {!form.audioUrl && <p className="text-ink-500 text-sm mt-3">{t.recordFirst}</p>}
      </div>
    </div>
  )
}

// ── Stage 2: Details ──────────────────────────────────────────
function StageDetails({ form, update, t, submitting, errorMsg, onBack, onSubmit }: {
  form: VoiceForm; update: any; t: typeof T['en']
  submitting: boolean; errorMsg: string; onBack: () => void; onSubmit: () => void
}) {
  const [locating, setLocating] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  const locate = () => {
    if (!navigator.geolocation) return alert(t.locationNoSupport)
    setLocating(true)
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude, longitude } = pos.coords
      const geo = await reverseGeocode(latitude, longitude)
      update({ latitude, longitude, location_name: geo?.location_name ?? '', country_code: geo?.country_code ?? '', country_name: geo?.country_name ?? '' })
      setLocating(false)
    }, () => { setLocating(false); alert(t.locationFail) })
  }

  const canSubmit = !!(form.author_name.trim() && form.author_email.trim() && form.latitude && form.longitude)

  const inputCls = "w-full bg-ink-950 border border-ink-700 focus:border-brand-600 rounded-lg px-4 py-4 text-base text-ink-200 placeholder:text-ink-700 outline-none transition-colors"

  return (
    <div>
      <h2 className="font-display text-3xl text-ink-50 mb-2">{t.step2Title}</h2>
      <p className="text-ink-300 text-base mb-1">{t.almostDone}</p>
      <p className="text-ink-400 text-sm mb-6">{t.required}</p>

      {/* Name */}
      <div className="mb-6">
        <label className="block text-base font-bold text-ink-200 mb-1">{t.nameLabel}</label>
        <p className="text-ink-500 text-sm mb-2">{t.nameDesc}</p>
        <input type="text" value={form.author_name} onChange={e => update({ author_name: e.target.value })} placeholder={t.namePlaceholder} className={inputCls} />
      </div>

      {/* Email */}
      <div className="mb-6">
        <label className="block text-base font-bold text-ink-200 mb-1">{t.emailLabel}</label>
        <p className="text-ink-500 text-sm mb-2">{t.emailDesc}</p>
        <input type="email" value={form.author_email} onChange={e => update({ author_email: e.target.value })} placeholder="you@example.com" className={inputCls} />
      </div>

      {/* Age range */}
      <div className="mb-6">
        <label className="block text-base font-bold text-ink-200 mb-1">{t.ageLabel} <span className="text-ink-500 font-normal text-sm">{t.photoOptional}</span></label>
        <p className="text-ink-500 text-sm mb-2">{t.ageDesc}</p>
        <select value={form.age_range} onChange={e => update({ age_range: e.target.value })} className={inputCls}>
          <option value="">{t.agePlaceholder}</option>
          {AGE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* On behalf of */}
      <div className="mb-6">
        <label className="block text-base font-bold text-ink-200 mb-1">
          <User size={14} className="inline mr-1" />{t.onBehalfLabel} <span className="text-ink-500 font-normal text-sm">{t.photoOptional}</span>
        </label>
        <p className="text-ink-500 text-sm mb-2">{t.onBehalfDesc}</p>
        <input type="text" value={form.submitted_for} onChange={e => update({ submitted_for: e.target.value })} placeholder={t.onBehalfPlaceholder} className={inputCls} />
      </div>

      {/* Location */}
      <div className="mb-6">
        <label className="block text-base font-bold text-ink-200 mb-1">{t.locationLabel}</label>
        <p className="text-ink-500 text-sm mb-3">{t.locationDesc}</p>
        <button
          onClick={locate}
          disabled={locating}
          className={`w-full flex items-center justify-center gap-3 py-4 rounded-lg border font-bold text-base transition-colors
            ${form.latitude ? 'bg-nature-900 border-nature-700 text-nature-300' : 'bg-ink-800 hover:bg-ink-700 border-ink-700 text-ink-200'}`}
        >
          <MapPin size={18} className={locating ? 'animate-bounce' : ''} />
          {locating ? t.locating : form.latitude ? `📍 ${form.location_name || `${form.latitude.toFixed(2)}, ${form.longitude?.toFixed(2)}`}` : t.locationBtn}
        </button>
        {form.latitude && (
          <button onClick={() => update({ latitude: null, longitude: null, location_name: '', country_code: '', country_name: '' })}
            className="text-ink-600 hover:text-ink-400 text-xs font-mono mt-1.5 transition-colors">
            {t.clearLocation}
          </button>
        )}
      </div>

      {/* Photo */}
      <div className="mb-6">
        <label className="block text-base font-bold text-ink-200 mb-1">{t.photoLabel} <span className="text-ink-500 font-normal text-sm">{t.photoOptional}</span></label>
        <p className="text-ink-500 text-sm mb-3">{t.photoDesc}</p>
        {form.cover_image_preview ? (
          <div className="relative">
            <img src={form.cover_image_preview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
            <button onClick={() => update({ cover_image_file: null, cover_image_preview: null })}
              className="absolute top-2 right-2 bg-ink-900/80 text-ink-300 rounded-full p-1 hover:bg-ink-800"><X size={14} /></button>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-lg border border-dashed border-ink-700 hover:border-ink-500 text-ink-500 hover:text-ink-300 text-sm transition-colors">
            <Upload size={18} /> {t.addPhoto}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) update({ cover_image_file: f, cover_image_preview: URL.createObjectURL(f) }) }} />
      </div>

      {/* Video */}
      <div className="mb-6">
        <label className="block text-base font-bold text-ink-200 mb-1">{t.videoLabel} <span className="text-ink-500 font-normal text-sm">{t.photoOptional}</span></label>
        <p className="text-ink-500 text-sm mb-3">{t.videoDesc}</p>
        {form.video_file ? (
          <div className="flex items-center gap-3 bg-ink-800 rounded-lg px-4 py-3">
            <span className="text-ink-300 text-sm flex-1 truncate">📹 {form.video_file.name}</span>
            <button onClick={() => update({ video_file: null })} className="text-ink-500 hover:text-ink-300"><X size={14} /></button>
          </div>
        ) : (
          <button onClick={() => videoRef.current?.click()}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-lg border border-dashed border-ink-700 hover:border-ink-500 text-ink-500 hover:text-ink-300 text-sm transition-colors">
            <Upload size={18} /> {t.addVideo}
          </button>
        )}
        <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden"
          onChange={e => update({ video_file: e.target.files?.[0] ?? null })} />
      </div>

      {errorMsg && (
        <div className="mb-5 flex items-start gap-2 text-red-400 bg-red-950/30 border border-red-900 rounded-lg p-4 text-sm">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />{errorMsg}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-ink-800 gap-4">
        <button onClick={onBack} disabled={submitting}
          className="text-ink-400 hover:text-ink-200 text-sm border border-ink-700 hover:border-ink-500 rounded-lg px-5 py-3 transition-colors">
          {t.back}
        </button>
        <button onClick={onSubmit} disabled={!canSubmit || submitting}
          className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-bold text-lg py-4 rounded-lg transition-colors">
          {submitting && <Loader2 size={18} className="animate-spin" />}
          {submitting ? t.submitting : t.submit}
        </button>
      </div>
      {!canSubmit && <p className="text-ink-500 text-sm text-right mt-2">{t.fillRequired}</p>}
    </div>
  )
}

// ── Submit handler ────────────────────────────────────────────
async function handleSubmit(form: VoiceForm): Promise<string | null> {
  try {
    const supabase = createClient()
    let cover_image_url: string | null = null
    let video_upload_path: string | null = null
    let audio_upload_path: string | null = null

    if (form.audioBlob) {
      const mime = form.audioMime || 'audio/webm'
      const ext = mime.includes('mp4') ? 'mp4' : mime.includes('ogg') ? 'ogg' : 'webm'
      const path = `audio/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('story-media').upload(path, form.audioBlob, { contentType: mime, cacheControl: '3600', upsert: false })
      if (error) throw new Error('Audio upload failed: ' + error.message)
      audio_upload_path = path
    }

    if (form.cover_image_file) {
      const ext = form.cover_image_file.name.split('.').pop()
      const path = `covers/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('story-media').upload(path, form.cover_image_file, { cacheControl: '3600', upsert: false })
      if (error) throw new Error('Image upload failed: ' + error.message)
      const { data: { publicUrl } } = supabase.storage.from('story-media').getPublicUrl(path)
      cover_image_url = publicUrl
    }

    if (form.video_file) {
      const ext = form.video_file.name.split('.').pop()
      const path = `videos/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('story-media').upload(path, form.video_file, { cacheControl: '3600', upsert: false })
      if (error) throw new Error('Video upload failed: ' + error.message)
      video_upload_path = path
    }

    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Voice Story — ${form.author_name}`,
        excerpt: 'Voice submission — pending transcription.',
        body: '[Voice recording — pending transcription]',
        category: 'extreme_weather',
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
        submitted_for: form.submitted_for.trim() || null,
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

// ── Success ───────────────────────────────────────────────────
function SuccessScreen({ t }: { t: typeof T['en'] }) {
  return (
    <div className="min-h-screen bg-ink-950 flex flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center px-6 py-24">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-nature-900 border border-nature-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={36} className="text-nature-400" />
          </div>
          <h1 className="font-display text-3xl text-ink-50 mb-4">{t.successTitle}</h1>
          <p className="text-ink-400 leading-relaxed mb-6">{t.successMsg}</p>
          <div className="bg-ink-900 border border-ink-800 rounded-lg p-5 mb-6 text-left">
            <p className="text-ink-300 text-sm font-bold mb-2">📋 {t.statusPrompt}</p>
            <p className="text-ink-500 text-sm mb-3">{t.statusDesc}</p>
            <a href="/status" className="block bg-ink-800 hover:bg-ink-700 border border-ink-700 text-brand-400 text-sm font-mono px-4 py-3 rounded-lg transition-colors text-center">
              geopoly.xyz/status →
            </a>
          </div>
          <Link href="/" className="inline-block bg-brand-500 hover:bg-brand-400 text-white font-semibold font-mono text-xs uppercase tracking-wider px-8 py-3 rounded-lg transition-colors">
            {t.backMap}
          </Link>
        </div>
      </div>
    </div>
  )
}
