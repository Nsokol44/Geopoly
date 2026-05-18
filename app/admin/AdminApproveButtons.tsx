'use client'
// app/admin/AdminApproveButtons.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Star, Loader2 } from 'lucide-react'

export function AdminApproveButtons({ storyId }: { storyId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const action = async (status: 'approved' | 'rejected', featured = false) => {
    setLoading(true)
    const res = await fetch('/api/admin/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: storyId, status, featured }),
    })
    setLoading(false)
    if (res.ok) {
      setDone(true)
      setTimeout(() => router.push('/admin'), 1200)
    }
  }

  if (done) {
    return <p className="text-nature-400 font-mono text-sm">✓ Done! Returning to queue…</p>
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {loading && <Loader2 size={16} className="animate-spin text-ink-400" />}
      <button
        onClick={() => action('rejected')}
        disabled={loading}
        className="flex items-center gap-2 text-sm font-mono text-red-400 hover:text-red-300 border border-red-900 hover:border-red-700 px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
      >
        <XCircle size={14} /> Reject
      </button>
      <button
        onClick={() => action('approved', false)}
        disabled={loading}
        className="flex items-center gap-2 text-sm font-mono text-nature-400 border border-nature-900 hover:border-nature-700 px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
      >
        <CheckCircle size={14} /> Approve
      </button>
      <button
        onClick={() => action('approved', true)}
        disabled={loading}
        className="flex items-center gap-2 text-sm font-mono bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
      >
        <Star size={14} /> Approve & Feature
      </button>
    </div>
  )
}
