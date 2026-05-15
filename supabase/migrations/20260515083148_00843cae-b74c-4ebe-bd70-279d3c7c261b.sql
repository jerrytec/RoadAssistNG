
DO $$ BEGIN
  CREATE TYPE public.sos_status AS ENUM ('dispatching','assigned','enroute','on_scene','resolved','escalated','cancelled','false_alarm');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS is_sos boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sos_status public.sos_status,
  ADD COLUMN IF NOT EXISTS priority smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sos_lat numeric,
  ADD COLUMN IF NOT EXISTS sos_lng numeric,
  ADD COLUMN IF NOT EXISTS sos_accuracy_m integer,
  ADD COLUMN IF NOT EXISTS sos_triggered_at timestamptz,
  ADD COLUMN IF NOT EXISTS sos_escalated_at timestamptz,
  ADD COLUMN IF NOT EXISTS device_info jsonb,
  ADD COLUMN IF NOT EXISTS danger_flag boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_service_requests_sos_active
  ON public.service_requests (sos_status, created_at DESC)
  WHERE is_sos = true;

CREATE TABLE IF NOT EXISTS public.sos_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL,
  kind text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sos_events_request ON public.sos_events(request_id, created_at);
ALTER TABLE public.sos_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read sos events" ON public.sos_events;
CREATE POLICY "Admins read sos events" ON public.sos_events FOR SELECT TO authenticated USING (public.is_any_admin(auth.uid()));
DROP POLICY IF EXISTS "Participants read sos events" ON public.sos_events;
CREATE POLICY "Participants read sos events" ON public.sos_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.service_requests r WHERE r.id = sos_events.request_id AND (r.buyer_id = auth.uid() OR r.assigned_provider_id = auth.uid())));
DROP POLICY IF EXISTS "Authenticated insert sos events" ON public.sos_events;
CREATE POLICY "Authenticated insert sos events" ON public.sos_events FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.service_requests r WHERE r.id = request_id AND (r.buyer_id = auth.uid() OR r.assigned_provider_id = auth.uid())) OR public.is_any_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.trusted_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  relation text,
  notify_on_sos boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trusted_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner manages trusted contacts" ON public.trusted_contacts;
CREATE POLICY "Owner manages trusted contacts" ON public.trusted_contacts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.sos_share_tokens (
  token text PRIMARY KEY,
  request_id uuid NOT NULL,
  created_by uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sos_share_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner manages share tokens" ON public.sos_share_tokens;
CREATE POLICY "Owner manages share tokens" ON public.sos_share_tokens FOR ALL TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

CREATE TABLE IF NOT EXISTS public.sos_abuse_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  request_id uuid,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sos_abuse_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read abuse log" ON public.sos_abuse_log;
CREATE POLICY "Admins read abuse log" ON public.sos_abuse_log FOR SELECT TO authenticated USING (public.is_any_admin(auth.uid()));
DROP POLICY IF EXISTS "Admins insert abuse log" ON public.sos_abuse_log;
CREATE POLICY "Admins insert abuse log" ON public.sos_abuse_log FOR INSERT TO authenticated WITH CHECK (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Providers see open sos" ON public.service_requests;
CREATE POLICY "Providers see open sos" ON public.service_requests FOR SELECT TO authenticated
USING (is_sos = true AND assigned_provider_id IS NULL AND public.has_role(auth.uid(), public.role_for_service(service_type)));

CREATE OR REPLACE FUNCTION public.get_sos_by_token(_token text)
RETURNS TABLE (id uuid, sos_status public.sos_status, sos_lat numeric, sos_lng numeric, assigned_provider_id uuid, vehicle text, location text, created_at timestamptz, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT r.id, r.sos_status, r.sos_lat, r.sos_lng, r.assigned_provider_id, r.vehicle, r.location, r.created_at, r.updated_at
  FROM public.sos_share_tokens t
  JOIN public.service_requests r ON r.id = t.request_id
  WHERE t.token = _token AND t.expires_at > now() AND r.is_sos = true;
$$;
GRANT EXECUTE ON FUNCTION public.get_sos_by_token(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_sos_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_sos = true THEN
    INSERT INTO public.notifications (user_id, kind, title, body, link)
    SELECT ar.user_id, 'sos.new', '🚨 SOS alert',
           'Emergency request — immediate dispatch needed', '/admin/sos'
    FROM public.admin_roles ar WHERE ar.role IN ('super_admin','operations');

    INSERT INTO public.notifications (user_id, kind, title, body, link)
    SELECT ur.user_id, 'sos.new', '🚨 Emergency nearby',
           'A user needs urgent ' || NEW.service_type::text || ' help', '/vendor'
    FROM public.user_roles ur WHERE ur.role = public.role_for_service(NEW.service_type);

    INSERT INTO public.sos_events (request_id, kind, payload, actor_id)
    VALUES (NEW.id, 'created', jsonb_build_object('service_type', NEW.service_type), NEW.buyer_id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_sos_created ON public.service_requests;
CREATE TRIGGER trg_notify_sos_created
AFTER INSERT ON public.service_requests
FOR EACH ROW WHEN (NEW.is_sos = true)
EXECUTE FUNCTION public.notify_sos_created();
