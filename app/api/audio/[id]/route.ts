// app/api/audio/[id]/route.ts
// Public playback for an APPROVED story's audio, streamed
// through the server (the storage bucket is private, so direct
// public URLs fail). Inline + Range responses, same as the
// admin player — iOS Safari requires both to press play.
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { parseRange } from '@/lib/range'
import { AUDIO_TYPES } from '@/lib/media'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createAdminClient()

  const { data: story } = await db
    .from('stories')
    .select('audio_upload_path, status')
    .eq('id', id)
    .single()
  if (!story || story.status !== 'approved' || !story.audio_upload_path) {
    return NextResponse.json({ error: 'Audio not found' }, { status: 404 })
  }

  const { data, error } = await db.storage.from('story-media').download(story.audio_upload_path)
  if (error || !data) return NextResponse.json({ error: 'Audio not found' }, { status: 404 })

  const buffer = Buffer.from(await data.arrayBuffer())
  const ext = story.audio_upload_path.split('.').pop()?.toLowerCase() ?? 'webm'
  const headers: Record<string, string> = {
    'Content-Type': AUDIO_TYPES[ext] ?? 'application/octet-stream',
    'Content-Disposition': 'inline',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=3600',
  }

  const range = parseRange(req.headers.get('range'), buffer.length)
  if (range) {
    const body = buffer.subarray(range.start, range.end + 1)
    return new NextResponse(body, {
      status: 206,
      headers: {
        ...headers,
        'Content-Range': `bytes ${range.start}-${range.end}/${buffer.length}`,
        'Content-Length': String(body.length),
      },
    })
  }
  return new NextResponse(buffer, { headers: { ...headers, 'Content-Length': String(buffer.length) } })
}
