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

-- RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tips    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read approved" ON stories FOR SELECT USING (status = 'approved');
CREATE POLICY "Public submit"        ON stories FOR INSERT WITH CHECK (status = 'pending');
CREATE POLICY "Public read tips"     ON tips    FOR SELECT USING (status = 'completed');
CREATE POLICY "Public insert tips"   ON tips    FOR INSERT WITH CHECK (true);

-- Storage RLS (run after creating story-media bucket)
CREATE POLICY "Public upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'story-media');
CREATE POLICY "Public read"   ON storage.objects FOR SELECT USING (bucket_id = 'story-media');

-- View count function
CREATE OR REPLACE FUNCTION increment_view_count(story_id UUID)
RETURNS void AS $$ UPDATE stories SET view_count = view_count + 1 WHERE id = story_id; $$ LANGUAGE SQL SECURITY DEFINER;

-- Add your admin email
-- INSERT INTO admins (email) VALUES ('you@email.com');
