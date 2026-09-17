ALTER TABLE public.lead_prospects
  ADD COLUMN IF NOT EXISTS score integer,
  ADD COLUMN IF NOT EXISTS score_reason text,
  ADD COLUMN IF NOT EXISTS scored_at timestamptz,
  ADD COLUMN IF NOT EXISTS pipeline_stage text,
  ADD COLUMN IF NOT EXISTS pipeline_error text,
  ADD COLUMN IF NOT EXISTS matched_request_id uuid REFERENCES public.renovation_requests(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS lead_prospects_pipeline_idx
  ON public.lead_prospects (pipeline_stage, scored_at DESC NULLS LAST);

INSERT INTO public.engine_state (key, label, status)
VALUES ('lead_pipeline', 'Aday İşleme Zinciri (temizleme, tekilleştirme, filtreleme, eşleştirme)', 'aktif')
ON CONFLICT (key) DO NOTHING;