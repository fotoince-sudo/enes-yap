CREATE TABLE public.emir_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  collected jsonb NOT NULL DEFAULT '{}'::jsonb,
  summary text,
  wants_survey boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'sohbet',
  request_id uuid REFERENCES public.renovation_requests(id) ON DELETE SET NULL,
  survey_id uuid REFERENCES public.surveys(id) ON DELETE SET NULL,
  message_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.emir_chat_sessions TO authenticated;
GRANT ALL ON public.emir_chat_sessions TO service_role;

ALTER TABLE public.emir_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "emir_sessions_staff_read" ON public.emir_chat_sessions
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "emir_sessions_manager_update" ON public.emir_chat_sessions
  FOR UPDATE TO authenticated
  USING (public.is_manager(auth.uid()))
  WITH CHECK (public.is_manager(auth.uid()));

CREATE INDEX emir_chat_sessions_created_idx ON public.emir_chat_sessions (created_at DESC);
CREATE INDEX emir_chat_sessions_request_idx ON public.emir_chat_sessions (request_id);

CREATE OR REPLACE FUNCTION public.touch_emir_chat_sessions()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_emir_chat_sessions_touch
  BEFORE UPDATE ON public.emir_chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_emir_chat_sessions();