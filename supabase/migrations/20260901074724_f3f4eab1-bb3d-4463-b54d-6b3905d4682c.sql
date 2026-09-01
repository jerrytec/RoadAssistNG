CREATE TYPE public.application_status AS ENUM ('pending','approved','rejected');

CREATE TABLE public.provider_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  location text,
  operator text,
  plate text,
  shop_type text,
  phone text,
  services text[] NOT NULL DEFAULT '{}',
  specializations text[] NOT NULL DEFAULT '{}',
  base_fee_kobo bigint,
  per_km_kobo bigint,
  capacity_tonnes numeric,
  status public.application_status NOT NULL DEFAULT 'pending',
  review_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

GRANT SELECT, INSERT, UPDATE ON public.provider_applications TO authenticated;
GRANT ALL ON public.provider_applications TO service_role;

ALTER TABLE public.provider_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants view own application" ON public.provider_applications
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_any_admin(auth.uid()));
CREATE POLICY "Applicants create own application" ON public.provider_applications
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "Applicants edit pending application" ON public.provider_applications
  FOR UPDATE TO authenticated USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "Admins review applications" ON public.provider_applications
  FOR UPDATE TO authenticated USING (public.is_any_admin(auth.uid())) WITH CHECK (public.is_any_admin(auth.uid()));

CREATE TRIGGER trg_provider_applications_updated
  BEFORE UPDATE ON public.provider_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.publish_provider_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE dir_id text;
BEGIN
  dir_id := 'app-' || NEW.id::text;
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    INSERT INTO public.providers_directory (
      id, sort_index, name, type, location, status, verified, operator, plate, shop_type,
      services, specializations, base_fee_kobo, per_km_kobo, capacity_tonnes, badges, search_text
    ) VALUES (
      dir_id,
      COALESCE((SELECT MAX(sort_index) FROM public.providers_directory), 0) + 1,
      NEW.name, NEW.type, NEW.location, 'Available', true, NEW.operator, NEW.plate, NEW.shop_type,
      NEW.services, NEW.specializations, NEW.base_fee_kobo, NEW.per_km_kobo, NEW.capacity_tonnes,
      '[]'::jsonb, ''
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, type = EXCLUDED.type, location = EXCLUDED.location,
      operator = EXCLUDED.operator, plate = EXCLUDED.plate, shop_type = EXCLUDED.shop_type,
      services = EXCLUDED.services, specializations = EXCLUDED.specializations,
      base_fee_kobo = EXCLUDED.base_fee_kobo, per_km_kobo = EXCLUDED.per_km_kobo,
      capacity_tonnes = EXCLUDED.capacity_tonnes;
  ELSIF NEW.status <> 'approved' AND OLD.status = 'approved' THEN
    DELETE FROM public.providers_directory WHERE id = dir_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_publish_provider_application
  AFTER UPDATE ON public.provider_applications
  FOR EACH ROW EXECUTE FUNCTION public.publish_provider_application();