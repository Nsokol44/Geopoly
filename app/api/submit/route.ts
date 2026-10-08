import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { insertStory } from '@/lib/story-submit'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    if (!body.title?.trim() || !body.author_name?.trim())
      return NextResponse.json({ error: 'Title and name required' }, { status: 400 })

    const db = createAdminClient()
    const id = await insertStory(db, {
      title: body.title.trim(),
      author_name: body.author_name.trim(),
      author_email: body.author_email,
      audio_upload_path: body.audio_upload_path ?? null,
      cover_image_url: body.cover_image_url ?? null,
    })

    return NextResponse.json({ id }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Internal server error' }, { status: 500 })
  }
}
