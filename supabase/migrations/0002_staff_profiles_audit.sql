create table if not exists staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'staff',
  office text not null default 'MAO Talacogon',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table staff_profiles enable row level security;

create policy "Staff can view own profile"
on staff_profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Staff can update own profile"
on staff_profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Staff can insert own profile"
on staff_profiles
for insert
to authenticated
with check (auth.uid() = id);

alter table farmers enable row level security;
alter table input_allocations enable row level security;

create policy "Authenticated users can view farmers"
on farmers
for select
to authenticated
using (true);

create policy "Authenticated users can view input allocations"
on input_allocations
for select
to authenticated
using (true);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_actor_user_id on audit_logs (actor_user_id);
create index if not exists idx_audit_logs_entity_type on audit_logs (entity_type);
create index if not exists idx_audit_logs_created_at on audit_logs (created_at desc);

alter table audit_logs enable row level security;

create policy "Service role manages audit logs"
on audit_logs
for all
to service_role
using (true)
with check (true);

