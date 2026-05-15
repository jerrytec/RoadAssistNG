
-- 1. Admin roles enum + table
CREATE TYPE public.admin_role AS ENUM (
  'super_admin','operations','finance','compliance','fraud','support','analytics'
);

CREATE TABLE public.admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.admin_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_admin_role(_user_id uuid, _role public.admin_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = _user_id AND role = _role); $$;

CREATE OR REPLACE FUNCTION public.is_any_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.admin_roles WHERE user_id = _user_id); $$;

CREATE POLICY "Users see own admin roles" ON public.admin_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_admin_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins manage admin roles" ON public.admin_roles
  FOR ALL TO authenticated
  USING (public.has_admin_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_admin_role(auth.uid(), 'super_admin'));

-- 2. Verification (NIN + status) for vendors
CREATE TYPE public.verification_status AS ENUM ('pending','approved','rejected');

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS nin text,
  ADD COLUMN IF NOT EXISTS verification_status public.verification_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS verification_notes text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid;

-- 3. Service request payment fields
CREATE TYPE public.svc_payment_status AS ENUM ('unpaid','pending','paid','refunded','failed');

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS payment_status public.svc_payment_status NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS amount_kobo bigint;

-- 4. Disputes
CREATE TYPE public.dispute_status AS ENUM ('open','investigating','resolved','rejected');
CREATE TYPE public.dispute_kind AS ENUM ('service','order');

CREATE TABLE public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.dispute_kind NOT NULL,
  reference_id uuid NOT NULL,
  opened_by uuid NOT NULL,
  reason text NOT NULL,
  description text,
  status public.dispute_status NOT NULL DEFAULT 'open',
  assigned_admin uuid,
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Opener sees own disputes" ON public.disputes
  FOR SELECT TO authenticated USING (opened_by = auth.uid());

CREATE POLICY "Admins read disputes" ON public.disputes
  FOR SELECT TO authenticated USING (public.is_any_admin(auth.uid()));

CREATE POLICY "Users open disputes" ON public.disputes
  FOR INSERT TO authenticated WITH CHECK (opened_by = auth.uid());

CREATE POLICY "Admins update disputes" ON public.disputes
  FOR UPDATE TO authenticated
  USING (
    public.has_admin_role(auth.uid(),'super_admin')
    OR public.has_admin_role(auth.uid(),'support')
    OR public.has_admin_role(auth.uid(),'operations')
    OR public.has_admin_role(auth.uid(),'finance')
  );

CREATE TRIGGER set_disputes_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Admin read access on key tables
CREATE POLICY "Admins read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_any_admin(auth.uid()));

CREATE POLICY "Admins read all user roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_any_admin(auth.uid()));

CREATE POLICY "Admins read all vendors" ON public.vendors
  FOR SELECT TO authenticated USING (public.is_any_admin(auth.uid()));

CREATE POLICY "Compliance updates vendor verification" ON public.vendors
  FOR UPDATE TO authenticated
  USING (public.has_admin_role(auth.uid(),'compliance') OR public.has_admin_role(auth.uid(),'super_admin'));

CREATE POLICY "Admins read all requests" ON public.service_requests
  FOR SELECT TO authenticated USING (public.is_any_admin(auth.uid()));

CREATE POLICY "Admins read all orders" ON public.parts_orders
  FOR SELECT TO authenticated USING (public.is_any_admin(auth.uid()));
