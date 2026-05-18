// app/api/admin/transcript/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminDb = createAdminClient()
  const { data: admin } = await adminDb
    .from('admins').select('email').eq('email', user.email!).single()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, transcript } = await req.json()
  if (!id || transcript === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { error } = await adminDb
    .from('stories')
    .update({
      transcript: transcript.trim(),
      body: transcript.trim() || '[Voice recording — pending transcription]',
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
