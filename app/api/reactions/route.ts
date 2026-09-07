import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import type { ReactionType } from '@/types'

const REACTIONS: ReactionType[] = ['inspired', 'seen_this', 'urgent']

function emptyCounts(): Record<ReactionType, number> {
  return { inspired: 0, seen_this: 0, urgent: 0 }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const storyId = searchParams.get('story_id')
    const fingerprint = searchParams.get('fingerprint')

    if (!storyId) {
      return NextResponse.json({ error: 'story_id required' }, { status: 400 })
    }

    const db = createAdminClient()

    const { data, error } = await db
      .from('reactions')
      .select('reaction, fingerprint')
      .eq('story_id', storyId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const counts = emptyCounts()
    const mine: ReactionType[] = []

    for (const row of data ?? []) {
      const reaction = row.reaction as ReactionType
      if (!REACTIONS.includes(reaction)) continue
      counts[reaction] += 1
      if (fingerprint && row.fingerprint === fingerprint) mine.push(reaction)
    }

    return NextResponse.json({ counts, mine })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { story_id, reaction, fingerprint } = body

    if (!story_id || !fingerprint || !REACTIONS.includes(reaction)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const db = createAdminClient()

    // Upsert so double-clicks / retries don't error on the unique constraint
    const { error } = await db
      .from('reactions')
      .upsert(
        { story_id, reaction, fingerprint },
        { onConflict: 'story_id,reaction,fingerprint', ignoreDuplicates: true }
      )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json()
    const { story_id, reaction, fingerprint } = body

    if (!story_id || !fingerprint || !REACTIONS.includes(reaction)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const db = createAdminClient()

    const { error } = await db
      .from('reactions')
      .delete()
      .eq('story_id', story_id)
      .eq('reaction', reaction)
      .eq('fingerprint', fingerprint)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
