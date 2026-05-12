
-- Fix mutable search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE PLPGSQL SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Restrict SECURITY DEFINER functions to only the roles that need them
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;

-- Narrow the parts-images public read so listing isn't possible (only direct file access via path)
DROP POLICY IF EXISTS "Parts images public read" ON storage.objects;
CREATE POLICY "Parts images authenticated read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'parts-images');
-- Anonymous users still get the file via the public CDN URL because the bucket is public,
-- but they cannot LIST the bucket since there's no anon SELECT policy on storage.objects.
