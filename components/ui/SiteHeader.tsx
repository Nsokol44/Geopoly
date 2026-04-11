'use client'
// components/ui/SiteHeader.tsx
import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  const links = [
    { href: '/', label: 'Map' },
    { href: '/stories', label: 'Stories' },
    { href: '/submit', label: 'Submit' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-ink-950/85 backdrop-blur-md border-b border-ink-800/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Geopoly Logo */}
          <Link href="/" className="flex items-center gap-3">
            {/* Yellow rectangle — nod to NatGeo border */}
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
              <div className="font-mono text-[9px] text-ink-500 tracking-[0.2em] uppercase mt-0.5">
                Climate Stories
              </div>
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
            <Link
              href="/submit"
              className="ml-4 bg-brand-500 hover:bg-brand-400 text-white font-mono text-xs tracking-[0.2em] uppercase px-5 py-2 transition-colors font-semibold rounded-sm"
            >
              Share Your Story
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button className="md:hidden text-ink-400 hover:text-ink-50" onClick={() => setOpen(o => !o)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
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
              Share Your Story
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
