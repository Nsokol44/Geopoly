import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  let event: Stripe.Event
  try { event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!) }
  catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }) }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.CheckoutSession
    const tipId = session.metadata?.tip_id
    const storyId = session.metadata?.story_id
    if (tipId && storyId) {
      const db = createAdminClient()
      await db.from('tips').update({ status: 'completed' }).eq('id', tipId)
      const { data: tip } = await db.from('tips').select('net_amount').eq('id', tipId).single()
      if (tip) {
        const { data: story } = await db.from('stories').select('tip_count,tip_total').eq('id', storyId).single()
        if (story) await db.from('stories').update({ tip_count: story.tip_count + 1, tip_total: Number(story.tip_total) + Number(tip.net_amount) }).eq('id', storyId)
      }
    }
  }
  return NextResponse.json({ ok: true })
}
