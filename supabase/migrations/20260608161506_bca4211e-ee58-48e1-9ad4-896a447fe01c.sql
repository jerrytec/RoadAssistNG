
CREATE TABLE IF NOT EXISTS public.compliance_config (
  id boolean PRIMARY KEY DEFAULT true,
  fee_percentage numeric NOT NULL DEFAULT 0.03,
  fee_label text NOT NULL DEFAULT 'State Digital Service Levy',
  platform_service_fee_percentage numeric NOT NULL DEFAULT 0.05,
  platform_parts_fee_percentage numeric NOT NULL DEFAULT 0.025,
  min_fee numeric NOT NULL DEFAULT 0.01,
  max_fee numeric NOT NULL DEFAULT 0.05,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT singleton CHECK (id = true)
);
GRANT SELECT, INSERT, UPDATE ON public.compliance_config TO authenticated;
GRANT ALL ON public.compliance_config TO service_role;
ALTER TABLE public.compliance_config ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_compliance_admin(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_roles
    WHERE user_id = _uid AND role::text IN ('super_admin','finance','compliance')
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_compliance_admin(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "admins read config" ON public.compliance_config;
DROP POLICY IF EXISTS "admins update config" ON public.compliance_config;
CREATE POLICY "admins read config" ON public.compliance_config FOR SELECT TO authenticated USING (public.is_compliance_admin(auth.uid()));
CREATE POLICY "admins update config" ON public.compliance_config FOR UPDATE TO authenticated USING (public.is_compliance_admin(auth.uid())) WITH CHECK (public.is_compliance_admin(auth.uid()));
INSERT INTO public.compliance_config (id) VALUES (true) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.compliance_remittance_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_amount_kobo bigint NOT NULL DEFAULT 0,
  entry_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','completed','cancelled')),
  notes text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.compliance_remittance_batches TO authenticated;
GRANT ALL ON public.compliance_remittance_batches TO service_role;
ALTER TABLE public.compliance_remittance_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins read batches" ON public.compliance_remittance_batches;
CREATE POLICY "admins read batches" ON public.compliance_remittance_batches FOR SELECT TO authenticated USING (public.is_compliance_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.compliance_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL,
  transaction_kind text NOT NULL CHECK (transaction_kind IN ('service','parts')),
  provider_id uuid,
  buyer_id uuid,
  service_type text,
  region text,
  gross_amount_kobo bigint NOT NULL,
  platform_fee_kobo bigint NOT NULL DEFAULT 0,
  compliance_fee_kobo bigint NOT NULL,
  net_payout_kobo bigint NOT NULL,
  fee_percentage_applied numeric NOT NULL,
  fee_label text NOT NULL,
  remittance_status text NOT NULL DEFAULT 'pending' CHECK (remittance_status IN ('pending','processing','completed')),
  remittance_batch_id uuid REFERENCES public.compliance_remittance_batches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (transaction_id, transaction_kind)
);
GRANT SELECT ON public.compliance_ledger TO authenticated;
GRANT ALL ON public.compliance_ledger TO service_role;
ALTER TABLE public.compliance_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins read ledger" ON public.compliance_ledger;
DROP POLICY IF EXISTS "user reads own ledger" ON public.compliance_ledger;
CREATE POLICY "admins read ledger" ON public.compliance_ledger FOR SELECT TO authenticated USING (public.is_compliance_admin(auth.uid()));
CREATE POLICY "user reads own ledger" ON public.compliance_ledger FOR SELECT TO authenticated USING (provider_id = auth.uid() OR buyer_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_ledger_created ON public.compliance_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_provider ON public.compliance_ledger(provider_id);
CREATE INDEX IF NOT EXISTS idx_ledger_remit ON public.compliance_ledger(remittance_status);

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS platform_fee_kobo bigint,
  ADD COLUMN IF NOT EXISTS compliance_fee_kobo bigint,
  ADD COLUMN IF NOT EXISTS net_payout_kobo bigint,
  ADD COLUMN IF NOT EXISTS fee_label text;

ALTER TABLE public.parts_orders
  ADD COLUMN IF NOT EXISTS platform_fee_kobo bigint,
  ADD COLUMN IF NOT EXISTS compliance_fee_kobo bigint,
  ADD COLUMN IF NOT EXISTS net_payout_kobo bigint,
  ADD COLUMN IF NOT EXISTS fee_label text;
