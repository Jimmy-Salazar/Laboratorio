-- ============================================================================
-- 019 FIX release_patient_result AMBIGUOUS released_at
-- Laboratorio Clinico Dr. Milton Chasi
--
-- Fixes PostgreSQL error 42702:
--   column reference "released_at" is ambiguous
--
-- Cause:
-- RETURNS TABLE defines an output variable named released_at, which conflicts
-- with patient_results.released_at inside the UPDATE expression.
--
-- This patch qualifies the table column with alias pr.
-- It does not modify existing patient/result data.
-- ============================================================================

begin;

create or replace function public.release_patient_result(
  p_result_id uuid
)
returns table (
  result_id uuid,
  order_number text,
  released_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_released_at timestamptz;
begin
  v_user_id := auth.uid();

  if v_user_id is null
     or not public.can_manage_results() then
    raise exception 'Not authorized';
  end if;

  select
    pr.order_id
  into
    v_order_id
  from public.patient_results as pr
  where pr.id = p_result_id
    and pr.status <> 'cancelled'
  for update;

  if v_order_id is null then
    raise exception 'Result not found';
  end if;

  v_released_at := now();

  update public.patient_results as pr
  set
    status = 'released',
    released_by = v_user_id,
    released_at = coalesce(
      pr.released_at,
      v_released_at
    ),
    updated_at = now()
  where pr.id = p_result_id;

  if not exists (
    select 1
    from public.patient_results as pr
    where pr.order_id = v_order_id
      and pr.status not in (
        'released',
        'cancelled'
      )
  ) then
    update public.result_orders as ro
    set
      status = 'released',
      updated_by = v_user_id,
      updated_at = now()
    where ro.id = v_order_id;
  end if;

  select
    ro.order_number
  into
    v_order_number
  from public.result_orders as ro
  where ro.id = v_order_id;

  return query
  select
    p_result_id,
    v_order_number,
    v_released_at;
end;
$$;

-- Keep least-privilege grants from the security hardening.
revoke all
on function public.release_patient_result(uuid)
from public, anon;

grant execute
on function public.release_patient_result(uuid)
to authenticated;

commit;

-- ============================================================================
-- VERIFICATION
-- Expected:
--   anon_can_execute = false
--   authenticated_can_execute = true
-- ============================================================================

select
  has_function_privilege(
    'anon',
    'public.release_patient_result(uuid)',
    'EXECUTE'
  ) as anon_can_execute,
  has_function_privilege(
    'authenticated',
    'public.release_patient_result(uuid)',
    'EXECUTE'
  ) as authenticated_can_execute;

-- Optional definition check: released_at RHS must be pr.released_at.
select
  pg_get_functiondef(
    'public.release_patient_result(uuid)'::regprocedure
  ) as function_definition;
