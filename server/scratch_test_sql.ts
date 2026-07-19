import "./src/loadEnv";
import pool from "./src/db/pool";

async function testQuery() {
  console.log("Testing PostGIS update SQL...");
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
  
  try {
    // Let's do a dry run of the case statements using SELECT instead of UPDATE to avoid side-effects
    const dryRunSql = `
      SELECT 
        ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)) AS gis_loc,
        ST_SetSRID(ST_GeomFromGeoJSON($1), 4326) AS boundary
    `;
    const res = await pool.query(dryRunSql, [geoJsonStr]);
    console.log("Dry run select query successful!", res.rows);
  } catch (err: any) {
    console.error("Dry run select query failed:", err.message);
  }

  try {
    // Let's test if the assignment to column fails
    // Let's get one farmer ID
    const farmersRes = await pool.query("SELECT id FROM farmers LIMIT 1");
    if (farmersRes.rows.length === 0) {
      console.log("No farmers in DB to test UPDATE");
      return;
    }
    const farmerId = farmersRes.rows[0].id;
    console.log("Testing UPDATE on farmer ID:", farmerId);

    const updateSql = `
      UPDATE farmers
      SET
        gis_location = ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)),
        farm_boundary = ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)
      WHERE id = $2
    `;
    await pool.query(updateSql, [geoJsonStr, farmerId]);
    console.log("UPDATE successful without explicit casts!");
  } catch (err: any) {
    console.error("UPDATE failed:", err.message);
  } finally {
    await pool.end();
  }
}

testQuery();
