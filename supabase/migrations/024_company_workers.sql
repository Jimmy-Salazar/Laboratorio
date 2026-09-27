begin;

create table if not exists public.company_workers (

  id uuid
    primary key
    default gen_random_uuid(),

  company_id uuid
    not null
    references public.companies(id)
    on delete restrict,

  patient_id uuid
    not null
    references public.patients(id)
    on delete restrict,

  active boolean
    not null
    default true,

  created_by uuid
    references auth.users(id)
    on delete set null
    default auth.uid(),

  updated_by uuid
    references auth.users(id)
    on delete set null
    default auth.uid(),

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now(),

  constraint uq_company_workers_company_patient
    unique (
      company_id,
      patient_id
    )
);


create unique index if not exists
  uq_company_workers_active_patient
on public.company_workers (
  patient_id
)
where active = true;


create index if not exists
  idx_company_workers_company
on public.company_workers (
  company_id,
  active
);


create index if not exists
  idx_company_workers_patient
on public.company_workers (
  patient_id,
  active
);


create or replace function
  public.prepare_company_worker_row()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin

  if tg_op = 'INSERT' then

    new.created_by :=
      coalesce(
        new.created_by,
        auth.uid()
      );

    new.updated_by :=
      coalesce(
        new.updated_by,
        auth.uid()
      );

  else

    new.updated_by :=
      auth.uid();

    new.updated_at :=
      now();

  end if;

  return new;

end;
$$;


drop trigger if exists
  trg_prepare_company_worker_row
on public.company_workers;

create trigger
  trg_prepare_company_worker_row
before insert or update
on public.company_workers
for each row
execute function
  public.prepare_company_worker_row();


alter table public.company_workers
  enable row level security;


revoke all
on table public.company_workers
from anon;

revoke all
on table public.company_workers
from authenticated;

grant
  select,
  insert,
  update
on table public.company_workers
to authenticated;


drop policy if exists
  "Staff can read company workers"
on public.company_workers;

create policy
  "Staff can read company workers"
on public.company_workers
for select
to authenticated
using (
  exists (
    select 1
    from public.staff_profiles sp
    where sp.user_id = auth.uid()
      and sp.active = true
      and sp.role in (
        'admin',
        'secretary',
        'laboratorist'
      )
  )
);


drop policy if exists
  "Admin secretary can create company workers"
on public.company_workers;

create policy
  "Admin secretary can create company workers"
on public.company_workers
for insert
to authenticated
with check (
  exists (
    select 1
    from public.staff_profiles sp
    where sp.user_id = auth.uid()
      and sp.active = true
      and sp.role in (
        'admin',
        'secretary'
      )
  )
);


drop policy if exists
  "Admin secretary can update company workers"
on public.company_workers;

create policy
  "Admin secretary can update company workers"
on public.company_workers
for update
to authenticated
using (
  exists (
    select 1
    from public.staff_profiles sp
    where sp.user_id = auth.uid()
      and sp.active = true
      and sp.role in (
        'admin',
        'secretary'
      )
  )
)
with check (
  exists (
    select 1
    from public.staff_profiles sp
    where sp.user_id = auth.uid()
      and sp.active = true
      and sp.role in (
        'admin',
        'secretary'
      )
  )
);


create or replace function
  public.set_patient_company(
    p_patient_id uuid,
    p_company_id uuid
  )
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_allowed boolean := false;
  v_company_active boolean;
begin

  if v_user_id is null then
    raise exception
      'Authentication required';
  end if;

  select exists (
    select 1
    from public.staff_profiles sp
    where sp.user_id = v_user_id
      and sp.active = true
      and sp.role in (
        'admin',
        'secretary'
      )
  )
  into v_allowed;

  if not v_allowed then
    raise exception
      'Not authorized';
  end if;

  if not exists (
    select 1
    from public.patients p
    where p.id = p_patient_id
  ) then
    raise exception
      'Patient not found';
  end if;


  if p_company_id is null then

    update public.company_workers
    set
      active = false,
      updated_by = v_user_id,
      updated_at = now()
    where patient_id = p_patient_id
      and active = true;

    return;

  end if;


  select c.active
  into v_company_active
  from public.companies c
  where c.id = p_company_id;

  if not found then
    raise exception
      'Company not found';
  end if;

  if not v_company_active then
    raise exception
      'Company is inactive';
  end if;


  update public.company_workers
  set
    active = false,
    updated_by = v_user_id,
    updated_at = now()
  where patient_id = p_patient_id
    and active = true
    and company_id <> p_company_id;


  insert into public.company_workers (
    company_id,
    patient_id,
    active,
    created_by,
    updated_by
  )
  values (
    p_company_id,
    p_patient_id,
    true,
    v_user_id,
    v_user_id
  )
  on conflict (
    company_id,
    patient_id
  )
  do update
  set
    active = true,
    updated_by = v_user_id,
    updated_at = now();

end;
$$;


revoke all
on function
  public.set_patient_company(uuid, uuid)
from public, anon;

grant execute
on function
  public.set_patient_company(uuid, uuid)
to authenticated;


do $$
begin

  if to_regprocedure(
    'public.capture_audit_log()'
  ) is not null then

    drop trigger if exists
      trg_audit_company_workers
    on public.company_workers;

    create trigger
      trg_audit_company_workers
    after insert or update or delete
    on public.company_workers
    for each row
    execute function
      public.capture_audit_log();

  end if;

end;
$$;

commit;