-- Enable Row Level Security on all tables, with no policies (deny-all).
--
-- Supabase auto-exposes a public REST API (PostgREST) for every table, gated
-- only by the project's anon/publishable key — which is not a secret. This
-- app never uses that key for database access: Prisma connects with a
-- direct Postgres role (via DATABASE_URL) that bypasses RLS entirely, so
-- enabling RLS here does not affect the app. It only closes off the public
-- REST surface so nothing can read/write these tables except through our
-- authenticated Next.js API routes.

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_in_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;
