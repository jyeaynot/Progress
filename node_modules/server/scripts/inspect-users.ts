import pool from "../src/db/pool";

// Load environment variables manually
import { join } from "path";
try {
  const loadEnv = (process as any).loadEnvFile;
  if (typeof loadEnv === "function") {
    loadEnv(join(process.cwd(), ".env.local"));
  }
} catch {}

async function run() {
  try {
    const res = await pool.query("SELECT id, email, email_confirmed_at, confirmation_token FROM auth.users");
    console.log("Auth users:", res.rows);
    const profiles = await pool.query("SELECT * FROM public.profiles");
    console.log("Profiles:", profiles.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}
run();
