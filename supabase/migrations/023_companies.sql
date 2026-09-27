begin;

create or replace function
  public.normalize_company_identification(
    p_value text
  )
returns text
language sql
immutable
as $$
  select regexp_replace(
    coalesce(trim(p_value), ''),
    '[^0-9]',
    '',
    'g'
  );
$$;


create table if not exists public.companies (

  id uuid
    primary key
    default gen_random_uuid(),

  identification_type text
    not null
    default 'ruc'
    check (
      identification_type in (
        'ruc',
        'cedula'
      )
    ),

  identification_number text
    not null,

  identification_normalized text
    not null
    default '',

  legal_name text
    not null,

  trade_name text,

  contact_name text,
  phone text,
  email text,
  address text,
  notes text,

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

  constraint uq_companies_identification
    unique (
      identification_type,
      identification_normalized
    )
);


create index if not exists
  idx_companies_legal_name
on public.companies (
  lower(legal_name)
);

create index if not exists
  idx_companies_active
on public.companies (
  active
);


create or replace function
  public.prepare_company_row()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin

  new.identification_number :=
    trim(new.identification_number);

  new.identification_normalized :=
    public.normalize_company_identification(
      new.identification_number
    );

  new.legal_name :=
    trim(new.legal_name);

  new.trade_name :=
    nullif(trim(new.trade_name), '');

  new.contact_name :=
    nullif(trim(new.contact_name), '');

  new.phone :=
    nullif(trim(new.phone), '');

  new.email :=
    nullif(trim(new.email), '');

  new.address :=
    nullif(trim(new.address), '');

  new.notes :=
    nullif(trim(new.notes), '');

  if new.legal_name = '' then
    raise exception
      'Company legal name cannot be empty';
  end if;

  if new.identification_type = 'ruc'
     and new.identification_normalized
       !~ '^[0-9]{13}$' then
    raise exception
      'RUC must contain 13 digits';
  end if;

  if new.identification_type = 'cedula'
     and new.identification_normalized
       !~ '^[0-9]{10}$' then
    raise exception
      'Cedula must contain 10 digits';
  end if;

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
  trg_prepare_company_row
on public.companies;

create trigger
  trg_prepare_company_row
before insert or update
on public.companies
for each row
execute function
  public.prepare_company_row();


alter table public.companies
  enable row level security;


revoke all
on table public.companies
from anon;

revoke all
on table public.companies
from authenticated;

grant
  select,
  insert,
  update
on table public.companies
to authenticated;


drop policy if exists
  "Staff can read companies"
on public.companies;

create policy
  "Staff can read companies"
on public.companies
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
  "Admin secretary can create companies"
on public.companies;

create policy
  "Admin secretary can create companies"
on public.companies
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
  "Admin secretary can update companies"
on public.companies;

create policy
  "Admin secretary can update companies"
on public.companies
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


do $$
begin

  if to_regprocedure(
    'public.capture_audit_log()'
  ) is not null then

    drop trigger if exists
      trg_audit_companies
    on public.companies;

    create trigger
      trg_audit_companies
    after insert or update or delete
    on public.companies
    for each row
    execute function
      public.capture_audit_log();

  end if;

end;
$$;

commit;