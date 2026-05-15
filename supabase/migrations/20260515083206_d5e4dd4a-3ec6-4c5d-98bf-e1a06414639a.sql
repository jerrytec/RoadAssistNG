
DROP POLICY IF EXISTS "Providers claim sos" ON public.service_requests;
CREATE POLICY "Providers claim sos" ON public.service_requests FOR UPDATE TO authenticated
USING (is_sos = true AND assigned_provider_id IS NULL AND public.has_role(auth.uid(), public.role_for_service(service_type)))
WITH CHECK (assigned_provider_id = auth.uid());
