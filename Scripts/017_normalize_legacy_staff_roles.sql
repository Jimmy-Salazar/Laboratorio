-- ============================================================================
-- 017 NORMALIZE LEGACY STAFF ROLES IN RLS POLICIES
-- Laboratorio Clinico Dr. Milton Chasi
--
-- Current application roles:
--   master
--   admin
--   secretary
--   laboratorist
--
-- Legacy policies still reference:
--   reception
--   lab
--
-- This migration updates only those policy role lists and normalizes any
-- remaining legacy staff rows. It does not broaden anonymous access.
-- ============================================================================

begin;

update public.staff_profiles
set role = 'secretary'
where role = 'reception';

update public.staff_profiles
set role = 'laboratorist'
where role = 'lab';

drop policy if exists "Staff can read appointment history"
on public.appointment_status_history;

create policy "Staff can read appointment history"
on public.appointment_status_history
for select
to authenticated
using (
  public.is_lab_staff(
    array['admin','secretary','laboratorist']::text[]
  )
);

drop policy if exists "Admin reception can delete appointment studies"
on public.appointment_studies;

drop policy if exists "Admin secretary can delete appointment studies"
on public.appointment_studies;

create policy "Admin secretary can delete appointment studies"
on public.appointment_studies
for delete
to authenticated
using (
  public.is_lab_staff(
    array['admin','secretary']::text[]
  )
);

drop policy if exists "Admin reception can insert appointment studies"
on public.appointment_studies;

drop policy if exists "Admin secretary can insert appointment studies"
on public.appointment_studies;

create policy "Admin secretary can insert appointment studies"
on public.appointment_studies
for insert
to authenticated
with check (
  public.is_lab_staff(
    array['admin','secretary']::text[]
  )
);

drop policy if exists "Staff can read appointment studies"
on public.appointment_studies;

create policy "Staff can read appointment studies"
on public.appointment_studies
for select
to authenticated
using (
  public.is_lab_staff(
    array['admin','secretary','laboratorist']::text[]
  )
);

drop policy if exists "Admin reception can insert appointments"
on public.appointments;

drop policy if exists "Admin secretary can insert appointments"
on public.appointments;

create policy "Admin secretary can insert appointments"
on public.appointments
for insert
to authenticated
with check (
  public.is_lab_staff(
    array['admin','secretary']::text[]
  )
);

drop policy if exists "Staff can read appointments"
on public.appointments;

create policy "Staff can read appointments"
on public.appointments
for select
to authenticated
using (
  public.is_lab_staff(
    array['admin','secretary','laboratorist']::text[]
  )
);

drop policy if exists "Admin reception can update appointments"
on public.appointments;

drop policy if exists "Admin secretary can update appointments"
on public.appointments;

create policy "Admin secretary can update appointments"
on public.appointments
for update
to authenticated
using (
  public.is_lab_staff(
    array['admin','secretary']::text[]
  )
)
with check (
  public.is_lab_staff(
    array['admin','secretary']::text[]
  )
);

drop policy if exists "Staff can read all branch studies"
on public.branch_studies;

create policy "Staff can read all branch studies"
on public.branch_studies
for select
to authenticated
using (
  public.is_lab_staff(
    array['admin','secretary','laboratorist']::text[]
  )
);

drop policy if exists "Staff can read all branches"
on public.branches;

create policy "Staff can read all branches"
on public.branches
for select
to authenticated
using (
  public.is_lab_staff(
    array['admin','secretary','laboratorist']::text[]
  )
);

drop policy if exists "Staff can read all specialties"
on public.specialties;

create policy "Staff can read all specialties"
on public.specialties
for select
to authenticated
using (
  public.is_lab_staff(
    array['admin','secretary','laboratorist']::text[]
  )
);

drop policy if exists "Staff can read all studies"
on public.studies;

create policy "Staff can read all studies"
on public.studies
for select
to authenticated
using (
  public.is_lab_staff(
    array['admin','secretary','laboratorist']::text[]
  )
);

commit;

-- VERIFICATION A: expected 0 rows
select
  user_id,
  full_name,
  role
from public.staff_profiles
where role in ('reception', 'lab');

-- VERIFICATION B: expected 0 rows
select
  tablename,
  policyname,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and (
    coalesce(qual, '') ~ E'(^|[^a-zA-Z])(reception|lab)([^a-zA-Z]|$)'
    or
    coalesce(with_check, '') ~ E'(^|[^a-zA-Z])(reception|lab)([^a-zA-Z]|$)'
  )
order by tablename, policyname;
