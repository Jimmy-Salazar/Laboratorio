-- PATCH 06.53: configurable public highlights.
-- Run once in the Supabase SQL Editor before installing the frontend.
begin;

create table if not exists public.site_highlights (
  id uuid primary key default gen_random_uuid(),
  title_es text not null check (length(trim(title_es)) between 1 and 120),
  title_en text not null check (length(trim(title_en)) between 1 and 120),
  image_path text not null check (length(image_path) between 5 and 240),
  active boolean not null default true,
  sort_order integer not null default 100 check (sort_order between 0 and 9999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_site_highlights()
returns trigger language plpgsql set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_site_highlights_updated_at on public.site_highlights;
create trigger trg_site_highlights_updated_at
before update on public.site_highlights
for each row execute function public.touch_site_highlights();

-- Keep the four current flyers, and let the admin edit or deactivate them.
insert into public.site_highlights
  (id, title_es, title_en, image_path, sort_order)
values
  ('00000000-0000-4000-8000-000000000101', 'Servicios de laboratorio', 'Laboratory services', '/destacados/destacado-01-servicios.png', 10),
  ('00000000-0000-4000-8000-000000000102', 'Prueba de dengue', 'Dengue testing', '/destacados/destacado-02-dengue.png', 20),
  ('00000000-0000-4000-8000-000000000103', 'Formas de pago', 'Payment options', '/destacados/destacado-03-pagos.png', 30),
  ('00000000-0000-4000-8000-000000000104', 'Salud ocupacional', 'Occupational health', '/destacados/destacado-04-ocupacional.png', 40)
on conflict (id) do nothing;

create index if not exists idx_site_highlights_public
on public.site_highlights (sort_order, created_at, id) where active;

alter table public.site_highlights enable row level security;

drop policy if exists "Public read active highlights" on public.site_highlights;
create policy "Public read active highlights"
on public.site_highlights for select to anon, authenticated
using (active);

drop policy if exists "Admin read all highlights" on public.site_highlights;
create policy "Admin read all highlights"
on public.site_highlights for select to authenticated
using (exists (
  select 1 from public.staff_profiles sp
  where sp.user_id = (select auth.uid())
    and sp.active = true and sp.role = 'admin'
));

drop policy if exists "Admin insert highlights" on public.site_highlights;
create policy "Admin insert highlights"
on public.site_highlights for insert to authenticated
with check (exists (
  select 1 from public.staff_profiles sp
  where sp.user_id = (select auth.uid())
    and sp.active = true and sp.role = 'admin'
));

drop policy if exists "Admin update highlights" on public.site_highlights;
create policy "Admin update highlights"
on public.site_highlights for update to authenticated
using (exists (
  select 1 from public.staff_profiles sp
  where sp.user_id = (select auth.uid())
    and sp.active = true and sp.role = 'admin'
))
with check (exists (
  select 1 from public.staff_profiles sp
  where sp.user_id = (select auth.uid())
    and sp.active = true and sp.role = 'admin'
));

drop policy if exists "Admin delete highlights" on public.site_highlights;
create policy "Admin delete highlights"
on public.site_highlights for delete to authenticated
using (exists (
  select 1 from public.staff_profiles sp
  where sp.user_id = (select auth.uid())
    and sp.active = true and sp.role = 'admin'
));

revoke all on public.site_highlights from anon, authenticated;
grant select on public.site_highlights to anon;
grant select, insert, update, delete on public.site_highlights to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-highlights', 'site-highlights', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admin upload highlight images" on storage.objects;
drop policy if exists "Admin read highlight images" on storage.objects;
create policy "Admin read highlight images"
on storage.objects for select to authenticated
using (
  bucket_id = 'site-highlights'
  and exists (
    select 1 from public.staff_profiles sp
    where sp.user_id = (select auth.uid())
      and sp.active = true and sp.role = 'admin'
  )
);

create policy "Admin upload highlight images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'site-highlights'
  and name ~ '^[0-9a-f-]{36}\.(jpg|png|webp)$'
  and exists (
    select 1 from public.staff_profiles sp
    where sp.user_id = (select auth.uid())
      and sp.active = true and sp.role = 'admin'
  )
);

drop policy if exists "Admin remove highlight images" on storage.objects;
create policy "Admin remove highlight images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'site-highlights'
  and exists (
    select 1 from public.staff_profiles sp
    where sp.user_id = (select auth.uid())
      and sp.active = true and sp.role = 'admin'
  )
);

commit;
