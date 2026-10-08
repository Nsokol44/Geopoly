// app/api/admin/transcribe/route.ts
// POST { id }            → transcribe one story's audio, save text.
// POST { all: true }     → transcribe every story still missing
//                          a transcript (bounded batch).
import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { transcriptionConfigured, transcribeStory, needsTranscript } from '@/lib/transcribe'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = createAdminClient()
    const { data: admin } = await db.from('admins').select('email').eq('email', user.email!).single()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (!transcriptionConfigured()) {
      return NextResponse.json(
        { error: 'Transcription is not configured — add OPENAI_API_KEY to enable it.' },
        { status: 503 },
      )
    }

    const body = await req.json().catch(() => ({}))

    if (body.all === true) {
      const { data: stories } = await db
        .from('stories')
        .select('id, transcript, audio_upload_path')
        .not('audio_upload_path', 'is', null)
        .order('created_at', { ascending: true })
        .limit(200)
      const pending = (stories ?? []).filter(s => needsTranscript(s)).slice(0, 25)
      let done = 0
      const failures: { id: string; error: string }[] = []
      for (const s of pending) {
        try { await transcribeStory(db, s.id); done++ }
        catch (e: any) { failures.push({ id: s.id, error: e?.message ?? 'failed' }) }
      }
      return NextResponse.json({ ok: true, transcribed: done, attempted: pending.length, failures })
    }

    if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const transcript = await transcribeStory(db, body.id)
    return NextResponse.json({ ok: true, transcript })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Internal server error' }, { status: 500 })
  }
}
