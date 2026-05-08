'use client'
// app/status/page.tsx — Story submission status tracker
import { useState } from 'react'
import { Search, CheckCircle, Clock, XCircle, Loader2, MapPin } from 'lucide-react'
import { SiteHeader } from '@/components/ui/SiteHeader'
import { SiteFooter } from '@/components/ui/SiteFooter'

interface StatusResult {
  found: boolean
  status?: 'pending' | 'approved' | 'rejected'
  title?: string
  location_name?: string
  created_at?: string
  author_name?: string
}

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: 'text-amber-400',
    bg: 'bg-amber-950/30 border-amber-800',
    label: 'In Review',
    message: 'Your story has been received and is in our editorial review queue. We typically review stories within 5–10 business days. Thank you for your patience!',
  },
  approved: {
    icon: CheckCircle,
    color: 'text-nature-400',
    bg: 'bg-nature-950/30 border-nature-800',
    label: 'Published!',
    message: 'Your story has been approved and is now live on the atlas! Thank you for sharing your voice.',
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-950/30 border-red-900',
    label: 'Not Published',
    message: 'After review, our editors decided not to publish this story at this time. We appreciate you sharing your experience with us.',
  },
}

export default function StatusPage() {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [mode, setMode] = useState<'email' | 'token'>('email')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<StatusResult[] | null>(null)
  const [error, setError] = useState('')

  const lookup = async () => {
    setLoading(true)
    setError('')
    setResults(null)
    try {
      const params = mode === 'email'
        ? `email=${encodeURIComponent(email)}`
        : `token=${encodeURIComponent(token)}`
      const res = await fetch(`/api/status?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lookup failed')
      setResults(data.stories)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink-950 flex flex-col">
      <SiteHeader />
      <main className="flex-1 pt-16">
        <div className="max-w-lg mx-auto px-5 py-16">

          <div className="text-center mb-10">
            <p className="font-mono text-xs tracking-[0.3em] text-brand-400 uppercase mb-3">Track Your Story</p>
            <h1 className="font-display text-4xl text-ink-50 mb-3">Check Your Status</h1>
            <p className="text-ink-400 text-base leading-relaxed">
              Want to know if your story has been reviewed? Enter your email address or your unique story link below.
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-lg border border-ink-700 overflow-hidden mb-6">
            {(['email', 'token'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setResults(null); setError('') }}
                className={`flex-1 py-3 text-sm font-mono uppercase tracking-wider transition-colors
                  ${mode === m ? 'bg-brand-600 text-white' : 'bg-ink-900 text-ink-400 hover:text-ink-200'}`}
              >
                {m === 'email' ? '📧 By Email' : '🔗 By Link'}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="bg-ink-900 border border-ink-800 rounded-lg p-6 mb-6">
            {mode === 'email' ? (
              <div>
                <label className="block text-base font-bold text-ink-200 mb-1">Your Email Address</label>
                <p className="text-ink-500 text-sm mb-3">Enter the email you used when you submitted your story.</p>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && lookup()}
                  placeholder="you@example.com"
                  className="w-full bg-ink-950 border border-ink-700 focus:border-brand-600 rounded-lg px-4 py-4 text-base text-ink-200 placeholder:text-ink-700 outline-none transition-colors mb-4"
                />
              </div>
            ) : (
              <div>
                <label className="block text-base font-bold text-ink-200 mb-1">Your Story Token</label>
                <p className="text-ink-500 text-sm mb-3">Paste the unique code from your confirmation page.</p>
                <input
                  type="text"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && lookup()}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="w-full bg-ink-950 border border-ink-700 focus:border-brand-600 rounded-lg px-4 py-4 text-sm text-ink-200 placeholder:text-ink-700 outline-none transition-colors font-mono mb-4"
                />
              </div>
            )}

            <button
              onClick={lookup}
              disabled={loading || (mode === 'email' ? !email.trim() : !token.trim())}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-bold text-base py-4 rounded-lg transition-colors"
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Looking up…</> : <><Search size={18} /> Check Status</>}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-950/30 border border-red-900 rounded-lg p-4 text-red-400 text-sm mb-6">{error}</div>
          )}

          {/* Results */}
          {results && results.length === 0 && (
            <div className="bg-ink-900 border border-ink-800 rounded-lg p-6 text-center">
              <p className="text-ink-300 text-base font-bold mb-2">No stories found</p>
              <p className="text-ink-500 text-sm">We could not find any submissions with that {mode}. Please double-check and try again.</p>
            </div>
          )}

          {results && results.map((r, i) => {
            if (!r.status) return null
            const cfg = STATUS_CONFIG[r.status]
            const Icon = cfg.icon
            return (
              <div key={i} className={`border rounded-lg p-6 mb-4 ${cfg.bg}`}>
                <div className="flex items-center gap-3 mb-3">
                  <Icon size={24} className={cfg.color} />
                  <div>
                    <p className={`font-bold text-lg ${cfg.color}`}>{cfg.label}</p>
                    {r.title && <p className="text-ink-200 text-sm font-semibold">{r.title}</p>}
                  </div>
                </div>
                {r.location_name && (
                  <p className="text-ink-400 text-sm mb-2 flex items-center gap-1">
                    <MapPin size={12} /> {r.location_name}
                  </p>
                )}
                <p className="text-ink-300 text-sm leading-relaxed mb-3">{cfg.message}</p>
                {r.status === 'approved' && (
                  <a href="/stories" className="inline-block bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold px-5 py-2 rounded-lg transition-colors">
                    View on the Atlas →
                  </a>
                )}
              </div>
            )
          })}

        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
