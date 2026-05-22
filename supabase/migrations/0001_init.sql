create extension if not exists pgcrypto;
create extension if not exists postgis;

create table if not exists farmers (
  id uuid primary key default gen_random_uuid(),
  rsbsa_id text not null unique,
  first_name text not null,
  middle_name text,
  last_name text not null,
  barangay text not null,
  contact_number text,
  civil_status text,
  ethnicity text,
  birth_date date,
  crop_type text not null,
  season text not null,
  gis_location geometry(Point, 4326),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_farmers_name on farmers (last_name, first_name);
create index if not exists idx_farmers_barangay on farmers (barangay);
create index if not exists idx_farmers_crop_type on farmers (crop_type);
create index if not exists idx_farmers_gis_location on farmers using gist (gis_location);

create table if not exists input_allocations (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references farmers(id) on delete cascade,
  fertilizer text,
  seeds text,
  farm_tools text,
  pesticides text,
  irrigation_subsidy text,
  allocated_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_input_allocations_farmer_id on input_allocations (farmer_id);
create index if not exists idx_input_allocations_allocated_at on input_allocations (allocated_at desc);

