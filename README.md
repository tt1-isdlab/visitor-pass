# RoboFest 2.0 — Visitor Pass Registration

A production-ready visitor pass registration system for RoboFest 2.0: public registration with
authorization-letter upload, an admin review dashboard, digital QR passes, public QR verification,
and a staff check-in scanner.

## Stack

- **Frontend/Backend:** Next.js 16 (App Router, Route Handlers), TypeScript, Tailwind CSS v4
- **UI:** Hand-built component library on Radix UI primitives (dark, glowing, robotics-themed)
- **Database:** PostgreSQL via Supabase, accessed with Prisma 7 (`@prisma/adapter-pg`)
- **File storage:** Supabase Storage (private bucket, signed URLs only)
- **Auth:** Auth.js / NextAuth v5, Credentials provider, JWT sessions, role-based access (SUPER_ADMIN / STAFF)
- **QR codes:** `qrcode` (generation) + `html5-qrcode` (camera scanning)
- **PDF passes:** `@react-pdf/renderer`
- **Validation:** Zod (client + server)

## Project provisioning

This project's Supabase instance (`robofest-visitor-pass`, region `ap-south-1`) was already
provisioned for you, including:

- All Postgres tables, enums, indexes, and triggers (see `prisma/migrations/0001_init/migration.sql`)
- A private storage bucket `authorization-letters` (5 MB limit, PDF/JPG/PNG only)

**Secrets were intentionally not exposed by the provisioning tool.** Before running locally, get
these two values from the [Supabase dashboard](https://supabase.com/dashboard/project/lvhdmrfgbxvviopdxdza):

1. **Settings → Database → Connection string** — copy the *Transaction pooler* URL into
   `DATABASE_URL` and the *direct connection* URL into `DIRECT_URL` in `.env` (replace `PASSWORD`).
   If you don't know the DB password, reset it there.
2. **Settings → API → Project API keys → service_role** — copy into `SUPABASE_SERVICE_ROLE_KEY`.

## Getting started

```bash
npm install
npm run db:generate      # generate Prisma Client
npm run db:seed          # create the initial SUPER_ADMIN (see .env for credentials)
npm run dev
```

Visit `http://localhost:3000` for the visitor registration form, and `/admin/login` for the
admin dashboard (login with the seeded admin credentials from `.env` — change the password after
first login).

### Setting up a *fresh* Supabase project (different account/org)

Easiest path: create a new project in the Supabase dashboard, open its **SQL Editor**, and paste
in the whole of [`prisma/supabase-setup.sql`](prisma/supabase-setup.sql) and run it once. That one
script creates the full schema, the private `authorization-letters` storage bucket (5 MB limit,
PDF/JPG/PNG only), and enables RLS — everything the app needs.

Then update `.env` with that project's `DATABASE_URL` / `DIRECT_URL` (Settings → Database),
`NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (Settings → API), and run:

```bash
npm run db:seed
```

Equivalently, from the CLI instead of the SQL Editor:

```bash
npx prisma migrate deploy   # applies prisma/migrations/0001_init + 0002_enable_rls
npm run db:seed
```

— but you'll still need to create the `authorization-letters` storage bucket yourself (Storage →
New bucket → private, 5 MB limit, `application/pdf`/`image/jpeg`/`image/png`), since Prisma
migrations only cover the database, not Storage.

## Environment variables

See [`.env.example`](.env.example) for the full list. Never commit `.env` — it's already
git-ignored.

## Application flow

```
Visitor Registration → Database → Admin Review → Approval → Digital Visitor Pass (QR) → QR Verification → Event Check-In
```

1. **Public registration** (`/`) — 4-step form (Visitor Details → Organization → Authorization →
   Confirmation). Validates client-side (Zod + react-hook-form) and again server-side. Uploads the
   authorization letter to Supabase Storage, generates a `RFV-<year>-<seq>` registration ID via an
   atomic Postgres counter, and stores the registration with status `UNDER_REVIEW`.
2. **Status lookup** (`/visitor/status`) — visitors check status with Registration ID + email (no
   account needed).
3. **Admin review** (`/admin`, `/admin/applications`, `/admin/applications/[id]`) — SUPER_ADMIN
   approves/rejects with a reason, adds internal notes, downloads the authorization letter via a
   short-lived signed URL, and exports CSV.
4. **Pass generation** (`/api/pass/[registrationId]`) — on approval, a PDF visitor pass (A6-sized,
   printable) with a QR code is generated on demand. The QR encodes a verification URL containing
   a secure random token (`qr_token`), not just the (guessable, sequential) registration ID.
5. **Public verification** (`/verify/[registrationId]?t=<token>`) — shows Valid/Invalid, name,
   college, visitor type, and status. Phone and email are never exposed here.
6. **Check-in** (`/admin/check-in`) — staff scan the QR with the device camera; the app validates
   the token server-side, shows visitor details, and lets staff confirm check-in. Re-scanning an
   already-checked-in pass clearly shows "ALREADY CHECKED IN" with the timestamp — no duplicates.

## Roles

- **SUPER_ADMIN** — full access: approve/reject, manage notes, export CSV, check in visitors.
- **STAFF** — can only view approved/checked-in visitors, scan QR codes, and check visitors in.
  Cannot approve/reject, edit notes, or export data (enforced both in the UI and in every API
  route via `requireAdmin` / `requireSuperAdmin`).

Seed additional staff accounts via Prisma Studio (`npm run db:studio`) or a short script using
`bcryptjs.hash()` — there's intentionally no self-service admin signup.

## Emails

Per project decision, transactional emails are **queued and stored** in the `email_logs` table
(subject, HTML, and plain-text body) rather than sent automatically — you send them manually for
now. To wire up live sending later (e.g. Resend or SMTP via nodemailer), add the send call in
`src/lib/email.ts`'s `queueEmail()` and flip `status` to `SENT`/`FAILED`.

## Security

- Server-side validation (Zod) mirrors all client-side validation
- File type/size validation both client- and server-side (PDF/JPG/PNG, 5 MB max)
- Authorization letters live in a **private** Supabase Storage bucket; access is only via
  short-lived signed URLs generated server-side for authenticated admins or the visitor themself
- Admin routes protected by NextAuth middleware + per-route role checks (SUPER_ADMIN / STAFF)
- Postgres-backed rate limiting on registration (5 / 10 min / IP), status lookups, and admin login
  (10 / min / IP) — works correctly across multiple serverless instances, unlike an in-memory limiter
- CSRF protection via double-submit cookie token (`/api/csrf`) required on all public mutating
  requests (registration, status lookup)
- Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
  Permissions-Policy) set globally in `next.config.ts`
- SQL injection protection via Prisma's parameterized queries throughout
- XSS protection via React's default escaping + CSP; no `dangerouslySetInnerHTML` on user input
- Uploaded filenames are sanitized before use in storage paths
- QR verification uses a cryptographically random 24-byte token (`qr_token`), not just the
  sequential/guessable registration ID
- No stack traces or internal errors are ever returned to the client; all API routes catch and
  return generic messages while logging details server-side
- CSV export deliberately excludes authorization-letter file references

## API summary

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/register` | CSRF token | Submit a new visitor registration |
| GET | `/api/csrf` | — | Issue a CSRF token |
| POST | `/api/visitor-status` | CSRF token | Look up status by Registration ID + email |
| GET | `/verify/[registrationId]?t=` | — | Public QR verification page |
| GET | `/api/pass/[registrationId]` | Admin session or `?email=` match | Download PDF visitor pass |
| GET | `/api/admin/stats` | Admin | Dashboard counters |
| GET | `/api/admin/applications` | Admin | Paginated/filterable applications list |
| GET | `/api/admin/applications/[id]` | Admin | Application detail |
| POST | `/api/admin/applications/[id]/approve` | SUPER_ADMIN | Approve application |
| POST | `/api/admin/applications/[id]/reject` | SUPER_ADMIN | Reject with reason |
| POST | `/api/admin/applications/[id]/checkin` | Admin | Mark checked in |
| POST | `/api/admin/applications/[id]/note` | SUPER_ADMIN | Save internal note |
| GET | `/api/admin/applications/[id]/letter` | Admin | Short-lived signed URL for the letter |
| GET | `/api/admin/export` | SUPER_ADMIN | CSV export |
| POST | `/api/admin/check-in/scan` | Admin | Validate a scanned QR payload |

## Database schema

See `prisma/schema.prisma` and `prisma/migrations/0001_init/migration.sql` for the full schema:
`visitor_registrations`, `admin_users`, `check_in_records`, `email_logs`,
`registration_counters` (atomic ID generator), and `rate_limit_buckets`, with indexes on
`registration_id`, `email`, `phone`, `status`, and `created_at`.

## Production build

```bash
npm run build
npm start
```

Deploy anywhere that supports Next.js (Vercel, Node hosting, etc.). Set all variables from
`.env.example` in your hosting provider's environment configuration — never commit secrets.
