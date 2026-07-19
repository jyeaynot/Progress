import "./src/loadEnv";
import pool from "./src/db/pool";
import axios from "axios";

async function runApiTest() {
  console.log("Fetching a farmer ID from database...");
  const res = await pool.query("SELECT id, rsbsa_id, first_name, last_name, barangay, crop_type, season FROM farmers LIMIT 1");
  if (res.rows.length === 0) {
    console.log("No farmers found in DB to test");
    await pool.end();
    return;
  }

  const farmer = res.rows[0];
  console.log("Testing API PUT on farmer:", farmer);

  const payload = {
    rsbsaId: farmer.rsbsa_id,
    firstName: farmer.first_name,
    lastName: farmer.last_name,
    barangay: farmer.barangay,
    cropType: farmer.crop_type,
    season: farmer.season,
    polygonCoords: [
      { lat: 8.1297, lng: 125.3962 },
      { lat: 8.1310, lng: 125.3975 },
      { lat: 8.1320, lng: 125.3950 },
      { lat: 8.1297, lng: 125.3962 }
    ]
  };

  try {
    const apiRes = await axios.put(`http://localhost:4000/api/v1/farmers/${farmer.id}`, payload);
    console.log("API response status:", apiRes.status);
    console.log("API response data:", apiRes.data);
  } catch (err: any) {
    console.error("API request failed!");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    } else {
      console.error("Error message:", err.message);
    }
  } finally {
    await pool.end();
  }
}

runApiTest();
