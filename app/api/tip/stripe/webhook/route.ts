import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase-server'
import { getStripe } from '@/lib/stripe'
import { completeTipOnce, failTipOnce, requirePaymentEnv } from '@/lib/payments'

// Stripe sends this endpoint raw-body requests; never cache it.
export const dynamic = 'force-dynamic'

async function handlePaidSession(session: Stripe.Checkout.Session) {
  const tipId = session.metadata?.tip_id
  if (!tipId) return
  // 'completed' can fire before an async payment actually settles;
  // card sessions are 'paid' synchronously. Anything not paid yet is
  // completed by checkout.session.async_payment_succeeded instead.
  if (session.payment_status !== 'paid') return

  const db = createAdminClient()
  const { data: tip } = await db
    .from('tips')
    .select('amount, status')
    .eq('id', tipId)
    .maybeSingle()
  if (!tip) return
  // Verify the money that moved matches the tip that was recorded —
  // never credit a story on metadata alone.
  const expectedCents = Math.round(Number(tip.amount) * 100)
  if (session.currency !== 'usd' || session.amount_total !== expectedCents) {
    console.error(`Stripe webhook amount mismatch for tip ${tipId}: got ${session.amount_total} ${session.currency}, expected ${expectedCents} usd`)
    return
  }
  await completeTipOnce(db, tipId)
}

export async function POST(req: Request) {
  let secret: string
  try {
    secret = requirePaymentEnv('STRIPE_WEBHOOK_SECRET')
    getStripe() // same clear config error if STRIPE_SECRET_KEY is missing
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 503 })
  }

  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })

  const body = await req.text()
  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret)
  } catch (e: any) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${e.message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await handlePaidSession(event.data.object as Stripe.Checkout.Session)
        break
      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session
        const tipId = session.metadata?.tip_id
        if (tipId) await failTipOnce(createAdminClient(), tipId)
        break
      }
      default:
        break // ACK everything else so Stripe stops retrying it
    }
  } catch (e: any) {
    // 500 makes Stripe retry — right for transient DB failures.
    // Crediting itself is idempotent (completeTipOnce), so a retry
    // after a partial failure can never double-count.
    return NextResponse.json({ error: e.message ?? 'Webhook handling failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
