// app/api/reactions/route.ts
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const story_id = searchParams.get('story_id')
  const fingerprint = searchParams.get('fingerprint')
  if (!story_id) return NextResponse.json({ error: 'Missing story_id' }, { status: 400 })

  const supabase = createAdminClient()

  const { data: countData } = await supabase
    .from('story_reaction_counts')
    .select('inspired, seen_this, urgent')
    .eq('story_id', story_id)
    .maybeSingle()

  const counts = {
    inspired:  countData?.inspired  ?? 0,
    seen_this: countData?.seen_this ?? 0,
    urgent:    countData?.urgent    ?? 0,
  }

  let mine: string[] = []
  if (fingerprint) {
    const { data: myData } = await supabase
      .from('story_reactions')
      .select('reaction')
      .eq('story_id', story_id)
      .eq('fingerprint', fingerprint)
    mine = (myData ?? []).map(r => r.reaction)
  }

  return NextResponse.json({ counts, mine })
}

export async function POST(req: Request) {
  const { story_id, reaction, fingerprint } = await req.json()
  if (!story_id || !reaction || !fingerprint) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('story_reactions')
    .insert({ story_id, reaction, fingerprint })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const { story_id, reaction, fingerprint } = await req.json()
  if (!story_id || !reaction || !fingerprint) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('story_reactions')
    .delete()
    .eq('story_id', story_id)
    .eq('reaction', reaction)
    .eq('fingerprint', fingerprint)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
