'use client'
// app/submit/SuccessScreen.tsx
// Shown after story submission — certificate + pin moment + share

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Share2, Download, Copy, Check, MapPin, Globe } from 'lucide-react'

interface Props {
  authorName: string
  locationName: string
  lang: 'en' | 'es' | 'fr'
}

const T = {
  en: {
    received: 'Story Received!',
    youAre: 'You are',
    storyNumber: 'story #',
    from: 'from',
    onAtlas: 'One of',
    onAtlasPost: 'approved stories on the Global Climate Atlas',
    pending: 'Your story is now in our review queue. Our editors will listen to your recording and be in touch within 5–10 business days.',
    checkStatus: '📋 Check your story status anytime at',
    shareTitle: 'Share Your Achievement',
    shareMsg: (name: string, local: number, area: string, global: number) =>
      `I just added my climate story to the Geopoly Atlas! I'm story #${local} from ${area} and one of ${global} voices worldwide. Add yours → geopoly.xyz/submit`,
    copyLink: 'Copy Share Message',
    copied: 'Copied!',
    backMap: 'Back to the Map',
    certificate: 'Climate Story Contributor',
    certSub: 'Global Climate Atlas',
    localStory: 'local story',
    globalVoices: 'global voices',
  },
  es: {
    received: '¡Historia Recibida!',
    youAre: 'Eres la',
    storyNumber: 'historia #',
    from: 'de',
    onAtlas: 'Una de',
    onAtlasPost: 'historias aprobadas en el Atlas Climático Global',
    pending: 'Tu historia está en nuestra cola de revisión. Nuestros editores escucharán tu grabación y te contactarán en 5–10 días hábiles.',
    checkStatus: '📋 Verifica el estado de tu historia en',
    shareTitle: 'Comparte tu Logro',
    shareMsg: (name: string, local: number, area: string, global: number) =>
      `¡Acabo de agregar mi historia climática al Atlas Geopoly! Soy la historia #${local} de ${area} y una de ${global} voces mundiales. Agrega la tuya → geopoly.xyz/submit`,
    copyLink: 'Copiar Mensaje',
    copied: '¡Copiado!',
    backMap: 'Volver al Mapa',
    certificate: 'Contribuidor de Historia Climática',
    certSub: 'Atlas Climático Global',
    localStory: 'historia local',
    globalVoices: 'voces globales',
  },
  fr: {
    received: 'Histoire Reçue !',
    youAre: 'Vous êtes la',
    storyNumber: 'histoire #',
    from: 'de',
    onAtlas: 'Une des',
    onAtlasPost: 'histoires approuvées sur l\'Atlas Climatique Mondial',
    pending: 'Votre histoire est maintenant dans notre file de révision. Nos éditeurs écouteront votre enregistrement et vous contacteront dans 5–10 jours ouvrables.',
    checkStatus: '📋 Vérifiez le statut de votre histoire sur',
    shareMsg: (name: string, local: number, area: string, global: number) =>
      `Je viens d'ajouter mon histoire climatique à l'Atlas Geopoly ! Je suis l'histoire #${local} de ${area} et une des ${global} voix mondiales. Ajoutez la vôtre → geopoly.xyz/submit`,
    shareTitle: 'Partagez votre Réussite',
    copyLink: 'Copier le Message',
    copied: 'Copié !',
    backMap: 'Retour à la Carte',
    certificate: 'Contributeur d\'Histoire Climatique',
    certSub: 'Atlas Climatique Mondial',
    localStory: 'histoire locale',
    globalVoices: 'voix mondiales',
  },
}

export function SuccessScreen({ authorName, locationName, lang }: Props) {
  const t = T[lang]
  const [globalCount, setGlobalCount] = useState<number | null>(null)
  const [localCount, setLocalCount] = useState<number | null>(null)
  const [localArea, setLocalArea] = useState('')
  const [copied, setCopied] = useState(false)
  const certRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/story-counts?location=${encodeURIComponent(locationName)}`)
      .then(r => r.json())
      .then(data => {
        setGlobalCount(data.global)
        setLocalCount(data.local)
        setLocalArea(data.local_area)
      })
      .catch(() => {})
  }, [locationName])

  const shareMessage = globalCount && localCount && localArea
    ? t.shareMsg(authorName, localCount, localArea, globalCount)
    : `I just added my climate story to the Geopoly Atlas! Add yours → geopoly.xyz/submit`

  const copyMessage = async () => {
    await navigator.clipboard.writeText(shareMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const nativeShare = () => {
    if (navigator.share) {
      navigator.share({ text: shareMessage, url: 'https://geopoly.xyz/submit' })
    } else {
      copyMessage()
    }
  }

  return (
    <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-start px-5 py-16 pt-24">

      {/* ── Certificate Card ── */}
      <div
        ref={certRef}
        className="w-full max-w-lg bg-ink-900 border border-brand-700 rounded-2xl overflow-hidden shadow-2xl mb-8"
        style={{ boxShadow: '0 0 60px rgba(11,144,228,0.15)' }}
      >
        {/* Top accent */}
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(to right, #0b90e4, #22c55e, #0b90e4)' }} />

        <div className="p-8 text-center">
          {/* Globe icon */}
          <div className="w-16 h-16 rounded-full bg-brand-950 border border-brand-700 flex items-center justify-center mx-auto mb-5">
            <Globe size={28} className="text-brand-400" />
          </div>

          {/* Certificate title */}
          <p className="font-mono text-[10px] tracking-[0.35em] text-brand-400 uppercase mb-2">{t.certSub}</p>
          <h2 className="font-display text-2xl text-ink-50 mb-1">{t.certificate}</h2>
          <p className="text-ink-300 text-base font-semibold mb-6">{authorName}</p>

          {/* Divider */}
          <div className="h-px bg-ink-800 mb-6" />

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Local stat */}
            <div className="bg-ink-950 border border-ink-800 rounded-xl p-4">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <MapPin size={14} className="text-nature-400" />
                <span className="text-nature-400 text-xs font-mono uppercase tracking-wider">{localArea || locationName.split(',')[0]}</span>
              </div>
              {localCount !== null ? (
                <div>
                  <p className="font-display text-4xl text-ink-50 font-bold">#{localCount}</p>
                  <p className="text-ink-500 text-xs mt-1">{t.localStory}</p>
                </div>
              ) : (
                <div className="h-10 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
                </div>
              )}
            </div>

            {/* Global stat */}
            <div className="bg-ink-950 border border-ink-800 rounded-xl p-4">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <Globe size={14} className="text-brand-400" />
                <span className="text-brand-400 text-xs font-mono uppercase tracking-wider">Global</span>
              </div>
              {globalCount !== null ? (
                <div>
                  <p className="font-display text-4xl text-ink-50 font-bold">{globalCount}</p>
                  <p className="text-ink-500 text-xs mt-1">{t.globalVoices}</p>
                </div>
              ) : (
                <div className="h-10 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center justify-center gap-1.5 text-ink-500 text-sm">
            <MapPin size={12} />
            <span>{locationName}</span>
          </div>
        </div>

        {/* Bottom accent */}
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(to right, #22c55e, #0b90e4, #22c55e)' }} />
      </div>

      {/* ── Pending notice ── */}
      <div className="w-full max-w-lg bg-amber-950/30 border border-amber-800 rounded-xl p-5 mb-6 text-center">
        <p className="text-amber-200 text-sm leading-relaxed mb-2">{t.pending}</p>
        <p className="text-amber-400/60 text-xs">
          {t.checkStatus} <a href="/status" className="text-brand-400 hover:underline">geopoly.xyz/status</a>
        </p>
      </div>

      {/* ── Share section ── */}
      <div className="w-full max-w-lg mb-8">
        <p className="text-ink-400 text-sm font-bold text-center mb-3">{t.shareTitle}</p>
        <div className="bg-ink-900 border border-ink-800 rounded-xl p-4 mb-3">
          <p className="text-ink-300 text-sm leading-relaxed italic">"{shareMessage}"</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={nativeShare}
            className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm py-3 rounded-xl transition-colors"
          >
            <Share2 size={16} /> Share
          </button>
          <button
            onClick={copyMessage}
            className="flex items-center justify-center gap-2 bg-ink-800 hover:bg-ink-700 border border-ink-700 text-ink-200 text-sm px-5 py-3 rounded-xl transition-colors"
          >
            {copied ? <><Check size={14} className="text-nature-400" /> {t.copied}</> : <><Copy size={14} /> {t.copyLink}</>}
          </button>
        </div>
      </div>

      {/* Back to map */}
      <Link
        href="/"
        className="inline-block bg-ink-800 hover:bg-ink-700 border border-ink-700 text-ink-200 font-mono text-xs uppercase tracking-wider px-8 py-3 rounded-xl transition-colors"
      >
        {t.backMap}
      </Link>
    </div>
  )
}
