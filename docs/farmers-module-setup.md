# Farmers Module Setup

## Database

1. Create the schema:

```bash
psql "$DATABASE_URL" -f server/src/db/schema.sql
```

2. Load seed data:

```bash
psql "$DATABASE_URL" -f server/src/db/seed.sql
```

3. Optional stress data:

```bash
psql "$DATABASE_URL" -f server/src/db/seed-stress.sql
```

## Cloud database setup

The backend is already cloud-hosted database ready because it uses `SUPABASE_DB_URL` or `DATABASE_URL` plus SSL toggles.

For Supabase, use the connection string from the Dashboard `Connect` panel.
Supabase recommends:

```env
SUPABASE_DB_URL=postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:5432/postgres
DATABASE_SSL=true
```

Recommended defaults for cloud deployments:

- `PGPOOL_MAX=10`
- `PGPOOL_IDLE_MS=30000`
- `PGPOOL_CONNECT_MS=10000`

For long-lived Express servers, Supabase session pooler or direct connection is a good fit.
If you use the transaction pooler, keep your queries simple and avoid named prepared statements.

Reference:
- Supabase connection strings: https://supabase.com/docs/reference/postgres/connection-strings
- Supabase SSL enforcement: https://supabase.com/docs/guides/platform/ssl-enforcement

## Install and run

```bash
npm install
npm run dev
```

- Frontend runs on Vite at `http://localhost:5173`
- Backend runs on the Express dev server from `server/src/server.ts`

## Supabase Auth

Set the frontend env vars from your Supabase project:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=/api/v1
```

Create at least one email/password user in Supabase Auth, then sign in at `/login`.
The backend expects the Supabase access token in the `Authorization: Bearer <token>` header.
For compatibility, the server can verify tokens with Supabase JWKS or with the Auth API using `SUPABASE_ANON_KEY`.
The app also reads the current MAO staff profile from `GET /api/v1/auth/me`.

## Best-practice security

This system also includes:

- `staff_profiles` for MAO user metadata
- RLS on `farmers`, `input_allocations`, and `staff_profiles`
- `audit_logs` for access tracing

Apply [supabase/migrations/0002_staff_profiles_audit.sql](C:/Users/jaymd/MAOGISDDs/supabase/migrations/0002_staff_profiles_audit.sql) after the base schema migration.

To populate `staff_profiles`, create a matching row for the Supabase Auth user after the user exists:

```sql
insert into staff_profiles (id, full_name, role, office)
values ('<auth-user-uuid>', 'Your Name', 'Administrator', 'MAO Talacogon');
```

## API

- `GET /api/v1/farmers`
- `GET /api/v1/farmers/:id`
- `GET /api/v1/farmers/export`

## Sample payloads

- List response: `server/src/db/sample-api-farmers-list-response.json`
- Profile response: `server/src/db/sample-api-farmer-profile-response.json`
- CSV export: `server/src/db/sample-api-farmers-export.csv`

## Frontend

- Route entry: `src/router.tsx`
- App bootstrap: `src/App.tsx`
- Vite bootstrap: `src/main.tsx`

## Notes

- The module expects `farmers.gis_location` to be a PostGIS `geometry(Point, 4326)`.
- The profile view renders the latest allocations returned from `input_allocations` joined by `farmer_id`.
- Verify fixtures with `node server/scripts/verify-seed.mjs`.
- Run contract tests with `node --test server/test/farmers.contract.test.mjs`.
