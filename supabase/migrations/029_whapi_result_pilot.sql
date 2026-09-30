-- PATCH 06.51: pilot notification log for released results.
-- This migration does not send messages or expose patient data to Whapi.
begin;

create table if not exists public.result_whapi_pilot_notifications (
  result_id uuid primary key references public.patient_results(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'sending', 'accepted', 'failed', 'needs_review')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_attempt_at timestamptz,
  accepted_at timestamptz,
  whapi_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.result_whapi_pilot_notifications enable row level security;
revoke all on public.result_whapi_pilot_notifications from public, anon, authenticated;
grant select, insert, update on public.result_whapi_pilot_notifications to service_role;

-- An atomic claim prevents two webhook deliveries from sending concurrently.
-- A stale claim is retried only when the event is delivered again.
create or replace function public.claim_result_whapi_pilot(p_result_id uuid)
returns table (claimed boolean, notification_status text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.result_whapi_pilot_notifications%rowtype;
  v_now timestamptz := clock_timestamp();
begin
  if p_result_id is null or not exists (
    select 1 from public.patient_results pr
    where pr.id = p_result_id and pr.status = 'released'
  ) then
    raise exception 'Released result not found';
  end if;

  insert into public.result_whapi_pilot_notifications (result_id)
  values (p_result_id)
  on conflict (result_id) do nothing;

  select n.* into v_row
  from public.result_whapi_pilot_notifications n
  where n.result_id = p_result_id
  for update;

  if v_row.status in ('accepted', 'needs_review') then
    return query select false, v_row.status;
    return;
  end if;

  if v_row.status = 'sending' then
    if v_row.last_attempt_at <= v_now - interval '10 minutes' then
      update public.result_whapi_pilot_notifications n
      set status = 'needs_review',
          last_error = 'stale_send_check_whapi_before_retry',
          updated_at = v_now
      where n.result_id = p_result_id;
      return query select false, 'needs_review'::text;
    end if;
    return query select false, 'sending'::text;
    return;
  end if;

  update public.result_whapi_pilot_notifications n
  set status = 'sending',
      attempt_count = n.attempt_count + 1,
      last_attempt_at = v_now,
      last_error = null,
      updated_at = v_now
  where n.result_id = p_result_id;

  return query select true, 'sending'::text;
end;
$$;

revoke all on function public.claim_result_whapi_pilot(uuid)
from public, anon, authenticated;
grant execute on function public.claim_result_whapi_pilot(uuid) to service_role;

commit;
