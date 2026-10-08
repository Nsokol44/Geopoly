-- ============================================================
-- Migration 005: Let voice stories be submitted again
-- ============================================================
-- The live stories table follows migration 001 (the Geopoly
-- climate-atlas schema), which made excerpt, category and the
-- location fields NOT NULL because that UI collected them.
-- The current product (JustGimmeADolla voice stories) collects
-- only a title, a name, an optional email and an audio file, so
-- every submission died with:
--   null value in column "excerpt" of relation "stories"
--   violates not-null constraint
--
-- The /api/submit route now fills legacy columns on demand, so
-- uploads work without this migration — but the correct schema
-- for the current product is that a voice story does not need
-- an excerpt, a category, or coordinates to exist. This
-- migration relaxes exactly those legacy columns. title and
-- author_name stay NOT NULL: a story still needs both.
--
-- Idempotent and safe to re-run (columns a given database does
-- not have are skipped). No data is changed.
-- ============================================================

DO $$
DECLARE col text;
BEGIN
  FOREACH col IN ARRAY ARRAY[
    'excerpt', 'category', 'latitude', 'longitude',
    'location_name', 'country_code', 'country_name', 'author_email'
  ] LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.stories ALTER COLUMN %I DROP NOT NULL', col);
    EXCEPTION WHEN undefined_column THEN
      RAISE NOTICE 'stories.% does not exist — skipped', col;
    END;
  END LOOP;
END;
$$;

-- An excerpt can always be derived for display; default it so
-- inserts that omit it still read sensibly in list views.
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.stories ALTER COLUMN excerpt SET DEFAULT '';
  EXCEPTION WHEN undefined_column THEN
    RAISE NOTICE 'stories.excerpt does not exist — skipped';
  END;
END;
$$;

-- Optional cleanup for rows that were submitted through the
-- code-side fallback before this migration ran (placeholder
-- 0,0 coordinates and empty location strings -> truly unknown):
-- UPDATE public.stories
-- SET latitude = NULL, longitude = NULL,
--     location_name = NULL, country_name = NULL, country_code = NULL
-- WHERE latitude = 0 AND longitude = 0 AND location_name = '';
