
-- Enums
DO $$ BEGIN
  CREATE TYPE public.service_kind AS ENUM ('tow','vulcanizer','mechanic');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.request_status AS ENUM ('pending','offered','accepted','enroute','arrived','in_progress','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.offer_status AS ENUM ('pending','accepted','declined','withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helper: map service_kind to app_role
CREATE OR REPLACE FUNCTION public.role_for_service(_k public.service_kind)
RETURNS public.app_role
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE _k
    WHEN 'tow' THEN 'tow_operator'::public.app_role
    WHEN 'vulcanizer' THEN 'vulcanizer'::public.app_role
    WHEN 'mechanic' THEN 'mechanic'::public.app_role
  END;
$$;

-- service_requests
CREATE TABLE IF NOT EXISTS public.service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL,
  service_type public.service_kind NOT NULL,
  vehicle text,
  description text,
  location text,
  price_estimate_kobo bigint DEFAULT 0,
  status public.request_status NOT NULL DEFAULT 'pending',
  assigned_provider_id uuid,
  accepted_offer_id uuid,
  accepted_at timestamptz,
  completed_at timestamptz,
  rating int,
  review text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers manage own requests" ON public.service_requests
  FOR ALL TO authenticated
  USING (buyer_id = auth.uid())
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Providers see open + assigned" ON public.service_requests
  FOR SELECT TO authenticated
  USING (
    assigned_provider_id = auth.uid()
    OR (status IN ('pending','offered') AND public.has_role(auth.uid(), public.role_for_service(service_type)))
  );

CREATE POLICY "Providers update assigned" ON public.service_requests
  FOR UPDATE TO authenticated
  USING (assigned_provider_id = auth.uid());

CREATE TRIGGER trg_service_requests_updated BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- service_offers
CREATE TABLE IF NOT EXISTS public.service_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL,
  price_kobo bigint NOT NULL,
  eta_minutes int,
  message text,
  status public.offer_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.service_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers create own offers" ON public.service_offers
  FOR INSERT TO authenticated
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Providers update own offers" ON public.service_offers
  FOR UPDATE TO authenticated
  USING (provider_id = auth.uid());

CREATE POLICY "Visible to buyer or offering provider" ON public.service_offers
  FOR SELECT TO authenticated
  USING (
    provider_id = auth.uid()
    OR request_id IN (SELECT id FROM public.service_requests WHERE buyer_id = auth.uid())
  );

CREATE TRIGGER trg_service_offers_updated BEFORE UPDATE ON public.service_offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- provider_availability
CREATE TABLE IF NOT EXISTS public.provider_availability (
  user_id uuid PRIMARY KEY,
  is_online boolean NOT NULL DEFAULT false,
  weekly_schedule jsonb NOT NULL DEFAULT '{}'::jsonb,
  service_radius_km int NOT NULL DEFAULT 10,
  base_location text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages availability" ON public.provider_availability
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER trg_provider_availability_updated BEFORE UPDATE ON public.provider_availability
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- chat_messages
CREATE TABLE IF NOT EXISTS public.service_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_type text NOT NULL CHECK (thread_type IN ('request','order')),
  thread_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.service_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_chat_thread ON public.service_chat_messages(thread_type, thread_id, created_at);

CREATE OR REPLACE FUNCTION public.can_access_thread(_type text, _thread uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE _type
    WHEN 'request' THEN EXISTS (
      SELECT 1 FROM public.service_requests r
      WHERE r.id = _thread AND (r.buyer_id = _uid OR r.assigned_provider_id = _uid)
    )
    WHEN 'order' THEN EXISTS (
      SELECT 1 FROM public.parts_orders o
      WHERE o.id = _thread AND (
        o.buyer_id = _uid
        OR EXISTS (
          SELECT 1 FROM public.parts_order_items oi
          JOIN public.vendors v ON v.id = oi.vendor_id
          WHERE oi.order_id = o.id AND v.user_id = _uid
        )
      )
    )
    ELSE false END;
$$;

CREATE POLICY "Thread participants read" ON public.service_chat_messages
  FOR SELECT TO authenticated
  USING (public.can_access_thread(thread_type, thread_id, auth.uid()));

CREATE POLICY "Thread participants send" ON public.service_chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.can_access_thread(thread_type, thread_id, auth.uid()));

-- notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);

CREATE POLICY "Owner reads notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Owner updates notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- vendor_onboarding
CREATE TABLE IF NOT EXISTS public.vendor_onboarding (
  user_id uuid PRIMARY KEY,
  step int NOT NULL DEFAULT 0,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vendor_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages onboarding" ON public.vendor_onboarding
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER trg_vendor_onboarding_updated BEFORE UPDATE ON public.vendor_onboarding
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Notification triggers
CREATE OR REPLACE FUNCTION public.notify_new_offer()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE buyer uuid;
BEGIN
  SELECT buyer_id INTO buyer FROM public.service_requests WHERE id = NEW.request_id;
  IF buyer IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, kind, title, body, link)
    VALUES (buyer, 'offer.new', 'New quote received',
      'A provider sent you a quote of ₦' || (NEW.price_kobo/100)::text,
      '/requests/' || NEW.request_id::text);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_new_offer AFTER INSERT ON public.service_offers
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_offer();

CREATE OR REPLACE FUNCTION public.notify_request_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- notify buyer
    INSERT INTO public.notifications (user_id, kind, title, body, link)
    VALUES (NEW.buyer_id, 'request.status', 'Request update',
      'Status changed to ' || NEW.status::text, '/requests/' || NEW.id::text);
    -- notify provider if assigned
    IF NEW.assigned_provider_id IS NOT NULL AND NEW.assigned_provider_id <> NEW.buyer_id THEN
      INSERT INTO public.notifications (user_id, kind, title, body, link)
      VALUES (NEW.assigned_provider_id, 'request.status', 'Job update',
        'Status changed to ' || NEW.status::text, '/provider');
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_request_status AFTER UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_request_status();

CREATE OR REPLACE FUNCTION public.notify_chat_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE recipient uuid;
BEGIN
  IF NEW.thread_type = 'request' THEN
    SELECT CASE WHEN buyer_id = NEW.sender_id THEN assigned_provider_id ELSE buyer_id END
    INTO recipient FROM public.service_requests WHERE id = NEW.thread_id;
  ELSIF NEW.thread_type = 'order' THEN
    SELECT CASE WHEN buyer_id = NEW.sender_id THEN NULL ELSE buyer_id END
    INTO recipient FROM public.parts_orders WHERE id = NEW.thread_id;
  END IF;
  IF recipient IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, kind, title, body, link)
    VALUES (recipient, 'chat.new', 'New message', LEFT(NEW.body, 80),
      '/' || NEW.thread_type || 's/' || NEW.thread_id::text);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_chat AFTER INSERT ON public.service_chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_chat_message();

CREATE OR REPLACE FUNCTION public.notify_order_item_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE buyer uuid;
BEGIN
  IF NEW.vendor_status IS DISTINCT FROM OLD.vendor_status THEN
    SELECT buyer_id INTO buyer FROM public.parts_orders WHERE id = NEW.order_id;
    IF buyer IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, kind, title, body, link)
      VALUES (buyer, 'order.status', 'Order update',
        NEW.title_snapshot || ' is now ' || NEW.vendor_status::text,
        '/orders');
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_notify_order_item AFTER UPDATE ON public.parts_order_items
  FOR EACH ROW EXECUTE FUNCTION public.notify_order_item_status();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.parts_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.parts_order_items;

ALTER TABLE public.service_requests REPLICA IDENTITY FULL;
ALTER TABLE public.service_offers REPLICA IDENTITY FULL;
ALTER TABLE public.service_chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.parts_orders REPLICA IDENTITY FULL;
ALTER TABLE public.parts_order_items REPLICA IDENTITY FULL;
