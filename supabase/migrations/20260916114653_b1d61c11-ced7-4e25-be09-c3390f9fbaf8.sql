REVOKE ALL ON FUNCTION public.notify_new_request() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_request_status_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;