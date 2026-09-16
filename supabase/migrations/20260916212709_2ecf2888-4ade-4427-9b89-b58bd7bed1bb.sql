CREATE TABLE public.engine_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  engine_key text NOT NULL,
  trigger text NOT NULL DEFAULT 'manuel',
  status text NOT NULL,
  message text,
  checked int NOT NULL DEFAULT 0,
  allowed int NOT NULL DEFAULT 0,
  blocked int NOT NULL DEFAULT 0,
  unreachable int NOT NULL DEFAULT 0,
  new_prospects int NOT NULL DEFAULT 0,
  details jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX engine_runs_key_created_idx ON public.engine_runs (engine_key, created_at DESC);

GRANT SELECT ON public.engine_runs TO authenticated;
GRANT ALL ON public.engine_runs TO service_role;

ALTER TABLE public.engine_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "engine_runs_staff_read" ON public.engine_runs
FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));