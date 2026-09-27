-- ============================================================
-- 022 PATIENT RESULT ACCESS
-- Laboratorio Clinico Dr. Milton Chasi
-- ============================================================

create table if not exists public.patient_result_access (
  result_id uuid primary key
    references public.patient_results(id)
    on delete cascade,

  patient_id uuid not null
    references public.patients(id)
    on delete cascade,

  first_accessed_at timestamptz
    not null default now(),

  first_viewed_at timestamptz,

  first_downloaded_at timestamptz,

  last_accessed_at timestamptz
    not null default now(),

  view_count integer
    not null default 0
    check (view_count >= 0),

  download_count integer
    not null default 0
    check (download_count >= 0),

  created_at timestamptz
    not null default now(),

  updated_at timestamptz
    not null default now()
);

create index if not exists
  idx_patient_result_access_patient
on public.patient_result_access (
  patient_id,
  last_accessed_at desc
);

alter table public.patient_result_access
  enable row level security;

revoke all
on table public.patient_result_access
from public, anon, authenticated;

grant
  select,
  insert,
  update,
  delete
on table public.patient_result_access
to service_role;


create or replace function public.record_patient_result_access(
  p_patient_id uuid,
  p_result_id uuid,
  p_action text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz;
begin

  if p_action not in (
    'view',
    'download'
  ) then
    raise exception
      'Invalid result access action';
  end if;

  if not exists (
    select 1
    from public.patient_results as pr

    join public.result_orders as ro
      on ro.id = pr.order_id

    where pr.id = p_result_id
      and ro.patient_id = p_patient_id
      and pr.status = 'released'
  ) then
    raise exception
      'Released result not found for patient';
  end if;

  v_now := clock_timestamp();

  insert into public.patient_result_access (
    result_id,
    patient_id,
    first_accessed_at,
    first_viewed_at,
    first_downloaded_at,
    last_accessed_at,
    view_count,
    download_count,
    created_at,
    updated_at
  )
  values (
    p_result_id,
    p_patient_id,
    v_now,

    case
      when p_action = 'view'
      then v_now
      else null
    end,

    case
      when p_action = 'download'
      then v_now
      else null
    end,

    v_now,

    case
      when p_action = 'view'
      then 1
      else 0
    end,

    case
      when p_action = 'download'
      then 1
      else 0
    end,

    v_now,
    v_now
  )

  on conflict on constraint
    patient_result_access_pkey

  do update
  set
    patient_id =
      excluded.patient_id,

    first_viewed_at =
      case
        when p_action = 'view'
        then coalesce(
          public.patient_result_access.first_viewed_at,
          v_now
        )
        else
          public.patient_result_access.first_viewed_at
      end,

    first_downloaded_at =
      case
        when p_action = 'download'
        then coalesce(
          public.patient_result_access.first_downloaded_at,
          v_now
        )
        else
          public.patient_result_access.first_downloaded_at
      end,

    last_accessed_at =
      v_now,

    view_count =
      public.patient_result_access.view_count +
      case
        when p_action = 'view'
        then 1
        else 0
      end,

    download_count =
      public.patient_result_access.download_count +
      case
        when p_action = 'download'
        then 1
        else 0
      end,

    updated_at =
      v_now;
end;
$$;

revoke all
on function public.record_patient_result_access(
  uuid,
  uuid,
  text
)
from public, anon, authenticated;

grant execute
on function public.record_patient_result_access(
  uuid,
  uuid,
  text
)
to service_role;