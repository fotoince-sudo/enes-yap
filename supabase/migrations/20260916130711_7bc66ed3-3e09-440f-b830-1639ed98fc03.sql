CREATE TABLE public.lead_prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'manuel',
  source_permission text NOT NULL DEFAULT 'manuel_giris',
  listing_url text,
  normalized_url text,
  title text NOT NULL,
  city text,
  district text,
  neighborhood text,
  need_type text,
  estimated_work_type text,
  estimated_value numeric,
  listing_date date,
  contact_name text,
  contact_phone text,
  contact_email text,
  contact_source_note text,
  description text,
  notes text,
  status text NOT NULL DEFAULT 'yeni',
  assigned_to uuid REFERENCES auth.users(id),
  first_contact_at timestamptz,
  last_contact_at timestamptz,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_prospects TO authenticated;
GRANT ALL ON public.lead_prospects TO service_role;

ALTER TABLE public.lead_prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_prospects_manager_all" ON public.lead_prospects
  FOR ALL TO authenticated
  USING (public.is_manager(auth.uid()))
  WITH CHECK (public.is_manager(auth.uid()));

CREATE POLICY "lead_prospects_staff_read_own" ON public.lead_prospects
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) AND (assigned_to = auth.uid() OR created_by = auth.uid()));

CREATE POLICY "lead_prospects_staff_insert" ON public.lead_prospects
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "lead_prospects_staff_update_own" ON public.lead_prospects
  FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()) AND (assigned_to = auth.uid() OR created_by = auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.normalize_prospect_url(_url text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT nullif(
    regexp_replace(
      regexp_replace(lower(btrim(coalesce(_url, ''))), '^https?://(www\.)?', ''),
      '([?&](utm_[a-z_]+|gclid|fbclid|ref|referrer)=[^&#]*)|#.*$', '', 'g'),
    '')
$$;

CREATE OR REPLACE FUNCTION public.lead_prospects_prepare()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.normalized_url = public.normalize_prospect_url(NEW.listing_url);
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_lead_prospects_prepare
BEFORE INSERT OR UPDATE ON public.lead_prospects
FOR EACH ROW EXECUTE FUNCTION public.lead_prospects_prepare();

CREATE UNIQUE INDEX lead_prospects_url_uniq
  ON public.lead_prospects (normalized_url)
  WHERE normalized_url IS NOT NULL;

CREATE UNIQUE INDEX lead_prospects_phone_need_uniq
  ON public.lead_prospects (contact_phone, coalesce(need_type, ''))
  WHERE normalized_url IS NULL AND contact_phone IS NOT NULL;

CREATE UNIQUE INDEX lead_prospects_title_district_date_uniq
  ON public.lead_prospects (lower(title), coalesce(lower(district), ''), coalesce(listing_date, '1900-01-01'::date))
  WHERE normalized_url IS NULL AND contact_phone IS NULL;

CREATE INDEX lead_prospects_status_idx ON public.lead_prospects (status);
CREATE INDEX lead_prospects_assigned_idx ON public.lead_prospects (assigned_to);