-- RoboFest 2.0 Visitor Pass Registration — one-shot Supabase setup.
--
-- Paste this whole file into a NEW Supabase project's SQL Editor
-- (Dashboard → SQL Editor → New query) and run it once. It creates the
-- full schema, the private authorization-letters storage bucket, and
-- enables RLS (deny-all — this app connects via a direct Postgres role
-- that bypasses RLS, so this only closes off the public REST API surface).
--
-- Equivalent to prisma/migrations/0001_init + 0002_enable_rls combined,
-- plus the storage bucket that was created separately via the dashboard
-- for the original project.

-- ── Schema ──────────────────────────────────────────────────────────────
create extension if not exists pgcrypto;

create type admin_role as enum ('SUPER_ADMIN', 'STAFF');
create type visitor_type as enum ('STUDENT','FACULTY','CONTENT_CREATOR','INDUSTRY_PROFESSIONAL','MEDIA','GUEST','OTHER');
create type application_status as enum ('UNDER_REVIEW','APPROVED','REJECTED','CHECKED_IN');
create type email_template_type as enum ('REGISTRATION_RECEIVED','APPROVED','REJECTED','REMINDER');
create type email_status as enum ('QUEUED','SENT','FAILED');

create table admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text not null,
  role admin_role not null default 'STAFF',
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table registration_counters (
  year int primary key,
  counter int not null default 0
);

create or replace function next_registration_id() returns text as $$
declare
  yr int := extract(year from now());
  next_val int;
  result text;
begin
  insert into registration_counters (year, counter)
  values (yr, 1)
  on conflict (year) do update set counter = registration_counters.counter + 1
  returning counter into next_val;
  result := 'RFV-' || yr || '-' || lpad(next_val::text, 6, '0');
  return result;
end;
$$ language plpgsql;

create table visitor_registrations (
  id uuid primary key default gen_random_uuid(),
  registration_id text not null unique,
  full_name text not null,
  phone text not null,
  email text not null,
  college_name text not null,
  visitor_type visitor_type not null,
  authorization_letter_path text not null,
  authorization_letter_original_name text not null,
  authorization_letter_mime_type text not null,
  authorization_letter_size_bytes int not null,
  purpose_of_visit text not null,
  number_of_visitors int not null default 1,
  status application_status not null default 'UNDER_REVIEW',
  rejection_reason text,
  admin_note text,
  qr_token text not null unique,
  reviewed_by uuid references admin_users(id),
  reviewed_at timestamptz,
  checked_in_at timestamptz,
  checked_in_by uuid references admin_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint number_of_visitors_positive check (number_of_visitors >= 1 and number_of_visitors <= 20),
  constraint phone_10_digits check (phone ~ '^[6-9][0-9]{9}$')
);

create index idx_visitor_registration_id on visitor_registrations (registration_id);
create index idx_visitor_email on visitor_registrations (email);
create index idx_visitor_phone on visitor_registrations (phone);
create index idx_visitor_status on visitor_registrations (status);
create index idx_visitor_created_at on visitor_registrations (created_at desc);
create index idx_visitor_qr_token on visitor_registrations (qr_token);
create index idx_visitor_full_name on visitor_registrations using gin (to_tsvector('simple', full_name));
create index idx_visitor_college on visitor_registrations using gin (to_tsvector('simple', college_name));

create table check_in_records (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references visitor_registrations(id) on delete cascade,
  scanned_by uuid references admin_users(id),
  result text not null,
  scanned_at timestamptz not null default now()
);
create index idx_checkin_registration on check_in_records (registration_id);
create index idx_checkin_scanned_at on check_in_records (scanned_at desc);

create table email_logs (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid references visitor_registrations(id) on delete set null,
  to_email text not null,
  template_type email_template_type not null,
  subject text not null,
  body_html text not null,
  body_text text not null,
  status email_status not null default 'QUEUED',
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index idx_email_logs_registration on email_logs (registration_id);
create index idx_email_logs_status on email_logs (status);
create index idx_email_logs_created_at on email_logs (created_at desc);

create table rate_limit_buckets (
  key text primary key,
  count int not null default 1,
  window_start timestamptz not null default now()
);

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_admin_users_updated_at before update on admin_users
  for each row execute function set_updated_at();
create trigger trg_visitor_registrations_updated_at before update on visitor_registrations
  for each row execute function set_updated_at();

-- ── Storage bucket (private, 5 MB limit, PDF/JPG/PNG only) ───────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('authorization-letters', 'authorization-letters', false, 5242880, array['application/pdf','image/jpeg','image/png'])
on conflict (id) do nothing;

-- ── RLS (deny-all — see note above) ───────────────────────────────────────
alter table public.admin_users enable row level security;
alter table public.registration_counters enable row level security;
alter table public.visitor_registrations enable row level security;
alter table public.check_in_records enable row level security;
alter table public.email_logs enable row level security;
alter table public.rate_limit_buckets enable row level security;
