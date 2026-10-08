// lib/paypal.ts
// Minimal PayPal Checkout (Orders v2) client with real error handling.
// The old routes never checked HTTP status: a bad client id/secret
// produced an undefined access token and a confusing downstream failure.

import { requirePaymentEnv } from './payments'

export function paypalBase(): string {
  return process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
}

export async function getPayPalAccessToken(): Promise<string> {
  const clientId = requirePaymentEnv('PAYPAL_CLIENT_ID')
  const secret = requirePaymentEnv('PAYPAL_CLIENT_SECRET')
  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.access_token) {
    throw new Error(`PayPal auth failed (${res.status}): ${data.error_description ?? data.error ?? 'unknown error'}`)
  }
  return data.access_token as string
}

export interface PayPalOrder {
  id: string
  status?: string
  links?: { rel: string; href: string }[]
  purchase_units?: {
    custom_id?: string
    amount?: { currency_code?: string; value?: string }
    payments?: {
      captures?: { id?: string; status?: string; amount?: { currency_code?: string; value?: string } }[]
    }
  }[]
}

export async function createPayPalOrder(args: {
  amountCents: number
  description: string
  customId: string
  returnUrl: string
  cancelUrl: string
}): Promise<{ order: PayPalOrder; approveUrl: string }> {
  const token = await getPayPalAccessToken()
  const res = await fetch(`${paypalBase()}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: 'USD', value: (args.amountCents / 100).toFixed(2) },
        description: args.description,
        custom_id: args.customId,
      }],
      application_context: {
        return_url: args.returnUrl,
        cancel_url: args.cancelUrl,
        brand_name: 'JustGimmeADolla',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
      },
    }),
  })
  const order = (await res.json().catch(() => ({}))) as PayPalOrder
  if (!res.ok || !order.id) {
    throw new Error(`PayPal order creation failed (${res.status})`)
  }
  const approveUrl = order.links?.find(l => l.rel === 'approve')?.href
  if (!approveUrl) throw new Error('PayPal order created but no approve link returned')
  return { order, approveUrl }
}

export async function getPayPalOrder(orderId: string): Promise<PayPalOrder> {
  const token = await getPayPalAccessToken()
  const res = await fetch(`${paypalBase()}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const order = (await res.json().catch(() => ({}))) as PayPalOrder
  if (!res.ok) throw new Error(`PayPal order lookup failed (${res.status})`)
  return order
}

/**
 * Capture an approved order and verify the captured amount/currency
 * matches what the buyer was charged for. Handles the case where a
 * previous capture attempt already succeeded (ORDER_ALREADY_CAPTURED)
 * by reading the order back instead of erroring — capture is safe
 * to retry, which the return route + success page both rely on.
 */
export async function capturePayPalOrder(orderId: string, expectedCents: number): Promise<{
  captured: boolean
  alreadyCaptured: boolean
}> {
  const token = await getPayPalAccessToken()
  const res = await fetch(`${paypalBase()}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  const body = (await res.json().catch(() => ({}))) as PayPalOrder & {
    details?: { issue?: string }[]
  }

  let order: PayPalOrder = body
  const already = body.details?.some(d => d.issue === 'ORDER_ALREADY_CAPTURED') ?? false
  if (already) {
    order = await getPayPalOrder(orderId)
  } else if (!res.ok) {
    throw new Error(`PayPal capture failed (${res.status}): ${body.details?.[0]?.issue ?? 'unknown error'}`)
  }

  const capture = order.purchase_units?.[0]?.payments?.captures?.[0]
  const capturedAmount = capture?.amount ?? order.purchase_units?.[0]?.amount
  const capturedStatus = capture?.status ?? order.status
  const cents = capturedAmount?.value ? Math.round(Number(capturedAmount.value) * 100) : NaN

  if (capturedStatus !== 'COMPLETED') return { captured: false, alreadyCaptured: already }
  if (capturedAmount?.currency_code !== 'USD' || cents !== expectedCents) {
    throw new Error('PayPal capture amount/currency does not match the tip')
  }
  return { captured: true, alreadyCaptured: already }
}
