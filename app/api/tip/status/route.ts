import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

// Receipt lookup for the success page: the tip id is the buyer's
// unguessable UUID receipt token from their own redirect. Returns
// only the fields a receipt needs — never processor references.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tipId = searchParams.get('tip')
  if (!tipId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tipId)) {
    return NextResponse.json({ error: 'Invalid tip id' }, { status: 400 })
  }
  const db = createAdminClient()
  const { data: tip } = await db
    .from('tips')
    .select('status, processor, amount, story_id')
    .eq('id', tipId)
    .maybeSingle()
  if (!tip) return NextResponse.json({ error: 'Tip not found' }, { status: 404 })
  return NextResponse.json({
    status: tip.status,
    processor: tip.processor,
    amount: Number(tip.amount),
    story_id: tip.story_id,
  })
}
