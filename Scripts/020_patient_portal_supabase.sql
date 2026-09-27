-- ============================================================================
-- 020 PATIENT PORTAL - SUPABASE SESSION + RATE LIMIT
-- Laboratorio Clinico Dr. Milton Chasi
--
-- Portal rule requested by the laboratory:
--   user     = patient cedula
--   password = same patient cedula
--
-- SECURITY MODEL
-- - The browser receives NO direct access to patients/results tables.
-- - The browser receives NO service_role key.
-- - A public Edge Function validates access server-side.
-- - Successful login creates a short opaque session token.
-- - Only the SHA-256 hash of that token is stored in the database.
-- - Sessions expire after 30 minutes.
-- - Rate limiting is enforced server-side.
-- - PDFs remain in the private patient-results bucket.
-- ============================================================================

begin;

-- --------------------------------------------------------------------------
-- PATIENT PORTAL SESSIONS
-- --------------------------------------------------------------------------

create table if not exists public.patient_portal_sessions (
  id uuid primary key default gen_random_uuid(),

  patient_id uuid not null
    references public.patients(id)
    on delete cascade,

  token_hash text not null unique,

  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create index if not exists idx_patient_portal_sessions_patient
  on public.patient_portal_sessions(
    patient_id,
    expires_at desc
  );

create index if not exists idx_patient_portal_sessions_expires
  on public.patient_portal_sessions(expires_at);

alter table public.patient_portal_sessions
  enable row level security;

revoke all
on table public.patient_portal_sessions
from public, anon, authenticated;

grant select, insert, update, delete
on table public.patient_portal_sessions
to service_role;

-- --------------------------------------------------------------------------
-- RATE LIMIT
-- --------------------------------------------------------------------------

create table if not exists public.patient_portal_access_limits (
  scope text not null
    check (
      scope in (
        'ip',
        'credential'
      )
    ),

  key_hash text not null,

  window_started_at timestamptz not null default now(),

  attempts integer not null default 0
    check (attempts >= 0),

  blocked_until timestamptz,

  updated_at timestamptz not null default now(),

  primary key (
    scope,
    key_hash
  )
);

alter table public.patient_portal_access_limits
  enable row level security;

revoke all
on table public.patient_portal_access_limits
from public, anon, authenticated;

grant select, insert, update, delete
on table public.patient_portal_access_limits
to service_role;

-- --------------------------------------------------------------------------
-- ATOMIC RATE-LIMIT CLAIM
-- --------------------------------------------------------------------------

create or replace function public.claim_patient_portal_limit(
  p_scope text,
  p_key_hash text,
  p_max_attempts integer,
  p_window_seconds integer,
  p_block_seconds integer
)
returns table (
  allowed boolean,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now timestamptz;
  v_row public.patient_portal_access_limits%rowtype;
  v_attempts integer;
  v_blocked_until timestamptz;
begin
  if p_scope not in ('ip', 'credential') then
    raise exception 'Invalid scope';
  end if;

  if p_key_hash is null
     or length(p_key_hash) < 32 then
    raise exception 'Invalid key';
  end if;

  if p_max_attempts < 1
     or p_window_seconds < 60
     or p_block_seconds < 60 then
    raise exception 'Invalid rate limit configuration';
  end if;

  perform pg_advisory_xact_lock(
    hashtext(
      p_scope || ':' || p_key_hash
    )::bigint
  );

  v_now := clock_timestamp();

  select *
  into v_row
  from public.patient_portal_access_limits
  where scope = p_scope
    and key_hash = p_key_hash
  for update;

  if not found then
    insert into public.patient_portal_access_limits (
      scope,
      key_hash,
      window_started_at,
      attempts,
      blocked_until,
      updated_at
    )
    values (
      p_scope,
      p_key_hash,
      v_now,
      1,
      null,
      v_now
    );

    return query
    select true, 0;

    return;
  end if;

  if v_row.blocked_until is not null
     and v_row.blocked_until > v_now then
    return query
    select
      false,
      greatest(
        1,
        ceil(
          extract(
            epoch from (
              v_row.blocked_until -
              v_now
            )
          )
        )::integer
      );

    return;
  end if;

  if v_row.window_started_at <=
     v_now -
     make_interval(
       secs => p_window_seconds
     ) then
    update public.patient_portal_access_limits
    set
      window_started_at = v_now,
      attempts = 1,
      blocked_until = null,
      updated_at = v_now
    where scope = p_scope
      and key_hash = p_key_hash;

    return query
    select true, 0;

    return;
  end if;

  v_attempts :=
    v_row.attempts + 1;

  if v_attempts > p_max_attempts then
    v_blocked_until :=
      v_now +
      make_interval(
        secs => p_block_seconds
      );

    update public.patient_portal_access_limits
    set
      attempts = v_attempts,
      blocked_until = v_blocked_until,
      updated_at = v_now
    where scope = p_scope
      and key_hash = p_key_hash;

    return query
    select
      false,
      p_block_seconds;

    return;
  end if;

  update public.patient_portal_access_limits
  set
    attempts = v_attempts,
    blocked_until = null,
    updated_at = v_now
  where scope = p_scope
    and key_hash = p_key_hash;

  return query
  select true, 0;
end;
$$;

revoke all
on function public.claim_patient_portal_limit(
  text,
  text,
  integer,
  integer,
  integer
)
from public, anon, authenticated;

grant execute
on function public.claim_patient_portal_limit(
  text,
  text,
  integer,
  integer,
  integer
)
to service_role;

commit;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n
  on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'patient_portal_sessions',
    'patient_portal_access_limits'
  )
order by c.relname;

select
  has_function_privilege(
    'anon',
    'public.claim_patient_portal_limit(text,text,integer,integer,integer)',
    'EXECUTE'
  ) as anon_can_execute,
  has_function_privilege(
    'authenticated',
    'public.claim_patient_portal_limit(text,text,integer,integer,integer)',
    'EXECUTE'
  ) as authenticated_can_execute,
  has_function_privilege(
    'service_role',
    'public.claim_patient_portal_limit(text,text,integer,integer,integer)',
    'EXECUTE'
  ) as service_role_can_execute;

-- Expected:
-- both tables: rls_enabled = true
-- anon_can_execute = false
-- authenticated_can_execute = false
-- service_role_can_execute = true
