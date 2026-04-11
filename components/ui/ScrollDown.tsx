'use client'
// components/ui/ScrollDown.tsx
import { ChevronDown } from 'lucide-react'

export function ScrollDown({ targetId }: { targetId: string }) {
  const handleClick = () => {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <button
      onClick={handleClick}
      aria-label="Scroll down to stories"
      className="flex flex-col items-center gap-1 group"
      style={{ cursor: 'pointer' }}
    >
      {/* Pill label */}
      <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/50 group-hover:text-white/90 transition-colors">
        Explore Stories
      </span>

      {/* Animated chevron */}
      <div
        className="w-8 h-8 rounded-full border border-white/20 group-hover:border-white/60 flex items-center justify-center transition-all group-hover:bg-white/10"
        style={{ animation: 'scroll-bounce 2s ease-in-out infinite' }}
      >
        <ChevronDown size={16} className="text-white/60 group-hover:text-white transition-colors" />
      </div>

      <style>{`
        @keyframes scroll-bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(5px); }
        }
      `}</style>
    </button>
  )
}
