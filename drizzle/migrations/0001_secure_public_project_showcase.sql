REVOKE SELECT ON TABLE public.projects FROM anon;
DROP POLICY IF EXISTS "projects_public_reference_read" ON public.projects;

CREATE OR REPLACE FUNCTION public.get_public_project_showcase()
RETURNS TABLE (
  id uuid,
  title text,
  district text,
  photo_urls text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.title,
    pr.district,
    COALESCE(
      array_agg(pp.url ORDER BY pp.created_at) FILTER (
        WHERE pp.id IS NOT NULL
          AND pp.is_public = true
          AND pp.url ~ '^https?://'
      ),
      ARRAY[]::text[]
    ) AS photo_urls
  FROM public.projects AS p
  LEFT JOIN public.properties AS pr ON pr.id = p.property_id
  LEFT JOIN public.project_photos AS pp
    ON pp.project_id = p.id
   AND pp.is_public = true
  WHERE p.is_public_reference = true
  GROUP BY p.id, p.title, pr.district, p.created_at
  ORDER BY p.created_at DESC
  LIMIT 6;
$$;

REVOKE ALL ON FUNCTION public.get_public_project_showcase() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_project_showcase() TO anon, authenticated, service_role;