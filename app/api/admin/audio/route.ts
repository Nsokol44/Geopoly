// app/api/admin/audio/route.ts
// Streams audio from Supabase storage to the admin browser
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'No path' }, { status: 400 })

  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from('story-media')
    .download(path)

  if (error || !data) {
    return NextResponse.json({ error: 'Audio not found' }, { status: 404 })
  }

  const ext = path.split('.').pop() ?? 'webm'
  const contentType = ext === 'mp4' ? 'audio/mp4' : ext === 'ogg' ? 'audio/ogg' : 'audio/webm'

  return new NextResponse(data, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="story-${Date.now()}.${ext}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
