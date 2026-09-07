'use client'
import { useState } from 'react'

export function TipSection({ storyId, authorName, tipCount, tipTotal }: {
  storyId: string; authorName: string; tipCount: number; tipTotal: number
}) {
  const [amount, setAmount] = useState(1)
  const [custom, setCustom] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [loading, setLoading] = useState<'stripe' | 'paypal' | null>(null)

  const finalAmount = useCustom ? Number(custom) || 0 : amount
  const stripeFee = (finalAmount * 0.029 + 0.30).toFixed(2)

  const tip = async (processor: 'stripe' | 'paypal') => {
    if (finalAmount < 1) return
    setLoading(processor)
    try {
      const res = await fetch(`/api/tip/${processor}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story_id: storyId, amount: finalAmount }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      if (url) window.location.href = url
    } catch (e: any) {
      alert(e.message || 'Something went wrong.')
    } finally { setLoading(null) }
  }

  return (
    <div className="bg-zinc-900 border border-yellow-400/30 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-white font-black text-xl">If this moved you —<br />send a dolla. 💛</p>
          <p className="text-zinc-500 text-sm mt-1">
            {tipCount > 0 ? `${tipCount} people sent $${Number(tipTotal).toFixed(0)} to ${authorName}` : `Be the first to support ${authorName}`}
          </p>
        </div>
      </div>

      {/* Amount picker */}
      <div className="flex gap-2 flex-wrap mb-4">
        {[1, 3, 5].map(a => (
          <button key={a} onClick={() => { setAmount(a); setUseCustom(false) }}
            className={`px-5 py-2.5 rounded-full font-black text-sm transition-colors
              ${!useCustom && amount === a ? 'bg-yellow-400 text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
            ${a}
          </button>
        ))}
        <button onClick={() => setUseCustom(true)}
          className={`px-5 py-2.5 rounded-full font-black text-sm transition-colors
            ${useCustom ? 'bg-yellow-400 text-zinc-950' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
          Custom
        </button>
      </div>

      {useCustom && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-zinc-400 font-bold">$</span>
          <input type="number" min="1" value={custom} onChange={e => setCustom(e.target.value)}
            placeholder="Enter amount"
            className="bg-zinc-800 border border-zinc-700 focus:border-yellow-400 rounded-xl px-4 py-2 text-white font-bold w-36 outline-none" />
        </div>
      )}

      {/* Fee disclosure */}
      <p className="text-zinc-600 text-xs mb-4">
        💡 On a ${finalAmount || 1} tip via card: ~${stripeFee} in payment fees. 0% platform fee — {authorName} gets the rest.
      </p>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => tip('stripe')} disabled={!!loading || finalAmount < 1}
          className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-zinc-100 disabled:opacity-40 text-zinc-950 font-black text-sm py-3.5 rounded-full transition-colors">
          {loading === 'stripe' ? '⏳' : '💳'} Pay with Card
        </button>
        <button onClick={() => tip('paypal')} disabled={!!loading || finalAmount < 1}
          className="flex-1 flex items-center justify-center gap-2 bg-[#0070ba] hover:bg-[#005ea6] disabled:opacity-40 text-white font-black text-sm py-3.5 rounded-full transition-colors">
          {loading === 'paypal' ? '⏳' : '🅿️'} Pay with PayPal
        </button>
      </div>
    </div>
  )
}
