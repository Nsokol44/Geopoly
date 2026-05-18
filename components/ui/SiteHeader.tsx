'use client'
// components/ui/SiteHeader.tsx
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Type } from 'lucide-react'

// ── Language strings ─────────────────────────────────────────
const LANGS = {
  en: {
    map: 'Map', stories: 'Stories', submit: 'Submit', share: 'Share Your Story', status: 'My Story',
  },
  es: {
    map: 'Mapa', stories: 'Historias', submit: 'Enviar', share: 'Comparte tu Historia', status: 'Mi Historia',
  },
  fr: {
    map: 'Carte', stories: 'Histoires', submit: 'Soumettre', share: 'Partagez votre Histoire', status: 'Mon Histoire',
  },
}

export type Language = keyof typeof LANGS

// Context so other components can read the language
import { createContext, useContext } from 'react'
export const LangContext = createContext<Language>('en')
export const useLang = () => useContext(LangContext)

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [lang, setLang] = useState<Language>('en')
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'xl'>('normal')

  const t = LANGS[lang]

  // Apply text size to root
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('text-size-normal', 'text-size-large', 'text-size-xl')
    root.classList.add(`text-size-${textSize}`)
    // Persist
    localStorage.setItem('geopoly_textsize', textSize)
    localStorage.setItem('geopoly_lang', lang)
  }, [textSize, lang])

  // Secret admin key combo: G → P → A
  useEffect(() => {
    const seq = ['g', 'p', 'a']
    let idx = 0
    let timer: ReturnType<typeof setTimeout>
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === seq[idx]) {
        idx++
        clearTimeout(timer)
        if (idx === seq.length) {
          window.location.href = '/admin'
          idx = 0
        } else {
          timer = setTimeout(() => { idx = 0 }, 1500)
        }
      } else {
        idx = 0
      }
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(timer) }
  }, [])

  // Load saved prefs
  useEffect(() => {
    const savedSize = localStorage.getItem('geopoly_textsize') as any
    const savedLang = localStorage.getItem('geopoly_lang') as any
    if (savedSize) setTextSize(savedSize)
    if (savedLang && LANGS[savedLang as Language]) setLang(savedLang)
  }, [])

  const cycleFontSize = () => {
    setTextSize(s => s === 'normal' ? 'large' : s === 'large' ? 'xl' : 'normal')
  }

  const links = [
    { href: '/',        label: t.map },
    { href: '/stories', label: t.stories },
    { href: '/submit',  label: t.submit },
    { href: '/status',  label: t.status },
  ]

  const SIZE_LABEL = { normal: 'A', large: 'A+', xl: 'A++' }

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-ink-950/85 backdrop-blur-md border-b border-ink-800/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-8 h-8 flex-shrink-0">
              <div className="absolute inset-0 border-2 border-brand-400" />
              <div
                className="absolute inset-[3px] flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0b90e4, #0369a1)' }}
              >
                <span className="font-display font-bold text-white text-[10px] leading-none">G</span>
              </div>
            </div>
            <div className="leading-none">
              <div className="font-display text-base text-ink-50 tracking-wide font-bold">Geopoly</div>
              <div className="font-mono text-[9px] text-ink-500 tracking-[0.2em] uppercase mt-0.5">Climate Stories</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="font-mono text-xs tracking-[0.2em] uppercase px-4 py-2 text-ink-400 hover:text-ink-50 transition-colors"
              >
                {l.label}
              </Link>
            ))}

            {/* Text size toggle */}
            <button
              onClick={cycleFontSize}
              title="Change text size"
              className="ml-2 font-mono text-xs px-3 py-2 text-ink-400 hover:text-ink-50 border border-ink-700 hover:border-ink-500 rounded-sm transition-colors"
            >
              <Type size={12} className="inline mr-1" />
              {SIZE_LABEL[textSize]}
            </button>

            {/* Language switcher */}
            <div className="ml-2 flex border border-ink-700 rounded-sm overflow-hidden">
              {(Object.keys(LANGS) as Language[]).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`font-mono text-xs px-2.5 py-2 uppercase transition-colors
                    ${lang === l ? 'bg-brand-600 text-white' : 'text-ink-400 hover:text-ink-200'}`}
                >
                  {l}
                </button>
              ))}
            </div>

            <Link
              href="/submit"
              className="ml-3 bg-brand-500 hover:bg-brand-400 text-white font-mono text-xs tracking-[0.2em] uppercase px-5 py-2 transition-colors font-semibold rounded-sm"
            >
              {t.share}
            </Link>
          </nav>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={cycleFontSize}
              className="font-mono text-xs px-2 py-1.5 text-ink-400 border border-ink-700 rounded-sm"
            >
              {SIZE_LABEL[textSize]}
            </button>
            <div className="flex border border-ink-700 rounded-sm overflow-hidden">
              {(Object.keys(LANGS) as Language[]).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`font-mono text-[10px] px-2 py-1.5 uppercase
                    ${lang === l ? 'bg-brand-600 text-white' : 'text-ink-400'}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <button className="text-ink-400 hover:text-ink-50" onClick={() => setOpen(o => !o)}>
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden bg-ink-950/95 backdrop-blur-md border-b border-ink-800">
          <nav className="flex flex-col px-6 py-4 gap-1">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="font-mono text-sm tracking-[0.2em] uppercase py-3 text-ink-300 border-b border-ink-800 last:border-0"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/submit"
              onClick={() => setOpen(false)}
              className="mt-3 bg-brand-500 text-white font-mono text-xs tracking-[0.2em] uppercase px-5 py-3 text-center font-semibold rounded-sm"
            >
              {t.share}
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
