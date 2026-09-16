REVOKE ALL ON FUNCTION public.is_manager(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_manager(uuid) TO authenticated, service_role;