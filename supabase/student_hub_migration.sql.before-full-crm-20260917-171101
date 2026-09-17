-- =========================================================
-- NOVA ACADEMY — STUDENT ACCOUNT + NOVA HUB
-- Run after crm_migration.sql
-- =========================================================

create extension if not exists pgcrypto;

-- =========================================================
-- STUDENT LOGIN SETTINGS
-- =========================================================

alter table public.profiles
  add column if not exists login_username text;

alter table public.profiles
  add column if not exists crm_login_enabled boolean not null default true;

alter table public.profiles
  add column if not exists hub_login_enabled boolean not null default true;

create unique index if not exists profiles_login_username_unique
on public.profiles (lower(login_username))
where login_username is not null;

-- =========================================================
-- NOVA HUB MODULE SETTINGS
-- =========================================================

create table if not exists public.student_hub_settings (
  student_id uuid primary key references public.profiles(id) on delete cascade,

  hub_enabled boolean not null default true,
  dashboard_enabled boolean not null default true,
  attendance_enabled boolean not null default true,
  payments_enabled boolean not null default true,
  grades_enabled boolean not null default true,
  tasks_enabled boolean not null default true,
  certificates_enabled boolean not null default true,
  schedule_enabled boolean not null default true,
  activity_enabled boolean not null default true,

  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.student_hub_settings enable row level security;

drop policy if exists "student reads own hub settings"
on public.student_hub_settings;

create policy "student reads own hub settings"
on public.student_hub_settings
for select
to authenticated
using (
  student_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "admin manages hub settings"
on public.student_hub_settings;

create policy "admin manages hub settings"
on public.student_hub_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- =========================================================
-- STUDENT TASKS
-- =========================================================

create table if not exists public.student_tasks (
  id uuid primary key default gen_random_uuid(),

  student_id uuid not null
    references public.profiles(id)
    on delete cascade,

  title text not null,
  subject text,
  description text,

  due_at timestamptz,

  status text not null default 'pending'
    check (status in (
      'pending',
      'submitted',
      'graded',
      'late',
      'completed'
    )),

  score numeric(5,2),

  mentor_note text,

  created_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.student_tasks enable row level security;

drop policy if exists "student reads own tasks"
on public.student_tasks;

create policy "student reads own tasks"
on public.student_tasks
for select
to authenticated
using (
  student_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "admin manages tasks"
on public.student_tasks;

create policy "admin manages tasks"
on public.student_tasks
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- =========================================================
-- STUDENT CERTIFICATES
-- =========================================================

create table if not exists public.student_certificates (
  id uuid primary key default gen_random_uuid(),

  student_id uuid not null
    references public.profiles(id)
    on delete cascade,

  title text not null,
  course_name text,
  certificate_no text unique,
  issued_at date not null default current_date,

  file_url text,

  status text not null default 'active'
    check (status in ('active','revoked')),

  created_by uuid
    references public.profiles(id)
    on delete set null,

  created_at timestamptz not null default now()
);

alter table public.student_certificates enable row level security;

drop policy if exists "student reads own certificates"
on public.student_certificates;

create policy "student reads own certificates"
on public.student_certificates
for select
to authenticated
using (
  student_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "admin manages certificates"
on public.student_certificates;

create policy "admin manages certificates"
on public.student_certificates
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- =========================================================
-- STUDENT ACCESS POLICIES
-- =========================================================

drop policy if exists "student reads own profile"
on public.profiles;

create policy "student reads own profile"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.is_admin()
);

-- Attendance
drop policy if exists "student reads own attendance"
on public.attendance;

create policy "student reads own attendance"
on public.attendance
for select
to authenticated
using (
  student_id = auth.uid()
  or public.is_admin()
);

-- Payments
drop policy if exists "student reads own payments"
on public.payments;

create policy "student reads own payments"
on public.payments
for select
to authenticated
using (
  student_id = auth.uid()
  or public.is_admin()
);

-- Grades
drop policy if exists "student reads own grades"
on public.grades;

create policy "student reads own grades"
on public.grades
for select
to authenticated
using (
  student_id = auth.uid()
  or public.is_admin()
);

-- Enrollments
drop policy if exists "student reads own enrollments"
on public.enrollments;

create policy "student reads own enrollments"
on public.enrollments
for select
to authenticated
using (
  student_id = auth.uid()
  or public.is_admin()
);

-- =========================================================
-- AUTOMATIC HUB SETTINGS
-- =========================================================

create or replace function public.ensure_student_hub_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  if new.role = 'student' then

    insert into public.student_hub_settings(student_id)
    values (new.id)
    on conflict (student_id) do nothing;

  end if;

  return new;

end;
$$;

drop trigger if exists profiles_student_hub_settings_trigger
on public.profiles;

create trigger profiles_student_hub_settings_trigger
after insert or update of role
on public.profiles
for each row
execute function public.ensure_student_hub_settings();

-- Existing students
insert into public.student_hub_settings(student_id)
select id
from public.profiles
where role = 'student'
on conflict (student_id) do nothing;

-- =========================================================
-- TIMESTAMP TRIGGERS
-- =========================================================

create or replace function public.touch_student_task()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists student_tasks_updated_at
on public.student_tasks;

create trigger student_tasks_updated_at
before update on public.student_tasks
for each row
execute function public.touch_student_task();

create or replace function public.touch_student_hub_settings()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists student_hub_settings_updated_at
on public.student_hub_settings;

create trigger student_hub_settings_updated_at
before update on public.student_hub_settings
for each row
execute function public.touch_student_hub_settings();
