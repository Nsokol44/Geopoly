-- ============================================================
-- Climate Stories — Supabase Migration
-- Run in Supabase SQL Editor or via supabase db push
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for full-text search

-- ============================================================
-- STORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS stories (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Content
  title               TEXT NOT NULL,
  excerpt             TEXT NOT NULL,
  body                TEXT NOT NULL,
  category            TEXT NOT NULL CHECK (category IN (
                        'energy_transition','nature_land','built_human','extreme_weather'
                      )),

  -- Media
  cover_image_url     TEXT,
  video_url           TEXT,         -- YouTube / Vimeo embed
  video_upload_path   TEXT,         -- Supabase Storage path

  -- Location (required for map plotting)
  latitude            DOUBLE PRECISION NOT NULL,
  longitude           DOUBLE PRECISION NOT NULL,
  location_name       TEXT NOT NULL,
  country_code        CHAR(2) NOT NULL,
  country_name        TEXT NOT NULL,

  -- Author
  author_name         TEXT NOT NULL,
  author_bio          TEXT,
  author_email        TEXT NOT NULL,

  -- Meta
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','approved','rejected')),
  featured            BOOLEAN NOT NULL DEFAULT FALSE,
  view_count          INTEGER NOT NULL DEFAULT 0,
  tags                TEXT[] NOT NULL DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_stories_status      ON stories(status);
CREATE INDEX idx_stories_country     ON stories(country_code);
CREATE INDEX idx_stories_category    ON stories(category);
CREATE INDEX idx_stories_featured    ON stories(featured) WHERE featured = TRUE;
CREATE INDEX idx_stories_location    ON stories(latitude, longitude);
CREATE INDEX idx_stories_tags        ON stories USING GIN(tags);

-- Full-text search index
ALTER TABLE stories ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(title,'') || ' ' ||
      coalesce(excerpt,'') || ' ' ||
      coalesce(body,'') || ' ' ||
      coalesce(location_name,'') || ' ' ||
      coalesce(country_name,'')
    )
  ) STORED;
CREATE INDEX idx_stories_fts ON stories USING GIN(fts);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stories_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- View count increment function (avoids full row lock)
CREATE OR REPLACE FUNCTION increment_view_count(story_id UUID)
RETURNS void AS $$
  UPDATE stories SET view_count = view_count + 1 WHERE id = story_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================================
-- ADMINS TABLE  (simple email-based admin list)
-- ============================================================
CREATE TABLE IF NOT EXISTS admins (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Public can read approved stories only
CREATE POLICY "Public read approved stories"
  ON stories FOR SELECT
  USING (status = 'approved');

-- Anyone can insert (public submissions)
CREATE POLICY "Public can submit stories"
  ON stories FOR INSERT
  WITH CHECK (status = 'pending');

-- Admins can do everything
CREATE POLICY "Admins full access"
  ON stories FOR ALL
  USING (
    auth.email() IN (SELECT email FROM admins)
  );

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- Run these via Supabase Dashboard > Storage > New Bucket
-- OR via the Supabase client in your seed script:
--
-- story-media  (public bucket for cover images + uploaded videos)

-- ============================================================
-- COUNTRY STATS VIEW
-- ============================================================
CREATE OR REPLACE VIEW country_stats AS
SELECT
  country_code,
  country_name,
  COUNT(*)::INT                            AS story_count,
  COUNT(*) FILTER (WHERE category = 'energy_transition')::INT  AS energy_transition,
  COUNT(*) FILTER (WHERE category = 'nature_land')::INT        AS nature_land,
  COUNT(*) FILTER (WHERE category = 'built_human')::INT        AS built_human,
  COUNT(*) FILTER (WHERE category = 'extreme_weather')::INT    AS extreme_weather,
  MAX(created_at)                          AS latest_story_date
FROM stories
WHERE status = 'approved'
GROUP BY country_code, country_name;

-- ============================================================
-- MAP STORIES VIEW (lightweight, for map pins)
-- ============================================================
CREATE OR REPLACE VIEW map_stories AS
SELECT
  id, title, excerpt, category,
  latitude, longitude, location_name, country_name,
  cover_image_url, author_name, created_at
FROM stories
WHERE status = 'approved';

-- ============================================================
-- SEED: Add your admin emails here
-- ============================================================
-- INSERT INTO admins (email) VALUES ('you@utk.edu'), ('yourwife@utk.edu');
