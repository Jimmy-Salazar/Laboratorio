-- MIGRATION 013
-- Public footer contact and social media settings.
-- One singleton row ("main") is used by the public website.
--
-- Security:
-- - anon/authenticated can read the public footer settings.
-- - only an active admin can insert/update.
-- - no client role can delete the singleton row.

create table if not exists public.site_contact_settings (
  id text primary key default 'main'
    check (id = 'main'),

  phone text not null default '',
  phone_enabled boolean not null default true,

  whatsapp text not null default '',
  whatsapp_enabled boolean not null default true,

  email text not null default '',
  email_enabled boolean not null default true,

  address text not null default '',
  address_enabled boolean not null default true,

  facebook_url text not null default '',
  facebook_enabled boolean not null default false,

  instagram_url text not null default '',
  instagram_enabled boolean not null default false,

  tiktok_url text not null default '',
  tiktok_enabled boolean not null default false,

  youtube_url text not null default '',
  youtube_enabled boolean not null default false,

  linkedin_url text not null default '',
  linkedin_enabled boolean not null default false,

  updated_at timestamptz not null default now()
);

create or replace function public.touch_site_contact_settings()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_site_contact_settings_updated_at
on public.site_contact_settings;

create trigger trg_site_contact_settings_updated_at
before update on public.site_contact_settings
for each row
execute function public.touch_site_contact_settings();

insert into public.site_contact_settings (id)
values ('main')
on conflict (id) do nothing;

alter table public.site_contact_settings
enable row level security;

drop policy if exists "Public can read site contact settings"
on public.site_contact_settings;

create policy "Public can read site contact settings"
on public.site_contact_settings
for select
to anon, authenticated
using (true);

drop policy if exists "Admin can insert site contact settings"
on public.site_contact_settings;

create policy "Admin can insert site contact settings"
on public.site_contact_settings
for insert
to authenticated
with check (
  exists (
    select 1
    from public.staff_profiles sp
    where sp.user_id = auth.uid()
      and sp.active = true
      and sp.role = 'admin'
  )
);

drop policy if exists "Admin can update site contact settings"
on public.site_contact_settings;

create policy "Admin can update site contact settings"
on public.site_contact_settings
for update
to authenticated
using (
  exists (
    select 1
    from public.staff_profiles sp
    where sp.user_id = auth.uid()
      and sp.active = true
      and sp.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.staff_profiles sp
    where sp.user_id = auth.uid()
      and sp.active = true
      and sp.role = 'admin'
  )
);

revoke all on public.site_contact_settings
from anon, authenticated;

grant select on public.site_contact_settings
to anon, authenticated;

grant insert, update on public.site_contact_settings
to authenticated;