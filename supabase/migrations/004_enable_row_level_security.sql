-- ============================================================
-- Migration 004: Row Level Security for every table
-- Geopoly / JustGimmeADolla
-- ============================================================
-- WHY THIS MIGRATION EXISTS
-- -------------------------
-- RLS was only partially applied before this migration:
--   * `admins` had RLS enabled NOWHERE (schema.sql or 001).
--     Anyone holding the public anon key could read the admin
--     email list via PostgREST -- and, where grants allowed,
--     insert themselves as an admin.
--   * `tips` existed only in schema.sql (no migration), with
--     "Public insert tips" WITH CHECK (true): anyone could
--     insert a fake `completed` tip with the anon key.
--   * `stories` public INSERT only checked status = 'pending',
--     so an anon caller could set featured = true or pre-fill
--     tip_count / tip_total / view_count on a new story.
--     The "Admins full access" policy existed in 001 but was
--     missing from schema.sql, so the two install paths diverged.
--   * Storage policies existed only in schema.sql and allowed
--     uploads of anything, to any path, in `story-media`.
--   * `country_stats` / `map_stories` views bypass the RLS of
--     the underlying table by default, and
--     `increment_view_count` was SECURITY DEFINER with no
--     search_path pin and no status check.
--   * `reactions` was the one table already done right:
--     RLS enabled, no public policies, service-role only.
--
-- ACCESS MODEL (matches how the app actually works)
-- --------------------------------------------------
-- Almost everything server-side uses the service-role key
-- (lib/supabase-server.ts createAdminClient()), which bypasses
-- RLS by design: homepage, story page, /api/submit, /api/tip/*,
-- /api/reactions, and the admin queue after an explicit
-- `admins` check in the route. Those paths keep working.
--
-- The anon key is public by design and ships to the browser.
-- Browser-direct database access is exactly ONE thing:
-- uploading audio / cover files to Storage from /create.
-- Everything below therefore locks PostgREST down to:
--
--   stories    anon/authenticated can READ approved stories
--              and INSERT a genuinely-new pending story
--              (not featured, zero tips, zero views).
--              Only admins (authenticated, listed in `admins`)
--              can read pending/rejected stories, update, delete.
--   tips       No anon access at all. Authenticated admins can
--              read. All writes are service-role only, after a
--              payment has been verified server-side.
--   admins     No anon access. An authenticated user can read
--              only their own row. The list itself is managed
--              only via the SQL editor / service role, so nobody
--              can self-promote with the anon or their own key.
--   reactions  No client access at all. Service-role only,
--              via /api/reactions (unchanged from 003).
--   storage    Public read of `story-media` (public bucket).
--              Anon/authenticated INSERT only under the
--              `audio/` and `covers/` prefixes the /create
--              page actually uses. Update/delete: admins only.
--
-- This migration is idempotent: it can be run on a project set
-- up from schema.sql, from migrations 001-003, or re-run safely.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Schema convergence
-- The two historical install paths (schema.sql vs 001-003)
-- created slightly different `stories` shapes, and `tips`
-- was missing from the migrations entirely. Converge first so
-- the policies below can reference every column they check.
-- All additions are nullable or defaulted: nothing existing breaks.
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS transcript        TEXT,
  ADD COLUMN IF NOT EXISTS audio_upload_path TEXT,
  ADD COLUMN IF NOT EXISTS tip_count         INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tip_total         NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS excerpt           TEXT,
  ADD COLUMN IF NOT EXISTS category          TEXT,
  ADD COLUMN IF NOT EXISTS video_url         TEXT,
  ADD COLUMN IF NOT EXISTS video_upload_path TEXT,
  ADD COLUMN IF NOT EXISTS latitude          DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude         DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_name     TEXT,
  ADD COLUMN IF NOT EXISTS country_code      TEXT,
  ADD COLUMN IF NOT EXISTS country_name      TEXT,
  ADD COLUMN IF NOT EXISTS author_bio        TEXT,
  ADD COLUMN IF NOT EXISTS age_range         TEXT,
  ADD COLUMN IF NOT EXISTS tags              TEXT[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.tips (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  story_id       UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  amount         NUMERIC(10,2) NOT NULL,
  fee_processor  NUMERIC(10,2) NOT NULL DEFAULT 0,
  fee_platform   NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_amount     NUMERIC(10,2) NOT NULL,
  processor      TEXT NOT NULL CHECK (processor IN ('stripe','paypal')),
  processor_ref  TEXT,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded'))
);

CREATE TABLE IF NOT EXISTS public.admins (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  story_id    UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  reaction    TEXT NOT NULL CHECK (reaction IN ('inspired', 'seen_this', 'urgent')),
  fingerprint TEXT NOT NULL,
  UNIQUE (story_id, reaction, fingerprint)
);

-- ------------------------------------------------------------
-- 1. Admin helper
-- SECURITY DEFINER so policies can check the `admins` list
-- without the caller needing read access to the whole table,
-- and without policy recursion on `admins` itself.
-- search_path is pinned (advisor: function_search_path_mutable).
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins a
    WHERE lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- ------------------------------------------------------------
-- 2. Enable RLS on every public table
-- ------------------------------------------------------------
ALTER TABLE public.stories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 3. stories policies
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Public read approved"          ON public.stories;
DROP POLICY IF EXISTS "Public submit"                 ON public.stories;
DROP POLICY IF EXISTS "Public read approved stories"  ON public.stories;
DROP POLICY IF EXISTS "Public can submit stories"     ON public.stories;
DROP POLICY IF EXISTS "Admins full access"            ON public.stories;
DROP POLICY IF EXISTS "stories_public_read_approved"  ON public.stories;
DROP POLICY IF EXISTS "stories_public_insert_pending" ON public.stories;
DROP POLICY IF EXISTS "stories_admin_read"            ON public.stories;
DROP POLICY IF EXISTS "stories_admin_update"          ON public.stories;
DROP POLICY IF EXISTS "stories_admin_delete"          ON public.stories;

-- Anyone may read approved stories (map, feed, story pages
-- served with the anon key keep working if they ever use it).
CREATE POLICY "stories_public_read_approved"
  ON public.stories FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

-- Admins may read stories in any status (review queue).
CREATE POLICY "stories_admin_read"
  ON public.stories FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Anyone may submit, but only a brand-new pending story:
-- no self-approving, no self-featuring, no inflated counters.
CREATE POLICY "stories_public_insert_pending"
  ON public.stories FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND featured = false
    AND tip_count = 0
    AND tip_total = 0
    AND view_count = 0
  );

-- Only admins may change or remove a story
-- (approve / reject / feature / edit transcript).
CREATE POLICY "stories_admin_update"
  ON public.stories FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "stories_admin_delete"
  ON public.stories FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------
-- 4. tips policies
-- All tip rows are created/updated by server routes with the
-- service-role key after Stripe/PayPal verification. No client
-- role ever writes a tip, and processor references are not
-- public data, so there is deliberately no anon policy.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Public read tips"     ON public.tips;
DROP POLICY IF EXISTS "Public insert tips"   ON public.tips;
DROP POLICY IF EXISTS "tips_admin_read"      ON public.tips;

CREATE POLICY "tips_admin_read"
  ON public.tips FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------
-- 5. admins policies
-- Deliberately does NOT use public.is_admin() (that would
-- recurse: the function is definer-rights, but the row policy
-- stays direct and auditable). A signed-in user can see only
-- the row that is their own email; nobody can insert, update
-- or delete through PostgREST -- manage the list in the
-- SQL editor: INSERT INTO public.admins (email) VALUES (...);
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "admins_read_own" ON public.admins;

CREATE POLICY "admins_read_own"
  ON public.admins FOR SELECT
  TO authenticated
  USING (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- ------------------------------------------------------------
-- 6. reactions policies
-- None, on purpose (as in 003): RLS is enabled and with no
-- policy for anon/authenticated the table is closed to them.
-- /api/reactions uses the service-role key.
-- ------------------------------------------------------------

-- ------------------------------------------------------------
-- 7. Table grants (defense in depth, on top of RLS)
-- RLS decides which ROWS a role can touch; grants decide which
-- OPERATIONS it may attempt at all. Strip both down to the
-- access model above. service_role keeps full access and
-- bypasses RLS, so all existing server routes are unaffected.
-- ------------------------------------------------------------
REVOKE ALL ON public.stories FROM anon, authenticated;
GRANT SELECT, INSERT ON public.stories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stories TO authenticated;
GRANT ALL ON public.stories TO service_role;

REVOKE ALL ON public.tips FROM anon, authenticated;
GRANT SELECT ON public.tips TO authenticated;
GRANT ALL ON public.tips TO service_role;

REVOKE ALL ON public.admins FROM anon, authenticated;
GRANT SELECT ON public.admins TO authenticated;
GRANT ALL ON public.admins TO service_role;

REVOKE ALL ON public.reactions FROM anon, authenticated;
GRANT ALL ON public.reactions TO service_role;

-- ------------------------------------------------------------
-- 8. Views: run with the caller's permissions
-- Default views execute with the view owner's rights and skip
-- the underlying table's RLS. security_invoker makes the two
-- public views respect stories RLS (they only expose approved
-- stories, which the public policy already allows).
-- ------------------------------------------------------------
DO $$
BEGIN
  BEGIN
    ALTER VIEW public.country_stats SET (security_invoker = true);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'country_stats: security_invoker not applied (%)', SQLERRM;
  END;
  BEGIN
    ALTER VIEW public.map_stories SET (security_invoker = true);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'map_stories: security_invoker not applied (%)', SQLERRM;
  END;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'country_stats') THEN
    GRANT SELECT ON public.country_stats TO anon, authenticated, service_role;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'map_stories') THEN
    GRANT SELECT ON public.map_stories TO anon, authenticated, service_role;
  END IF;
END;
$$;

-- ------------------------------------------------------------
-- 9. Functions hardening
-- ------------------------------------------------------------
-- Only count a view when the story is actually public, pin
-- search_path, and keep the exact parameter name `story_id`:
-- the app calls .rpc('increment_view_count', { story_id }).
CREATE OR REPLACE FUNCTION public.increment_view_count(story_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.stories s
  SET view_count = s.view_count + 1
  WHERE s.id = increment_view_count.story_id
    AND s.status = 'approved';
END;
$$;

REVOKE ALL ON FUNCTION public.increment_view_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_view_count(UUID)
  TO anon, authenticated, service_role;

-- Trigger helper (from 001): pin search_path; triggers do not
-- need PUBLIC execute.
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

REVOKE ALL ON FUNCTION public.update_updated_at() FROM PUBLIC;

-- ------------------------------------------------------------
-- 10. Storage: story-media bucket + object policies
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('story-media', 'story-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Supabase manages these storage grants by default; pin them
-- explicitly so the policies below cannot silently no-op on a
-- project whose defaults were ever changed.
REVOKE ALL ON storage.objects FROM anon, authenticated;
GRANT SELECT, INSERT ON storage.objects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT ALL ON storage.objects TO service_role;

DROP POLICY IF EXISTS "Public upload"              ON storage.objects;
DROP POLICY IF EXISTS "Public read"                ON storage.objects;
DROP POLICY IF EXISTS "story_media_public_read"    ON storage.objects;
DROP POLICY IF EXISTS "story_media_upload_create"  ON storage.objects;
DROP POLICY IF EXISTS "story_media_admin_update"   ON storage.objects;
DROP POLICY IF EXISTS "story_media_admin_delete"   ON storage.objects;

-- Files in the public bucket are world-readable by URL anyway;
-- this covers listing/reading through the Storage API.
CREATE POLICY "story_media_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'story-media');

-- The /create page uploads from the browser with the anon key,
-- and only ever to these two prefixes:
--   audio/<timestamp>.webm|mp4   and   covers/<timestamp>.<ext>
-- Anything outside them (other buckets, other paths) is denied.
CREATE POLICY "story_media_upload_create"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'story-media'
    AND (storage.foldername(name))[1] IN ('audio', 'covers')
  );

-- Replacing or removing files is an admin-only action,
-- done from the dashboard / service role in practice.
CREATE POLICY "story_media_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'story-media' AND public.is_admin())
  WITH CHECK (bucket_id = 'story-media' AND public.is_admin());

CREATE POLICY "story_media_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'story-media' AND public.is_admin());

-- ============================================================
-- VERIFY (read-only; run in the SQL editor after applying)
-- ============================================================
-- Every public table should show rowsecurity = true:
--   SELECT tablename, rowsecurity FROM pg_tables
--   WHERE schemaname = 'public' ORDER BY tablename;
--
-- Full policy list:
--   SELECT schemaname, tablename, policyname, roles, cmd
--   FROM pg_policies
--   WHERE schemaname IN ('public', 'storage')
--   ORDER BY tablename, policyname;
--
-- Expected: stories 5 policies, tips 1, admins 1, reactions 0,
-- storage.objects 4 (for story-media). Supabase Dashboard ->
-- Authentication -> Policies and Database -> Advisors should
-- no longer report "RLS disabled" for any public table.
-- ============================================================
