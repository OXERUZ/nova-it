-- =========================================================
-- NOVA ACADEMY — FULL CRM CONTROL
-- Student / Mentor / RBAC / Tasks / Activity
-- =========================================================

begin;

-- ---------------------------------------------------------
-- 1. PROFILE ACCESS DEFAULTS
-- ---------------------------------------------------------

alter table public.profiles
  alter column crm_login_enabled set default true;

alter table public.profiles
  alter column hub_login_enabled set default true;

-- ---------------------------------------------------------
-- 2. STUDENT TASKS
-- ---------------------------------------------------------

create table if not exists public.student_tasks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending'
    check (status in ('pending','in_progress','completed','cancelled')),
  priority text not null default 'normal'
    check (priority in ('low','normal','high','urgent')),
  due_date date,
  assigned_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_student_tasks_student
  on public.student_tasks(student_id);

create index if not exists idx_student_tasks_status
  on public.student_tasks(status);

create index if not exists idx_student_tasks_due_date
  on public.student_tasks(due_date);

-- ---------------------------------------------------------
-- 3. STAFF PROFILE
-- ---------------------------------------------------------

insert into public.staff_profiles (
  id,
  position,
  specialization,
  hire_date,
  active
)
select
  p.id,
  case
    when p.role = 'mentor' then 'Mentor'
    when p.role = 'manager' then 'Manager'
    when p.role = 'admin' then 'Administrator'
    when p.role = 'super_admin' then 'Super Administrator'
    else p.role
  end,
  null,
  p.started_at,
  coalesce(p.status = 'active', true)
from public.profiles p
where p.role in ('mentor','manager','admin','super_admin')
on conflict (id) do nothing;

-- ---------------------------------------------------------
-- 4. UPDATED_AT
-- ---------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_student_tasks_updated_at
on public.student_tasks;

create trigger trg_student_tasks_updated_at
before update on public.student_tasks
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------
-- 5. DEFAULT PERMISSIONS
-- ---------------------------------------------------------

create or replace function public.default_profile_permissions(
  target_role text
)
returns jsonb
language plpgsql
immutable
as $$
begin

  if target_role = 'super_admin' then
    return '{
      "students":{"view":true,"create":true,"edit":true,"delete":true},
      "mentors":{"view":true,"create":true,"edit":true,"delete":true},
      "attendance":{"view":true,"create":true,"edit":true,"delete":true},
      "payments":{"view":true,"create":true,"edit":true,"delete":true},
      "grades":{"view":true,"create":true,"edit":true,"delete":true},
      "tasks":{"view":true,"create":true,"edit":true,"delete":true},
      "certificates":{"view":true,"create":true,"edit":true,"delete":true},
      "schedule":{"view":true,"create":true,"edit":true,"delete":true},
      "reports":{"view":true,"export":true},
      "settings":{"view":true,"edit":true}
    }'::jsonb;

  elsif target_role = 'admin' then
    return '{
      "students":{"view":true,"create":true,"edit":true,"delete":true},
      "mentors":{"view":true,"create":true,"edit":true,"delete":false},
      "attendance":{"view":true,"create":true,"edit":true,"delete":true},
      "payments":{"view":true,"create":true,"edit":true,"delete":true},
      "grades":{"view":true,"create":true,"edit":true,"delete":true},
      "tasks":{"view":true,"create":true,"edit":true,"delete":true},
      "certificates":{"view":true,"create":true,"edit":true,"delete":true},
      "schedule":{"view":true,"create":true,"edit":true,"delete":true},
      "reports":{"view":true,"export":true},
      "settings":{"view":true,"edit":false}
    }'::jsonb;

  elsif target_role = 'manager' then
    return '{
      "students":{"view":true,"create":true,"edit":true,"delete":false},
      "mentors":{"view":true,"create":false,"edit":true,"delete":false},
      "attendance":{"view":true,"create":true,"edit":true,"delete":false},
      "payments":{"view":true,"create":true,"edit":true,"delete":false},
      "grades":{"view":true,"create":true,"edit":true,"delete":false},
      "tasks":{"view":true,"create":true,"edit":true,"delete":false},
      "certificates":{"view":true,"create":true,"edit":true,"delete":false},
      "schedule":{"view":true,"create":true,"edit":true,"delete":false},
      "reports":{"view":true,"export":true},
      "settings":{"view":true,"edit":false}
    }'::jsonb;

  elsif target_role = 'mentor' then
    return '{
      "students":{"view":true,"create":false,"edit":false,"delete":false},
      "mentors":{"view":false,"create":false,"edit":false,"delete":false},
      "attendance":{"view":true,"create":true,"edit":true,"delete":false},
      "payments":{"view":false,"create":false,"edit":false,"delete":false},
      "grades":{"view":true,"create":true,"edit":true,"delete":false},
      "tasks":{"view":true,"create":true,"edit":true,"delete":false},
      "certificates":{"view":true,"create":true,"edit":false,"delete":false},
      "schedule":{"view":true,"create":false,"edit":false,"delete":false},
      "reports":{"view":true,"export":false},
      "settings":{"view":false,"edit":false}
    }'::jsonb;

  else
    return '{
      "students":{"view":false,"create":false,"edit":false,"delete":false},
      "mentors":{"view":false,"create":false,"edit":false,"delete":false},
      "attendance":{"view":true,"create":false,"edit":false,"delete":false},
      "payments":{"view":true,"create":false,"edit":false,"delete":false},
      "grades":{"view":true,"create":false,"edit":false,"delete":false},
      "tasks":{"view":true,"create":false,"edit":false,"delete":false},
      "certificates":{"view":true,"create":false,"edit":false,"delete":false},
      "schedule":{"view":true,"create":false,"edit":false,"delete":false},
      "reports":{"view":false,"export":false},
      "settings":{"view":false,"edit":false}
    }'::jsonb;
  end if;

end;
$$;

-- ---------------------------------------------------------
-- 6. INITIALIZE EMPTY PERMISSIONS
-- Do not overwrite custom permissions.
-- ---------------------------------------------------------

update public.profiles
set permissions = public.default_profile_permissions(role)
where permissions is null
   or permissions = '{}'::jsonb;

-- ---------------------------------------------------------
-- 7. AUDIT HELPER
-- ---------------------------------------------------------

create or replace function public.crm_log_activity(
  p_actor_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_action text,
  p_description text,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  result_id uuid;
begin

  insert into public.crm_activity (
    actor_id,
    entity_type,
    entity_id,
    action,
    description,
    metadata
  )
  values (
    p_actor_id,
    p_entity_type,
    p_entity_id,
    p_action,
    p_description,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into result_id;

  return result_id;
end;
$$;

-- ---------------------------------------------------------
-- 8. RLS
-- ---------------------------------------------------------

alter table public.student_tasks enable row level security;

drop policy if exists "student_tasks_admin_all"
on public.student_tasks;

create policy "student_tasks_admin_all"
on public.student_tasks
for all
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('super_admin','admin','manager')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('super_admin','admin','manager')
  )
);

drop policy if exists "student_tasks_student_read"
on public.student_tasks;

create policy "student_tasks_student_read"
on public.student_tasks
for select
using (
  student_id = auth.uid()
);

drop policy if exists "student_tasks_mentor_read"
on public.student_tasks;

create policy "student_tasks_mentor_read"
on public.student_tasks
for select
using (
  exists (
    select 1
    from public.profiles mentor
    where mentor.id = auth.uid()
      and mentor.role = 'mentor'
  )
);

-- ---------------------------------------------------------
-- 9. STUDENT CERTIFICATE RLS
-- ---------------------------------------------------------

alter table public.student_certificates enable row level security;

drop policy if exists "student_certificates_student_read"
on public.student_certificates;

create policy "student_certificates_student_read"
on public.student_certificates
for select
using (
  student_id = auth.uid()
);

drop policy if exists "student_certificates_admin_all"
on public.student_certificates;

create policy "student_certificates_admin_all"
on public.student_certificates
for all
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('super_admin','admin','manager')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('super_admin','admin','manager')
  )
);

commit;
