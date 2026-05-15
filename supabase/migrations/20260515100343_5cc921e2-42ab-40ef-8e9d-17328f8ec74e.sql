
-- Provider KYC table for all service providers (tow_operator, vulcanizer, mechanic, vendor)
CREATE TABLE IF NOT EXISTS public.provider_kyc (
  user_id uuid PRIMARY KEY,
  nin text,
  bvn text,
  union_id text,
  union_name text,
  nin_verified boolean NOT NULL DEFAULT false,
  bvn_verified boolean NOT NULL DEFAULT false,
  nin_data jsonb,
  bvn_data jsonb,
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  verified_at timestamptz,
  verified_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_kyc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages own kyc"
  ON public.provider_kyc FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins read all kyc"
  ON public.provider_kyc FOR SELECT TO authenticated
  USING (public.is_any_admin(auth.uid()));

CREATE POLICY "Compliance updates kyc"
  ON public.provider_kyc FOR UPDATE TO authenticated
  USING (public.has_admin_role(auth.uid(), 'compliance'::admin_role)
      OR public.has_admin_role(auth.uid(), 'super_admin'::admin_role));

CREATE TRIGGER provider_kyc_updated_at
  BEFORE UPDATE ON public.provider_kyc
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add union fields to vendors as well so parts sellers can store union/association reg
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS union_id text,
  ADD COLUMN IF NOT EXISTS union_name text;
