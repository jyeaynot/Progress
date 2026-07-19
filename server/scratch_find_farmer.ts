import "./src/loadEnv";
import pool from "./src/db/pool";

async function findFarmer() {
  console.log("Searching for farmer named Jay Dichosa...");
  try {
    const res = await pool.query("SELECT * FROM farmers WHERE last_name ILIKE 'dichosa' OR first_name ILIKE 'jay'");
    console.log("Found farmers:", res.rows);
  } catch (err: any) {
    console.error("Query failed:", err.message);
  } finally {
    await pool.end();
  }
}

findFarmer();
