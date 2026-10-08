// lib/paypal-capture.ts
// Shared by POST /api/tip/paypal/capture (success-page retry) and
// GET /api/tip/paypal/return (the server-side PayPal return).
// Capturing in the return redirect, server-side, is what actually
// collects the money — the old flow only captured from a
// fire-and-forget fetch in the browser, so closing the tab on the
// success page meant the approved order expired uncaptured and
// the creator was never paid.
import { createAdminClient } from './supabase-server'
import { completeTipOnce } from './payments'
import { capturePayPalOrder } from './paypal'

// Single-shape result: strict:false in tsconfig means TS will not
// narrow a boolean-discriminated union at the call sites.
export interface CaptureResult {
  ok: boolean
  alreadyCompleted?: boolean
  storyId?: string
  error?: string
  status?: number
}

export async function captureTipById(tipId: string): Promise<CaptureResult> {
  const db = createAdminClient()
  const { data: tip } = await db
    .from('tips')
    .select('id, story_id, amount, status, processor, processor_ref')
    .eq('id', tipId)
    .maybeSingle()

  if (!tip) return { ok: false, error: 'Tip not found', status: 404 }
  if (tip.processor !== 'paypal') return { ok: false, error: 'Tip is not a PayPal tip', status: 400 }
  if (tip.status === 'completed') return { ok: true, alreadyCompleted: true, storyId: tip.story_id }
  if (tip.status !== 'pending') return { ok: false, error: `Tip is ${tip.status}`, status: 409 }
  if (!tip.processor_ref) return { ok: false, error: 'Tip has no PayPal order', status: 409 }

  const result = await capturePayPalOrder(tip.processor_ref, Math.round(Number(tip.amount) * 100))
  if (!result.captured) {
    return { ok: false, error: 'PayPal capture did not complete', status: 402 }
  }
  const done = await completeTipOnce(db, tipId)
  return { ok: true, alreadyCompleted: !done.completed, storyId: tip.story_id }
}
