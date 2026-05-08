-- ============================================================
-- Migration: Add audio support for voice submissions
-- Run in Supabase SQL Editor
-- ============================================================

-- Add audio_upload_path column to stories table
ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS audio_upload_path TEXT;

-- ============================================================
-- That's it! The voice submission form sends audio to
-- Supabase Storage under the "audio/" prefix in story-media.
-- Admins can listen + transcribe from the admin dashboard.
-- ============================================================

-- Add age_range column for demographic data
ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS age_range TEXT;
