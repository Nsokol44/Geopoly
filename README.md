# JustGimmeADolla

Real people. Real stories. If it moves you — send a dollar.

## Setup (3 steps)

### 1. Supabase
- Create project at supabase.com
- Run `schema.sql` in SQL Editor
- Then run `supabase/migrations/004_enable_row_level_security.sql` in SQL Editor — this enables **Row Level Security on every table** (stories, tips, admins, reactions + the `story-media` storage policies) and creates the `story-media` bucket if it is missing. Existing projects only need this one file; it is safe to re-run. See [RLS.md](RLS.md) for who can do what and how to verify it.
- Go to Authentication → Users → Add User → create your admin account
- Run: `INSERT INTO admins (email) VALUES ('your@email.com');`

### 2. Stripe + PayPal
- Set every key from `.env.local.example` in Vercel (Production): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE=live`
- **Stripe:** Get secret key from stripe.com/dashboard → Developers → API Keys
  - Add webhook: `https://justgimmeadolla.com/api/tip/stripe/webhook` (or the `geopoly.vercel.app` URL for that deployment) → events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`
  - The webhook is what credits a story after a card tip — without it, Stripe collects but nothing is recorded
- **PayPal:** Create app at developer.paypal.com → get Client ID + Secret (the live app and sandbox app have different credentials)
  - Start with `PAYPAL_MODE=sandbox` for testing; PayPal orders are captured server-side when PayPal returns the buyer, no webhook needed

### 3. Deploy to Vercel
- Push to GitHub
- Import to vercel.com
- Add all env vars from `.env.example`
- Add domain: `justgimmeadolla.com`

## Admin access
- Go to `/admin/login`
- Or type **G → P → A** anywhere on the site

## Dev
```bash
npm install
cp .env.example .env.local
# fill in .env.local
npm run dev
```
