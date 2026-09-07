import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

const BASE = process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'

async function getToken() {
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  return (await res.json()).access_token
}

export async function POST(req: Request) {
  try {
    const { tip_id } = await req.json()
    if (!tip_id) return NextResponse.json({ error: 'Missing tip_id' }, { status: 400 })

    const db = createAdminClient()
    const { data: tip } = await db.from('tips').select('*').eq('id', tip_id).single()
    if (!tip || tip.status !== 'pending') return NextResponse.json({ ok: true })

    const token = await getToken()
    const captureRes = await fetch(`${BASE}/v2/checkout/orders/${tip.processor_ref}/capture`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
    const capture = await captureRes.json()

    if (capture.status === 'COMPLETED') {
      await db.from('tips').update({ status: 'completed' }).eq('id', tip_id)
      const { data: story } = await db.from('stories').select('tip_count,tip_total').eq('id', tip.story_id).single()
      if (story) await db.from('stories').update({ tip_count: story.tip_count + 1, tip_total: Number(story.tip_total) + Number(tip.net_amount) }).eq('id', tip.story_id)
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
