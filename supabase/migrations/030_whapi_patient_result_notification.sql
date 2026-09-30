-- PATCH 06.52: patient result notification. Apply only after reviewing the
-- recipient policy. This migration never sends a message by itself.
begin;

do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_net') then
    raise exception 'Enable pg_net before applying PATCH 06.52';
  end if;
  if not exists (
    select 1 from vault.secrets where name = 'whapi_pilot_webhook_secret'
  ) then
    raise exception 'Webhook secret missing in Vault';
  end if;
end;
$$;

create table if not exists public.result_whapi_notifications (
  result_id uuid primary key references public.patient_results(id) on delete cascade,
  status text not null check (status in
    ('sending', 'accepted', 'failed', 'needs_review', 'skipped_invalid_phone')),
  attempt_count integer not null default 1 check (attempt_count = 1),
  recipient_last4 text,
  last_attempt_at timestamptz not null default now(),
  accepted_at timestamptz,
  whapi_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.result_whapi_notifications enable row level security;
revoke all on public.result_whapi_notifications from public, anon, authenticated;
grant select, insert, update on public.result_whapi_notifications to service_role;

-- One durable claim per result. A duplicate event never initiates a second send.
create or replace function public.claim_result_whapi_notification(p_result_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_inserted integer;
begin
  if p_result_id is null or not exists (
    select 1 from public.patient_results r
    where r.id = p_result_id and r.status = 'released'
  ) then
    return false;
  end if;

  insert into public.result_whapi_notifications (result_id, status)
  values (p_result_id, 'sending')
  on conflict (result_id) do nothing;
  get diagnostics v_inserted = row_count;
  return v_inserted = 1;
end;
$$;

revoke all on function public.claim_result_whapi_notification(uuid)
from public, anon, authenticated;
grant execute on function public.claim_result_whapi_notification(uuid) to service_role;

-- This function queues only result ID and release status. Patient data remains
-- in Supabase until the Edge Function reads the corresponding phone number.
create schema if not exists result_whapi;
create or replace function result_whapi.enqueue_released_result()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_secret text;
  v_previous jsonb := null;
begin
  if new.status::text is distinct from 'released' then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.status::text = 'released' then
      return new;
    end if;
    v_previous := jsonb_build_object('status', old.status);
  end if;

  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'whapi_pilot_webhook_secret';

  if v_secret is null then
    raise warning 'Whapi result: webhook secret missing in Vault';
    return new;
  end if;

  perform net.http_post(
    url := 'https://farficqhjdozapcfxrge.supabase.co/functions/v1/notify-result-whapi',
    body := jsonb_build_object(
      'type', tg_op,
      'schema', 'public',
      'table', 'patient_results',
      'record', jsonb_build_object('id', new.id, 'status', new.status),
      'old_record', v_previous
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', v_secret
    ),
    timeout_milliseconds := 5000
  );
  return new;
exception when others then
  -- A notification problem must not roll back release of a medical result.
  raise warning 'Whapi result: could not enqueue notification';
  return new;
end;
$$;

revoke all on function result_whapi.enqueue_released_result()
from public, anon, authenticated;

create trigger whapi_result_released
after insert or update of status on public.patient_results
for each row execute function result_whapi.enqueue_released_result();

-- The old pilot is closed. It remains installed but no longer receives events.
drop trigger if exists whapi_pilot_released_result on public.patient_results;

commit;
