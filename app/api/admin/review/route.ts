// app/api/admin/review/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    // Verify session
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify admin using admin client (bypasses RLS)
    const adminDb = createAdminClient()
    const { data: admin } = await adminDb
      .from('admins')
      .select('email')
      .eq('email', user.email!)
      .single()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id, status, featured } = await req.json()
    if (!id || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const { error } = await adminDb
      .from('stories')
      .update({
        status,
        featured: status === 'approved' ? Boolean(featured) : false,
      })
      .eq('id', id)

    if (error) {
      console.error('Admin review error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Admin review route error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
