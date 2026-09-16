ALTER TABLE public.quote_items
  ADD COLUMN IF NOT EXISTS labor_hours numeric,
  ADD COLUMN IF NOT EXISTS labor_hourly_rate numeric;

CREATE OR REPLACE FUNCTION public.quote_item_unit_price()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.labor_hours IS NOT NULL AND NEW.labor_hourly_rate IS NOT NULL THEN
    NEW.labor_cost = COALESCE(NEW.labor_hours, 0) * COALESCE(NEW.labor_hourly_rate, 0);
  END IF;
  NEW.unit_price = COALESCE(NEW.material_cost, 0) + COALESCE(NEW.labor_cost, 0);
  RETURN NEW;
END; $$;