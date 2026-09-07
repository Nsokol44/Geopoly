import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { AdminQueue } from './AdminQueue'
import type { Story } from '@/types'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const db = createAdminClient()
  const { data: admin } = await db.from('admins').select('email').eq('email', user.email!).single()
  if (!admin) redirect('/admin/login')

  const { data: pending } = await db.from('stories').select('*').eq('status', 'pending').order('created_at', { ascending: true })

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-400 text-zinc-950 font-black text-xs px-2 py-1 rounded">$1</div>
            <span className="font-black text-white">Admin</span>
          </div>
          <span className="text-zinc-500 text-sm">{pending?.length ?? 0} pending</span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="font-black text-4xl text-white mb-2">Review Queue</h1>
        <p className="text-zinc-500 mb-8">{pending?.length ?? 0} {pending?.length === 1 ? 'story' : 'stories'} awaiting review</p>
        <AdminQueue stories={(pending ?? []) as Story[]} />
      </main>
    </div>
  )
}
