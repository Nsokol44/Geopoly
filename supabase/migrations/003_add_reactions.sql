-- ============================================================
-- Migration: Add story reactions
-- Run in Supabase SQL Editor or via supabase db push
-- Backs the "How does this story make you feel?" widget
-- (components/stories/StoryReactions.tsx + app/api/reactions)
-- ============================================================

CREATE TABLE IF NOT EXISTS reactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  story_id    UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  reaction    TEXT NOT NULL CHECK (reaction IN ('inspired', 'seen_this', 'urgent')),
  fingerprint TEXT NOT NULL,

  -- One reaction of a given kind per (story, fingerprint)
  UNIQUE (story_id, reaction, fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_reactions_story ON reactions(story_id);
CREATE INDEX IF NOT EXISTS idx_reactions_fingerprint ON reactions(fingerprint);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Reactions are written and read only through the /api/reactions
-- route using the service role key, so no public policies are needed.
-- (RLS stays enabled with no public policy = locked down by default.)
