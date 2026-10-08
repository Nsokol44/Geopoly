import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { captureTipById } from '@/lib/paypal-capture'
import { getSiteOrigin } from '@/lib/payments'

export const dynamic = 'force-dynamic'

// PayPal sends the buyer back here after approval, appending
// ?token=<paypal-order-id>&PayerID=<id> to the ?tip= we set.
// Capture server-side, THEN land them on the success page — so
// the money is collected even if they close the tab a second later.
export async function GET(req: Request) {
  const origin = getSiteOrigin(req)
  const { searchParams } = new URL(req.url)
  const tipId = searchParams.get('tip')
  const token = searchParams.get('token')

  if (!tipId) return NextResponse.redirect(`${origin}/`)

  const db = createAdminClient()
  const { data: tip } = await db
    .from('tips')
    .select('story_id, processor_ref')
    .eq('id', tipId)
    .maybeSingle()
  if (!tip) return NextResponse.redirect(`${origin}/`)

  const storyUrl = `${origin}/story/${tip.story_id}`
  // The order PayPal says was approved must be the order we created.
  if (token && tip.processor_ref && token !== tip.processor_ref) {
    return NextResponse.redirect(`${storyUrl}?tip_error=mismatch`)
  }

  try {
    const result = await captureTipById(tipId)
    if (!result.ok) return NextResponse.redirect(`${storyUrl}?tip_error=capture`)
    return NextResponse.redirect(
      `${origin}/tip/success?story=${tip.story_id}&tip=${tipId}&processor=paypal`,
    )
  } catch {
    return NextResponse.redirect(`${storyUrl}?tip_error=capture`)
  }
}
