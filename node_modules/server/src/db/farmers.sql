-- Sample SQL for GET /farmers
-- Parameters:
--   $1 = search term (optional, ILIKE pattern)
--   $2 = barangay filter (optional, ILIKE pattern)
--   $3 = limit
--   $4 = offset
SELECT
  f.id,
  f.rsbsa_id AS "rsbsaId",
  CONCAT_WS(' ', f.first_name, f.middle_name, f.last_name) AS "fullName",
  UPPER(CONCAT(LEFT(COALESCE(f.first_name, ''), 1), LEFT(COALESCE(f.last_name, ''), 1))) AS initials,
  f.barangay,
  f.crop_type AS "cropType"
FROM farmers f
WHERE (
  CONCAT_WS(' ', f.first_name, f.middle_name, f.last_name) ILIKE $1
  OR f.barangay ILIKE $1
  OR f.rsbsa_id ILIKE $1
)
ORDER BY f.last_name ASC, f.first_name ASC
LIMIT $3 OFFSET $4;

-- Sample SQL for GET /farmers/:id
-- Parameter:
--   $1 = farmer id
SELECT
  f.id,
  f.rsbsa_id AS "rsbsaId",
  CONCAT_WS(' ', f.first_name, f.middle_name, f.last_name) AS "fullName",
  f.barangay,
  f.contact_number AS "contactNumber",
  f.civil_status AS "civilStatus",
  f.ethnicity,
  EXTRACT(YEAR FROM age(CURRENT_DATE, f.birth_date))::int AS age,
  f.crop_type AS "cropType",
  f.season AS "season",
  ST_Y(f.gis_location::geometry) AS latitude,
  ST_X(f.gis_location::geometry) AS longitude,
  f.barangay AS "label",
  COALESCE(
    json_agg(
      json_build_object(
        'id', ia.id,
        'fertilizer', ia.fertilizer,
        'seeds', ia.seeds,
        'farmTools', ia.farm_tools,
        'pesticides', ia.pesticides,
        'irrigationSubsidy', ia.irrigation_subsidy,
        'allocatedAt', ia.allocated_at,
        'notes', ia.notes
      )
      ORDER BY ia.allocated_at DESC
    ) FILTER (WHERE ia.id IS NOT NULL),
    '[]'::json
  ) AS "inputAllocations"
FROM farmers f
LEFT JOIN input_allocations ia ON ia.farmer_id = f.id
WHERE f.id = $1
GROUP BY f.id;

-- Sample SQL for GET /farmers/export
SELECT
  f.rsbsa_id AS "rsbsaId",
  CONCAT_WS(' ', f.first_name, f.middle_name, f.last_name) AS "fullName",
  f.barangay,
  f.crop_type AS "cropType",
  UPPER(CONCAT(LEFT(COALESCE(f.first_name, ''), 1), LEFT(COALESCE(f.last_name, ''), 1))) AS initials
FROM farmers f
WHERE (
  CONCAT_WS(' ', f.first_name, f.middle_name, f.last_name) ILIKE $1
  OR f.barangay ILIKE $1
  OR f.rsbsa_id ILIKE $1
)
ORDER BY f.last_name ASC, f.first_name ASC;
