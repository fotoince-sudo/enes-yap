ALTER TABLE public.lead_prospects
  ALTER COLUMN city SET DEFAULT 'İzmir';

UPDATE public.lead_prospects SET city = 'İzmir' WHERE city IS NULL OR btrim(city) = '';

ALTER TABLE public.lead_prospects
  ADD CONSTRAINT lead_prospects_izmir_only_chk
  CHECK (city IS NULL OR btrim(city) ILIKE 'izmir' OR btrim(city) ILIKE 'İzmir');