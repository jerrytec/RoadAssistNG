
DROP POLICY IF EXISTS "Parts images authenticated read" ON storage.objects;
-- The bucket is public, so files are still reachable via getPublicUrl() / CDN.
-- Without any SELECT policy on storage.objects, no client can LIST the bucket.
