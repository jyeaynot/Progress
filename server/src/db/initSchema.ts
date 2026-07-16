import pool from "./pool";

export async function ensureSchema() {
  await pool.query(`
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
    CREATE INDEX IF NOT EXISTS idx_input_allocations_farmer_id ON input_allocations (farmer_id);
    CREATE INDEX IF NOT EXISTS idx_input_allocations_allocated_at ON input_allocations (allocated_at DESC);
  `);

  await pool.query(`
    ALTER TABLE farmers
    ADD COLUMN IF NOT EXISTS farm_boundary GEOMETRY(Polygon, 4326);
  `);

  await pool.query(`
    ALTER TABLE input_allocations
    ADD COLUMN IF NOT EXISTS status TEXT;
  `);

  await pool.query(`
    UPDATE input_allocations
    SET status = COALESCE(status, 'Pending')
  `);

  await pool.query(`
    ALTER TABLE input_allocations
    ALTER COLUMN status SET DEFAULT 'Pending'
  `);

  await pool.query(`
    ALTER TABLE input_allocations
    ALTER COLUMN status SET NOT NULL
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_farmers_farm_boundary ON farmers USING GIST (farm_boundary);
  `);

  await pool.query(`
    UPDATE farmers
    SET farm_boundary = COALESCE(
      farm_boundary,
      ST_Buffer(
        gis_location::geography,
        CASE
          WHEN crop_type ILIKE 'Rice' THEN 190
          WHEN crop_type ILIKE 'Corn' THEN 175
          WHEN crop_type ILIKE 'Banana' THEN 165
          WHEN crop_type ILIKE 'Coconut' THEN 220
          WHEN crop_type ILIKE 'Vegetables' THEN 145
          WHEN crop_type ILIKE 'Cacao' THEN 180
          ELSE 160
        END
      )::geometry
    )
    WHERE gis_location IS NOT NULL;
  `);
}
