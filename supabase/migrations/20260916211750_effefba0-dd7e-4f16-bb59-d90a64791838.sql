CREATE TABLE public.prospect_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  url text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'ilan-siteleri',
  region text NOT NULL DEFAULT 'İzmir' CHECK (region = 'İzmir'),
  permission_status text NOT NULL DEFAULT 'inceleniyor' CHECK (permission_status IN ('izinli','inceleniyor','izinsiz')),
  active boolean NOT NULL DEFAULT true,
  reachable boolean,
  http_status integer,
  robots_allowed boolean,
  robots_note text,
  auto_scan_allowed boolean NOT NULL DEFAULT false,
  last_checked_at timestamptz,
  last_result text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.prospect_sources TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.prospect_sources TO authenticated;
GRANT ALL ON public.prospect_sources TO service_role;

ALTER TABLE public.prospect_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prospect_sources_staff_read" ON public.prospect_sources
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "prospect_sources_manager_all" ON public.prospect_sources
  FOR ALL TO authenticated USING (public.is_manager(auth.uid())) WITH CHECK (public.is_manager(auth.uid()));

CREATE TABLE public.engine_state (
  key text NOT NULL PRIMARY KEY,
  label text NOT NULL,
  status text NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif','durakladi')),
  paused_reason text,
  lease_until timestamptz,
  last_run_at timestamptz,
  last_result jsonb,
  run_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.engine_state TO authenticated;
GRANT UPDATE ON public.engine_state TO authenticated;
GRANT ALL ON public.engine_state TO service_role;

ALTER TABLE public.engine_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "engine_state_staff_read" ON public.engine_state
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE POLICY "engine_state_manager_update" ON public.engine_state
  FOR UPDATE TO authenticated USING (public.is_manager(auth.uid())) WITH CHECK (public.is_manager(auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_prospect_sources()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prospect_sources_touch
  BEFORE UPDATE ON public.prospect_sources
  FOR EACH ROW EXECUTE FUNCTION public.touch_prospect_sources();

CREATE TRIGGER trg_engine_state_touch
  BEFORE UPDATE ON public.engine_state
  FOR EACH ROW EXECUTE FUNCTION public.touch_prospect_sources();

INSERT INTO public.engine_state (key, label, status)
VALUES ('source_research', 'Source Research Motoru', 'aktif');

INSERT INTO public.prospect_sources (name, url, category, permission_status, notes) VALUES
  ('Sahibinden.com', 'https://www.sahibinden.com', 'ilan-siteleri', 'inceleniyor', 'İzmir satılık/kiralık ilanları — otomatik erişim izni motor tarafından denetlenir.'),
  ('Emlakjet', 'https://www.emlakjet.com', 'ilan-siteleri', 'inceleniyor', 'İzmir ilanları.'),
  ('Hepsiemlak', 'https://www.hepsiemlak.com', 'ilan-siteleri', 'inceleniyor', 'İzmir ilanları.'),
  ('Zingat', 'https://www.zingat.com', 'ilan-siteleri', 'inceleniyor', 'İzmir ilanları.'),
  ('Armut.com', 'https://armut.com', 'hizmet-talep', 'inceleniyor', 'Tadilat hizmet talepleri.'),
  ('Instagram', 'https://www.instagram.com', 'sosyal-medya', 'inceleniyor', 'Yalnızca resmî API ile erişim mümkündür.'),
  ('Facebook', 'https://www.facebook.com', 'sosyal-medya', 'inceleniyor', 'Yalnızca resmî API ile erişim mümkündür.'),
  ('Google arama', 'https://www.google.com', 'arama', 'inceleniyor', 'Otomatik sorgu yalnızca resmî arama API''si ile mümkündür.'),
  ('İzmir Büyükşehir Açık Veri', 'https://acikveri.bizmirbb.gov.tr', 'acik-veri', 'inceleniyor', 'Açık veri portalı — izinli kullanım.'),
  ('Enes Yapı web formu', 'https://enes-yap.lovable.app', 'kendi-kaynagimiz', 'izinli', 'Kendi sitemiz — tam izinli.'),
  ('İzmir Ticaret Odası', 'https://www.izto.org.tr', 'kurumsal', 'inceleniyor', 'Kurumsal duyuru ve ihale kaynağı.');