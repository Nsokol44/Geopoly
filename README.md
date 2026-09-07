# JustGimmeADolla

Real people. Real stories. If it moves you — send a dollar.

## Setup (3 steps)

### 1. Supabase
- Create project at supabase.com
- Run `schema.sql` in SQL Editor
- Create storage bucket named `story-media` (public: YES)
- Go to Authentication → Users → Add User → create your admin account
- Run: `INSERT INTO admins (email) VALUES ('your@email.com');`

### 2. Stripe + PayPal
- **Stripe:** Get secret key from stripe.com/dashboard → Developers → API Keys
  - Add webhook: `https://justgimmeadolla.com/api/tip/stripe/webhook` → event: `checkout.session.completed`
- **PayPal:** Create app at developer.paypal.com → get Client ID + Secret
  - Start with `PAYPAL_MODE=sandbox` for testing

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
