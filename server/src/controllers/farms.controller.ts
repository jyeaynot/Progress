import type { Request, Response } from "express";
import pool from "../db/pool";

type FarmCropKey = "Rice" | "Corn" | "Banana" | "Coconut" | "Vegetables" | "Cacao" | "Others";

interface FarmRow {
  systemId: string;
  farmerId: string;
  farmerName: string;
  initials: string;
  contactNumber: string | null;
  barangay: string;
  address: string;
  cropType: string;
  cropIcon: string;
  cropLabel: string;
  variety: string;
  growthStage: string;
  plantingDate: string | null;
  expectedHarvestDate: string | null;
  farmStatus: string;
  totalAreaHa: number | string | null;
  polygonAreaHa: number | string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  dateRegistered: string;
  healthStatus: string;
  ndviValue: number | string | null;
  moistureLevel: number | string | null;
  pestRisk: string;
  diseaseRisk: string;
  expectedYield: number | string | null;
  previousYield: number | string | null;
  fertilizerApplied: string | null;
  lastIrrigation: string | null;
  lastInspection: string | null;
  temperature: number | string | null;
  humidity: number | string | null;
  rainProbability: number | string | null;
  windSpeed: number | string | null;
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  } | null;
  cropHistoryCount?: number;
  cropHistory?: unknown;
}

const CROP_META: Record<FarmCropKey, { icon: string; label: string; variety: string; radius: number }> = {
  Rice: { icon: "🌾", label: "Rice", variety: "Inbred Hybrid", radius: 190 },
  Corn: { icon: "🌽", label: "Corn", variety: "Yellow Flint", radius: 175 },
  Banana: { icon: "🍌", label: "Banana", variety: "Lakatan", radius: 165 },
  Coconut: { icon: "🥥", label: "Coconut", variety: "Tall Hybrid", radius: 220 },
  Vegetables: { icon: "🥬", label: "Vegetables", variety: "Mixed Vegetable Line", radius: 145 },
  Cacao: { icon: "🍫", label: "Cacao", variety: "BR-25", radius: 180 },
  Others: { icon: "◼", label: "Others", variety: "Mixed Variety", radius: 160 },
};

function normalizeCropKey(value?: string | null): FarmCropKey {
  const text = (value ?? "").trim().toLowerCase();

  if (text.includes("rice")) return "Rice";
  if (text.includes("corn")) return "Corn";
  if (text.includes("banana")) return "Banana";
  if (text.includes("coconut")) return "Coconut";
  if (text.includes("vegetable")) return "Vegetables";
  if (text.includes("cacao") || text.includes("cocoa")) return "Cacao";

  return "Others";
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatMetric(value: number, suffix: string) {
  return `${value.toFixed(1)} ${suffix}`;
}

function buildResponse(row: FarmRow, includeHistory = false) {
  const cropKey = normalizeCropKey(row.cropType);
  const meta = CROP_META[cropKey];
  const hash = hashString(row.systemId);
  const latitude = toNumber(row.latitude);
  const longitude = toNumber(row.longitude);
  const polygonAreaHa = toNumber(row.polygonAreaHa) ?? 0;
  const totalAreaHa = toNumber(row.totalAreaHa) ?? polygonAreaHa;
  const ndviValue = Number((0.35 + (hash % 40) / 100).toFixed(2));
  const moistureLevel = Number((38 + (hash % 42)).toFixed(0));
  const temperature = Number((27 + (hash % 6) + ((hash % 10) / 10)).toFixed(1));
  const humidity = Number((70 + (hash % 22)).toFixed(0));
  const rainProbability = Number((15 + (hash % 45)).toFixed(0));
  const windSpeed = Number((4 + (hash % 12) / 2).toFixed(1));
  const healthStatus =
    ndviValue >= 0.68 ? "Healthy" : ndviValue >= 0.5 ? "Moderate" : ndviValue >= 0.42 ? "Needs Attention" : "Critical";
  const pestRisk =
    ndviValue >= 0.7 ? "Low" : ndviValue >= 0.58 ? "Moderate" : ndviValue >= 0.48 ? "Elevated" : "High";
  const diseaseRisk =
    moistureLevel >= 70 ? "High" : moistureLevel >= 58 ? "Moderate" : moistureLevel >= 48 ? "Low" : "Very Low";
  const growthStage = row.growthStage || "No Data";
  const farmStatus = row.farmStatus || "Registered";
  const expectedYield = Number((Math.max(totalAreaHa, polygonAreaHa) * (cropKey === "Rice" ? 4.2 : cropKey === "Corn" ? 5.1 : cropKey === "Coconut" ? 3.4 : cropKey === "Banana" ? 3.8 : cropKey === "Cacao" ? 2.6 : 3.0)).toFixed(1));
  const previousYield = Number((expectedYield * 0.84).toFixed(1));
  const lastInspection = row.lastInspection || row.dateRegistered;
  const lastIrrigation = row.lastIrrigation || row.dateRegistered;
  const fertilizerApplied = row.fertilizerApplied || "Balanced fertilizer program";

  return {
    systemId: row.systemId,
    farmId: row.systemId,
    farmerId: row.farmerId,
    farmerName: row.farmerName,
    initials: row.initials,
    contactNumber: row.contactNumber,
    barangay: row.barangay,
    address: row.address,
    cropType: meta.label,
    cropIcon: meta.icon,
    cropLabel: meta.label,
    variety: meta.variety,
    growthStage,
    plantingDate: row.plantingDate,
    expectedHarvestDate: row.expectedHarvestDate,
    farmStatus,
    totalAreaHa: Number(totalAreaHa.toFixed(2)),
    polygonAreaHa: Number(polygonAreaHa.toFixed(2)),
    gpsCoordinates: {
      latitude,
      longitude,
    },
    dateRegistered: row.dateRegistered,
    healthStatus,
    ndviValue,
    moistureLevel,
    pestRisk,
    diseaseRisk,
    expectedYield: formatMetric(expectedYield, "t"),
    previousYield: formatMetric(previousYield, "t"),
    fertilizerApplied,
    lastIrrigation,
    lastInspection,
    weather: {
      temperature,
      humidity,
      rainProbability,
      windSpeed,
    },
    geometry: row.geometry,
    cropHistoryCount: row.cropHistoryCount ?? 0,
    ...(includeHistory ? { cropHistory: row.cropHistory ?? [] } : {}),
  };
}

function buildFarmFilters(search?: string, barangay?: string, cropType?: string, healthStatus?: string, growthStage?: string, areaSize?: string, year?: string) {
  const clauses: string[] = [];
  const values: unknown[] = [];

  const pushClause = (clause: string, value: unknown) => {
    values.push(value);
    clauses.push(clause.replace("$value", `$${values.length}`));
  };

  if (search?.trim()) {
    pushClause(
      `(base."farmerName" ILIKE $value OR base."farmerId" ILIKE $value OR base."systemId"::text ILIKE $value OR base.barangay ILIKE $value OR base."cropType" ILIKE $value)`,
      `%${search.trim()}%`
    );
  }

  if (barangay?.trim()) {
    pushClause(`base.barangay ILIKE $value`, `%${barangay.trim()}%`);
  }

  if (cropType?.trim()) {
    pushClause(`base."cropType" ILIKE $value`, `%${cropType.trim()}%`);
  }

  if (healthStatus?.trim()) {
    pushClause(`base."healthStatus" = $value`, healthStatus.trim());
  }

  if (growthStage?.trim()) {
    pushClause(`base."growthStage" = $value`, growthStage.trim());
  }

  if (areaSize?.trim()) {
    const normalized = areaSize.trim().toLowerCase();
    if (normalized === "small") {
      clauses.push(`base."polygonAreaHa" < 1`);
    } else if (normalized === "medium") {
      clauses.push(`base."polygonAreaHa" >= 1 AND base."polygonAreaHa" < 3`);
    } else if (normalized === "large") {
      clauses.push(`base."polygonAreaHa" >= 3`);
    }
  }

  if (year?.trim()) {
    pushClause(`EXTRACT(YEAR FROM base."dateRegistered") = $value`, Number(year.trim()));
  }

  return { clauses, values };
}

function buildFarmSql(includeHistory = false, singleFarmId?: string, filters?: ReturnType<typeof buildFarmFilters>) {
  const parcelRadiusCase = `
    CASE
      WHEN f.crop_type ILIKE 'Rice' THEN 190
      WHEN f.crop_type ILIKE 'Corn' THEN 175
      WHEN f.crop_type ILIKE 'Banana' THEN 165
      WHEN f.crop_type ILIKE 'Coconut' THEN 220
      WHEN f.crop_type ILIKE 'Vegetables' THEN 145
      WHEN f.crop_type ILIKE 'Cacao' THEN 180
      ELSE 160
    END
  `;

  const historySelect = includeHistory
    ? `,
        COALESCE(history.crop_history, '[]'::json) AS "cropHistory"`
    : "";

  const sql = `
    WITH latest_crop AS (
      SELECT DISTINCT ON (cr.farmer_id)
        cr.farmer_id,
        cr.crop_type,
        cr.planting_date,
        cr.harvest_date,
        cr.area_ha,
        cr.status,
        cr.notes,
        cr.created_at,
        cr.updated_at
      FROM crop_records cr
      ORDER BY cr.farmer_id, cr.planting_date DESC NULLS LAST, cr.created_at DESC
    ),
    latest_allocation AS (
      SELECT DISTINCT ON (ia.farmer_id)
        ia.farmer_id,
        ia.fertilizer,
        ia.seeds,
        ia.farm_tools,
        ia.pesticides,
        ia.irrigation_subsidy,
        ia.status,
        ia.allocated_at,
        ia.notes
      FROM input_allocations ia
      ORDER BY ia.farmer_id, ia.allocated_at DESC
    ),
    history AS (
      SELECT
        cr.farmer_id,
        COUNT(*)::int AS crop_history_count,
        COALESCE(SUM(cr.area_ha), 0) AS total_crop_area,
        json_agg(
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
        ) AS crop_history
      FROM crop_records cr
      INNER JOIN farmers f ON f.id = cr.farmer_id
      GROUP BY cr.farmer_id
    ),
    base AS (
      SELECT
        f.id AS "systemId",
        f.rsbsa_id AS "farmerId",
        CONCAT_WS(' ', f.first_name, f.middle_name, f.last_name) AS "farmerName",
        UPPER(CONCAT(LEFT(COALESCE(f.first_name, ''), 1), LEFT(COALESCE(f.last_name, ''), 1))) AS initials,
        f.contact_number AS "contactNumber",
        f.barangay,
        CONCAT_WS(', ', f.barangay, 'Talacogon', 'Agusan del Sur') AS address,
        f.crop_type AS "cropType",
        CASE
          WHEN f.crop_type ILIKE 'Rice' THEN '🌾'
          WHEN f.crop_type ILIKE 'Corn' THEN '🌽'
          WHEN f.crop_type ILIKE 'Banana' THEN '🍌'
          WHEN f.crop_type ILIKE 'Coconut' THEN '🥥'
          WHEN f.crop_type ILIKE 'Vegetables' THEN '🥬'
          WHEN f.crop_type ILIKE 'Cacao' THEN '🍫'
          ELSE '◼'
        END AS "cropIcon",
        CASE
          WHEN f.crop_type ILIKE 'Rice' THEN 'Rice'
          WHEN f.crop_type ILIKE 'Corn' THEN 'Corn'
          WHEN f.crop_type ILIKE 'Banana' THEN 'Banana'
          WHEN f.crop_type ILIKE 'Coconut' THEN 'Coconut'
          WHEN f.crop_type ILIKE 'Vegetables' THEN 'Vegetables'
          WHEN f.crop_type ILIKE 'Cacao' THEN 'Cacao'
          ELSE 'Others'
        END AS "cropLabel",
        CASE
          WHEN f.crop_type ILIKE 'Rice' THEN 'Inbred Hybrid'
          WHEN f.crop_type ILIKE 'Corn' THEN 'Yellow Flint'
          WHEN f.crop_type ILIKE 'Banana' THEN 'Lakatan'
          WHEN f.crop_type ILIKE 'Coconut' THEN 'Tall Hybrid'
          WHEN f.crop_type ILIKE 'Vegetables' THEN 'Mixed Vegetable Line'
          WHEN f.crop_type ILIKE 'Cacao' THEN 'BR-25'
          ELSE 'Mixed Variety'
        END AS variety,
        COALESCE(lc.status, 'No Data') AS "growthStage",
        lc.planting_date AS "plantingDate",
        lc.harvest_date AS "expectedHarvestDate",
        COALESCE(lc.status, 'Registered') AS "farmStatus",
        COALESCE(history.total_crop_area, 0) AS "totalAreaHa",
        ROUND((ST_Area(parcel.geom::geography) / 10000.0)::numeric, 2) AS "polygonAreaHa",
        ST_Y(f.gis_location::geometry) AS latitude,
        ST_X(f.gis_location::geometry) AS longitude,
        f.created_at AS "dateRegistered",
        CASE
          WHEN lc.status = 'Harvested' THEN 'Healthy'
          WHEN lc.status = 'Growing' THEN 'Moderate'
          WHEN lc.status = 'Planted' THEN 'Needs Attention'
          WHEN lc.status = 'Planned' THEN 'No Data'
          ELSE 'No Data'
        END AS "healthStatus",
        la.fertilizer AS "fertilizerApplied",
        la.allocated_at AS "lastIrrigation",
        COALESCE(lc.updated_at, lc.created_at, f.created_at) AS "lastInspection",
        ST_AsGeoJSON(parcel.geom)::json AS geometry,
        COALESCE(history.crop_history_count, 0) AS "cropHistoryCount"
        ${historySelect}
      FROM farmers f
      LEFT JOIN latest_crop lc ON lc.farmer_id = f.id
      LEFT JOIN latest_allocation la ON la.farmer_id = f.id
      LEFT JOIN history ON history.farmer_id = f.id
      CROSS JOIN LATERAL (
        SELECT COALESCE(
          f.farm_boundary,
          ST_Buffer(f.gis_location::geography, ${parcelRadiusCase})::geometry
        ) AS geom
      ) parcel
      WHERE f.gis_location IS NOT NULL
        ${singleFarmId ? "AND f.id = $1" : ""}
    )
    SELECT *
    FROM base
  `;

  const filterClause = filters?.clauses.length ? `WHERE ${filters.clauses.join(" AND ")}` : "";
  const orderClause = `ORDER BY "farmerName" ASC`;
  return `${sql} ${filterClause} ${orderClause}`;
}

function getRequestValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readFarmFilters(req: Request) {
  return {
    search: getRequestValue(req.query.search ?? req.query.q),
    barangay: getRequestValue(req.query.barangay),
    cropType: getRequestValue(req.query.cropType),
    healthStatus: getRequestValue(req.query.healthStatus),
    growthStage: getRequestValue(req.query.growthStage),
    areaSize: getRequestValue(req.query.areaSize),
    year: getRequestValue(req.query.year),
  };
}

export async function listFarms(req: Request, res: Response) {
  try {
    const filters = buildFarmFilters(
      getRequestValue(req.query.search ?? req.query.q),
      getRequestValue(req.query.barangay),
      getRequestValue(req.query.cropType),
      getRequestValue(req.query.healthStatus),
      getRequestValue(req.query.growthStage),
      getRequestValue(req.query.areaSize),
      getRequestValue(req.query.year)
    );

    const sql = buildFarmSql(false, undefined, filters);
    const result = await pool.query(sql, filters.values);

    return res.json({
      data: result.rows.map((row: any) => buildResponse(row as FarmRow, false)),
    });
  } catch (error) {
    console.error("Failed to load farm GIS list:", error);
    return res.status(500).json({ message: "Failed to load farm GIS data." });
  }
}

export async function getFarmById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const sql = buildFarmSql(true, String(id), undefined);
    const result = await pool.query(sql, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Farm not found." });
    }

    return res.json({
      data: buildResponse(result.rows[0] as FarmRow, true),
    });
  } catch (error) {
    console.error("Failed to load farm details:", error);
    return res.status(500).json({ message: "Failed to load farm details." });
  }
}

export async function searchFarms(req: Request, res: Response) {
  return listFarms(req, res);
}

export async function filterFarms(req: Request, res: Response) {
  return listFarms(req, res);
}
