// app/api/cover/[id]/route.ts
// Serves an APPROVED story's cover image from the private
// storage bucket (direct public URLs fail — see lib/media.ts).
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { storagePathFromUrl, IMAGE_TYPES } from '@/lib/media'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = createAdminClient()

  const { data: story } = await db
    .from('stories')
    .select('cover_image_url, status')
    .eq('id', id)
    .single()
  const path = story && story.status === 'approved' ? storagePathFromUrl(story.cover_image_url) : null
  if (!path) return NextResponse.json({ error: 'Cover not found' }, { status: 404 })

  const { data, error } = await db.storage.from('story-media').download(path)
  if (error || !data) return NextResponse.json({ error: 'Cover not found' }, { status: 404 })

  const ext = path.split('.').pop()?.toLowerCase() ?? 'jpg'
  return new NextResponse(await data.arrayBuffer(), {
    headers: {
      'Content-Type': IMAGE_TYPES[ext] ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
