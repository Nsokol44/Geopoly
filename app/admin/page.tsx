// app/admin/page.tsx
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPendingStories } from '@/lib/queries'
import { AdminQueue } from './AdminQueue'
import { SiteHeader } from '@/components/ui/SiteHeader'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Must be logged in
  if (!user) redirect('/admin/login')

  // Must be in admins table
  const { data: admin } = await supabase
    .from('admins')
    .select('email')
    .eq('email', user.email!)
    .single()

  if (!admin) redirect('/')

  const pending = await getPendingStories()

  return (
    <div className="min-h-screen bg-ink-950">
      <SiteHeader />
      <main className="pt-16">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="mb-10">
            <p className="font-mono text-xs tracking-[0.3em] text-brand-400 uppercase mb-2">
              Admin Dashboard
            </p>
            <h1 className="font-display text-4xl text-ink-50 mb-2">Review Queue</h1>
            <p className="text-ink-500">
              {pending.length} {pending.length === 1 ? 'story' : 'stories'} awaiting review
            </p>
          </div>

          <AdminQueue stories={pending} />
        </div>
      </main>
    </div>
  )
}
