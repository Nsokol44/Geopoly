'use client'
// app/admin/login/page.tsx
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errMsg, setErrMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    setLoading(true)
    setErrMsg('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) {
      setErrMsg('Invalid email or password.')
      setLoading(false)
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center px-6">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#0b90e4 1px, transparent 1px), linear-gradient(90deg, #0b90e4 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
      <div className="relative w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 border-2 border-brand-400" />
            <div className="absolute inset-[4px] bg-brand-500" />
          </div>
          <div className="leading-none">
            <div className="font-display text-base text-ink-50 tracking-wide">Geopoly</div>
            <div className="font-mono text-[9px] text-ink-500 tracking-[0.25em] uppercase mt-0.5">Editorial Admin</div>
          </div>
        </div>

        <div className="bg-ink-900 border border-ink-800 rounded-sm shadow-2xl overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-brand-700 via-brand-400 to-brand-700" />
          <div className="p-8">
            <div className="mb-7">
              <h1 className="font-display text-2xl text-ink-50 mb-1">Sign in</h1>
              <p className="text-ink-500 text-sm">Admin access only.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block font-mono text-[10px] tracking-[0.2em] uppercase text-ink-400 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    required
                    autoFocus
                    className="w-full bg-ink-950 border border-ink-700 focus:border-brand-600 rounded-sm pl-9 pr-4 py-3 text-sm text-ink-200 placeholder:text-ink-700 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] tracking-[0.2em] uppercase text-ink-400 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-ink-950 border border-ink-700 focus:border-brand-600 rounded-sm pl-9 pr-4 py-3 text-sm text-ink-200 placeholder:text-ink-700 outline-none transition-colors"
                  />
                </div>
              </div>

              {errMsg && (
                <div className="flex items-start gap-2 text-red-400 bg-red-950/30 border border-red-900/50 rounded-sm px-4 py-3 text-xs">
                  <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                  {errMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold font-mono text-xs tracking-[0.2em] uppercase py-3 transition-colors rounded-sm"
              >
                {loading && <Loader2 size={13} className="animate-spin" />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs font-mono text-ink-600 hover:text-ink-400 transition-colors tracking-wider uppercase">
            Back to site
          </Link>
        </div>
      </div>
    </div>
  )
}
