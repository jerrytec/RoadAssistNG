DROP VIEW IF EXISTS public.vendors_public;

CREATE TABLE public.vendors_public_info (
  vendor_id uuid PRIMARY KEY REFERENCES public.vendors(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  status public.vendor_status NOT NULL,
  verification_status public.verification_status NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.vendors_public_info TO anon, authenticated;
GRANT ALL ON public.vendors_public_info TO service_role;

ALTER TABLE public.vendors_public_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendor public info is readable"
  ON public.vendors_public_info FOR SELECT
  USING (true);

CREATE OR REPLACE FUNCTION public.sync_vendor_public_info()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'verified' THEN
    INSERT INTO public.vendors_public_info (vendor_id, business_name, status, verification_status)
    VALUES (NEW.id, NEW.business_name, NEW.status, NEW.verification_status)
    ON CONFLICT (vendor_id) DO UPDATE
      SET business_name = EXCLUDED.business_name,
          status = EXCLUDED.status,
          verification_status = EXCLUDED.verification_status;
  ELSE
    DELETE FROM public.vendors_public_info WHERE vendor_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_vendor_public_info() FROM anon, authenticated, PUBLIC;

CREATE TRIGGER trg_sync_vendor_public_info
AFTER INSERT OR UPDATE ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.sync_vendor_public_info();

INSERT INTO public.vendors_public_info (vendor_id, business_name, status, verification_status)
SELECT id, business_name, status, verification_status FROM public.vendors WHERE status = 'verified'
ON CONFLICT (vendor_id) DO NOTHING;