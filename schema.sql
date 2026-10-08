-- JustGimmeADolla — Run in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS stories (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title             TEXT NOT NULL,
  body              TEXT NOT NULL DEFAULT '[Voice recording — pending transcription]',
  transcript        TEXT,
  audio_upload_path TEXT,
  cover_image_url   TEXT,
  author_name       TEXT NOT NULL,
  author_email      TEXT,
  tip_count         INTEGER NOT NULL DEFAULT 0,
  tip_total         NUMERIC(10,2) NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  featured          BOOLEAN NOT NULL DEFAULT FALSE,
  view_count        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tips (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  story_id       UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  amount         NUMERIC(10,2) NOT NULL,
  fee_processor  NUMERIC(10,2) NOT NULL DEFAULT 0,
  fee_platform   NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_amount     NUMERIC(10,2) NOT NULL,
  processor      TEXT NOT NULL CHECK (processor IN ('stripe','paypal')),
  processor_ref  TEXT,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded'))
);

CREATE TABLE IF NOT EXISTS admins (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS — enabled on EVERY table. The canonical, idempotent
-- version (also covering `reactions`, views, and grants) is
-- supabase/migrations/004_enable_row_level_security.sql;
-- existing projects should run that file instead of this section.
-- Access model: anon can read approved stories and insert a new
-- pending story (not featured, zero tips/views); tips have no
-- client write access (verified payments are written server-side
-- with the service-role key, which bypasses RLS); `admins` can
-- only be read as your own row and is managed only here.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT EXISTS (SELECT 1 FROM public.admins a
      WHERE lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))) $$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips    ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read approved"          ON stories;
DROP POLICY IF EXISTS "Public submit"                 ON stories;
DROP POLICY IF EXISTS "stories_public_read_approved"  ON stories;
DROP POLICY IF EXISTS "stories_public_insert_pending" ON stories;
DROP POLICY IF EXISTS "stories_admin_read"            ON stories;
DROP POLICY IF EXISTS "stories_admin_update"          ON stories;
DROP POLICY IF EXISTS "stories_admin_delete"          ON stories;
CREATE POLICY "stories_public_read_approved"  ON stories FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY "stories_admin_read"            ON stories FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "stories_public_insert_pending" ON stories FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending' AND featured = false AND tip_count = 0 AND tip_total = 0 AND view_count = 0);
CREATE POLICY "stories_admin_update" ON stories FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "stories_admin_delete" ON stories FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Public read tips"   ON tips;
DROP POLICY IF EXISTS "Public insert tips" ON tips;
DROP POLICY IF EXISTS "tips_admin_read"    ON tips;
-- No anon/authenticated INSERT or UPDATE on tips, ever.
CREATE POLICY "tips_admin_read" ON tips FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admins_read_own" ON admins;
CREATE POLICY "admins_read_own" ON admins FOR SELECT TO authenticated
  USING (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- Storage RLS (bucket `story-media` must exist; migration 004 creates it)
-- Public read; uploads only to the audio/ and covers/ prefixes
-- the /create page uses; update/delete for admins only.
-- (Supabase manages storage grants by default; pin them anyway.)
REVOKE ALL ON storage.objects FROM anon, authenticated;
GRANT SELECT, INSERT ON storage.objects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT ALL ON storage.objects TO service_role;
DROP POLICY IF EXISTS "Public upload"             ON storage.objects;
DROP POLICY IF EXISTS "Public read"               ON storage.objects;
DROP POLICY IF EXISTS "story_media_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "story_media_upload_create" ON storage.objects;
DROP POLICY IF EXISTS "story_media_admin_update"  ON storage.objects;
DROP POLICY IF EXISTS "story_media_admin_delete"  ON storage.objects;
CREATE POLICY "story_media_public_read"   ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'story-media');
CREATE POLICY "story_media_upload_create" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'story-media' AND (storage.foldername(name))[1] IN ('audio', 'covers'));
CREATE POLICY "story_media_admin_update"  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'story-media' AND public.is_admin()) WITH CHECK (bucket_id = 'story-media' AND public.is_admin());
CREATE POLICY "story_media_admin_delete"  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'story-media' AND public.is_admin());

-- View count function (hardened: pinned search_path, approved only)
CREATE OR REPLACE FUNCTION public.increment_view_count(story_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$ BEGIN
  UPDATE public.stories s SET view_count = s.view_count + 1
  WHERE s.id = increment_view_count.story_id AND s.status = 'approved';
END; $$;
REVOKE ALL ON FUNCTION public.increment_view_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_view_count(UUID) TO anon, authenticated, service_role;

-- Add your admin email
-- INSERT INTO admins (email) VALUES ('you@email.com');
