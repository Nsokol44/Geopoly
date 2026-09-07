import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase-server'
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

      {/* Feed */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-black text-2xl text-white mb-8">Latest Stories</h2>
        {stories.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-500 text-lg mb-4">No stories yet. Be the first.</p>
            <Link href="/create" className="text-yellow-400 font-black hover:text-yellow-300">Share yours →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map(s => <StoryCard key={s.id} story={s} />)}
          </div>
        )}
      </section>
      <Footer />
    </div>
  )
}

function StoryCard({ story }: { story: Story }) {
  return (
    <Link href={`/story/${story.id}`}
      className="group block bg-zinc-900 border border-zinc-800 hover:border-yellow-400/50 rounded-2xl overflow-hidden transition-all hover:scale-[1.01]">
      <div className="h-40 bg-zinc-800 flex items-center justify-center overflow-hidden relative">
        {story.cover_image_url
          ? <img src={story.cover_image_url} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#facc15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
              </div>
              <span className="text-zinc-600 text-xs">Voice Story</span>
            </div>
        }
      </div>
      <div className="p-5">
        <h3 className="font-black text-white text-lg leading-tight mb-1 line-clamp-2 group-hover:text-yellow-400 transition-colors">{story.title}</h3>
        <p className="text-zinc-500 text-sm mb-3">by {story.author_name}</p>
        {story.transcript && <p className="text-zinc-600 text-sm line-clamp-2">{story.transcript}</p>}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
          <span className="text-yellow-400 font-black text-sm">
            {story.tip_count > 0 ? `${story.tip_count} tip${story.tip_count !== 1 ? 's' : ''} · $${Number(story.tip_total).toFixed(0)}` : '💛 Send a dolla'}
          </span>
          <span className="text-zinc-700 text-xs">{new Date(story.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
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
