import { Pool } from "pg";
function parseBool(value, fallback = false) {
    if (value === undefined) {
        return fallback;
    }
    return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}
const databaseUrl = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) {
    console.warn("\x1b[33m%s\x1b[0m", "WARNING: Neither SUPABASE_DB_URL nor DATABASE_URL is defined in environment variables.\n" +
        "The server will fall back to connecting to a local PostgreSQL instance at localhost:5432.\n" +
        "To use your remote Supabase database, set SUPABASE_DB_URL in your .env.local file.");
}
const useSsl = parseBool(process.env.DATABASE_SSL) ||
    process.env.PGSSLMODE === "require" ||
    databaseUrl?.includes("sslmode=require") ||
    databaseUrl?.includes(".supabase.co") ||
    false;
const pool = new Pool({
    connectionString: databaseUrl,
    host: process.env.PGHOST,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    max: Number(process.env.PGPOOL_MAX ?? 10),
    idleTimeoutMillis: Number(process.env.PGPOOL_IDLE_MS ?? 30_000),
    connectionTimeoutMillis: Number(process.env.PGPOOL_CONNECT_MS ?? 10_000),
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});
export default pool;
