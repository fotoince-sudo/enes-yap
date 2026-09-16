ALTER TABLE public.emir_chat_sessions
  ADD COLUMN IF NOT EXISTS logged_message_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS emir_chat_sessions_quote_id_idx ON public.emir_chat_sessions (quote_id);