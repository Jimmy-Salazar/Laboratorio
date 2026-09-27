-- ============================================================================
-- 016.1 SECURITY POST-HARDENING CHECK
-- READ ONLY
-- ============================================================================

-- 1. No exposed application table should have RLS disabled.
select
  c.relname as table_without_rls
from pg_class c
join pg_namespace n
  on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
  and c.relrowsecurity = false
order by c.relname;

-- Expected: 0 rows.

-- 2. No SECURITY DEFINER function should be executable by anon.
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

-- Expected: 0 rows.

-- 3. Dynamic SQL functions exposed to browser roles.
select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  has_function_privilege(
    'anon',
    p.oid,
    'EXECUTE'
  ) as anon_can_execute,
  has_function_privilege(
    'authenticated',
    p.oid,
    'EXECUTE'
  ) as authenticated_can_execute
from pg_proc p
join pg_namespace n
  on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prokind = 'f'
  and lower(pg_get_functiondef(p.oid)) like '%execute %'
order by p.proname;

-- Expected:
-- rls_auto_enable with false / false.

-- 4. Sensitive result bucket remains private.
select
  id,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
where id = 'patient-results';

-- Expected: public = false.
