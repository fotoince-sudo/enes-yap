ALTER TABLE public.prospect_sources
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS feed_url text,
  ADD COLUMN IF NOT EXISTS feed_type text,
  ADD COLUMN IF NOT EXISTS last_collect_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_collect_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.prospect_sources
  DROP CONSTRAINT IF EXISTS prospect_sources_feed_type_check;
ALTER TABLE public.prospect_sources
  ADD CONSTRAINT prospect_sources_feed_type_check
  CHECK (feed_type IS NULL OR feed_type IN ('rss', 'json'));

ALTER TABLE public.engine_runs
  ADD COLUMN IF NOT EXISTS collected integer NOT NULL DEFAULT 0;