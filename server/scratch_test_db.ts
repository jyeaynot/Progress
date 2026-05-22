import "./src/loadEnv";
import { Pool } from "pg";

async function testConnection() {
  const pool = new Pool({
    connectionString: "postgresql://postgres.ooeibhmriltmqlcjdlon:Jaydichosa1@aws-0-ap-south-1.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });
  console.log("Testing connection to Mumbai Pooler...");
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("Database connection successful! Time from DB:", res.rows[0].now);
  } catch (err) {
    console.error("Database connection failed:", err);
  } finally {
    await pool.end();
  }
}

testConnection();
