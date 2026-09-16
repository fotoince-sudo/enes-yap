ALTER TABLE public.emir_chat_sessions
  ADD COLUMN IF NOT EXISTS flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS stop_reason text,
  ADD COLUMN IF NOT EXISTS last_flag_at timestamptz;

CREATE INDEX IF NOT EXISTS emir_chat_sessions_last_flag_at_idx
  ON public.emir_chat_sessions (last_flag_at DESC NULLS LAST);