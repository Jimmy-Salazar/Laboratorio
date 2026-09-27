begin;

create or replace function public.can_release_results()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.staff_profiles sp
    where sp.user_id = auth.uid()
      and sp.active = true
      and sp.role in (
        'admin',
        'secretary',
        'laboratorist'
      )
  );
$$;

revoke all
on function public.can_release_results()
from public, anon;

grant execute
on function public.can_release_results()
to authenticated;


create table if not exists public.result_release_notifications (
  id uuid primary key default gen_random_uuid(),

  result_id uuid not null unique
    references public.patient_results(id)
    on delete cascade,

  status text not null default 'pending'
    check (
      status in (
        'pending',
        'sending',
        'sent',
        'failed',
        'no_email'
      )
    ),

  recipient_email text,

  attempt_count integer not null default 0
    check (attempt_count >= 0),

  last_attempt_at timestamptz,
  sent_at timestamptz,
  smtp_message_id text,
  last_error text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists
  idx_result_release_notifications_status
on public.result_release_notifications (
  status,
  updated_at
);

alter table public.result_release_notifications
  enable row level security;

revoke all
on table public.result_release_notifications
from public, anon, authenticated;

grant select, insert, update, delete
on table public.result_release_notifications
to service_role;


create or replace function public.claim_result_release_notification(
  p_result_id uuid
)
returns table (
  claimed boolean,
  notification_id uuid,
  notification_status text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.result_release_notifications%rowtype;
  v_now timestamptz;
begin

  v_now := clock_timestamp();

  select n.*
  into v_row
  from public.result_release_notifications n
  where n.result_id = p_result_id
  for update;

  if not found then
    return query
    select
      false,
      null::uuid,
      'missing'::text;
    return;
  end if;

  if v_row.status in (
    'sent',
    'no_email'
  ) then
    return query
    select
      false,
      v_row.id,
      v_row.status;
    return;
  end if;

  if v_row.status = 'sending'
     and v_row.last_attempt_at is not null
     and v_row.last_attempt_at >
       v_now - interval '5 minutes' then

    return query
    select
      false,
      v_row.id,
      'sending'::text;

    return;
  end if;

  update public.result_release_notifications n
  set
    status = 'sending',
    attempt_count = n.attempt_count + 1,
    last_attempt_at = v_now,
    last_error = null,
    updated_at = v_now
  where n.id = v_row.id;

  return query
  select
    true,
    v_row.id,
    'sending'::text;

end;
$$;

revoke all
on function public.claim_result_release_notification(uuid)
from public, anon, authenticated;

grant execute
on function public.claim_result_release_notification(uuid)
to service_role;


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
     or not public.can_release_results() then
    raise exception 'Not authorized';
  end if;

  select pr.order_id
  into v_order_id
  from public.patient_results pr
  where pr.id = p_result_id
    and pr.status <> 'cancelled'
  for update;

  if v_order_id is null then
    raise exception 'Result not found';
  end if;

  update public.patient_results as pr
  set
    status = 'released',
    released_by = coalesce(
      pr.released_by,
      v_user_id
    ),
    released_at = coalesce(
      pr.released_at,
      now()
    ),
    updated_at = now()
  where pr.id = p_result_id
  returning pr.released_at
  into v_released_at;

  insert into public.result_release_notifications (
    result_id,
    status
  )
  values (
    p_result_id,
    'pending'
  )
  on conflict on constraint
    result_release_notifications_result_id_key
  do nothing;

  if not exists (
    select 1
    from public.patient_results pr
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

  select ro.order_number
  into v_order_number
  from public.result_orders ro
  where ro.id = v_order_id;

  return query
  select
    p_result_id,
    v_order_number,
    v_released_at;

end;
$$;

revoke all
on function public.release_patient_result(uuid)
from public, anon;

grant execute
on function public.release_patient_result(uuid)
to authenticated;

commit;