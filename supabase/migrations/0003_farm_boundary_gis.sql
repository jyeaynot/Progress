-- Add farm_boundary geometry column to farmers if not exists
ALTER TABLE farmers 
ADD COLUMN IF NOT EXISTS farm_boundary GEOMETRY(Polygon, 4326);

-- Add spatial index on farm_boundary column using GIST
CREATE INDEX IF NOT EXISTS idx_farmers_farm_boundary ON farmers USING GIST (farm_boundary);

-- Migrate existing farmers to have a default polygon boundary if they only have a point location
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
