import "./src/loadEnv";
import pool from "./src/db/pool";

async function runUpdateTest() {
  const id = "6373b9b7-e2e5-482f-b8dc-b8ee42124407";
  const rsbsaId = "RSBSA-2001-01";
  const firstName = "Jay";
  const middleName = "M";
  const lastName = "Dichosa";
  const barangay = "San Vicente";
  const contactNumber = "09987654321";
  const civilStatus = "Single";
  const ethnicity = ""; // from screenshot
  const birthDate = "1990-12-09"; // from the DB value 1990-12-08T16:00:00.000Z
  const cropType = "Coconut";
  const season = "Wet Season 2026";
  const latitude = null;
  const longitude = null;
  const polygonCoords = [
    { lat: 8.1297, lng: 125.3962 },
    { lat: 8.1310, lng: 125.3975 },
    { lat: 8.1320, lng: 125.3950 },
    { lat: 8.1297, lng: 125.3962 }
  ];

  const makeGeoJsonPolygon = (coords: any[]) => {
    const points = coords.map((c: any) => [Number(c.lng), Number(c.lat)]);
    return {
      type: "Polygon",
      coordinates: [points],
    };
  };

  const geoJsonStr = JSON.stringify(makeGeoJsonPolygon(polygonCoords));

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
              WHEN $10::text ILIKE 'Rice' THEN 190
              WHEN $10::text ILIKE 'Corn' THEN 175
              WHEN $10::text ILIKE 'Banana' THEN 165
              WHEN $10::text ILIKE 'Coconut' THEN 220
              WHEN $10::text ILIKE 'Vegetables' THEN 145
              WHEN $10::text ILIKE 'Cacao' THEN 180
              ELSE 160
            END
          )::geometry
        ELSE NULL
      END,
      updated_at = NOW()
    WHERE id = $15
  `;

  try {
    console.log("Executing SQL update directly...");
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
      geoJsonStr,
      id,
    ]);
    console.log("UPDATE completed successfully. Rows affected:", result.rowCount);
  } catch (err: any) {
    console.error("SQL UPDATE FAILED:", err.message);
    console.error(err);
  } finally {
    await pool.end();
  }
}

runUpdateTest();
