create extension if not exists pgcrypto;

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  application_number text unique not null,
  full_name text not null,
  phone text not null,
  telegram text,
  age integer,
  city text,
  education text,
  experience_level text,
  course text not null,
  study_format text,
  goal text,
  source text,
  message text,
  status text not null default 'new'
    check (status in ('new','contacted','interview','accepted','rejected','studying','completed')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_application_number()
returns trigger
language plpgsql
as $$
declare
  seq bigint;
begin
  if new.application_number is null or new.application_number = '' then
    select count(*) + 1 into seq from public.applications;
    new.application_number := 'NOVA-' || extract(year from now())::int || '-' || lpad(seq::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists applications_number_trigger on public.applications;
create trigger applications_number_trigger
before insert on public.applications
for each row execute function public.set_application_number();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists applications_updated_trigger on public.applications;
create trigger applications_updated_trigger
before update on public.applications
for each row execute function public.touch_updated_at();

alter table public.applications enable row level security;

drop policy if exists "public can submit applications" on public.applications;
create policy "public can submit applications"
on public.applications for insert
to anon, authenticated
with check (
  length(trim(full_name)) >= 2
  and length(trim(phone)) >= 7
  and course in ('Dasturlash','Sun’iy intellekt','Professional kiberxavfsizlik')
  and status = 'new'
);

drop policy if exists "authenticated admins can read applications" on public.applications;
create policy "authenticated admins can read applications"
on public.applications for select
to authenticated
using (true);

drop policy if exists "authenticated admins can update applications" on public.applications;
create policy "authenticated admins can update applications"
on public.applications for update
to authenticated
using (true)
with check (true);

drop policy if exists "authenticated admins can delete applications" on public.applications;
create policy "authenticated admins can delete applications"
on public.applications for delete
to authenticated
using (true);

-- IMPORTANT:
-- For a strict production deployment, create a separate admin_profiles table
-- and restrict the authenticated policies above to users with role='admin'.
-- Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
