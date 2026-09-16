-- 1) Enum genişletmeleri
ALTER TYPE public.request_status ADD VALUE IF NOT EXISTS 'is_basladi';
ALTER TYPE public.request_status ADD VALUE IF NOT EXISTS 'beklemede';
ALTER TYPE public.quote_status ADD VALUE IF NOT EXISTS 'revizyon';
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'planlandi';
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'beklemede';
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'iptal';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'personel';

-- 2) Mevcut tablo genişletmeleri
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS last_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'aktif';

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS usage_status text,
  ADD COLUMN IF NOT EXISTS videos jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.renovation_requests
  ADD COLUMN IF NOT EXISTS address text;

ALTER TABLE public.surveys
  ADD COLUMN IF NOT EXISTS work_items text,
  ADD COLUMN IF NOT EXISTS material_notes text,
  ADD COLUMN IF NOT EXISTS labor_notes text,
  ADD COLUMN IF NOT EXISTS videos jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS responsible_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS scope text,
  ADD COLUMN IF NOT EXISTS payment_status text,
  ADD COLUMN IF NOT EXISTS material_notes text;

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS contact_person text;

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manuel',
  ADD COLUMN IF NOT EXISTS listing_url text,
  ADD COLUMN IF NOT EXISTS listing_title text,
  ADD COLUMN IF NOT EXISTS listing_date date,
  ADD COLUMN IF NOT EXISTS property_type text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS renovation_likelihood text,
  ADD COLUMN IF NOT EXISTS sale_rent_status text,
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS first_contact_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_contact_at timestamptz;

-- Mükerrer fırsat kaydını engelle
CREATE UNIQUE INDEX IF NOT EXISTS opportunities_listing_url_key
  ON public.opportunities (lower(listing_url)) WHERE listing_url IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS opportunities_manual_key
  ON public.opportunities (
    lower(coalesce(listing_title, '')),
    lower(coalesce(city, '')),
    lower(coalesce(district, '')),
    lower(coalesce(neighborhood, '')),
    coalesce(phone, '')
  ) WHERE listing_url IS NULL AND listing_title IS NOT NULL;

-- 3) Önce / Sonra kayıtları
CREATE TABLE IF NOT EXISTS public.before_after (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  work_type text,
  title text,
  before_url text,
  progress_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  after_url text,
  description text,
  happened_on date,
  is_published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.before_after TO authenticated;
GRANT SELECT ON public.before_after TO anon;
GRANT ALL ON public.before_after TO service_role;
ALTER TABLE public.before_after ENABLE ROW LEVEL SECURITY;
CREATE POLICY before_after_public_read ON public.before_after
  FOR SELECT TO anon, authenticated USING (is_published);
CREATE POLICY before_after_staff_all ON public.before_after
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_before_after_touch BEFORE UPDATE ON public.before_after
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4) Bildirimler
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  kind text NOT NULL DEFAULT 'bilgi',
  entity_type text,
  entity_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_read ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'yonetici'));
CREATE POLICY notifications_staff_write ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY notifications_staff_update ON public.notifications
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY notifications_staff_delete ON public.notifications
  FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications (user_id, is_read, created_at DESC);

-- 5) Ortak işlem geçmişi
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type text NOT NULL DEFAULT 'note',
  note text,
  old_status text,
  new_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY activity_log_staff_all ON public.activity_log
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE INDEX IF NOT EXISTS activity_log_entity_idx ON public.activity_log (entity_type, entity_id, created_at DESC);

-- 6) Yönetici / personel ayrımı
CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'yonetici')
  )
$$;
REVOKE ALL ON FUNCTION public.is_manager(uuid) FROM anon;

DROP POLICY IF EXISTS requests_staff_read ON public.renovation_requests;
CREATE POLICY requests_staff_read ON public.renovation_requests
  FOR SELECT TO authenticated
  USING (public.is_manager(auth.uid()) OR (public.is_staff(auth.uid()) AND (assigned_to IS NULL OR assigned_to = auth.uid())));
DROP POLICY IF EXISTS requests_staff_update ON public.renovation_requests;
CREATE POLICY requests_staff_update ON public.renovation_requests
  FOR UPDATE TO authenticated
  USING (public.is_manager(auth.uid()) OR (public.is_staff(auth.uid()) AND (assigned_to IS NULL OR assigned_to = auth.uid())));

DROP POLICY IF EXISTS surveys_staff_all ON public.surveys;
CREATE POLICY surveys_staff_all ON public.surveys
  FOR ALL TO authenticated
  USING (public.is_manager(auth.uid()) OR (public.is_staff(auth.uid()) AND (responsible_id IS NULL OR responsible_id = auth.uid())))
  WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS projects_staff_all ON public.projects;
CREATE POLICY projects_staff_all ON public.projects
  FOR ALL TO authenticated
  USING (public.is_manager(auth.uid()) OR (public.is_staff(auth.uid()) AND (responsible_id IS NULL OR responsible_id = auth.uid())))
  WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS opportunities_staff_all ON public.opportunities;
CREATE POLICY opportunities_staff_all ON public.opportunities
  FOR ALL TO authenticated
  USING (public.is_manager(auth.uid()) OR (public.is_staff(auth.uid()) AND (assigned_to IS NULL OR assigned_to = auth.uid())))
  WITH CHECK (public.is_staff(auth.uid()));

-- 7) İlk kullanıcı otomatik admin olsun
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM public.user_roles) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END; $$;
