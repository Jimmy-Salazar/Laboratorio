begin;

-- ============================================================================
-- MIGRATION 025
-- Results no longer require a study selection.
-- Existing historical results remain compatible.
-- ============================================================================

create or replace function public.create_uploaded_patient_result(
  p_order_id uuid,
  p_patient_id uuid,
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


  if not exists (
    select 1
    from public.patients p
    where p.id = p_patient_id
      and p.active = true
  ) then
    raise exception
      'Patient not found or inactive';
  end if;


  if p_study_id is null then

    v_study_name :=
      'Resultado de laboratorio';

  else

    select s.name_es
    into v_study_name
    from public.studies s
    where s.id = p_study_id
      and s.active = true;

    if v_study_name is null then
      raise exception
        'Study not found or inactive';
    end if;

  end if;


  if p_file_path is null
     or trim(p_file_path) = ''
     or p_file_path not like (
       p_patient_id::text ||
       '/' ||
       p_order_id::text ||
       '/%'
     ) then
    raise exception
      'Invalid result file path';
  end if;


  if p_original_file_name is null
     or trim(p_original_file_name) = '' then
    raise exception
      'Invalid original file name';
  end if;


  if p_file_size_bytes is null
     or p_file_size_bytes <= 0
     or p_file_size_bytes > 20971520 then
    raise exception
      'Invalid result file size';
  end if;


  if p_result_date is null then
    raise exception
      'Result date is required';
  end if;


  if not exists (
    select 1
    from storage.objects o
    where o.bucket_id = 'patient-results'
      and o.name = p_file_path
  ) then
    raise exception
      'Uploaded PDF was not found in Storage';
  end if;


  insert into public.result_orders (
    id,
    patient_id,
    order_date,
    status,
    created_by,
    updated_by
  )
  values (
    p_order_id,
    p_patient_id,
    p_result_date,
    case
      when p_release then 'released'
      else 'processing'
    end,
    v_user_id,
    v_user_id
  )
  returning
    result_orders.order_number
  into
    v_order_number;


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

commit;