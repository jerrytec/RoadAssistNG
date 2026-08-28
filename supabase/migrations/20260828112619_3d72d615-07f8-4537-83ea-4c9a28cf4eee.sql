create table if not exists public.providers_directory (
  id text primary key,
  sort_index integer not null default 0,
  name text not null,
  type text not null,
  location text,
  status text,
  verified boolean not null default false,
  distance text,
  eta text,
  rating text,
  avatar_bg text,
  operator text,
  plate text,
  base_fee_kobo bigint,
  per_km_kobo bigint,
  capacity_tonnes numeric,
  shop_type text,
  services text[],
  specializations text[],
  badges jsonb not null default '[]'::jsonb,
  search_text text not null default '',
  created_at timestamptz not null default now()
);

grant select on public.providers_directory to anon;
grant select on public.providers_directory to authenticated;
grant all on public.providers_directory to service_role;

alter table public.providers_directory enable row level security;

drop policy if exists "Provider directory is publicly readable" on public.providers_directory;
create policy "Provider directory is publicly readable"
on public.providers_directory for select
to anon, authenticated
using (true);

create or replace function public.providers_directory_search_text()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.search_text := lower(
    coalesce(new.name,'') || ' ' || coalesce(new.type,'') || ' ' || coalesce(new.location,'') || ' ' ||
    coalesce(new.operator,'') || ' ' || coalesce(new.plate,'') || ' ' || coalesce(new.shop_type,'') || ' ' ||
    coalesce(array_to_string(new.services,' '),'') || ' ' || coalesce(array_to_string(new.specializations,' '),'')
  );
  return new;
end;
$$;

drop trigger if exists providers_directory_search_text_trg on public.providers_directory;
create trigger providers_directory_search_text_trg
before insert or update on public.providers_directory
for each row execute function public.providers_directory_search_text();

create index if not exists providers_directory_type_idx on public.providers_directory (lower(type));
create index if not exists providers_directory_sort_idx on public.providers_directory (sort_index);
create index if not exists providers_directory_search_idx on public.providers_directory (search_text);