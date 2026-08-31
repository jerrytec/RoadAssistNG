drop policy if exists "Temporary directory seeding" on public.providers_directory;
revoke insert on public.providers_directory from anon;
revoke insert on public.providers_directory from authenticated;