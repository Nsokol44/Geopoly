// app/api/admin/audio/route.ts
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const path = new URL(req.url).searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'No path' }, { status: 400 })

  const { data, error } = await createAdminClient().storage.from('story-media').download(path)
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const ext = path.split('.').pop() ?? 'webm'
  const type = ext === 'mp4' ? 'audio/mp4' : ext === 'ogg' ? 'audio/ogg' : 'audio/webm'
  return new NextResponse(data, {
    headers: { 'Content-Type': type, 'Content-Disposition': `attachment; filename="story-${Date.now()}.${ext}"` },
  })
}
