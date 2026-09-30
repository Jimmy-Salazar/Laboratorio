-- ============================================================================
-- 028 RESULT ORDER SEQUENCE BY BRANCH AND YEAR
-- Laboratorio Clinico Dr. Milton Chasi
-- ============================================================================

begin;

alter table public.branches
add column if not exists result_order_prefix text;

update public.branches
set result_order_prefix =
  case lower(trim(name_es))
    when 'guayaquil' then 'GYE'
    when 'colimes' then 'COL'
    when 'balzar' then 'BAL'
    when 'palestina' then 'PAL'
    else result_order_prefix
  end
where lower(trim(name_es)) in (
  'guayaquil',
  'colimes',
  'balzar',
  'palestina'
);

alter table public.branches
drop constraint if exists branches_result_order_prefix_format;

alter table public.branches
add constraint branches_result_order_prefix_format
check (
  result_order_prefix is null
  or result_order_prefix ~ '^[A-Z]{3}$'
);

create unique index if not exists uq_branches_result_order_prefix
on public.branches(result_order_prefix)
where result_order_prefix is not null;

create table if not exists public.result_order_sequences (
  branch_id uuid not null
    references public.branches(id)
    on delete restrict,
  sequence_year integer not null
    check (sequence_year between 2000 and 9999),
  last_value bigint not null default 0
    check (last_value >= 0),
  updated_at timestamptz not null default now(),
  primary key (branch_id, sequence_year)
);

alter table public.result_order_sequences
enable row level security;

revoke all
on table public.result_order_sequences
from public, anon, authenticated;

create or replace function public.next_result_order_number(
  p_branch_id uuid
)
returns text
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_prefix text;
  v_year integer;
  v_next_value bigint;
begin
  if p_branch_id is null then
    raise exception 'Branch is required';
  end if;

  select b.result_order_prefix
  into v_prefix
  from public.branches b
  where b.id = p_branch_id
    and b.active = true;

  if v_prefix is null then
    raise exception 'Branch not found, inactive or missing result order prefix';
  end if;

  v_year :=
    extract(
      year from (
        now() at time zone 'America/Guayaquil'
      )
    )::integer;

  insert into public.result_order_sequences (
    branch_id,
    sequence_year,
    last_value,
    updated_at
  )
  values (
    p_branch_id,
    v_year,
    1,
    now()
  )
  on conflict (
    branch_id,
    sequence_year
  )
  do update
  set
    last_value =
      public.result_order_sequences.last_value + 1,
    updated_at = now()
  returning last_value
  into v_next_value;

  return
    v_prefix
    || '-'
    || v_year::text
    || '-'
    || lpad(v_next_value::text, 6, '0');
end;
$$;

revoke all
on function public.next_result_order_number(uuid)
from public, anon, authenticated;

create or replace function public.can_manage_results()
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
on function public.can_manage_results()
from public, anon;

grant execute
on function public.can_manage_results()
to authenticated;

create or replace function public.create_uploaded_patient_result_v2(
  p_order_id uuid,
  p_patient_id uuid,
  p_branch_id uuid,
  p_study_id uuid,
  p_result_date date,
  p_file_path text,
  p_original_file_name text,
  p_file_size_bytes bigint,
  p_release boolean default false
)
returns table (
  order_id uuid,
  order_number text,
  result_id uuid,
  result_status text
)
language plpgsql
security definer
set search_path = public, storage, pg_temp
as $$
declare
  v_user_id uuid;
  v_staff_role text;
  v_staff_branch_id uuid;
  v_study_name text;
  v_order_number text;
  v_result_id uuid;
  v_status text;
begin
  v_user_id := auth.uid();

  if v_user_id is null
     or not public.can_manage_results() then
    raise exception 'Not authorized';
  end if;

  select
    sp.role,
    sp.branch_id
  into
    v_staff_role,
    v_staff_branch_id
  from public.staff_profiles sp
  where sp.user_id = v_user_id
    and sp.active = true;

  if v_staff_role is null then
    raise exception 'Active staff profile not found';
  end if;

  if v_staff_branch_id is not null
     and v_staff_branch_id <> p_branch_id then
    raise exception 'User is not assigned to selected branch';
  end if;

  if not exists (
    select 1
    from public.branches b
    where b.id = p_branch_id
      and b.active = true
      and b.result_order_prefix is not null
  ) then
    raise exception 'Branch not found, inactive or missing order prefix';
  end if;

  if not exists (
    select 1
    from public.patients p
    where p.id = p_patient_id
      and p.active = true
  ) then
    raise exception 'Patient not found or inactive';
  end if;

  if p_study_id is null then
    v_study_name := 'Resultado de laboratorio';
  else
    select s.name_es
    into v_study_name
    from public.studies s
    where s.id = p_study_id
      and s.active = true;

    if v_study_name is null then
      raise exception 'Study not found or inactive';
    end if;
  end if;

  if p_file_path is null
     or trim(p_file_path) = ''
     or p_file_path not like (
       p_patient_id::text
       || '/'
       || p_order_id::text
       || '/%'
     ) then
    raise exception 'Invalid result file path';
  end if;

  if p_original_file_name is null
     or trim(p_original_file_name) = '' then
    raise exception 'Invalid original file name';
  end if;

  if p_file_size_bytes is null
     or p_file_size_bytes <= 0
     or p_file_size_bytes > 20971520 then
    raise exception 'Invalid result file size';
  end if;

  if p_result_date is null then
    raise exception 'Result date is required';
  end if;

  if not exists (
    select 1
    from storage.objects o
    where o.bucket_id = 'patient-results'
      and o.name = p_file_path
  ) then
    raise exception 'Uploaded PDF was not found in Storage';
  end if;

  v_order_number :=
    public.next_result_order_number(
      p_branch_id
    );

  insert into public.result_orders (
    id,
    order_number,
    patient_id,
    branch_id,
    order_date,
    status,
    created_by,
    updated_by
  )
  values (
    p_order_id,
    v_order_number,
    p_patient_id,
    p_branch_id,
    p_result_date,
    case
      when p_release then 'released'
      else 'processing'
    end,
    v_user_id,
    v_user_id
  );

  v_status :=
    case
      when p_release then 'released'
      else 'draft'
    end;

  insert into public.patient_results (
    order_id,
    study_id,
    study_name_snapshot,
    result_date,
    file_path,
    original_file_name,
    file_size_bytes,
    mime_type,
    status,
    uploaded_by,
    released_by,
    released_at
  )
  values (
    p_order_id,
    p_study_id,
    v_study_name,
    p_result_date,
    p_file_path,
    trim(p_original_file_name),
    p_file_size_bytes,
    'application/pdf',
    v_status,
    v_user_id,
    case
      when p_release then v_user_id
      else null
    end,
    case
      when p_release then now()
      else null
    end
  )
  returning id
  into v_result_id;

  return query
  select
    p_order_id,
    v_order_number,
    v_result_id,
    v_status;
end;
$$;

revoke all
on function public.create_uploaded_patient_result_v2(
  uuid,
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
on function public.create_uploaded_patient_result_v2(
  uuid,
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

commit;
