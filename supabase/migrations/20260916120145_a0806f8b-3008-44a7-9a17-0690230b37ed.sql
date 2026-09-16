ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

UPDATE public.profiles p SET email = u.email FROM auth.users u WHERE u.id = p.id AND p.email IS NULL;

CREATE TABLE public.staff_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  full_name text,
  role app_role NOT NULL DEFAULT 'personel',
  note text,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at timestamp with time zone,
  accepted_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_invites TO authenticated;
GRANT ALL ON public.staff_invites TO service_role;

ALTER TABLE public.staff_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Yoneticiler davetleri yonetir" ON public.staff_invites
  FOR ALL TO authenticated
  USING (public.is_manager(auth.uid()))
  WITH CHECK (public.is_manager(auth.uid()));

CREATE TRIGGER trg_staff_invites_touch BEFORE UPDATE ON public.staff_invites
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  invited_role app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

  IF NOT EXISTS (SELECT 1 FROM public.user_roles) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN NEW;
  END IF;

  SELECT role INTO invited_role
  FROM public.staff_invites
  WHERE lower(email) = lower(NEW.email) AND accepted_at IS NULL
  LIMIT 1;

  IF invited_role IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, invited_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    UPDATE public.staff_invites
    SET accepted_at = now(), accepted_user_id = NEW.id
    WHERE lower(email) = lower(NEW.email) AND accepted_at IS NULL;
  END IF;

  RETURN NEW;
END; $function$;