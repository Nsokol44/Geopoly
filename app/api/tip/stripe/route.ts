import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { getStripe } from '@/lib/stripe'
import {
  PaymentConfigError,
  createPendingTip,
  failTipOnce,
  getSiteOrigin,
  getTippableStory,
  parseTipAmount,
} from '@/lib/payments'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const parsed = parseTipAmount(body.amount)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }
    if (!body.story_id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const db = createAdminClient()
    const story = await getTippableStory(db, String(body.story_id))
    if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 })

    // Record first, charge second: a payment with no tip row is a
    // payment the webhook can never credit.
    const tipId = await createPendingTip(db, {
      storyId: story.id,
      processor: 'stripe',
      amountCents: parsed.amountCents,
    })

    const origin = getSiteOrigin(req)
    try {
      const session = await getStripe().checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Tip for "${story.title}"`,
              description: `Supporting ${story.author_name} on JustGimmeADolla`,
            },
            unit_amount: parsed.amountCents,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${origin}/tip/success?story=${story.id}&tip=${tipId}&processor=stripe&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/story/${story.id}`,
        metadata: { story_id: story.id, tip_id: tipId },
        payment_intent_data: { metadata: { story_id: story.id, tip_id: tipId } },
      })
      if (!session.url) throw new Error('Stripe session created without a URL')
      await db.from('tips').update({ processor_ref: session.id }).eq('id', tipId)
      return NextResponse.json({ url: session.url })
    } catch (e) {
      await failTipOnce(db, tipId).catch(() => {})
      throw e
    }
  } catch (e: any) {
    const status = e instanceof PaymentConfigError ? 503 : 500
    return NextResponse.json({ error: e.message ?? 'Payment failed to start' }, { status })
  }
}
