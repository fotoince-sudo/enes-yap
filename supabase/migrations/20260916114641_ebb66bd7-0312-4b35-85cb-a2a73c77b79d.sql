CREATE OR REPLACE FUNCTION public.notify_new_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, kind, entity_type, entity_id)
  SELECT ur.user_id,
         'Yeni tadilat talebi: ' || NEW.full_name,
         concat_ws(' · ',
           nullif(concat_ws(' ', NEW.district, NEW.city), ''),
           nullif(NEW.renovation_type, ''),
           nullif(NEW.phone, '')),
         'yeni_talep',
         'renovation_request',
         NEW.id
  FROM public.user_roles ur
  WHERE ur.role IN ('admin', 'yonetici');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_request ON public.renovation_requests;
CREATE TRIGGER trg_notify_new_request
AFTER INSERT ON public.renovation_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_new_request();