// lib/payments.ts
// Shared payment logic for the tip flow (Stripe + PayPal).
// Pure helpers are unit-testable; DB helpers take the Supabase
// admin client as an argument (service role — bypasses RLS,
// which is correct here: tips are written only by server routes
// after a payment is verified with the processor).

export const TIP_MIN_CENTS = 100 // $1 — matches the TipSection UI
export const TIP_MAX_CENTS = 50_000 // $500 sanity ceiling per tip

export type Processor = 'stripe' | 'paypal'

export class PaymentConfigError extends Error {
  constructor(varName: string) {
    super(`Payments are not configured: missing ${varName}`)
    this.name = 'PaymentConfigError'
  }
}

export function requirePaymentEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new PaymentConfigError(name)
  return v
}

/**
 * Strictly validate a client-supplied tip amount.
 * Accepts numbers and numeric strings, rounds to whole cents,
 * enforces the $1–$500 range. Anything else is an error —
 * the old routes passed raw JSON through to `amount * 100`,
 * which produced NaN sessions for malformed payloads.
 */
// Single-shape result (not a discriminated union): this project's
// tsconfig has strict:false, under which TS does not narrow
// boolean-discriminated unions, so callers could not typecheck.
export interface TipAmountResult { ok: boolean; amountCents: number; error?: string }

export function parseTipAmount(input: unknown): TipAmountResult {
  const n = typeof input === 'string' ? Number(input) : input
  if (typeof n !== 'number' || !Number.isFinite(n)) {
    return { ok: false, amountCents: 0, error: 'Invalid amount' }
  }
  const amountCents = Math.round(n * 100)
  if (amountCents < TIP_MIN_CENTS) return { ok: false, amountCents: 0, error: 'Minimum tip is $1' }
  if (amountCents > TIP_MAX_CENTS) return { ok: false, amountCents: 0, error: 'Maximum tip is $500' }
  return { ok: true, amountCents }
}

/**
 * Estimated processor fee, in cents. Standard US published rates:
 * Stripe 2.9% + $0.30; PayPal Checkout 3.49% + $0.49.
 * The tipper is charged the full tip; the fee is what the
 * processor keeps, so net = amount - fee is what reaches the pot
 * for the creator. (The old PayPal estimate, 5% + $0.09, matched
 * no published rate and understated PayPal's actual cut.)
 */
export function processorFeeCents(processor: Processor, amountCents: number): number {
  if (processor === 'stripe') return Math.round(amountCents * 0.029) + 30
  return Math.round(amountCents * 0.0349) + 49
}

export function netCents(amountCents: number, feeCents: number): number {
  return Math.max(0, amountCents - feeCents)
}

/**
 * Base URL for success/cancel/return links.
 * Prefer the origin the request actually arrived on — the app is
 * served from both geopoly.vercel.app and justgimmeadolla.com,
 * and the old code read NEXT_PUBLIC_URL (documented nowhere and
 * set nowhere) and silently fell back to one hardcoded domain,
 * which sent PayPal buyers to a return page that might not be
 * this deployment, so their orders were never captured.
 */
export function getSiteOrigin(req?: Request): string {
  if (req) {
    try {
      return new URL(req.url).origin
    } catch { /* fall through to env */ }
  }
  const env = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_URL
  if (env) return env.replace(/\/+$/, '')
  return 'https://geopoly.vercel.app'
}

type AdminDb = ReturnType<typeof import('./supabase-server').createAdminClient>

/**
 * Atomically claim a pending tip and credit its story exactly once.
 * The UPDATE ... WHERE status='pending' is the claim: webhook
 * retries, duplicate events, and capture/return races all funnel
 * through here, and only the caller that flips the row counts it.
 * (The old webhook incremented tip_count/tip_total on every
 * Stripe retry, double-counting tips.)
 */
export async function completeTipOnce(
  db: AdminDb,
  tipId: string,
): Promise<{ completed: boolean; storyId?: string }> {
  const { data: claimed, error } = await db
    .from('tips')
    .update({ status: 'completed' })
    .eq('id', tipId)
    .eq('status', 'pending')
    .select('story_id, net_amount')
    .maybeSingle()
  if (error) throw new Error(`Could not complete tip: ${error.message}`)
  if (!claimed) return { completed: false } // already completed/failed — do not count again

  const { data: story } = await db
    .from('stories')
    .select('tip_count, tip_total')
    .eq('id', claimed.story_id)
    .single()
  if (story) {
    await db
      .from('stories')
      .update({
        tip_count: story.tip_count + 1,
        tip_total: Number(story.tip_total) + Number(claimed.net_amount),
      })
      .eq('id', claimed.story_id)
  }
  return { completed: true, storyId: claimed.story_id }
}

/** Mark a pending tip failed/expired — also exactly once, never overwrites a completion. */
export async function failTipOnce(db: AdminDb, tipId: string): Promise<void> {
  await db
    .from('tips')
    .update({ status: 'failed' })
    .eq('id', tipId)
    .eq('status', 'pending')
}

/**
 * Create the pending tip row BEFORE any money moves, and fail
 * loudly if the row cannot be created. The old routes ignored the
 * insert error and still sent the buyer to checkout, producing
 * payments with no tip record the webhook could ever match.
 */
export async function createPendingTip(
  db: AdminDb,
  args: { storyId: string; processor: Processor; amountCents: number },
): Promise<string> {
  const fee = processorFeeCents(args.processor, args.amountCents)
  const { data, error } = await db
    .from('tips')
    .insert({
      story_id: args.storyId,
      amount: args.amountCents / 100,
      fee_processor: fee / 100,
      fee_platform: 0,
      net_amount: netCents(args.amountCents, fee) / 100,
      processor: args.processor,
      status: 'pending',
    })
    .select('id')
    .single()
  if (error || !data) {
    throw new Error(`Could not record tip: ${error?.message ?? 'insert returned no row'}`)
  }
  return data.id as string
}

/** A story can only be tipped when it is public (approved). */
export async function getTippableStory(
  db: AdminDb,
  storyId: string,
): Promise<{ id: string; title: string; author_name: string } | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storyId)) {
    return null
  }
  const { data } = await db
    .from('stories')
    .select('id, title, author_name')
    .eq('id', storyId)
    .eq('status', 'approved')
    .maybeSingle()
  return data
}
