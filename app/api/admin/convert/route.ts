// app/api/admin/convert/route.ts
// Stores an MP3 the admin's browser produced from a story's
// original recording (see lib/convert-client.ts): uploads it
// next to the original, points the story at it, and removes
// the old file. The conversion itself happens client-side —
// the server never runs ffmpeg.
import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = createAdminClient()
    const { data: admin } = await db.from('admins').select('email').eq('email', user.email!).single()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const form = await req.formData()
    const id = form.get('id')
    const file = form.get('file')
    if (typeof id !== 'string' || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Missing id or file' }, { status: 400 })
    }
    if (file.size === 0 || file.size > 30 * 1024 * 1024) {
      return NextResponse.json({ error: 'Converted file is empty or too large' }, { status: 400 })
    }

    const { data: story } = await db.from('stories').select('id, audio_upload_path').eq('id', id).single()
    if (!story?.audio_upload_path) return NextResponse.json({ error: 'Story has no audio' }, { status: 404 })
    if (story.audio_upload_path.toLowerCase().endsWith('.mp3')) {
      return NextResponse.json({ ok: true, path: story.audio_upload_path, already: true })
    }

    const newPath = story.audio_upload_path.replace(/\.[a-z0-9]+$/i, '') + '.mp3'
    const bytes = new Uint8Array(await file.arrayBuffer())
    const { error: upError } = await db.storage.from('story-media').upload(newPath, bytes, {
      contentType: 'audio/mpeg',
      upsert: true,
    })
    if (upError) return NextResponse.json({ error: `Upload failed: ${upError.message}` }, { status: 500 })

    const { error: dbError } = await db.from('stories').update({ audio_upload_path: newPath }).eq('id', id)
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

    // Old recording is replaced — remove it so the bucket
    // doesn't accumulate two copies of every story.
    await db.storage.from('story-media').remove([story.audio_upload_path])

    return NextResponse.json({ ok: true, path: newPath })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Internal server error' }, { status: 500 })
  }
}
