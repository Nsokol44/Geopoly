import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body.title?.trim() || !body.author_name?.trim())
      return NextResponse.json({ error: 'Title and name required' }, { status: 400 })

    const db = createAdminClient()
    const { data, error } = await db.from('stories').insert({
      title: body.title.trim(),
      body: '[Voice recording — pending transcription]',
      audio_upload_path: body.audio_upload_path ?? null,
      cover_image_url: body.cover_image_url ?? null,
      author_name: body.author_name.trim(),
      author_email: body.author_email?.trim().toLowerCase() ?? '',
      status: 'pending',
    }).select('id').single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch { return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }
}
