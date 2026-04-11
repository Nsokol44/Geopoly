# Climate Stories

**National Geographic Society × The Climate Pledge**

A living atlas of climate resilience — geolocated stories from communities navigating a warming world. Built with Next.js 14, Supabase, MapLibre GL, and deployed on Vercel.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Database & Auth | Supabase (Postgres + Row Level Security) |
| Storage | Supabase Storage (images + video uploads) |
| Map | MapLibre GL + OpenStreetMap (free, no API key) |
| Styling | Tailwind CSS (custom `ink`, `earth`, `forest`, `ocean` palette) |
| Fonts | Playfair Display (headings) + Source Serif 4 (body) |
| Deployment | Vercel |

---

## Local Development

### 1. Clone & install

```bash
git clone <your-repo>
cd climate-stories
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and paste + run `supabase/migrations/001_initial_schema.sql`
3. Go to **Storage → New bucket**:
   - Name: `story-media`
   - Make it **public**
4. Go to **Authentication → URL Configuration**:
   - Add `http://localhost:3000/auth/callback` to Redirect URLs
5. Add your admin email(s) to the `admins` table:
   ```sql
   INSERT INTO admins (email) VALUES ('you@utk.edu'), ('yourwife@utk.edu');
   ```

### 3. Configure environment

```bash
cp .env.local.example .env.local
# Fill in your Supabase URL and keys from:
# Supabase Dashboard → Settings → API
```

### 4. Run dev server

```bash
npm run dev
# Open http://localhost:3000
```

---

## Project Structure

```
climate-stories/
├── app/
│   ├── page.tsx                    # Homepage: map + featured stories + stats
│   ├── layout.tsx                  # Root layout, fonts, global styles
│   ├── globals.css                 # Tailwind base + custom CSS
│   ├── not-found.tsx               # 404 page
│   ├── story/[id]/
│   │   ├── page.tsx                # Full story read view
│   │   └── loading.tsx             # Skeleton loader
│   ├── stories/
│   │   ├── page.tsx                # Browse all stories
│   │   └── StoriesFilter.tsx       # Client-side filter + grid
│   ├── submit/
│   │   └── page.tsx                # Multi-step submission form
│   ├── admin/
│   │   ├── page.tsx                # Admin review dashboard
│   │   ├── AdminQueue.tsx          # Approve/reject UI
│   │   └── login/page.tsx          # Magic link login
│   ├── auth/callback/route.ts      # Supabase auth callback
│   └── api/
│       ├── submit/route.ts         # POST story submission
│       ├── stories/route.ts        # GET stories (map + full)
│       ├── stats/route.ts          # GET country stats
│       └── admin/review/route.ts   # POST approve/reject
├── components/
│   ├── map/
│   │   ├── MapSection.tsx          # Main MapLibre map with clustering + heatmap
│   │   ├── MapControls.tsx         # View toggle, category filter, locate button
│   │   ├── MapPopup.tsx            # Story popup overlay
│   │   └── LocationPicker.tsx      # Click-to-pick map for submission form
│   ├── stories/
│   │   ├── FeaturedStories.tsx     # Hero + grid card layout
│   │   └── GlobalStats.tsx         # Stats bar with country breakdown
│   └── ui/
│       ├── SiteHeader.tsx          # Nav with mobile drawer
│       ├── SiteFooter.tsx          # Footer with links
│       └── CategoryBadge.tsx       # Colored category pill
├── lib/
│   ├── supabase.ts                 # Browser + server + admin Supabase clients
│   ├── queries.ts                  # All data fetching functions
│   ├── utils.ts                    # Helpers: video embed, geocode, date format
│   └── database.types.ts           # TypeScript types for Supabase schema
├── types/index.ts                  # Shared app types
├── supabase/migrations/
│   └── 001_initial_schema.sql      # Full DB schema + RLS + views
├── tailwind.config.js
├── next.config.js
├── vercel.json
└── .env.local.example
```

---

## Key Features

### 🗺️ Interactive World Map
- **MapLibre GL** with OpenStreetMap tiles (dark-mode toned)
- Automatic **point clustering** — click clusters to zoom in
- Toggle between **individual pins** and **heat map** view
- Filter pins by **category** (Energy, Nature, Built, Weather)
- **Geolocation button** — zooms to user's location
- Click any pin to see a **story popup** with link to full read

### 📖 Story Pages
- Full story text with video embed (YouTube/Vimeo) or uploaded video
- View count tracking (non-blocking)
- Tags with search links
- Location card with "View on Map" link

### 📝 Multi-Step Submission Form
- **5 steps**: Story content → Media → Location → Author → Review
- **Drag-and-drop** cover image upload to Supabase Storage
- **YouTube/Vimeo URL** or **direct video file upload**
- **Click-to-pick** location map with reverse geocoding via Nominatim (OSM, free)
- Auto-detect location button
- Client-side validation before each step advance

### 🛠️ Admin Dashboard
- Magic-link email authentication (no passwords)
- Review queue shows all pending stories
- Expand to read full story body before deciding
- **Approve**, **Reject**, or **Approve & Feature** (puts on homepage)
- Protected by both Supabase Auth + admin email allowlist

### 📊 Global Stats Bar
- Total story count, country count
- Per-category breakdowns
- Top countries by story volume with filter links

---

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/you/climate-stories.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` → your Vercel domain, e.g. `https://climate-stories.vercel.app`
4. Deploy

### 3. Update Supabase redirect URLs

After getting your Vercel domain, add it to Supabase:
- Dashboard → Authentication → URL Configuration
- Add `https://your-domain.vercel.app/auth/callback`

---

## Regenerate Supabase Types

When you change the schema, regenerate types with:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts
```

---

## Design System

All colors are defined as Tailwind custom tokens:

| Token | Usage |
|-------|-------|
| `ink-950` → `ink-50` | Backgrounds, text (dark warm black → off-white) |
| `earth-400` → `earth-700` | Accents, CTAs (NatGeo amber-gold) |
| `forest-*` | Success states, nature category |
| `ocean-*` | Reserved for future use |

Category colors (also in CSS variables):
- **Energy Transition** → `#F59E0B` (amber)
- **Nature & Land** → `#10B981` (emerald)
- **Built & Human** → `#6366F1` (indigo)
- **Extreme Weather** → `#EF4444` (red)

Fonts:
- **Display** → Playfair Display (headlines)
- **Body** → Source Serif 4 (prose, UI)
- **Mono** → JetBrains Mono (labels, metadata)
