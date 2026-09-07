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
    const { story_id, amount } = await req.json()
    if (!story_id || !amount || amount < 1) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const db = createAdminClient()
    const { data: story } = await db.from('stories').select('title, author_name').eq('id', story_id).single()
    if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 })

    const origin = process.env.NEXT_PUBLIC_URL ?? 'https://justgimmeadolla.com'
    const processorFee = Number((amount * 0.05 + 0.09).toFixed(2))
    const netAmount = Number((amount - processorFee).toFixed(2))

    const { data: tip } = await db.from('tips').insert({
      story_id, amount, fee_processor: processorFee, fee_platform: 0, net_amount: netAmount, processor: 'paypal', status: 'pending',
    }).select('id').single()

    const token = await getToken()
    const orderRes = await fetch(`${BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{ amount: { currency_code: 'USD', value: amount.toFixed(2) }, description: `Tip for "${story.title}"`, custom_id: `${story_id}|${tip?.id ?? ''}` }],
        application_context: {
          return_url: `${origin}/tip/success?story=${story_id}&tip=${tip?.id}&processor=paypal`,
          cancel_url: `${origin}/story/${story_id}`,
          brand_name: 'JustGimmeADolla', landing_page: 'BILLING', user_action: 'PAY_NOW',
        },
      }),
    })
    const order = await orderRes.json()
    const approveLink = order.links?.find((l: any) => l.rel === 'approve')?.href
    if (!approveLink) throw new Error('No PayPal approve link')
    if (tip?.id) await db.from('tips').update({ processor_ref: order.id }).eq('id', tip.id)
    return NextResponse.json({ url: approveLink })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
