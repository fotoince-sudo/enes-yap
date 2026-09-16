-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','yonetici','operasyon','saha','ekip');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

CREATE POLICY "profiles_select_self_or_staff" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "user_roles_select_self_or_staff" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "user_roles_admin_manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ENUMS
CREATE TYPE public.request_status AS ENUM ('yeni','inceleniyor','gorusuldu','kesif_planlandi','kesif_yapildi','teklif_hazirlaniyor','teklif_gonderildi','onaylandi','uygulamada','tamamlandi','iptal');
CREATE TYPE public.quote_status AS ENUM ('taslak','hazirlaniyor','gonderildi','musteri_inceliyor','kabul','red');
CREATE TYPE public.project_status AS ENUM ('baslamadi','hazirlik','malzeme_bekleniyor','basladi','devam','kontrol','tamamlandi');
CREATE TYPE public.partner_type AS ENUM ('usta','ekip','firma','cozum_ortagi');
CREATE TYPE public.opportunity_type AS ENUM ('satisa_hazirlik','kiraya_hazirlik','satis_ihtimali','kiralama_ihtimali','yatirim_yenileme','komple_yenileme');
CREATE TYPE public.photo_phase AS ENUM ('once','uygulama','sonra');

-- SERVICE CATEGORIES
CREATE TABLE public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_categories TO authenticated;
GRANT ALL ON public.service_categories TO service_role;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON public.service_categories FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "categories_staff_manage" ON public.service_categories FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

INSERT INTO public.service_categories (slug, name, sort_order) VALUES
 ('ev-tadilati','Ev tadilatı',1),
 ('daire-yenileme','Daire yenileme',2),
 ('mutfak-yenileme','Mutfak yenileme',3),
 ('banyo-yenileme','Banyo yenileme',4),
 ('boya-badana','Boya ve badana',5),
 ('zemin-parke','Zemin ve parke uygulamaları',6),
 ('seramik','Seramik uygulamaları',7),
 ('alcipan-asma-tavan','Alçıpan ve asma tavan',8),
 ('elektrik','Elektrik işleri',9),
 ('sihhi-tesisat','Sıhhi tesisat',10),
 ('kapi-pencere','Kapı/pencere işleri',11),
 ('mantolama-dis-cephe','Mantolama ve dış cephe',12),
 ('cati-izolasyon','Çatı ve izolasyon',13),
 ('komple-tadilat','Komple tadilat',14),
 ('isyeri-ofis-tadilati','İş yeri/ofis tadilatı',15),
 ('kiraya-hazirlama','Kiraya hazırlama',16),
 ('satisa-hazirlama','Satışa hazırlama',17),
 ('gayrimenkul-yenileme','Gayrimenkul yenileme',18);

-- CUSTOMERS
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  city TEXT, district TEXT, neighborhood TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers_staff_all" ON public.customers FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_customers_touch BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- PROPERTIES
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  city TEXT, district TEXT, neighborhood TEXT, address TEXT,
  property_type TEXT,
  area_m2 NUMERIC,
  room_count TEXT,
  building_age INT,
  condition TEXT,
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  external_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "properties_staff_all" ON public.properties FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_properties_touch BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RENOVATION REQUESTS
CREATE TABLE public.renovation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  city TEXT, district TEXT, neighborhood TEXT,
  property_type TEXT,
  service_category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
  renovation_type TEXT,
  area_m2 NUMERIC,
  budget_range TEXT,
  desired_start TEXT,
  description TEXT,
  photo_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  video_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  status public.request_status NOT NULL DEFAULT 'yeni',
  opportunity_type public.opportunity_type,
  source TEXT NOT NULL DEFAULT 'website',
  assigned_to UUID REFERENCES auth.users ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.renovation_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.renovation_requests TO authenticated;
GRANT ALL ON public.renovation_requests TO service_role;
ALTER TABLE public.renovation_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "requests_public_insert" ON public.renovation_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "requests_staff_read" ON public.renovation_requests FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "requests_staff_update" ON public.renovation_requests FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "requests_staff_delete" ON public.renovation_requests FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER trg_requests_touch BEFORE UPDATE ON public.renovation_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.request_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.renovation_requests(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users ON DELETE SET NULL,
  activity_type TEXT NOT NULL DEFAULT 'note',
  old_status public.request_status,
  new_status public.request_status,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.request_activities TO authenticated;
GRANT ALL ON public.request_activities TO service_role;
ALTER TABLE public.request_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activities_staff_all" ON public.request_activities FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.log_request_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.request_activities (request_id, actor_id, activity_type, old_status, new_status)
    VALUES (NEW.id, auth.uid(), 'status_change', OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_request_status_log AFTER UPDATE ON public.renovation_requests
  FOR EACH ROW EXECUTE FUNCTION public.log_request_status_change();

-- SURVEYS (keşif)
CREATE TABLE public.surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.renovation_requests(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  scheduled_date DATE,
  scheduled_time TIME,
  address TEXT,
  responsible_id UUID REFERENCES auth.users ON DELETE SET NULL,
  responsible_name TEXT,
  notes TEXT,
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  measurements JSONB NOT NULL DEFAULT '{}'::jsonb,
  result TEXT,
  estimated_cost NUMERIC,
  quote_state TEXT,
  is_done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.surveys TO authenticated;
GRANT ALL ON public.surveys TO service_role;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "surveys_staff_all" ON public.surveys FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_surveys_touch BEFORE UPDATE ON public.surveys FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- QUOTES
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_no SERIAL,
  request_id UUID REFERENCES public.renovation_requests(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  title TEXT,
  status public.quote_status NOT NULL DEFAULT 'taslak',
  materials_total NUMERIC NOT NULL DEFAULT 0,
  labor_total NUMERIC NOT NULL DEFAULT 0,
  extra_total NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  vat_rate NUMERIC NOT NULL DEFAULT 20,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  valid_until DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quotes_staff_all" ON public.quotes FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_quotes_touch BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'adet',
  unit_price NUMERIC NOT NULL DEFAULT 0,
  material_cost NUMERIC NOT NULL DEFAULT 0,
  labor_cost NUMERIC NOT NULL DEFAULT 0,
  line_total NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_items TO authenticated;
GRANT ALL ON public.quote_items TO service_role;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quote_items_staff_all" ON public.quote_items FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- PARTNERS (usta/ekip/firma/çözüm ortağı)
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_type public.partner_type NOT NULL DEFAULT 'usta',
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  service_areas TEXT[] NOT NULL DEFAULT '{}',
  specialty TEXT,
  district TEXT,
  work_regions TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rating NUMERIC,
  references_text TEXT,
  documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partners_staff_all" ON public.partners FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_partners_touch BEFORE UPDATE ON public.partners FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- SUPPLIERS & MATERIALS
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  categories TEXT[] NOT NULL DEFAULT '{}',
  price_info TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suppliers_staff_all" ON public.suppliers FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_suppliers_touch BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT NOT NULL DEFAULT 'adet',
  estimated_cost NUMERIC,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT ALL ON public.materials TO service_role;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "materials_staff_all" ON public.materials FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_materials_touch BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- PROJECTS
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_no SERIAL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  request_id UUID REFERENCES public.renovation_requests(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status public.project_status NOT NULL DEFAULT 'baslamadi',
  contract_total NUMERIC NOT NULL DEFAULT 0,
  cost_total NUMERIC NOT NULL DEFAULT 0,
  paid_total NUMERIC NOT NULL DEFAULT 0,
  payment_notes TEXT,
  start_date DATE,
  estimated_end_date DATE,
  actual_end_date DATE,
  notes TEXT,
  is_public_reference BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT ON public.projects TO anon;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_public_reference_read" ON public.projects FOR SELECT TO anon, authenticated USING (is_public_reference);
CREATE POLICY "projects_staff_all" ON public.projects FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_projects_touch BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.project_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  role TEXT,
  agreed_cost NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, partner_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_partners TO authenticated;
GRANT ALL ON public.project_partners TO service_role;
ALTER TABLE public.project_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_partners_staff_all" ON public.project_partners FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.project_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase public.photo_phase NOT NULL DEFAULT 'once',
  url TEXT NOT NULL,
  caption TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_photos TO authenticated;
GRANT SELECT ON public.project_photos TO anon;
GRANT ALL ON public.project_photos TO service_role;
ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_photos_public_read" ON public.project_photos FOR SELECT TO anon, authenticated USING (is_public);
CREATE POLICY "project_photos_staff_all" ON public.project_photos FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- OPPORTUNITIES
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.renovation_requests(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  opportunity_type public.opportunity_type NOT NULL,
  status TEXT NOT NULL DEFAULT 'yeni',
  estimated_value NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opportunities_staff_all" ON public.opportunities FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_opportunities_touch BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_requests_status ON public.renovation_requests(status);
CREATE INDEX idx_requests_created ON public.renovation_requests(created_at DESC);
CREATE INDEX idx_properties_customer ON public.properties(customer_id);
CREATE INDEX idx_quotes_request ON public.quotes(request_id);
CREATE INDEX idx_quote_items_quote ON public.quote_items(quote_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_surveys_date ON public.surveys(scheduled_date);