CREATE OR REPLACE FUNCTION public.my_customer_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id FROM public.customers c
  WHERE auth.email() IS NOT NULL AND c.email IS NOT NULL AND lower(c.email) = lower(auth.email())
$$;

CREATE OR REPLACE FUNCTION public.my_request_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id FROM public.renovation_requests r
  WHERE (auth.email() IS NOT NULL AND r.email IS NOT NULL AND lower(r.email) = lower(auth.email()))
     OR r.customer_id IN (SELECT public.my_customer_ids())
$$;

CREATE OR REPLACE FUNCTION public.my_quote_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT q.id FROM public.quotes q
  WHERE q.customer_id IN (SELECT public.my_customer_ids())
     OR q.request_id IN (SELECT public.my_request_ids())
$$;

CREATE OR REPLACE FUNCTION public.my_project_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id FROM public.projects p
  WHERE p.customer_id IN (SELECT public.my_customer_ids())
     OR p.request_id IN (SELECT public.my_request_ids())
     OR p.quote_id IN (SELECT public.my_quote_ids())
$$;

REVOKE ALL ON FUNCTION public.my_customer_ids() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_request_ids() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_quote_ids() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_project_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_customer_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_request_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_quote_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_project_ids() TO authenticated;

CREATE POLICY customers_own_read ON public.customers FOR SELECT TO authenticated
  USING (id IN (SELECT public.my_customer_ids()));

CREATE POLICY properties_own_read ON public.properties FOR SELECT TO authenticated
  USING (customer_id IN (SELECT public.my_customer_ids()));

CREATE POLICY requests_own_read ON public.renovation_requests FOR SELECT TO authenticated
  USING (id IN (SELECT public.my_request_ids()));

CREATE POLICY quotes_own_read ON public.quotes FOR SELECT TO authenticated
  USING (id IN (SELECT public.my_quote_ids()));

CREATE POLICY quote_items_own_read ON public.quote_items FOR SELECT TO authenticated
  USING (quote_id IN (SELECT public.my_quote_ids()));

CREATE POLICY projects_own_read ON public.projects FOR SELECT TO authenticated
  USING (id IN (SELECT public.my_project_ids()));

CREATE POLICY project_photos_own_read ON public.project_photos FOR SELECT TO authenticated
  USING (project_id IN (SELECT public.my_project_ids()));

CREATE POLICY request_activities_own_read ON public.request_activities FOR SELECT TO authenticated
  USING (request_id IN (SELECT public.my_request_ids()));