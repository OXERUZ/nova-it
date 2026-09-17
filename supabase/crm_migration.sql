-- NOVA ACADEMY PROFESSIONAL CRM MIGRATION
-- Run this AFTER the existing supabase/schema.sql.

create extension if not exists pgcrypto;

-- ---------- PROFILE / RBAC ----------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('student','mentor','manager','admin','super_admin'));
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists birth_date date;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists status text not null default 'active';
alter table public.profiles add column if not exists started_at date;
alter table public.profiles add column if not exists notes text;
alter table public.profiles add column if not exists permissions jsonb not null default '{}'::jsonb;

-- ---------- APPLICATION EMAIL ----------
alter table public.applications add column if not exists email text;

-- ---------- COURSES ----------
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text unique,
  description text,
  duration_months integer not null default 1,
  price numeric(12,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- ATTENDANCE ----------
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  attendance_date date not null,
  status text not null check (status in ('present','absent','late','excused')),
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(student_id, attendance_date)
);

-- ---------- PAYMENTS ----------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  amount numeric(12,2) not null check (amount >= 0),
  payment_date date not null default current_date,
  method text not null default 'cash' check (method in ('cash','card','transfer','online','other')),
  status text not null default 'paid' check (status in ('paid','pending','refunded')),
  receipt_no text,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- ENROLLMENT BILLING ----------
alter table public.enrollments add column if not exists course_id uuid references public.courses(id) on delete set null;
alter table public.enrollments add column if not exists status text not null default 'active';
alter table public.enrollments add column if not exists end_date date;

-- ---------- STAFF / MENTOR ----------
create table if not exists public.staff_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  position text not null default 'Mentor',
  specialization text,
  salary numeric(12,2),
  hire_date date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- SCHEDULE ----------
create table if not exists public.schedule_events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade,
  mentor_id uuid references public.profiles(id) on delete set null,
  title text not null,
  room text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- ACTIVITY AUDIT ----------
create table if not exists public.crm_activity (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------- HELPERS ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role in ('super_admin','admin','manager'));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='super_admin');
$$;
revoke all on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to authenticated;

-- ---------- RLS ----------
alter table public.courses enable row level security;
alter table public.attendance enable row level security;
alter table public.payments enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.schedule_events enable row level security;
alter table public.crm_activity enable row level security;

-- courses
 drop policy if exists "public read active courses" on public.courses;
 create policy "public read active courses" on public.courses for select to anon,authenticated using(active=true or public.is_admin());
 drop policy if exists "staff manage courses" on public.courses;
 create policy "staff manage courses" on public.courses for all to authenticated using(public.is_admin()) with check(public.is_admin());

-- attendance
 drop policy if exists "student reads own attendance" on public.attendance;
 create policy "student reads own attendance" on public.attendance for select to authenticated using(student_id=auth.uid() or public.is_admin());
 drop policy if exists "staff manage attendance" on public.attendance;
 create policy "staff manage attendance" on public.attendance for all to authenticated using(public.is_admin()) with check(public.is_admin());

-- payments
 drop policy if exists "student reads own payments" on public.payments;
 create policy "student reads own payments" on public.payments for select to authenticated using(student_id=auth.uid() or public.is_admin());
 drop policy if exists "staff manage payments" on public.payments;
 create policy "staff manage payments" on public.payments for all to authenticated using(public.is_admin()) with check(public.is_admin());

-- staff
 drop policy if exists "staff reads staff" on public.staff_profiles;
 create policy "staff reads staff" on public.staff_profiles for select to authenticated using(public.is_admin() or id=auth.uid());
 drop policy if exists "staff manages staff" on public.staff_profiles;
 create policy "staff manages staff" on public.staff_profiles for all to authenticated using(public.is_admin()) with check(public.is_admin());

-- schedule
 drop policy if exists "authenticated reads schedule" on public.schedule_events;
 create policy "authenticated reads schedule" on public.schedule_events for select to authenticated using(true);
 drop policy if exists "staff manages schedule" on public.schedule_events;
 create policy "staff manages schedule" on public.schedule_events for all to authenticated using(public.is_admin()) with check(public.is_admin());

-- activity
 drop policy if exists "staff reads activity" on public.crm_activity;
 create policy "staff reads activity" on public.crm_activity for select to authenticated using(public.is_admin());
 drop policy if exists "staff writes activity" on public.crm_activity;
 create policy "staff writes activity" on public.crm_activity for insert to authenticated with check(public.is_admin());

-- ---------- SEED COURSES ----------
insert into public.courses(name,code,description,duration_months,price) values
('Dasturlash','DEV-01','Frontend, backend va amaliy dasturlash.',6,0),
('Sun’iy intellekt','AI-01','AI asoslari, Python va amaliy loyihalar.',6,0),
('Professional Kiberxavfsizlik','CYBER-01','12 oylik professional cybersecurity dasturi.',12,0)
on conflict(name) do nothing;

-- ---------- INDEXES ----------
create index if not exists idx_profiles_role_status on public.profiles(role,status);
create index if not exists idx_enrollments_student_active on public.enrollments(student_id,active);
create index if not exists idx_attendance_date_group on public.attendance(attendance_date,group_id);
create index if not exists idx_payments_date on public.payments(payment_date);
create index if not exists idx_payments_student on public.payments(student_id);
create index if not exists idx_schedule_starts on public.schedule_events(starts_at);
create index if not exists idx_activity_created on public.crm_activity(created_at desc);
