-- Lock down SECURITY DEFINER funcs
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_product_rate_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
-- has_role is needed by RLS policies (called as auth.uid() context) - keep authenticated execute
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;

-- Storage listing: restrict SELECT to owner's folder only (images still load via public URL)
DROP POLICY IF EXISTS "Demo images are publicly accessible" ON storage.objects;
CREATE POLICY "Owners can list their demo images"
ON storage.objects FOR SELECT
USING (bucket_id = 'demo-images' AND (auth.uid()::text = (storage.foldername(name))[1]));