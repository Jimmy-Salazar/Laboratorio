-- ============================================================================
-- 017.1 ROLE / SECURITY POST-CHECK
-- READ ONLY
-- ============================================================================

select
  role,
  count(*) as total
from public.staff_profiles
group by role
order by role;

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

select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n
  on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prokind = 'f'
  and p.prosecdef = true
  and has_function_privilege(
    'anon',
    p.oid,
    'EXECUTE'
  )
order by p.proname;

select
  c.relname as table_without_rls
from pg_class c
join pg_namespace n
  on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
  and c.relrowsecurity = false
order by c.relname;
