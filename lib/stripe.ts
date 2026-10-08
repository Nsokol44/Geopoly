// lib/stripe.ts
// Lazy Stripe client: constructing it inside the handler (not at
// module load) means a missing key produces one clear config
// error from the route instead of crashing the module import,
// and the webhook route can share the same instance rules.
import Stripe from 'stripe'
import { requirePaymentEnv } from './payments'

let client: Stripe | null = null

export function getStripe(): Stripe {
  if (!client) {
    client = new Stripe(requirePaymentEnv('STRIPE_SECRET_KEY'), {
      apiVersion: '2025-02-24.acacia',
    })
  }
  return client
}
