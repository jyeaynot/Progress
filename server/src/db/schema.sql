CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rsbsa_id TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  barangay TEXT NOT NULL,
  contact_number TEXT,
  civil_status TEXT,
  ethnicity TEXT,
  birth_date DATE,
  crop_type TEXT NOT NULL,
  season TEXT NOT NULL,
  gis_location GEOMETRY(Point, 4326),
  farm_boundary GEOMETRY(Polygon, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farmers_name ON farmers (last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_farmers_barangay ON farmers (barangay);
CREATE INDEX IF NOT EXISTS idx_farmers_crop_type ON farmers (crop_type);
CREATE INDEX IF NOT EXISTS idx_farmers_gis_location ON farmers USING GIST (gis_location);
CREATE INDEX IF NOT EXISTS idx_farmers_farm_boundary ON farmers USING GIST (farm_boundary);

CREATE TABLE IF NOT EXISTS input_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  fertilizer TEXT,
  seeds TEXT,
  farm_tools TEXT,
  pesticides TEXT,
  irrigation_subsidy TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_input_allocations_farmer_id ON input_allocations (farmer_id);
CREATE INDEX IF NOT EXISTS idx_input_allocations_allocated_at ON input_allocations (allocated_at DESC);

CREATE TABLE IF NOT EXISTS crop_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  crop_type TEXT NOT NULL,
  planting_date DATE,
  harvest_date DATE,
  area_ha NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Planted',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crop_records_farmer_id ON crop_records (farmer_id);
CREATE INDEX IF NOT EXISTS idx_crop_records_status ON crop_records (status);
