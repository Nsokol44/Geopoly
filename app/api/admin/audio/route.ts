// app/api/admin/audio/route.ts
// Streams a story's audio to the admin player.
//
// The old version returned the file with
// `Content-Disposition: attachment` and no Range support. Browsers
// (Safari on iOS in particular) refuse to play media served that
// way — attachment means "download this", and iOS requires byte
// ranges to play at all — so the admin player just showed an
// error. Now: inline disposition, Accept-Ranges, 206 responses.
// It also had NO auth check: anyone could fetch any file in the
// bucket through this route by guessing a path. Admin-only now.
import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import { parseRange } from '@/lib/range'

export const dynamic = 'force-dynamic'

const TYPES: Record<string, string> = {
  webm: 'audio/webm',
  mp4: 'audio/mp4',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const path = url.searchParams.get('path')
  const asDownload = url.searchParams.get('download') === '1'
  if (!path) return NextResponse.json({ error: 'No path' }, { status: 400 })
  if (path.includes('..')) return NextResponse.json({ error: 'Invalid path' }, { status: 400 })

  // Same gate as every other admin route: signed in AND in `admins`.
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  const db = createAdminClient()
  const { data: admin } = await db.from('admins').select('email').eq('email', user.email!).maybeSingle()
  if (!admin) return NextResponse.json({ error: 'Admins only' }, { status: 403 })

  const { data, error } = await db.storage.from('story-media').download(path)
  if (error || !data) return NextResponse.json({ error: 'Audio not found' }, { status: 404 })

  const buffer = Buffer.from(await data.arrayBuffer())
  const ext = path.split('.').pop()?.toLowerCase() ?? 'webm'
  const filename = `story.${ext}`
  const baseHeaders: Record<string, string> = {
    'Content-Type': TYPES[ext] ?? 'application/octet-stream',
    'Content-Disposition': asDownload ? `attachment; filename="${filename}"` : 'inline',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, max-age=3600',
  }

  const range = parseRange(req.headers.get('range'), buffer.length)
  if (range) {
    const body = buffer.subarray(range.start, range.end + 1)
    return new NextResponse(body, {
      status: 206,
      headers: {
        ...baseHeaders,
        'Content-Range': `bytes ${range.start}-${range.end}/${buffer.length}`,
        'Content-Length': String(body.length),
      },
    })
  }
  return new NextResponse(buffer, {
    headers: { ...baseHeaders, 'Content-Length': String(buffer.length) },
  })
}
