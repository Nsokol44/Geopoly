'use client'
// components/stories/ShareCard.tsx
// Drop this inside your story/[id]/page.tsx
import { useState } from 'react'
import { Share2, Copy, Check, Twitter, Facebook } from 'lucide-react'
import type { Story } from '@/types'

interface Props {
  story: Story
}

export function ShareCard({ story }: Props) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/story/${story.id}`
    : `https://geopoly.xyz/story/${story.id}`

  const text = `"${story.title}" — a climate story from ${story.location_name}. Read it on the Geopoly Atlas:`
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`

  const copy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const nativeShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: story.title, text, url })
    } else {
      setOpen(o => !o)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={nativeShare}
        className="flex items-center gap-2 text-ink-400 hover:text-ink-200 text-sm border border-ink-700 hover:border-ink-500 rounded-lg px-4 py-2 transition-colors"
      >
        <Share2 size={14} />
        Share This Story
      </button>

      {open && (
        <div className="absolute top-full mt-2 right-0 bg-ink-900 border border-ink-700 rounded-lg p-3 shadow-xl z-10 w-64">
          <p className="text-ink-500 text-xs font-mono uppercase tracking-wider mb-3">Share this story</p>

          {/* Story card preview */}
          <div className="bg-ink-950 border border-ink-800 rounded-lg p-3 mb-3">
            <p className="text-brand-400 text-[10px] font-mono uppercase tracking-wider mb-1">
              📍 {story.location_name}
            </p>
            <p className="text-ink-200 text-sm font-bold leading-tight mb-1">{story.title}</p>
            <p className="text-ink-500 text-xs">geopoly.xyz · Climate Atlas</p>
          </div>

          <div className="space-y-2">
            <button
              onClick={copy}
              className="w-full flex items-center gap-2 bg-ink-800 hover:bg-ink-700 text-ink-200 text-sm px-3 py-2 rounded-lg transition-colors"
            >
              {copied ? <Check size={14} className="text-nature-400" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <a
              href={twitterUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center gap-2 bg-ink-800 hover:bg-ink-700 text-ink-200 text-sm px-3 py-2 rounded-lg transition-colors"
            >
              <Twitter size={14} /> Share on X / Twitter
            </a>
            <a
              href={fbUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center gap-2 bg-ink-800 hover:bg-ink-700 text-ink-200 text-sm px-3 py-2 rounded-lg transition-colors"
            >
              <Facebook size={14} /> Share on Facebook
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
