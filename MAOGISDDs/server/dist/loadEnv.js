import { join } from "path";
try {
    const loadEnv = process.loadEnvFile;
    if (typeof loadEnv === "function") {
        const cwd = process.cwd();
        // Try loading env files from different possible working directories
        const paths = [
            join(cwd, ".env.local"),
            join(cwd, ".env"),
            join(cwd, "server", ".env.local"),
            join(cwd, "server", ".env"),
        ];
        for (const p of paths) {
            try {
                loadEnv(p);
            }
            catch { }
        }
    }
}
catch (e) {
    console.warn("Failed to load environment variables natively:", e);
}
// Fallback to VITE_ prefixed environment variables for local development compatibility
if (!process.env.SUPABASE_URL && process.env.VITE_SUPABASE_URL) {
    process.env.SUPABASE_URL = process.env.VITE_SUPABASE_URL;
}
if (!process.env.SUPABASE_ANON_KEY && process.env.VITE_SUPABASE_ANON_KEY) {
    process.env.SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
}
