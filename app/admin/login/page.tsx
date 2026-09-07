'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error: err } = await createClient().auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (err) { setError('Invalid email or password.'); setLoading(false) }
    else { router.push('/admin'); router.refresh() }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-block bg-yellow-400 text-zinc-950 font-black text-xs px-2 py-1 rounded mb-3">$1</div>
          <h1 className="font-black text-2xl text-white">Admin Sign In</h1>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <form onSubmit={submit} className="space-y-4">
            {[{ label: 'Email', val: email, set: setEmail, type: 'email', ph: 'you@email.com' },
              { label: 'Password', val: password, set: setPassword, type: 'password', ph: '••••••••' }].map(({ label, val, set, type, ph }) => (
              <div key={label}>
                <label className="block text-xs font-black text-zinc-400 uppercase tracking-wider mb-2">{label}</label>
                <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph} required
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-yellow-400 rounded-xl px-4 py-3 text-white placeholder:text-zinc-700 outline-none transition-colors" />
              </div>
            ))}
            {error && <p className="text-red-400 text-sm bg-red-950/30 border border-red-900 rounded-xl p-3">{error}</p>}
            <button type="submit" disabled={loading || !email || !password}
              className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-zinc-950 font-black py-3 rounded-full transition-colors">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
