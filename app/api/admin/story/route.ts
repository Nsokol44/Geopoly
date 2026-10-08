// app/api/admin/story/route.ts
// DELETE /api/admin/story?id=… — permanently remove a story.
//
// Guard: a story with COMPLETED tips is never hard-deleted —
// those rows are the payment ledger for money already paid out
// to a creator. The admin gets a 409 and should unpublish
// instead (unpublishing hides the story, keeps the records).
// On success the story's audio (and cover, when it lives in our
// bucket) are removed from storage too; reactions cascade.
import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'

export async function DELETE(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = createAdminClient()
    const { data: admin } = await db.from('admins').select('email').eq('email', user.email!).single()
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const { data: story } = await db
      .from('stories')
      .select('id, audio_upload_path, cover_image_url')
      .eq('id', id)
      .single()
    if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 })

    const { count: paidTips } = await db
      .from('tips')
      .select('*', { count: 'exact', head: true })
      .eq('story_id', id)
      .eq('status', 'completed')
    if ((paidTips ?? 0) > 0) {
      return NextResponse.json(
        { error: `This story has ${paidTips} paid tip${paidTips === 1 ? '' : 's'} on record — unpublish it instead of deleting so the payment history is kept.` },
        { status: 409 },
      )
    }

    // Best-effort storage cleanup before the row goes.
    const paths: string[] = []
    if (story.audio_upload_path) paths.push(story.audio_upload_path)
    if (story.cover_image_url) {
      const marker = '/story-media/'
      const idx = story.cover_image_url.indexOf(marker)
      if (idx >= 0) paths.push(decodeURIComponent(story.cover_image_url.slice(idx + marker.length)))
    }
    if (paths.length) await db.storage.from('story-media').remove(paths)

    const { error } = await db.from('stories').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
