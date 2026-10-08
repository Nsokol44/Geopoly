import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-server'
import { DailyLoop } from '@/components/daily/DailyLoop'
import { StoryOfTheDay } from '@/components/daily/StoryOfTheDay'
import { StoriesExplorer } from '@/components/home/StoriesExplorer'
import type { Story } from '@/types'

export const revalidate = 60

async function getData() {
  const db = createAdminClient()
  const [{ data: stories }, { count }, { data: tips }] = await Promise.all([
    db.from('stories').select('*').eq('status', 'approved').order('created_at', { ascending: false }).limit(24),
    db.from('stories').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    db.from('tips').select('net_amount').eq('status', 'completed'),
  ])
  const totalPaid = (tips ?? []).reduce((s, t) => s + Number(t.net_amount), 0)
  return { stories: (stories ?? []) as Story[], storyCount: count ?? 0, totalPaid }
}

export default async function HomePage() {
  const { stories, storyCount, totalPaid } = await getData()

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      {/* Hero */}
      <section className="border-b border-zinc-800 py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-block bg-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-widest px-3 py-1 rounded-full mb-6">
            Voice Stories
          </div>
          <h1 className="font-black text-6xl md:text-8xl text-white mb-4 leading-none tracking-tight">
            Just Gimme<br /><span className="text-yellow-400">A Dolla</span>
          </h1>
          <p className="text-zinc-400 text-xl mb-8">Real people. Real stories. If it moves you — send a dollar.</p>
          <div className="flex items-center justify-center gap-8 mb-10">
            <div className="text-center">
              <p className="text-4xl font-black text-white">{storyCount}</p>
              <p className="text-zinc-500 text-xs uppercase tracking-wider mt-1">Stories</p>
            </div>
            <div className="w-px h-12 bg-zinc-800" />
            <div className="text-center">
              <p className="text-4xl font-black text-yellow-400">${totalPaid.toFixed(0)}</p>
              <p className="text-zinc-500 text-xs uppercase tracking-wider mt-1">Sent to Creators</p>
            </div>
          </div>
          <Link href="/create" className="inline-block bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-black text-sm uppercase tracking-wider px-8 py-4 rounded-full transition-colors">
            Share Your Story →
          </Link>
        </div>
      </section>

      <DailyLoop />
      <StoryOfTheDay stories={stories} />

      {/* Feed + map, filterable by country */}
      <StoriesExplorer stories={stories} />
      <Footer />
    </div>
  )
}

function Header() {
  return (
    <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-yellow-400 text-zinc-950 font-black text-xs px-2 py-1 rounded">$1</div>
          <span className="font-black text-white hidden sm:inline">JustGimmeADolla</span>
        </Link>
        <Link href="/create" className="bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-black text-sm px-5 py-2 rounded-full transition-colors">
          Share Your Story
        </Link>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="border-t border-zinc-800 py-8 px-6 text-center">
      <p className="text-zinc-700 text-sm">Real stories. Zero BS. · <Link href="/admin/login" className="hover:text-zinc-500 transition-colors">Admin</Link></p>
    </footer>
  )
}
