'use client'
// app/admin/login/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Loader2, Mail, CheckCircle, AlertCircle } from 'lucide-react'

type State = 'idle' | 'loading' | 'sent' | 'error'

export default function AdminLoginPage() {
  const [email, setEmail]   = useState('')
  const [state, setState]   = useState<State>(&apos;idle&apos;)
  const [errMsg, setErrMsg] = useState(&apos;&apos;)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setState(&apos;loading&apos;)
    setErrMsg(&apos;&apos;)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    })

    if (error) {
      setErrMsg(error.message)
      setState(&apos;error&apos;)
    } else {
      setState(&apos;sent&apos;)
    }
  }

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center px-6">
      {/* Background grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#b8651a 1px, transparent 1px),
                            linear-gradient(90deg, #b8651a 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 border-2 border-brand-400" />
            <div className="absolute inset-[4px] bg-brand-500" />
          </div>
          <div className="leading-none">
            <div className="font-display text-base text-ink-50 tracking-wide">Climate Stories</div>
            <div className="font-mono text-[9px] text-ink-500 tracking-[0.25em] uppercase mt-0.5">
              Editorial Admin
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-ink-900 border border-ink-800 rounded-sm shadow-2xl overflow-hidden">
          {/* Top accent bar */}
          <div className="h-0.5 bg-gradient-to-r from-brand-700 via-brand-400 to-brand-700" />

          <div className="p-8">
            {state === &apos;sent&apos; ? (
              /* ── Success state ───────────────────── */
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-nature-950 border border-nature-800 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle size={24} className="text-nature-400" />
                </div>
                <h2 className="font-display text-xl text-ink-50 mb-3">Check your inbox</h2>
                <p className="text-ink-400 text-sm leading-relaxed">
                  We sent a magic link to{&apos; &apos;}
                  <span className="text-ink-200 font-medium">{email}</span>.
                  Click it to sign in — it expires in 1 hour.
                </p>
                <button
                  onClick={() => { setState(&apos;idle&apos;); setEmail(&apos;&apos;) }}
                  className="mt-6 text-xs font-mono text-ink-500 hover:text-ink-300 transition-colors tracking-wider uppercase"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              /* ── Login form ──────────────────────── */
              <>
                <div className="mb-7">
                  <h1 className="font-display text-2xl text-ink-50 mb-1">Sign in</h1>
                  <p className="text-ink-500 text-sm">
                    Admin access only. We&apos;ll send a magic link to your email.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block font-mono text-[10px] tracking-[0.2em] uppercase text-ink-400 mb-2">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600"
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@utk.edu"
                        required
                        autoFocus
                        className="w-full bg-ink-950 border border-ink-700 focus:border-brand-600 rounded-sm pl-9 pr-4 py-3 text-sm text-ink-200 placeholder:text-ink-700 outline-none transition-colors font-body"
                      />
                    </div>
                  </div>

                  {/* Error message */}
                  {state === &apos;error&apos; && (
                    <div className="flex items-start gap-2 text-red-400 bg-red-950/30 border border-red-900/50 rounded-sm px-4 py-3 text-xs">
                      <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                      {errMsg || &apos;Something went wrong. Please try again.&apos;}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={state === 'loading' || !email.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold font-mono text-xs tracking-[0.2em] uppercase py-3 transition-colors rounded-sm"
                  >
                    {state === &apos;loading&apos; && <Loader2 size={13} className="animate-spin" />}
                    {state === &apos;loading&apos; ? &apos;Sending…&apos; : &apos;Send Magic Link&apos;}
                  </button>
                </form>

                <p className="mt-6 text-center text-ink-700 text-xs">
                  Only registered admin emails can sign in.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Back to site link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs font-mono text-ink-600 hover:text-ink-400 transition-colors tracking-wider uppercase"
          >
            ← Back to site
          </Link>
        </div>
      </div>
    </div>
  )
}
