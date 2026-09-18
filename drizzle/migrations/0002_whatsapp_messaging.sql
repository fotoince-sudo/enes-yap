-- WhatsApp mesajlaşma altyapısı
-- 1) Webhook inbox: Meta'dan gelen her teslimat burada saklanır (imza doğrulamadan sonra).
CREATE TABLE public.whatsapp_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id TEXT NOT NULL UNIQUE,
  event TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processing_error TEXT
);
GRANT SELECT, UPDATE ON public.whatsapp_webhook_events TO authenticated;
GRANT ALL ON public.whatsapp_webhook_events TO service_role;
ALTER TABLE public.whatsapp_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wa_events_staff_read" ON public.whatsapp_webhook_events
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "wa_events_staff_update" ON public.whatsapp_webhook_events
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 2) Mesajlar: gelen (in) ve giden (out) WhatsApp mesajları, sohbet görünümü için.
CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direction TEXT NOT NULL CHECK (direction IN ('in','out')),
  wa_message_id TEXT UNIQUE,
  contact_phone TEXT NOT NULL,
  contact_name TEXT,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received','pending','accepted','sent','delivered','read','failed')),
  status_error TEXT,
  status_times JSONB NOT NULL DEFAULT '{}'::jsonb,
  provider_timestamp TIMESTAMPTZ,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX wa_messages_contact_idx ON public.whatsapp_messages (contact_phone, created_at);
GRANT SELECT, INSERT, UPDATE ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO service_role;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wa_messages_staff_read" ON public.whatsapp_messages
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "wa_messages_staff_insert_out" ON public.whatsapp_messages
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND direction = 'out');
CREATE POLICY "wa_messages_staff_update" ON public.whatsapp_messages
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
