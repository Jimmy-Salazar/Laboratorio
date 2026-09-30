begin;

-- ============================================================================
-- MIGRATION 026
-- Staff branch assignment
-- ============================================================================
--
-- branch_id = NULL:
--   acceso a TODAS las sucursales.
--
-- branch_id = UUID:
--   usuario asociado a una sucursal especifica.
--
-- Master y Admin siempre deben tener branch_id = NULL.
-- ============================================================================

alter table public.staff_profiles
  add column if not exists branch_id uuid;


alter table public.staff_profiles
  drop constraint if exists staff_profiles_branch_id_fkey;


alter table public.staff_profiles
  add constraint staff_profiles_branch_id_fkey
  foreign key (branch_id)
  references public.branches(id)
  on delete set null;


alter table public.staff_profiles
  drop constraint if exists staff_profiles_admin_all_branches_check;


alter table public.staff_profiles
  add constraint staff_profiles_admin_all_branches_check
  check (
    role not in (
      'master',
      'admin'
    )
    or branch_id is null
  );


create index if not exists idx_staff_profiles_branch
  on public.staff_profiles(branch_id);


update public.staff_profiles
set
  branch_id = null,
  updated_at = now()
where role in (
  'master',
  'admin'
)
and branch_id is not null;


comment on column public.staff_profiles.branch_id is
  'NULL means all branches. UUID limits staff member to one branch. Admin and master must always be NULL.';


commit;