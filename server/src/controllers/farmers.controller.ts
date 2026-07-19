import type { Request, Response } from "express";
import pool from "../db/pool";

const DEFAULT_PAGE_SIZE = 10;
const ALLOCATION_STATUSES = new Set(["Pending", "Received"]);
const CROP_RECORD_STATUSES = new Set(["Planned", "Planted", "Growing", "Harvested"]);

type ValidationIssue = {
  field: string;
  message: string;
};

type NormalizedFarmerGeometry = {
  latitude: number | null;
  longitude: number | null;
  geoJsonStr: string | null;
};

function normalizeAllocationStatus(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return ALLOCATION_STATUSES.has(normalized) ? normalized : null;
}

function normalizeCropRecordStatus(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return CROP_RECORD_STATUSES.has(normalized) ? normalized : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeText(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function normalizeRequiredText(value: unknown, field: string, errors: ValidationIssue[]) {
  const text = normalizeText(value);

  if (!text) {
    errors.push({ field, message: "is required." });
    return null;
  }

  return text;
}

function normalizeOptionalNumber(value: unknown, field: string, errors: ValidationIssue[]) {
  const text = normalizeText(value);

  if (!text) {
    return null;
  }

  const numericValue = Number(text);
  if (!Number.isFinite(numericValue)) {
    errors.push({ field, message: "must be a valid number." });
    return null;
  }

  return numericValue;
}

function normalizeOptionalDate(value: unknown, field: string, errors: ValidationIssue[]) {
  const text = normalizeText(value);

  if (!text) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    errors.push({ field, message: "must use YYYY-MM-DD format." });
    return null;
  }

  const parsed = new Date(`${text}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text) {
    errors.push({ field, message: "must be a real calendar date." });
    return null;
  }

  return text;
}

function buildGeoJsonPolygon(coords: unknown, errors: ValidationIssue[]) {
  if (!Array.isArray(coords)) {
    return null;
  }

  if (coords.length === 0) {
    return null;
  }

  if (coords.length < 3) {
    errors.push({
      field: "polygonCoords",
      message: "must include at least 3 coordinates.",
    });
    return null;
  }

  const points: Array<[number, number]> = [];

  for (let index = 0; index < coords.length; index += 1) {
    const coord = coords[index];
    if (!isRecord(coord)) {
      errors.push({
        field: `polygonCoords[${index}]`,
        message: "must contain lat and lng values.",
      });
      continue;
    }

    const lat = Number(coord.lat);
    const lng = Number(coord.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      errors.push({
        field: `polygonCoords[${index}]`,
        message: "lat and lng must be valid numbers.",
      });
      continue;
    }

    points.push([lng, lat]);
  }

  if (errors.length > 0 || points.length < 3) {
    if (points.length < 3 && errors.length === 0) {
      errors.push({
        field: "polygonCoords",
        message: "must include at least 3 valid coordinates.",
      });
    }
    return null;
  }

  const first = points[0];
  const last = points[points.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    points.push([first[0], first[1]]);
  }

  return JSON.stringify({
    type: "Polygon",
    coordinates: [points],
  });
}

function normalizeFarmGeometry(body: Request["body"], errors: ValidationIssue[]): NormalizedFarmerGeometry {
  const geoJsonStr = buildGeoJsonPolygon(body.polygonCoords, errors);
  if (geoJsonStr) {
    return {
      latitude: null,
      longitude: null,
      geoJsonStr,
    };
  }

  const latitude = normalizeOptionalNumber(body.latitude, "latitude", errors);
  const longitude = normalizeOptionalNumber(body.longitude, "longitude", errors);

  if ((latitude !== null && longitude === null) || (latitude === null && longitude !== null)) {
    errors.push({
      field: "gisLocation",
      message: "latitude and longitude must be provided together.",
    });
  }

  return {
    latitude,
    longitude,
    geoJsonStr: null,
  };
}

function sendValidationError(res: Response, errors: ValidationIssue[]) {
  const message = errors.map((issue) => `${issue.field} ${issue.message}`).join(" ");
  return res.status(400).json({
    message: message || "Invalid request payload.",
    errors,
  });
}

function parseAreaHa(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function buildListFilters(search?: string, barangay?: string, cropType?: string) {
  const clauses: string[] = [];
  const values: unknown[] = [];

  if (search && search.trim().length > 0) {
    values.push(`%${search.trim()}%`);
    const searchIndex = values.length;
    clauses.push(
      `(CONCAT_WS(' ', f.first_name, f.middle_name, f.last_name) ILIKE $${searchIndex}
        OR f.barangay ILIKE $${searchIndex}
        OR f.rsbsa_id ILIKE $${searchIndex})`
    );
  }

  if (barangay && barangay.trim().length > 0) {
    values.push(`%${barangay.trim()}%`);
    const barangayIndex = values.length;
    clauses.push(`f.barangay ILIKE $${barangayIndex}`);
  }

  if (cropType && cropType.trim().length > 0) {
    values.push(cropType.trim());
    const cropTypeIndex = values.length;
    clauses.push(`f.crop_type = $${cropTypeIndex}`);
  }

  return { clauses, values };
}

function quoteCsvValue(value: unknown) {
  if (value === null || value === undefined) {
    return '""';
  }

  const text = String(value).replace(/"/g, '""');
  return `"${text}"`;
}

function farmersToCsv(rows: Array<Record<string, unknown>>) {
  const header = ["RSBSA ID", "Full Name", "Barangay", "Crop Type", "Initials"];
  const csvRows = rows.map((row) =>
    [
      row.rsbsaId,
      row.fullName,
      row.barangay,
      row.cropType,
      row.initials,
    ]
      .map(quoteCsvValue)
      .join(",")
  );

  return [header.map(quoteCsvValue).join(","), ...csvRows].join("\n");
}

export async function getFarmers(req: Request, res: Response) {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : "";
    const barangay = typeof req.query.barangay === "string" ? req.query.barangay : "";
    const cropType = typeof req.query.cropType === "string" ? req.query.cropType : "";
    const page = Math.max(1, Number(req.query.page ?? 1) || 1);
    const pageSize = Math.max(
      1,
      Number(typeof req.query.pageSize === "string" ? req.query.pageSize : DEFAULT_PAGE_SIZE) ||
        DEFAULT_PAGE_SIZE
    );
    const offset = (page - 1) * pageSize;

    const { clauses, values } = buildListFilters(search, barangay, cropType);
    const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

    const listSql = `
      SELECT
        f.id,
        f.rsbsa_id AS "rsbsaId",
        CONCAT_WS(' ', f.first_name, f.middle_name, f.last_name) AS "fullName",
        UPPER(CONCAT(LEFT(COALESCE(f.first_name, ''), 1), LEFT(COALESCE(f.last_name, ''), 1))) AS initials,
        f.barangay,
        f.crop_type AS "cropType",
        ST_Y(f.gis_location::geometry) AS latitude,
        ST_X(f.gis_location::geometry) AS longitude,
        ST_AsGeoJSON(f.farm_boundary)::json AS "farmBoundary",
        COALESCE(ST_Area(f.farm_boundary::geography) / 10000.0, 0)::double precision AS "farmAreaHa"
      FROM farmers f
      ${whereClause}
      ORDER BY f.last_name ASC, f.first_name ASC
      LIMIT $${values.length + 1}
      OFFSET $${values.length + 2}
    `;

    const filteredCountSql = `
      SELECT COUNT(*)::int AS count
      FROM farmers f
      ${whereClause}
    `;

    const totalRegisteredSql = `SELECT COUNT(*)::int AS count FROM farmers`;

    const [listResult, filteredCountResult, totalCountResult] = await Promise.all([
      pool.query(listSql, [...values, pageSize, offset]),
      pool.query(filteredCountSql, values),
      pool.query(totalRegisteredSql),
    ]);

    const filteredCount = filteredCountResult.rows[0]?.count ?? 0;
    const totalRegistered = totalCountResult.rows[0]?.count ?? 0;

    return res.json({
      data: listResult.rows,
      meta: {
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(filteredCount / pageSize)),
        filteredCount,
        totalRegistered,
      },
    });
  } catch (error) {
    console.error("Failed to load farmers list:", error);
    return res.status(500).json({
      message: "Failed to load farmers.",
    });
  }
}

export async function exportFarmers(req: Request, res: Response) {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : "";
    const barangay = typeof req.query.barangay === "string" ? req.query.barangay : "";
    const cropType = typeof req.query.cropType === "string" ? req.query.cropType : "";

    const { clauses, values } = buildListFilters(search, barangay, cropType);
    const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

    const exportSql = `
      SELECT
        f.rsbsa_id AS "rsbsaId",
        CONCAT_WS(' ', f.first_name, f.middle_name, f.last_name) AS "fullName",
        f.barangay,
        f.crop_type AS "cropType",
        UPPER(CONCAT(LEFT(COALESCE(f.first_name, ''), 1), LEFT(COALESCE(f.last_name, ''), 1))) AS initials
      FROM farmers f
      ${whereClause}
      ORDER BY f.last_name ASC, f.first_name ASC
    `;

    const result = await pool.query(exportSql, values);
    const csv = farmersToCsv(result.rows);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="farmers-export.csv"');
    return res.send(csv);
  } catch (error) {
    console.error("Failed to export farmers:", error);
    return res.status(500).json({
      message: "Failed to export farmers.",
    });
  }
}

export async function getFarmerById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const farmerSql = `
      SELECT
        f.id,
        f.rsbsa_id AS "rsbsaId",
        CONCAT_WS(' ', f.first_name, f.middle_name, f.last_name) AS "fullName",
        UPPER(CONCAT(LEFT(COALESCE(f.first_name, ''), 1), LEFT(COALESCE(f.last_name, ''), 1))) AS initials,
        f.barangay,
        f.crop_type AS "cropType",
        f.contact_number AS "contactNumber",
        f.civil_status AS "civilStatus",
        f.ethnicity,
        EXTRACT(YEAR FROM age(CURRENT_DATE, f.birth_date))::int AS age,
        f.birth_date AS "birthDate",
        f.season AS "season",
        ST_Y(f.gis_location::geometry) AS latitude,
        ST_X(f.gis_location::geometry) AS longitude,
        f.barangay AS "label",
        ST_AsGeoJSON(f.farm_boundary)::json AS "farmBoundary",
        COALESCE(ST_Area(f.farm_boundary::geography) / 10000.0, 0)::double precision AS "farmAreaHa",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', ia.id,
                'fertilizer', ia.fertilizer,
                'seeds', ia.seeds,
                'farmTools', ia.farm_tools,
                'pesticides', ia.pesticides,
                'irrigationSubsidy', ia.irrigation_subsidy,
                'status', ia.status,
                'allocatedAt', ia.allocated_at,
                'notes', ia.notes
              )
              ORDER BY ia.allocated_at DESC
            )
            FROM input_allocations ia
            WHERE ia.farmer_id = f.id
          ),
          '[]'::json
        ) AS "inputAllocations"
        ,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', cr.id,
                'farmerId', cr.farmer_id,
                'farmerName', CONCAT_WS(' ', f.first_name, f.middle_name, f.last_name),
                'rsbsaId', f.rsbsa_id,
                'barangay', f.barangay,
                'cropType', cr.crop_type,
                'plantingDate', cr.planting_date,
                'harvestDate', cr.harvest_date,
                'areaHa', cr.area_ha,
                'status', cr.status,
                'notes', cr.notes,
                'createdAt', cr.created_at,
                'updatedAt', cr.updated_at
              )
              ORDER BY cr.planting_date DESC NULLS LAST, cr.created_at DESC
            )
            FROM crop_records cr
            WHERE cr.farmer_id = f.id
          ),
          '[]'::json
        ) AS "cropRecords"
      FROM farmers f
      WHERE f.id = $1
      LIMIT 1
    `;

    const result = await pool.query(farmerSql, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Farmer not found.",
      });
    }

    const row = result.rows[0];

    return res.json({
      data: {
        ...row,
        farmDetails: {
          cropType: row.cropType,
          season: row.season,
        },
        cropRecords: row.cropRecords ?? [],
        gisLocation: {
          latitude: row.latitude,
          longitude: row.longitude,
          label: row.label,
        },
        farmBoundary: row.farmBoundary,
        farmAreaHa: row.farmAreaHa,
      },
    });
  } catch (error) {
    console.error("Failed to load farmer profile:", error);
    return res.status(500).json({
      message: "Failed to load farmer profile.",
    });
  }
}

export async function createFarmer(req: Request, res: Response) {
  try {
    const errors: ValidationIssue[] = [];
    const {
      rsbsaId,
      firstName,
      middleName,
      lastName,
      barangay,
      contactNumber,
      civilStatus,
      ethnicity,
      birthDate,
      cropType,
      season,
      latitude,
      longitude,
      polygonCoords,
    } = req.body;

    const normalizedRsbsaId = normalizeRequiredText(rsbsaId, "rsbsaId", errors);
    const normalizedFirstName = normalizeRequiredText(firstName, "firstName", errors);
    const normalizedLastName = normalizeRequiredText(lastName, "lastName", errors);
    const normalizedBarangay = normalizeRequiredText(barangay, "barangay", errors);
    const normalizedCropType = normalizeRequiredText(cropType, "cropType", errors);
    const normalizedSeason = normalizeRequiredText(season, "season", errors);
    const normalizedMiddleName = normalizeText(middleName);
    const normalizedContactNumber = normalizeText(contactNumber);
    const normalizedCivilStatus = normalizeText(civilStatus);
    const normalizedEthnicity = normalizeText(ethnicity);
    const normalizedBirthDate = normalizeOptionalDate(birthDate, "birthDate", errors);
    const normalizedGeometry = normalizeFarmGeometry({ latitude, longitude, polygonCoords }, errors);

    if (errors.length > 0) {
      return sendValidationError(res, errors);
    }

    const checkRsbsa = await pool.query("SELECT id FROM farmers WHERE rsbsa_id = $1", [normalizedRsbsaId]);
    if (checkRsbsa.rows.length > 0) {
      return res.status(400).json({ message: "RSBSA ID already exists." });
    }

    const query = `
      INSERT INTO farmers (
        rsbsa_id,
        first_name,
        middle_name,
        last_name,
        barangay,
        contact_number,
        civil_status,
        ethnicity,
        birth_date,
        crop_type,
        season,
        gis_location,
        farm_boundary
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 
        CASE 
          WHEN $14::text IS NOT NULL
            THEN ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON($14), 4326))
          WHEN $12::double precision IS NOT NULL AND $13::double precision IS NOT NULL 
            THEN ST_SetSRID(ST_MakePoint($13, $12), 4326)
          ELSE NULL 
        END,
        CASE
          WHEN $14::text IS NOT NULL
            THEN ST_SetSRID(ST_GeomFromGeoJSON($14), 4326)
          WHEN $12::double precision IS NOT NULL AND $13::double precision IS NOT NULL
            THEN ST_Buffer(
              ST_SetSRID(ST_MakePoint($13, $12), 4326)::geography,
              CASE
                WHEN $10 ILIKE 'Rice' THEN 190
                WHEN $10 ILIKE 'Corn' THEN 175
                WHEN $10 ILIKE 'Banana' THEN 165
                WHEN $10 ILIKE 'Coconut' THEN 220
                WHEN $10 ILIKE 'Vegetables' THEN 145
                WHEN $10 ILIKE 'Cacao' THEN 180
                ELSE 160
              END
            )::geometry
          ELSE NULL
        END
      )
      RETURNING id
    `;

    const result = await pool.query(query, [
      normalizedRsbsaId,
      normalizedFirstName,
      normalizedMiddleName,
      normalizedLastName,
      normalizedBarangay,
      normalizedContactNumber,
      normalizedCivilStatus,
      normalizedEthnicity,
      normalizedBirthDate,
      normalizedCropType,
      normalizedSeason,
      normalizedGeometry.latitude,
      normalizedGeometry.longitude,
      normalizedGeometry.geoJsonStr,
    ]);

    const newId = result.rows[0].id;
    return res.status(201).json({ id: newId, message: "Farmer registered successfully." });
  } catch (error) {
    console.error("Failed to create farmer:", error);
    return res.status(500).json({ message: "Failed to create farmer." });
  }
}

export async function updateFarmer(req: Request, res: Response) {
  try {
    const errors: ValidationIssue[] = [];
    const { id } = req.params;
    const {
      rsbsaId,
      firstName,
      middleName,
      lastName,
      barangay,
      contactNumber,
      civilStatus,
      ethnicity,
      birthDate,
      cropType,
      season,
      latitude,
      longitude,
      polygonCoords,
    } = req.body;

    const normalizedRsbsaId = normalizeRequiredText(rsbsaId, "rsbsaId", errors);
    const normalizedFirstName = normalizeRequiredText(firstName, "firstName", errors);
    const normalizedLastName = normalizeRequiredText(lastName, "lastName", errors);
    const normalizedBarangay = normalizeRequiredText(barangay, "barangay", errors);
    const normalizedCropType = normalizeRequiredText(cropType, "cropType", errors);
    const normalizedSeason = normalizeRequiredText(season, "season", errors);
    const normalizedMiddleName = normalizeText(middleName);
    const normalizedContactNumber = normalizeText(contactNumber);
    const normalizedCivilStatus = normalizeText(civilStatus);
    const normalizedEthnicity = normalizeText(ethnicity);
    const normalizedBirthDate = normalizeOptionalDate(birthDate, "birthDate", errors);
    const normalizedGeometry = normalizeFarmGeometry({ latitude, longitude, polygonCoords }, errors);

    if (errors.length > 0) {
      return sendValidationError(res, errors);
    }

    const checkRsbsa = await pool.query("SELECT id FROM farmers WHERE rsbsa_id = $1 AND id != $2", [normalizedRsbsaId, id]);
    if (checkRsbsa.rows.length > 0) {
      return res.status(400).json({ message: "RSBSA ID already in use by another farmer." });
    }

    const query = `
      UPDATE farmers
      SET
        rsbsa_id = $1,
        first_name = $2,
        middle_name = $3,
        last_name = $4,
        barangay = $5,
        contact_number = $6,
        civil_status = $7,
        ethnicity = $8,
        birth_date = $9,
        crop_type = $10,
        season = $11,
        gis_location = CASE 
          WHEN $14::text IS NOT NULL
            THEN ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON($14), 4326))
          WHEN $12::double precision IS NOT NULL AND $13::double precision IS NOT NULL 
            THEN ST_SetSRID(ST_MakePoint($13, $12), 4326)
          ELSE NULL 
        END,
        farm_boundary = CASE
          WHEN $14::text IS NOT NULL
            THEN ST_SetSRID(ST_GeomFromGeoJSON($14), 4326)
          WHEN $12::double precision IS NOT NULL AND $13::double precision IS NOT NULL
            THEN ST_Buffer(
              ST_SetSRID(ST_MakePoint($13, $12), 4326)::geography,
              CASE
                WHEN $10 ILIKE 'Rice' THEN 190
                WHEN $10 ILIKE 'Corn' THEN 175
                WHEN $10 ILIKE 'Banana' THEN 165
                WHEN $10 ILIKE 'Coconut' THEN 220
                WHEN $10 ILIKE 'Vegetables' THEN 145
                WHEN $10 ILIKE 'Cacao' THEN 180
                ELSE 160
              END
            )::geometry
          ELSE NULL
        END,
        updated_at = NOW()
      WHERE id = $15
    `;

    const result = await pool.query(query, [
      normalizedRsbsaId,
      normalizedFirstName,
      normalizedMiddleName,
      normalizedLastName,
      normalizedBarangay,
      normalizedContactNumber,
      normalizedCivilStatus,
      normalizedEthnicity,
      normalizedBirthDate,
      normalizedCropType,
      normalizedSeason,
      normalizedGeometry.latitude,
      normalizedGeometry.longitude,
      normalizedGeometry.geoJsonStr,
      id,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Farmer not found." });
    }

    return res.json({ message: "Farmer updated successfully." });
  } catch (error) {
    console.error("Failed to update farmer:", error);
    return res.status(500).json({ message: "Failed to update farmer." });
  }
}

export async function deleteFarmer(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM farmers WHERE id = $1", [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Farmer not found." });
    }

    return res.json({ message: "Farmer deleted successfully." });
  } catch (error) {
    console.error("Failed to delete farmer:", error);
    return res.status(500).json({ message: "Failed to delete farmer." });
  }
}

export async function createInputAllocation(req: Request, res: Response) {
  try {
    const { id: farmerId } = req.params;
    const { fertilizer, seeds, farmTools, pesticides, irrigationSubsidy, notes } = req.body;
    const status = normalizeAllocationStatus(req.body.status) ?? "Pending";

    const checkFarmer = await pool.query("SELECT id FROM farmers WHERE id = $1", [farmerId]);
    if (checkFarmer.rows.length === 0) {
      return res.status(404).json({ message: "Farmer not found." });
    }

    const query = `
      INSERT INTO input_allocations (
        farmer_id,
        fertilizer,
        seeds,
        farm_tools,
        pesticides,
        irrigation_subsidy,
        status,
        notes,
        allocated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id, allocated_at AS "allocatedAt", status
    `;

    const result = await pool.query(query, [
      farmerId,
      fertilizer || null,
      seeds || null,
      farmTools || null,
      pesticides || null,
      irrigationSubsidy || null,
      status,
      notes || null,
    ]);

    return res.status(201).json({
      data: result.rows[0],
      message: "Input allocation recorded successfully.",
    });
  } catch (error) {
    console.error("Failed to create input allocation:", error);
    return res.status(500).json({ message: "Failed to create input allocation." });
  }
}

export async function updateInputAllocationStatus(req: Request, res: Response) {
  try {
    const { id: farmerId, allocationId } = req.params;
    const status = normalizeAllocationStatus(req.body.status);

    if (!status) {
      return res.status(400).json({ message: "Status must be Received or Pending." });
    }

    const query = `
      UPDATE input_allocations
      SET status = $1, updated_at = NOW()
      WHERE id = $2 AND farmer_id = $3
      RETURNING id, status
    `;

    const result = await pool.query(query, [status, allocationId, farmerId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Allocation not found." });
    }

    return res.json({
      data: result.rows[0],
      message: "Allocation status updated successfully.",
    });
  } catch (error) {
    console.error("Failed to update allocation status:", error);
    return res.status(500).json({ message: "Failed to update allocation status." });
  }
}

export async function getCropRecords(req: Request, res: Response) {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const whereClauses: string[] = [];
    const values: unknown[] = [];

    if (search) {
      values.push(`%${search}%`);
      whereClauses.push(`(
        CONCAT_WS(' ', f.first_name, f.middle_name, f.last_name) ILIKE $1
        OR f.rsbsa_id ILIKE $1
        OR f.barangay ILIKE $1
        OR cr.crop_type ILIKE $1
        OR cr.status ILIKE $1
      )`);
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const sql = `
      SELECT
        cr.id,
        cr.farmer_id AS "farmerId",
        CONCAT_WS(' ', f.first_name, f.middle_name, f.last_name) AS "farmerName",
        f.rsbsa_id AS "rsbsaId",
        f.barangay,
        cr.crop_type AS "cropType",
        cr.planting_date AS "plantingDate",
        cr.harvest_date AS "harvestDate",
        cr.area_ha AS "areaHa",
        cr.status,
        cr.notes,
        cr.created_at AS "createdAt",
        cr.updated_at AS "updatedAt"
      FROM crop_records cr
      INNER JOIN farmers f ON f.id = cr.farmer_id
      ${whereClause}
      ORDER BY cr.planting_date DESC NULLS LAST, cr.updated_at DESC
    `;

    const result = await pool.query(sql, values);
    return res.json({ data: result.rows });
  } catch (error) {
    console.error("Failed to load crop records:", error);
    return res.status(500).json({ message: "Failed to load crop records." });
  }
}

export async function createCropRecord(req: Request, res: Response) {
  try {
    const { id: farmerId } = req.params;
    const { cropType, plantingDate, harvestDate, areaHa, status, notes } = req.body;
    const normalizedStatus = normalizeCropRecordStatus(status) ?? "Planted";
    const normalizedArea = parseAreaHa(areaHa);

    if (!cropType || normalizedArea === null || normalizedArea <= 0) {
      return res.status(400).json({ message: "Crop type and area are required." });
    }

    const checkFarmer = await pool.query("SELECT id FROM farmers WHERE id = $1", [farmerId]);
    if (checkFarmer.rows.length === 0) {
      return res.status(404).json({ message: "Farmer not found." });
    }

    const query = `
      INSERT INTO crop_records (
        farmer_id,
        crop_type,
        planting_date,
        harvest_date,
        area_ha,
        status,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        farmer_id AS "farmerId",
        crop_type AS "cropType",
        planting_date AS "plantingDate",
        harvest_date AS "harvestDate",
        area_ha AS "areaHa",
        status,
        notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;

    const result = await pool.query(query, [
      farmerId,
      cropType,
      plantingDate || null,
      harvestDate || null,
      normalizedArea,
      normalizedStatus,
      notes || null,
    ]);

    return res.status(201).json({
      data: result.rows[0],
      message: "Crop record created successfully.",
    });
  } catch (error) {
    console.error("Failed to create crop record:", error);
    return res.status(500).json({ message: "Failed to create crop record." });
  }
}

export async function updateCropRecord(req: Request, res: Response) {
  try {
    const { recordId } = req.params;
    const { cropType, plantingDate, harvestDate, areaHa, status, notes } = req.body;
    const normalizedStatus = normalizeCropRecordStatus(status);
    const normalizedArea = parseAreaHa(areaHa);

    if (!cropType || normalizedArea === null || normalizedArea <= 0 || !normalizedStatus) {
      return res.status(400).json({ message: "Crop type, area, and status are required." });
    }

    const query = `
      UPDATE crop_records
      SET
        crop_type = $1,
        planting_date = $2,
        harvest_date = $3,
        area_ha = $4,
        status = $5,
        notes = $6,
        updated_at = NOW()
      WHERE id = $7
      RETURNING
        id,
        farmer_id AS "farmerId",
        crop_type AS "cropType",
        planting_date AS "plantingDate",
        harvest_date AS "harvestDate",
        area_ha AS "areaHa",
        status,
        notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;

    const result = await pool.query(query, [
      cropType,
      plantingDate || null,
      harvestDate || null,
      normalizedArea,
      normalizedStatus,
      notes || null,
      recordId,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Crop record not found." });
    }

    return res.json({
      data: result.rows[0],
      message: "Crop record updated successfully.",
    });
  } catch (error) {
    console.error("Failed to update crop record:", error);
    return res.status(500).json({ message: "Failed to update crop record." });
  }
}
