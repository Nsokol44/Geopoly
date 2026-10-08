import { NextResponse } from 'next/server'
import { captureTipById } from '@/lib/paypal-capture'
import { PaymentConfigError } from '@/lib/payments'

// Idempotent capture — the success page calls this as a fallback
// when the server-side return redirect could not, and retries are
// safe (an already-captured order reads back as completed).
export async function POST(req: Request) {
  try {
    const { tip_id } = await req.json().catch(() => ({}))
    if (!tip_id) return NextResponse.json({ error: 'Missing tip_id' }, { status: 400 })
    const result = await captureTipById(String(tip_id))
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json({ ok: true, already_completed: result.alreadyCompleted })
  } catch (e: any) {
    const status = e instanceof PaymentConfigError ? 503 : 500
    return NextResponse.json({ error: e.message ?? 'Capture failed' }, { status })
  }
}
