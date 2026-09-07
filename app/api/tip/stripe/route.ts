import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-02-24.acacia' })

export async function POST(req: Request) {
  try {
    const { story_id, amount } = await req.json()
    if (!story_id || !amount || amount < 1) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const db = createAdminClient()
    const { data: story } = await db.from('stories').select('title, author_name').eq('id', story_id).single()
    if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 })

    const origin = process.env.NEXT_PUBLIC_URL ?? 'https://justgimmeadolla.com'
    const processorFee = Number((amount * 0.029 + 0.30).toFixed(2))
    const netAmount = Number((amount - processorFee).toFixed(2))

    const { data: tip } = await db.from('tips').insert({
      story_id, amount, fee_processor: processorFee, fee_platform: 0, net_amount: netAmount, processor: 'stripe', status: 'pending',
    }).select('id').single()

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: 'usd', product_data: { name: `Tip for "${story.title}"`, description: `Supporting ${story.author_name} on JustGimmeADolla` }, unit_amount: Math.round(amount * 100) }, quantity: 1 }],
      mode: 'payment',
      success_url: `${origin}/tip/success?story=${story_id}&tip=${tip?.id}&processor=stripe`,
      cancel_url: `${origin}/story/${story_id}`,
      metadata: { story_id, tip_id: tip?.id ?? '' },
    })

    if (tip?.id) await db.from('tips').update({ processor_ref: session.id }).eq('id', tip.id)
    return NextResponse.json({ url: session.url })
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }) }
}
