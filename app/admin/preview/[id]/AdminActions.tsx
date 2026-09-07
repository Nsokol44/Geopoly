'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function AdminActions({ storyId }: { storyId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const act = async (status: 'approved' | 'rejected', featured = false) => {
    setLoading(true)
    await fetch('/api/admin/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: storyId, status, featured }) })
    setDone(true)
    setTimeout(() => router.push('/admin'), 1200)
  }

  if (done) return <p className="text-green-400 font-black text-center">✓ Done! Returning to queue…</p>

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {loading && <span className="text-zinc-400 text-sm">Processing…</span>}
      <button onClick={() => act('rejected')} disabled={loading}
        className="text-sm font-black text-red-400 border border-red-900 hover:border-red-700 px-5 py-2.5 rounded-full transition-colors disabled:opacity-50">
        ✕ Reject
      </button>
      <button onClick={() => act('approved')} disabled={loading}
        className="text-sm font-black text-green-400 border border-green-900 hover:border-green-700 px-5 py-2.5 rounded-full transition-colors disabled:opacity-50">
        ✓ Approve
      </button>
      <button onClick={() => act('approved', true)} disabled={loading}
        className="text-sm font-black bg-yellow-400 hover:bg-yellow-300 text-zinc-950 px-5 py-2.5 rounded-full transition-colors disabled:opacity-50">
        ★ Approve & Feature
      </button>
    </div>
  )
}
