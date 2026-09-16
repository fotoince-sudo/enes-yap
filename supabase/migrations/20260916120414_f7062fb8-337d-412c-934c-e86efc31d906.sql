CREATE OR REPLACE FUNCTION public.quote_item_unit_price()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.unit_price = COALESCE(NEW.material_cost, 0) + COALESCE(NEW.labor_cost, 0);
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_quote_items_unit_price
BEFORE INSERT OR UPDATE ON public.quote_items
FOR EACH ROW EXECUTE FUNCTION public.quote_item_unit_price();

CREATE OR REPLACE FUNCTION public.recalc_quote_totals(_quote_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  m numeric := 0;
  l numeric := 0;
  items numeric := 0;
  q record;
  sub numeric;
BEGIN
  IF _quote_id IS NULL THEN RETURN; END IF;

  SELECT COALESCE(sum(quantity * material_cost), 0),
         COALESCE(sum(quantity * labor_cost), 0),
         COALESCE(sum(line_total), 0)
    INTO m, l, items
  FROM public.quote_items WHERE quote_id = _quote_id;

  SELECT extra_total, discount, vat_rate INTO q FROM public.quotes WHERE id = _quote_id;
  IF NOT FOUND THEN RETURN; END IF;

  sub := greatest(items + COALESCE(q.extra_total, 0) - COALESCE(q.discount, 0), 0);

  UPDATE public.quotes
  SET materials_total = m,
      labor_total = l,
      grand_total = sub + sub * COALESCE(q.vat_rate, 0) / 100
  WHERE id = _quote_id;
END; $$;

REVOKE EXECUTE ON FUNCTION public.recalc_quote_totals(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.trg_quote_items_recalc()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_quote_totals(OLD.quote_id);
    RETURN OLD;
  END IF;
  PERFORM public.recalc_quote_totals(NEW.quote_id);
  IF TG_OP = 'UPDATE' AND OLD.quote_id IS DISTINCT FROM NEW.quote_id THEN
    PERFORM public.recalc_quote_totals(OLD.quote_id);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_quote_items_totals
AFTER INSERT OR UPDATE OR DELETE ON public.quote_items
FOR EACH ROW EXECUTE FUNCTION public.trg_quote_items_recalc();

CREATE OR REPLACE FUNCTION public.trg_quotes_recalc()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.extra_total IS DISTINCT FROM OLD.extra_total
     OR NEW.discount IS DISTINCT FROM OLD.discount
     OR NEW.vat_rate IS DISTINCT FROM OLD.vat_rate THEN
    PERFORM public.recalc_quote_totals(NEW.id);
  END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER trg_quotes_totals
AFTER UPDATE ON public.quotes
FOR EACH ROW EXECUTE FUNCTION public.trg_quotes_recalc();

UPDATE public.quote_items SET unit_price = COALESCE(material_cost, 0) + COALESCE(labor_cost, 0);

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.quotes LOOP
    PERFORM public.recalc_quote_totals(r.id);
  END LOOP;
END $$;