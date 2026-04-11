// app/not-found.tsx
import Link from 'next/link'
import { SiteHeader } from '@/components/ui/SiteHeader'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink-950">
      <SiteHeader />
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="text-center max-w-md">
          {/* Decorative number */}
          <div className="relative mb-8">
            <div
              className="font-display text-[140px] leading-none font-bold select-none"
              style={{
                background: 'linear-gradient(135deg, #473c30 0%, #1c1812 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 border-2 border-brand-700 rotate-45 opacity-40" />
            </div>
          </div>

          <h1 className="font-display text-2xl text-ink-50 mb-3">
            Story not found
          </h1>
          <p className="text-ink-500 leading-relaxed mb-8">
            This story may have been removed, or the link may be incorrect.
            Head back to the atlas to keep exploring.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/"
              className="bg-brand-500 hover:bg-brand-400 text-white font-semibold font-mono text-xs tracking-[0.2em] uppercase px-6 py-3 transition-colors rounded-sm"
            >
              Back to Map
            </Link>
            <Link
              href="/stories"
              className="border border-ink-700 hover:border-ink-500 text-ink-400 hover:text-ink-200 font-mono text-xs tracking-[0.2em] uppercase px-6 py-3 transition-colors rounded-sm"
            >
              All Stories
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
