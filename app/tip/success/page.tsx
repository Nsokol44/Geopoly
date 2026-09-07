'use client'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function TipSuccessPage() {
  const params = useSearchParams()
  const storyId = params.get('story')
  const tipId = params.get('tip')
  const processor = params.get('processor')

  useEffect(() => {
    if (processor === 'paypal' && tipId) {
      fetch('/api/tip/paypal/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tip_id: tipId }),
      }).catch(() => {})
    }
  }, [processor, tipId])

  const share = () => {
    const url = storyId ? `https://justgimmeadolla.com/story/${storyId}` : 'https://justgimmeadolla.com'
    const text = `I just sent a dolla on JustGimmeADolla 💛 Real stories. Real people. → ${url}`
    if (navigator.share) navigator.share({ text, url })
    else navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'))
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">💛</div>
        <h1 className="font-black text-4xl text-white mb-3">You sent a dolla!</h1>
        <p className="text-zinc-400 mb-8 leading-relaxed">
          You just supported a real person sharing a real story. That matters more than you know.
        </p>
        <button onClick={share}
          className="w-full bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-black py-3 rounded-full mb-4 transition-colors">
          📣 Share This Story
        </button>
        <div className="flex gap-3">
          {storyId && <Link href={`/story/${storyId}`} className="flex-1 border border-zinc-700 text-zinc-300 font-bold py-3 rounded-full text-center hover:border-zinc-500 transition-colors text-sm">Back to Story</Link>}
          <Link href="/" className="flex-1 border border-zinc-700 text-zinc-300 font-bold py-3 rounded-full text-center hover:border-zinc-500 transition-colors text-sm">More Stories</Link>
        </div>
      </div>
    </div>
  )
}
