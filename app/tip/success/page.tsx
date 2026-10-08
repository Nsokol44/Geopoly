'use client'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { recordTip } from '@/lib/daily-client'

type TipState = 'checking' | 'confirmed' | 'processing' | 'failed'

function TipSuccessContent() {
  const params = useSearchParams()
  const storyId = params.get('story')
  const tipId = params.get('tip')
  const processor = params.get('processor')
  const [state, setState] = useState<TipState>('checking')
  const recorded = useRef(false)

  useEffect(() => {
    if (!tipId) { setState('failed'); return }
    let cancelled = false
    let tries = 0

    const poll = async () => {
      // PayPal: the return route normally captured already; this
      // call is the idempotent fallback if it did not.
      if (processor === 'paypal' && tries === 0) {
        await fetch('/api/tip/paypal/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tip_id: tipId }),
        }).catch(() => {})
      }
      while (!cancelled && tries < 12) {
        tries++
        try {
          const res = await fetch(`/api/tip/status?tip=${tipId}`)
          const data = await res.json()
          if (data.status === 'completed') {
            if (!recorded.current) { recorded.current = true; recordTip() }
            if (!cancelled) setState('confirmed')
            return
          }
          if (data.status === 'failed') { if (!cancelled) setState('failed'); return }
        } catch { /* keep polling */ }
        if (!cancelled) setState('processing')
        await new Promise(r => setTimeout(r, 2000))
      }
      if (!cancelled) setState(s => (s === 'confirmed' ? s : 'processing'))
    }
    poll()
    return () => { cancelled = true }
  }, [processor, tipId])

  const share = () => {
    const url = storyId ? `${window.location.origin}/story/${storyId}` : window.location.origin
    const text = `I just sent a dolla on JustGimmeADolla 💛 Real stories. Real people. → ${url}`
    if (navigator.share) navigator.share({ text, url })
    else navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'))
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">{state === 'confirmed' ? '💛' : state === 'failed' ? '⚠️' : '⏳'}</div>
        <h1 className="font-black text-4xl text-white mb-3">
          {state === 'confirmed' ? 'You sent a dolla!' : state === 'failed' ? 'That tip didn’t go through' : 'Confirming your tip…'}
        </h1>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          {state === 'confirmed'
            ? 'You just supported a real person sharing a real story. That matters more than you know.'
            : state === 'failed'
              ? 'No payment was completed. You can try again from the story page.'
              : 'Hang tight — we’re confirming the payment with your provider.'}
        </p>
        {state === 'confirmed' && (
          <button onClick={share}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-black py-3 rounded-full mb-4 transition-colors">
            📣 Share This Story
          </button>
        )}
        <div className="flex gap-3">
          {storyId && <Link href={`/story/${storyId}`} className="flex-1 border border-zinc-700 text-zinc-300 font-bold py-3 rounded-full text-center hover:border-zinc-500 transition-colors text-sm">Back to Story</Link>}
          <Link href="/" className="flex-1 border border-zinc-700 text-zinc-300 font-bold py-3 rounded-full text-center hover:border-zinc-500 transition-colors text-sm">More Stories</Link>
        </div>
      </div>
    </div>
  )
}

export default function TipSuccessPage() {
  return (
    <Suspense fallback={null}>
      <TipSuccessContent />
    </Suspense>
  )
}
