-- 1. profiles: own row + admins only
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

-- 2. vendors: remove broad read; owner + admins only
DROP POLICY IF EXISTS "Verified vendors are public" ON public.vendors;
CREATE POLICY "Vendors read own row" ON public.vendors FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE VIEW public.vendors_public AS
  SELECT id, business_name, status, verification_status, created_at
  FROM public.vendors
  WHERE status = 'verified';
GRANT SELECT ON public.vendors_public TO anon, authenticated;

-- 3. providers_directory: hide operator + plate from public reads
REVOKE SELECT ON public.providers_directory FROM anon, authenticated;
GRANT SELECT (id, sort_index, name, type, location, status, verified, distance, eta, rating,
  avatar_bg, base_fee_kobo, per_km_kobo, capacity_tonnes, shop_type, services, specializations,
  badges, search_text, created_at) ON public.providers_directory TO anon, authenticated;

-- 4. lock down internal SECURITY DEFINER / trigger functions
REVOKE ALL ON FUNCTION public.notify_chat_message() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.notify_new_offer() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.notify_order_item_status() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.notify_request_status() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.notify_sos_created() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.parts_directory_search_text() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.providers_directory_search_text() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.publish_provider_application() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;

-- helpers only needed by signed-in policy checks
REVOKE ALL ON FUNCTION public.can_access_thread(text, uuid, uuid) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.has_admin_role(uuid, public.admin_role) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.is_any_admin(uuid) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.is_compliance_admin(uuid) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_thread(text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_admin_role(uuid, public.admin_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_any_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_compliance_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;