-- Add attendees list to matches: players who showed up (separate from the playing lineup)
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS attendees jsonb NOT NULL DEFAULT '[]'::jsonb;
