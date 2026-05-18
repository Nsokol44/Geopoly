'use client'
// app/submit/page.tsx

import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, MapPin, Upload, CheckCircle, Loader2, AlertCircle, X, User } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { reverseGeocode } from '@/lib/utils'
import { SiteHeader } from '@/components/ui/SiteHeader'
import { SiteFooter } from '@/components/ui/SiteFooter'
import { SuccessScreen } from './SuccessScreen'

// ── Types ─────────────────────────────────────────────────────
type Lang = 'en' | 'es' | 'fr'
type Stage = 'record' | 'category' | 'prompts' | 'details' | 'submitting' | 'success'
type Category = 'energy_transition' | 'nature_land' | 'built_human' | 'extreme_weather'

const AGE_RANGES = ['Under 18','18–24','25–34','35–44','45–54','55–64','65–74','75 or older','Prefer not to say']

interface VoiceForm {
  audioBlob: Blob | null; audioUrl: string | null; audioDuration: number; audioMime: string
  category: Category | null
  author_name: string; author_email: string; age_range: string; submitted_for: string
  latitude: number | null; longitude: number | null
  location_name: string; country_code: string; country_name: string
  cover_image_file: File | null; cover_image_preview: string | null; video_file: File | null
}

const EMPTY: VoiceForm = {
  audioBlob: null, audioUrl: null, audioDuration: 0, audioMime: '', category: null,
  author_name: '', author_email: '', age_range: '', submitted_for: '',
  latitude: null, longitude: null, location_name: '', country_code: '', country_name: '',
  cover_image_file: null, cover_image_preview: null, video_file: null,
}

// ── Guidance prompts per category + language ──────────────────
const PROMPTS: Record<Category, Record<Lang, string[]>> = {
  energy_transition: {
    en: [
      'What area of energy change are you discussing — solar, wind, coal, oil, electricity?',
      'How were things before — what energy sources did your home or community rely on?',
      'How are things different now? What changes have you seen?',
      'Do you think the energy changes have been good or difficult for your area?',
      'Where do you see energy in your community heading in the future?',
      'What are your fears about how energy is changing?',
      'Anything else you would like to share about energy in your life?',
    ],
    es: [
      '¿Qué área de cambio energético describes — solar, eólica, carbón, petróleo, electricidad?',
      '¿Cómo eran las cosas antes — de qué energía dependía tu hogar o comunidad?',
      '¿Cómo son las cosas ahora? ¿Qué cambios has visto?',
      '¿Crees que los cambios energéticos han sido buenos o difíciles para tu área?',
      '¿A dónde crees que va la energía en tu comunidad?',
      '¿Qué te preocupa de cómo está cambiando la energía?',
      '¿Algo más que quieras compartir sobre la energía en tu vida?',
    ],
    fr: [
      'De quel domaine du changement énergétique parlez-vous — solaire, éolien, charbon, pétrole ?',
      'Comment étaient les choses avant — de quelles sources d\'énergie dépendiez-vous ?',
      'Comment les choses sont-elles différentes maintenant ?',
      'Pensez-vous que les changements énergétiques ont été bénéfiques ou difficiles ?',
      'Où voyez-vous l\'énergie dans votre communauté à l\'avenir ?',
      'Quelles sont vos craintes concernant l\'évolution de l\'énergie ?',
      'Autre chose à partager sur l\'énergie dans votre vie ?',
    ],
  },
  nature_land: {
    en: [
      'What area of nature are you talking about — forests, rivers, oceans, wildlife, farming?',
      'How was the land or nature in your area before climate change affected it?',
      'How are things different now? What have you noticed changing?',
      'Do you think things have gotten better or worse for nature in your area?',
      'Where do you see the land or nature heading in the future?',
      'What are your fears about how nature or the land will change?',
      'Anything else you would like to share about nature and land in your life?',
    ],
    es: [
      '¿De qué área de la naturaleza hablas — bosques, ríos, océanos, vida silvestre, agricultura?',
      '¿Cómo era la naturaleza en tu área antes de que el cambio climático la afectara?',
      '¿Cómo son las cosas ahora? ¿Qué cambios has notado?',
      '¿Crees que las cosas han mejorado o empeorado para la naturaleza?',
      '¿A dónde crees que va la tierra o la naturaleza en el futuro?',
      '¿Qué te preocupa sobre cómo cambiará la naturaleza?',
      '¿Algo más que quieras compartir sobre la naturaleza y la tierra?',
    ],
    fr: [
      'De quel domaine de la nature parlez-vous — forêts, rivières, océans, faune, agriculture ?',
      'Comment était la nature dans votre région avant le changement climatique ?',
      'Comment les choses sont-elles différentes maintenant ?',
      'Pensez-vous que les choses se sont améliorées ou aggravées pour la nature ?',
      'Où voyez-vous la nature évoluer à l\'avenir ?',
      'Quelles sont vos craintes concernant l\'évolution de la nature ?',
      'Autre chose à partager sur la nature dans votre vie ?',
    ],
  },
  built_human: {
    en: [
      'How has climate change affected your home, neighborhood, or city?',
      'How were things before — what did your community look and feel like?',
      'How are things different now? Infrastructure, housing, daily life?',
      'Do you think your community has adapted well or struggled?',
      'What do you hope your community looks like in the future?',
      'What worries you most about how your community will handle climate change?',
      'Anything else you would like to share about your community and climate?',
    ],
    es: [
      '¿Cómo ha afectado el cambio climático a tu hogar, vecindario o ciudad?',
      '¿Cómo eran las cosas antes en tu comunidad?',
      '¿Cómo son las cosas ahora? ¿Infraestructura, vivienda, vida diaria?',
      '¿Crees que tu comunidad se ha adaptado bien o ha tenido dificultades?',
      '¿Cómo esperas que sea tu comunidad en el futuro?',
      '¿Qué te preocupa más sobre tu comunidad y el cambio climático?',
      '¿Algo más que quieras compartir?',
    ],
    fr: [
      'Comment le changement climatique a-t-il affecté votre maison ou quartier ?',
      'Comment étaient les choses avant dans votre communauté ?',
      'Comment les choses sont-elles différentes maintenant ?',
      'Pensez-vous que votre communauté s\'est bien adaptée ?',
      'Comment espérez-vous que votre communauté sera à l\'avenir ?',
      'Qu\'est-ce qui vous inquiète le plus pour votre communauté ?',
      'Autre chose à partager sur votre communauté et le climat ?',
    ],
  },
  extreme_weather: {
    en: [
      'What kind of extreme weather are you talking about — floods, drought, hurricanes, heat, fires?',
      'How was the weather in your area before — what was normal?',
      'How are things different now? What events have you lived through?',
      'Do you think extreme weather has gotten better or worse in your lifetime?',
      'Where do you see things heading in the future?',
      'What are your fears about future extreme weather events?',
      'Anything else you would like to share about weather and climate in your life?',
    ],
    es: [
      '¿De qué tipo de clima extremo hablas — inundaciones, sequía, huracanes, calor, incendios?',
      '¿Cómo era el clima en tu área antes? ¿Qué era normal?',
      '¿Cómo son las cosas ahora? ¿Qué eventos has vivido?',
      '¿Crees que el clima extremo ha empeorado en tu vida?',
      '¿A dónde crees que van las cosas en el futuro?',
      '¿Cuáles son tus temores sobre futuros eventos climáticos?',
      '¿Algo más que quieras compartir sobre el clima en tu vida?',
    ],
    fr: [
      'De quel type de météo extrême parlez-vous — inondations, sécheresse, ouragans, chaleur, incendies ?',
      'Comment était la météo dans votre région avant ?',
      'Comment les choses sont-elles différentes maintenant ?',
      'Pensez-vous que les conditions météo extrêmes ont empiré ?',
      'Où voyez-vous les choses évoluer à l\'avenir ?',
      'Quelles sont vos craintes pour les futurs événements météo ?',
      'Autre chose à partager sur la météo et le climat ?',
    ],
  },
}

// ── Category config ───────────────────────────────────────────
const CATEGORIES: Record<Category, { emoji: string; color: string; label: Record<Lang, string>; desc: Record<Lang, string> }> = {
  energy_transition: {
    emoji: '⚡', color: '#0b90e4',
    label: { en: 'Energy Transition', es: 'Transición Energética', fr: 'Transition Énergétique' },
    desc: { en: 'Solar, wind, coal, oil & energy changes', es: 'Solar, eólica, carbón, petróleo', fr: 'Solaire, éolien, charbon, pétrole' },
  },
  nature_land: {
    emoji: '🌿', color: '#22c55e',
    label: { en: 'Nature & Land', es: 'Naturaleza y Tierra', fr: 'Nature et Terres' },
    desc: { en: 'Forests, water, wildlife & farming', es: 'Bosques, agua, vida silvestre', fr: 'Forêts, eau, faune et agriculture' },
  },
  built_human: {
    emoji: '🏘️', color: '#38bdf8',
    label: { en: 'Built & Human Systems', es: 'Sistemas Humanos', fr: 'Systèmes Humains' },
    desc: { en: 'Homes, cities & communities', es: 'Hogares, ciudades y comunidades', fr: 'Maisons, villes et communautés' },
  },
  extreme_weather: {
    emoji: '🌪️', color: '#ef4444',
    label: { en: 'Extreme Weather', es: 'Clima Extremo', fr: 'Météo Extrême' },
    desc: { en: 'Floods, drought, fires & hurricanes', es: 'Inundaciones, sequía, incendios', fr: 'Inondations, sécheresse, incendies' },
  },
}

// ── Translations ──────────────────────────────────────────────
const T = {
  en: {
    pageTitle: 'Share Your Story',
    steps: ['Record', 'Topic', 'Prompts', 'Details'],
    step1Title: 'Step 1: Record Your Story',
    step1Desc: 'Press the big button below and speak your story out loud.',
    step1Sub: 'Speak as long as you need — there is no time limit.',
    tapRecord: 'Tap to Record', tapStop: 'Tap to Stop', recording: 'Recording…',
    tapAgain: 'Tap the button again when you are done speaking.',
    tapBegin: '👆 Tap the button to begin speaking',
    saved: '✅ Your recording is saved!', listenBack: 'Press play to hear your recording.',
    reRecord: 'Not happy with it? Record again', nextStep: 'Next Step →',
    recordFirst: '👆 Please record your story first, then tap Next Step.',
    step2Title: 'Step 2: What is your story about?', step2Desc: 'Choose the topic that best fits your story.',
    step3Title: 'Step 3: Guidance Prompts',
    step3Desc: 'These questions help you think about what to say. You do not need to answer all of them — they are just a guide.',
    step3Sub: 'When you are ready, you can re-record your story using these prompts as a guide.',
    reRecordBtn: '🎙 Re-record with these prompts in mind',
    step4Title: 'Step 4: About You', almostDone: 'Almost done! We just need a few details.',
    required: 'Fields marked with * are required. Everything else is optional.',
    nameLabel: 'Your Name *', nameDesc: 'Enter your first and last name.', namePlaceholder: 'Full name',
    emailLabel: 'Email Address', emailDesc: 'We will contact you here if needed. Never published.',
    ageLabel: 'Your Age Range', ageDesc: 'Optional — helps us understand who is sharing stories.', agePlaceholder: 'Select your age range…',
    onBehalfLabel: 'Submitting for someone else?', onBehalfDesc: 'If helping someone else, enter their name here.', onBehalfPlaceholder: "Elder's name (optional)",
    locationLabel: 'Your Location *', locationDesc: 'Tap below and your phone detects where you are automatically.',
    locating: 'Detecting location…', locationBtn: 'Use My Current Location', clearLocation: 'Clear location',
    photoLabel: 'Photo', photoOptional: '— optional', photoDesc: 'Add a photo if you have one. Not required.', addPhoto: 'Add a Photo',
    videoLabel: 'Video', videoDesc: 'Add a video if you have one. Not required.', addVideo: 'Add a Video',
    back: '← Go Back', submit: '✅ Submit My Story', submitting: 'Submitting…',
    fillRequired: 'Please fill in your name and location above.',
    micDenied: 'Microphone access denied. Please allow microphone and try again.',
    locationFail: 'Could not detect location. Please try again.', locationNoSupport: 'Location not available on this device.',
  },
  es: {
    pageTitle: 'Comparte tu Historia', steps: ['Grabar', 'Tema', 'Guía', 'Detalles'],
    step1Title: 'Paso 1: Graba tu Historia', step1Desc: 'Presiona el botón y habla en voz alta.',
    step1Sub: 'Habla todo el tiempo que necesites.',
    tapRecord: 'Toca para Grabar', tapStop: 'Toca para Detener', recording: 'Grabando…',
    tapAgain: 'Toca el botón de nuevo cuando termines.', tapBegin: '👆 Toca el botón para comenzar',
    saved: '✅ ¡Tu grabación está guardada!', listenBack: 'Presiona reproducir para escuchar.',
    reRecord: '¿No estás satisfecho? Graba de nuevo', nextStep: 'Siguiente Paso →',
    recordFirst: '👆 Por favor graba tu historia primero.',
    step2Title: 'Paso 2: ¿De qué trata tu historia?', step2Desc: 'Elige el tema que mejor describe tu historia.',
    step3Title: 'Paso 3: Preguntas Guía',
    step3Desc: 'Estas preguntas te ayudarán a pensar en qué decir. No necesitas responderlas todas.',
    step3Sub: 'Cuando estés listo, puedes re-grabar tu historia usando estas preguntas como guía.',
    reRecordBtn: '🎙 Re-grabar con estas preguntas en mente',
    step4Title: 'Paso 4: Sobre Ti', almostDone: '¡Casi listo! Solo necesitamos algunos detalles.',
    required: 'Los campos con * son obligatorios.',
    nameLabel: 'Tu Nombre *', nameDesc: 'Ingresa tu nombre completo.', namePlaceholder: 'Nombre completo',
    emailLabel: 'Correo Electrónico', emailDesc: 'Solo para contacto. Nunca publicado.',
    ageLabel: 'Tu Rango de Edad', ageDesc: 'Opcional.', agePlaceholder: 'Selecciona tu rango de edad…',
    onBehalfLabel: '¿Enviando por otra persona?', onBehalfDesc: 'Si ayudas a alguien, ingresa su nombre.', onBehalfPlaceholder: 'Nombre (opcional)',
    locationLabel: 'Tu Ubicación *', locationDesc: 'Toca para detectar tu ubicación automáticamente.',
    locating: 'Detectando…', locationBtn: 'Usar Mi Ubicación', clearLocation: 'Borrar',
    photoLabel: 'Foto', photoOptional: '— opcional', photoDesc: 'Agrega una foto si tienes.', addPhoto: 'Agregar Foto',
    videoLabel: 'Video', videoDesc: 'Agrega un video si tienes.', addVideo: 'Agregar Video',
    back: '← Volver', submit: '✅ Enviar mi Historia', submitting: 'Enviando…',
    fillRequired: 'Por favor completa nombre y ubicación.',
    micDenied: 'Acceso al micrófono denegado.', locationFail: 'No se pudo detectar la ubicación.', locationNoSupport: 'Ubicación no disponible.',
  },
  fr: {
    pageTitle: 'Partagez votre Histoire', steps: ['Enregistrer', 'Sujet', 'Guide', 'Détails'],
    step1Title: 'Étape 1 : Enregistrez votre Histoire', step1Desc: 'Appuyez sur le bouton et parlez à voix haute.',
    step1Sub: 'Parlez aussi longtemps que nécessaire.',
    tapRecord: 'Appuyez pour Enregistrer', tapStop: 'Appuyez pour Arrêter', recording: 'Enregistrement…',
    tapAgain: 'Appuyez à nouveau quand vous avez fini.', tapBegin: '👆 Appuyez pour commencer',
    saved: '✅ Votre enregistrement est sauvegardé !', listenBack: 'Appuyez sur lecture pour écouter.',
    reRecord: 'Pas satisfait ? Enregistrer à nouveau', nextStep: 'Étape Suivante →',
    recordFirst: "👆 Veuillez d'abord enregistrer.",
    step2Title: 'Étape 2 : De quoi parle votre histoire ?', step2Desc: 'Choisissez le sujet qui correspond le mieux.',
    step3Title: 'Étape 3 : Questions Guide',
    step3Desc: "Ces questions vous aident à réfléchir. Vous n'avez pas à toutes les répondre.",
    step3Sub: 'Quand vous êtes prêt, vous pouvez ré-enregistrer en utilisant ces questions comme guide.',
    reRecordBtn: '🎙 Ré-enregistrer avec ces questions',
    step4Title: 'Étape 4 : À Propos de Vous', almostDone: 'Presque terminé !',
    required: 'Les champs * sont obligatoires.',
    nameLabel: 'Votre Nom *', nameDesc: 'Entrez votre nom complet.', namePlaceholder: 'Nom complet',
    emailLabel: 'E-mail', emailDesc: 'Pour contact si nécessaire. Jamais publié.',
    ageLabel: 'Votre Âge', ageDesc: 'Optionnel.', agePlaceholder: 'Sélectionnez…',
    onBehalfLabel: 'Vous soumettez pour quelqu\'un d\'autre ?', onBehalfDesc: 'Si vous aidez quelqu\'un, entrez son nom.', onBehalfPlaceholder: 'Nom (optionnel)',
    locationLabel: 'Votre Emplacement *', locationDesc: 'Appuyez pour détecter votre position automatiquement.',
    locating: 'Détection…', locationBtn: 'Utiliser Ma Position', clearLocation: 'Effacer',
    photoLabel: 'Photo', photoOptional: '— optionnel', photoDesc: 'Ajoutez une photo si vous en avez.', addPhoto: 'Ajouter Photo',
    videoLabel: 'Vidéo', videoDesc: 'Ajoutez une vidéo si vous en avez.', addVideo: 'Ajouter Vidéo',
    back: '← Retour', submit: '✅ Soumettre mon Histoire', submitting: 'Soumission…',
    fillRequired: 'Veuillez remplir votre nom et emplacement.',
    micDenied: 'Accès micro refusé.', locationFail: 'Impossible de détecter la position.', locationNoSupport: 'Position non disponible.',
  },
}

// ── Main Component ────────────────────────────────────────────
export default function SubmitPage() {
  const [lang, setLang] = useState<Lang>('en')
  const [stage, setStage] = useState<Stage>('record')
  const [form, setForm] = useState<VoiceForm>(EMPTY)
  const [errorMsg, setErrorMsg] = useState('')
  const [successData, setSuccessData] = useState<{ authorName: string; locationName: string } | null>(null)

  // Sync language from localStorage every 500ms so it updates when header changes
  useEffect(() => {
    const sync = () => {
      const saved = localStorage.getItem('geopoly_lang') as Lang
      if (saved && ['en','es','fr'].includes(saved)) setLang(saved)
    }
    sync()
    const interval = setInterval(sync, 500)
    return () => clearInterval(interval)
  }, [])

  const t = T[lang]
  const update = (p: Partial<VoiceForm>) => setForm(f => ({ ...f, ...p }))

  if (stage === 'success' && successData) {
    return <SuccessScreen authorName={successData.authorName} locationName={successData.locationName} lang={lang} />
  }

  const STAGE_ORDER: Stage[] = ['record', 'category', 'prompts', 'details']
  const currentIdx = STAGE_ORDER.indexOf(stage as any)

  return (
    <div className="min-h-screen bg-ink-950 flex flex-col">
      <SiteHeader />
      <main className="flex-1 pt-16">
        <div className="max-w-lg mx-auto px-5 py-12">
          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl text-ink-50 mb-2">{t.pageTitle}</h1>
          </div>

          {/* 4-step progress indicator */}
          <div className="flex items-center justify-center gap-1 mb-8">
            {STAGE_ORDER.map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-colors
                  ${stage === s ? 'bg-brand-600 text-white' :
                    i < currentIdx ? 'bg-brand-900 text-brand-400' :
                    'bg-ink-800 text-ink-600'}`}>
                  <span className="font-bold">{i < currentIdx ? '✓' : i + 1}</span>
                  <span className="hidden sm:inline">{t.steps[i]}</span>
                </div>
                {i < STAGE_ORDER.length - 1 && <div className="w-3 h-px bg-ink-700 flex-shrink-0" />}
              </div>
            ))}
          </div>

          <div className="bg-ink-900 border border-ink-800 rounded-lg p-6 md:p-8">
            {stage === 'record' && (
              <StageRecord form={form} update={update} t={t} onNext={() => setStage('category')} />
            )}
            {stage === 'category' && (
              <StageCategory form={form} update={update} t={t} lang={lang}
                onBack={() => setStage('record')} onNext={() => setStage('prompts')} />
            )}
            {stage === 'prompts' && form.category && (
              <StagePrompts form={form} t={t} lang={lang}
                onBack={() => setStage('category')}
                onReRecord={() => setStage('record')}
                onNext={() => setStage('details')} />
            )}
            {(stage === 'details' || stage === 'submitting') && (
              <StageDetails form={form} update={update} t={t}
                submitting={stage === 'submitting'} errorMsg={errorMsg}
                onBack={() => setStage('prompts')}
                onSubmit={async () => {
                  setStage('submitting')
                  setErrorMsg('')
                  const err = await handleSubmit(form)
                  if (err) { setErrorMsg(err); setStage('details') }
                  else {
                    setSuccessData({ authorName: form.author_name, locationName: form.location_name })
                    setStage('success')
                  }
                }} />
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

// ── Stage 1: Record ───────────────────────────────────────────
function StageRecord({ form, update, t, onNext }: any) {
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
        stream.getTracks().forEach((tk: MediaStreamTrack) => tk.stop())
      }
      mr.start()
      mediaRef.current = mr
      setRecording(true)
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } catch { alert(t.micDenied) }
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
          <button onClick={recording ? stopRecording : startRecording}
            className={`w-40 h-40 rounded-full flex flex-col items-center justify-center gap-3 transition-all shadow-xl
              ${recording ? 'bg-red-600 animate-pulse scale-110' : 'bg-brand-600 hover:bg-brand-500 active:scale-95'}`}>
            {recording ? <MicOff size={48} className="text-white" /> : <Mic size={48} className="text-white" />}
            <span className="text-white text-sm font-bold uppercase tracking-wider">
              {recording ? t.tapStop : t.tapRecord}
            </span>
          </button>
          {recording && (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 font-bold">{t.recording}</span>
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
          <button onClick={() => update({ audioBlob: null, audioUrl: null, audioDuration: 0 })}
            className="flex items-center gap-2 text-ink-400 hover:text-ink-200 text-sm border border-ink-700 rounded-lg px-5 py-2.5">
            <X size={14} /> {t.reRecord}
          </button>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-ink-800">
        <button onClick={onNext} disabled={!form.audioUrl}
          className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-bold text-lg py-5 rounded-lg transition-colors">
          {t.nextStep}
        </button>
        {!form.audioUrl && <p className="text-ink-500 text-sm mt-3">{t.recordFirst}</p>}
      </div>
    </div>
  )
}

// ── Stage 2: Category picker ──────────────────────────────────
function StageCategory({ form, update, t, lang, onBack, onNext }: any) {
  const cats = Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]
  return (
    <div>
      <h2 className="font-display text-3xl text-ink-50 mb-2">{t.step2Title}</h2>
      <p className="text-ink-400 text-sm mb-6">{t.step2Desc}</p>
      <div className="grid grid-cols-1 gap-3 mb-8">
        {cats.map(([key, cfg]) => (
          <button key={key} onClick={() => update({ category: key })}
            className={`flex items-center gap-4 p-4 rounded-lg border text-left transition-all
              ${form.category === key ? 'border-2 scale-[1.01]' : 'border-ink-700 hover:border-ink-500 bg-ink-950/50'}`}
            style={form.category === key ? { borderColor: cfg.color, background: `${cfg.color}12` } : {}}>
            <span className="text-3xl">{cfg.emoji}</span>
            <div className="flex-1">
              <p className="font-bold text-ink-100 text-base" style={form.category === key ? { color: cfg.color } : {}}>
                {cfg.label[lang]}
              </p>
              <p className="text-ink-500 text-sm">{cfg.desc[lang]}</p>
            </div>
            {form.category === key && <CheckCircle size={20} className="flex-shrink-0" style={{ color: cfg.color }} />}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-ink-800">
        <button onClick={onBack} className="text-ink-400 hover:text-ink-200 text-sm border border-ink-700 rounded-lg px-5 py-3 transition-colors">
          {t.back}
        </button>
        <button onClick={onNext} disabled={!form.category}
          className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-bold text-lg py-4 rounded-lg transition-colors">
          {t.nextStep}
        </button>
      </div>
    </div>
  )
}

// ── Stage 3: Guided prompts ───────────────────────────────────
function StagePrompts({ form, t, lang, onBack, onReRecord, onNext }: any) {
  const prompts: string[] = form.category ? PROMPTS[form.category as Category][lang as Lang] : []
  const cfg = form.category ? CATEGORIES[form.category as Category] : null
  return (
    <div>
      <h2 className="font-display text-3xl text-ink-50 mb-2">{t.step3Title}</h2>
      <p className="text-ink-300 text-base mb-1">{t.step3Desc}</p>
      <p className="text-ink-400 text-sm mb-5 leading-relaxed">{t.step3Sub}</p>

      {cfg && (
        <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-lg border w-fit"
          style={{ borderColor: `${cfg.color}44`, background: `${cfg.color}10` }}>
          <span className="text-xl">{cfg.emoji}</span>
          <span className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.label[lang]}</span>
        </div>
      )}

      <div className="space-y-3 mb-6">
        {prompts.map((prompt, i) => (
          <div key={i} className="flex items-start gap-3 bg-ink-950 border border-ink-800 rounded-lg p-4">
            <span className="font-mono text-xs font-bold mt-0.5 flex-shrink-0 w-5"
              style={{ color: cfg?.color ?? '#0b90e4' }}>{i + 1}.</span>
            <p className="text-ink-200 text-sm leading-relaxed">{prompt}</p>
          </div>
        ))}
      </div>

      <button onClick={onReRecord}
        className="w-full flex items-center justify-center gap-2 bg-ink-800 hover:bg-ink-700 border border-ink-700 text-ink-200 font-bold text-sm py-4 rounded-lg transition-colors mb-4">
        {t.reRecordBtn}
      </button>

      <div className="flex items-center justify-between gap-4 pt-4 border-t border-ink-800">
        <button onClick={onBack} className="text-ink-400 hover:text-ink-200 text-sm border border-ink-700 rounded-lg px-5 py-3 transition-colors">
          {t.back}
        </button>
        <button onClick={onNext}
          className="flex-1 bg-brand-600 hover:bg-brand-500 text-white font-bold text-lg py-4 rounded-lg transition-colors">
          {t.nextStep}
        </button>
      </div>
    </div>
  )
}

// ── Stage 4: Details ──────────────────────────────────────────
function StageDetails({ form, update, t, submitting, errorMsg, onBack, onSubmit }: any) {
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

  const canSubmit = !!(form.author_name.trim() && form.latitude && form.longitude)
  const cls = "w-full bg-ink-950 border border-ink-700 focus:border-brand-600 rounded-lg px-4 py-4 text-base text-ink-200 placeholder:text-ink-700 outline-none transition-colors"

  return (
    <div>
      <h2 className="font-display text-3xl text-ink-50 mb-2">{t.step4Title}</h2>
      <p className="text-ink-300 text-base mb-1">{t.almostDone}</p>
      <p className="text-ink-400 text-sm mb-6">{t.required}</p>

      <div className="mb-6">
        <label className="block text-base font-bold text-ink-200 mb-1">{t.nameLabel}</label>
        <p className="text-ink-500 text-sm mb-2">{t.nameDesc}</p>
        <input type="text" value={form.author_name} onChange={e => update({ author_name: e.target.value })} placeholder={t.namePlaceholder} className={cls} />
      </div>

      <div className="mb-6">
        <label className="block text-base font-bold text-ink-200 mb-1">{t.emailLabel} <span className="text-ink-500 font-normal text-sm">{t.photoOptional}</span></label>
        <p className="text-ink-500 text-sm mb-2">{t.emailDesc}</p>
        <input type="email" value={form.author_email} onChange={e => update({ author_email: e.target.value })} placeholder="you@example.com" className={cls} />
      </div>

      <div className="mb-6">
        <label className="block text-base font-bold text-ink-200 mb-1">{t.ageLabel} <span className="text-ink-500 font-normal text-sm">{t.photoOptional}</span></label>
        <p className="text-ink-500 text-sm mb-2">{t.ageDesc}</p>
        <select value={form.age_range} onChange={e => update({ age_range: e.target.value })} className={cls}>
          <option value="">{t.agePlaceholder}</option>
          {AGE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-base font-bold text-ink-200 mb-1">
          <User size={14} className="inline mr-1" />{t.onBehalfLabel} <span className="text-ink-500 font-normal text-sm">{t.photoOptional}</span>
        </label>
        <p className="text-ink-500 text-sm mb-2">{t.onBehalfDesc}</p>
        <input type="text" value={form.submitted_for} onChange={e => update({ submitted_for: e.target.value })} placeholder={t.onBehalfPlaceholder} className={cls} />
      </div>

      <div className="mb-6">
        <label className="block text-base font-bold text-ink-200 mb-1">{t.locationLabel}</label>
        <p className="text-ink-500 text-sm mb-3">{t.locationDesc}</p>
        <button onClick={locate} disabled={locating}
          className={`w-full flex items-center justify-center gap-3 py-4 rounded-lg border font-bold text-base transition-colors
            ${form.latitude ? 'bg-nature-900 border-nature-700 text-nature-300' : 'bg-ink-800 hover:bg-ink-700 border-ink-700 text-ink-200'}`}>
          <MapPin size={18} className={locating ? 'animate-bounce' : ''} />
          {locating ? t.locating : form.latitude ? `📍 ${form.location_name}` : t.locationBtn}
        </button>
        {form.latitude && (
          <button onClick={() => update({ latitude: null, longitude: null, location_name: '', country_code: '', country_name: '' })}
            className="text-ink-600 hover:text-ink-400 text-xs font-mono mt-1.5">{t.clearLocation}</button>
        )}
      </div>

      <div className="mb-6">
        <label className="block text-base font-bold text-ink-200 mb-1">{t.photoLabel} <span className="text-ink-500 font-normal text-sm">{t.photoOptional}</span></label>
        <p className="text-ink-500 text-sm mb-3">{t.photoDesc}</p>
        {form.cover_image_preview ? (
          <div className="relative">
            <img src={form.cover_image_preview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
            <button onClick={() => update({ cover_image_file: null, cover_image_preview: null })}
              className="absolute top-2 right-2 bg-ink-900/80 text-ink-300 rounded-full p-1"><X size={14} /></button>
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

      <div className="mb-6">
        <label className="block text-base font-bold text-ink-200 mb-1">{t.videoLabel} <span className="text-ink-500 font-normal text-sm">{t.photoOptional}</span></label>
        <p className="text-ink-500 text-sm mb-3">{t.videoDesc}</p>
        {form.video_file ? (
          <div className="flex items-center gap-3 bg-ink-800 rounded-lg px-4 py-3">
            <span className="text-ink-300 text-sm flex-1 truncate">📹 {form.video_file.name}</span>
            <button onClick={() => update({ video_file: null })}><X size={14} className="text-ink-500" /></button>
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
          className="text-ink-400 hover:text-ink-200 text-sm border border-ink-700 rounded-lg px-5 py-3 transition-colors">
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
        category: form.category ?? 'extreme_weather',
        cover_image_url, video_upload_path, audio_upload_path,
        latitude: form.latitude, longitude: form.longitude,
        location_name: form.location_name,
        country_code: form.country_code.toUpperCase(),
        country_name: form.country_name,
        author_name: form.author_name.trim(),
        author_email: form.author_email?.trim().toLowerCase() ?? '',
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
