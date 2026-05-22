# Supabase Setup

This project works with Supabase as the hosted PostgreSQL database.

## Recommended connection

Use the Supabase Dashboard `Connect` panel and choose:

- `Session pooler` for a long-lived Express backend
- `Direct connection` if your environment supports IPv6

Set:

```env
SUPABASE_DB_URL=postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:5432/postgres
DATABASE_SSL=true
```

## Auth setup

This app uses Supabase Auth with email and password.

1. Open your Supabase project.
2. Go to Authentication and create a user.
3. Add these frontend env vars:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=/api/v1
```

The backend verifies the user's access token against Supabase JWT signing keys before serving the Farmers API.
If your project uses shared-secret JWTs or you prefer a runtime check, the backend can also call the Supabase Auth `/user` endpoint when `SUPABASE_ANON_KEY` is set.

## Staff profiles

Run [supabase/migrations/0002_staff_profiles_audit.sql](./migrations/0002_staff_profiles_audit.sql) to add:

- `staff_profiles`
- `audit_logs`
- RLS policies for MAO staff access

After creating a user in Supabase Auth, insert the matching row into `staff_profiles` using the Auth user UUID.

## Apply schema

Run the migration in the SQL editor or use the Supabase CLI:

```bash
supabase db push
```

## Seed data

Load:

- [server/src/db/seed.sql](../server/src/db/seed.sql)
- [server/src/db/seed-stress.sql](../server/src/db/seed-stress.sql)

You can paste them into the SQL editor or run them through `psql` against your Supabase connection string.
