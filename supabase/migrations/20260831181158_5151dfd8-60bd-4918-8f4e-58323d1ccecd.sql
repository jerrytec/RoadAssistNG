create policy "Temporary directory seeding"
on public.providers_directory for insert
to anon, authenticated
with check (true);

grant insert on public.providers_directory to anon;
grant insert on public.providers_directory to authenticated;