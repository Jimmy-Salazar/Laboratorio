-- ============================================================================
-- 016 SECURITY FUNCTION PRIVILEGES HARDENING
-- Laboratorio Clinico Dr. Milton Chasi
--
-- Goal:
-- - Remove direct anonymous execution from SECURITY DEFINER helpers.
-- - Keep only the authenticated RPC/helper access the application needs.
-- - Remove direct browser execution from trigger/event-trigger functions.
-- - Keep existing RLS policies and table data unchanged.
--
-- This migration is intentionally narrow: it changes FUNCTION EXECUTE grants.
-- ============================================================================

begin;

-- ============================================================================
-- 1. SECURITY DEFINER HELPERS USED BY RLS
-- Authenticated staff needs these because RLS policies call them.
-- Anonymous visitors do not.
-- ============================================================================

revoke execute
on function public.is_lab_staff(text[])
from public, anon;

grant execute
on function public.is_lab_staff(text[])
to authenticated;


revoke execute
on function public.is_master_admin()
from public, anon;

grant execute
on function public.is_master_admin()
to authenticated;


revoke execute
on function public.is_operational_admin()
from public, anon;

grant execute
on function public.is_operational_admin()
to authenticated;


revoke execute
on function public.is_staff_admin()
from public, anon;

grant execute
on function public.is_staff_admin()
to authenticated;


-- ============================================================================
-- 2. RESULT AUTHORIZATION HELPERS / RPCs
-- These are intentionally available only to authenticated users.
-- Internal role checks inside the functions remain in force.
-- ============================================================================

revoke execute
on function public.can_manage_results()
from public, anon;

grant execute
on function public.can_manage_results()
to authenticated;


revoke execute
on function public.is_results_staff()
from public, anon;

grant execute
on function public.is_results_staff()
to authenticated;


revoke execute
on function public.create_uploaded_patient_result(
  uuid,
  uuid,
  uuid,
  date,
  text,
  text,
  bigint,
  boolean
)
from public, anon;

grant execute
on function public.create_uploaded_patient_result(
  uuid,
  uuid,
  uuid,
  date,
  text,
  text,
  bigint,
  boolean
)
to authenticated;


revoke execute
on function public.release_patient_result(uuid)
from public, anon;

grant execute
on function public.release_patient_result(uuid)
to authenticated;


-- ============================================================================
-- 3. INTERNAL AUDIT FUNCTIONS
-- No browser role should call these directly.
-- Existing database triggers/functions can still invoke them as designed.
-- ============================================================================

revoke execute
on function public.audit_actor_snapshot(uuid)
from public, anon, authenticated;


revoke execute
on function public.capture_audit_log()
from public, anon, authenticated;


revoke execute
on function public.capture_patient_result_audit()
from public, anon, authenticated;


revoke execute
on function public.write_service_audit_log(
  uuid,
  text,
  text,
  text,
  text,
  jsonb
)
from public, anon, authenticated;


-- ============================================================================
-- 4. INTERNAL SECURITY / EVENT TRIGGER FUNCTION
-- rls_auto_enable is a database event-trigger helper. It must not be exposed
-- as an API-callable function to anonymous or authenticated browser clients.
-- ============================================================================

revoke execute
on function public.rls_auto_enable()
from public, anon, authenticated;


-- ============================================================================
-- 5. INTERNAL SECURITY-DEFINER TRIGGER FUNCTION
-- This function is already attached to an existing DB trigger and should not
-- be a directly callable API endpoint.
-- ============================================================================

revoke execute
on function public.track_appointment_status()
from public, anon, authenticated;


-- ============================================================================
-- 6. INTERNAL ORDER-NUMBER GENERATOR
-- Order numbers are created internally while results are registered.
-- There is no need for browser clients to call this function directly.
-- ============================================================================

revoke execute
on function public.generate_result_order_number()
from public, anon, authenticated;


-- ============================================================================
-- 7. PATIENT NORMALIZER
-- Authenticated patient-management code may indirectly need this through
-- SECURITY INVOKER database logic. Anonymous users do not.
-- ============================================================================

revoke execute
on function public.normalize_patient_identification(text)
from public, anon;

grant execute
on function public.normalize_patient_identification(text)
to authenticated;


commit;

-- ============================================================================
-- VERIFICATION A
-- SECURITY DEFINER functions and effective browser EXECUTE privileges.
-- Expected:
-- - anon_can_execute = false for every row.
-- - authenticated_can_execute = true only for:
--     can_manage_results
--     create_uploaded_patient_result
--     is_lab_staff
--     is_master_admin
--     is_operational_admin
--     is_results_staff
--     is_staff_admin
--     release_patient_result
-- - internal trigger/audit/event functions should be false/false.
-- ============================================================================

select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.proconfig as function_config,
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
  and p.prosecdef = true
order by p.proname;

-- ============================================================================
-- VERIFICATION B
-- The single dynamic-SQL function should remain rls_auto_enable, but neither
-- browser role should be able to execute it directly.
-- ============================================================================

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

-- Expected Verification B:
-- rls_auto_enable | anon_can_execute=false | authenticated_can_execute=false
