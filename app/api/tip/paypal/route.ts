import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { createPayPalOrder } from '@/lib/paypal'
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

    const tipId = await createPendingTip(db, {
      storyId: story.id,
      processor: 'paypal',
      amountCents: parsed.amountCents,
    })

    const origin = getSiteOrigin(req)
    try {
      const { order, approveUrl } = await createPayPalOrder({
        amountCents: parsed.amountCents,
        description: `Tip for "${story.title}"`,
        customId: `${story.id}|${tipId}`,
        // PayPal returns the buyer HERE (server-side GET), which
        // captures the order before redirecting to the success
        // page. It appends ?token=<orderId>&PayerID=<id>.
        returnUrl: `${origin}/api/tip/paypal/return?tip=${tipId}`,
        cancelUrl: `${origin}/story/${story.id}`,
      })
      await db.from('tips').update({ processor_ref: order.id }).eq('id', tipId)
      return NextResponse.json({ url: approveUrl })
    } catch (e) {
      await failTipOnce(db, tipId).catch(() => {})
      throw e
    }
  } catch (e: any) {
    const status = e instanceof PaymentConfigError ? 503 : 500
    return NextResponse.json({ error: e.message ?? 'Payment failed to start' }, { status })
  }
}
