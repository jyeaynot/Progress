import type { Request, Response } from "express";
import pool from "../db/pool.js";

const DEFAULT_PAGE_SIZE = 10;

function buildListFilters(search?: string, barangay?: string) {
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
    const page = Math.max(1, Number(req.query.page ?? 1) || 1);
    const pageSize = Math.max(
      1,
      Number(typeof req.query.pageSize === "string" ? req.query.pageSize : DEFAULT_PAGE_SIZE) ||
        DEFAULT_PAGE_SIZE
    );
    const offset = (page - 1) * pageSize;

    const { clauses, values } = buildListFilters(search, barangay);
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
        ST_X(f.gis_location::geometry) AS longitude
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

    const { clauses, values } = buildListFilters(search, barangay);
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
      GROUP BY f.id
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
        gisLocation: {
          latitude: row.latitude,
          longitude: row.longitude,
          label: row.label,
        },
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
    } = req.body;

    if (!rsbsaId || !firstName || !lastName || !barangay || !cropType || !season) {
      return res.status(400).json({ message: "Missing required farmer fields." });
    }

    const checkRsbsa = await pool.query("SELECT id FROM farmers WHERE rsbsa_id = $1", [rsbsaId]);
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
        gis_location
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 
        CASE 
          WHEN $12::double precision IS NOT NULL AND $13::double precision IS NOT NULL 
            THEN ST_SetSRID(ST_MakePoint($13, $12), 4326)
          ELSE NULL 
        END
      )
      RETURNING id
    `;

    const result = await pool.query(query, [
      rsbsaId,
      firstName,
      middleName || null,
      lastName,
      barangay,
      contactNumber || null,
      civilStatus || null,
      ethnicity || null,
      birthDate || null,
      cropType,
      season,
      latitude !== undefined && latitude !== null && latitude !== "" ? Number(latitude) : null,
      longitude !== undefined && longitude !== null && longitude !== "" ? Number(longitude) : null,
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
    } = req.body;

    if (!rsbsaId || !firstName || !lastName || !barangay || !cropType || !season) {
      return res.status(400).json({ message: "Missing required farmer fields." });
    }

    const checkRsbsa = await pool.query("SELECT id FROM farmers WHERE rsbsa_id = $1 AND id != $2", [rsbsaId, id]);
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
          WHEN $12::double precision IS NOT NULL AND $13::double precision IS NOT NULL 
            THEN ST_SetSRID(ST_MakePoint($13, $12), 4326)
          ELSE NULL 
        END,
        updated_at = NOW()
      WHERE id = $14
    `;

    const result = await pool.query(query, [
      rsbsaId,
      firstName,
      middleName || null,
      lastName,
      barangay,
      contactNumber || null,
      civilStatus || null,
      ethnicity || null,
      birthDate || null,
      cropType,
      season,
      latitude !== undefined && latitude !== null && latitude !== "" ? Number(latitude) : null,
      longitude !== undefined && longitude !== null && longitude !== "" ? Number(longitude) : null,
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
        notes,
        allocated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id, allocated_at AS "allocatedAt"
    `;

    const result = await pool.query(query, [
      farmerId,
      fertilizer || null,
      seeds || null,
      farmTools || null,
      pesticides || null,
      irrigationSubsidy || null,
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
