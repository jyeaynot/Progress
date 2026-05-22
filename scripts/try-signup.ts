import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load env vars from .env.local
const envContent = fs.readFileSync(".env.local", "utf8");
const urlMatch = envContent.match(/VITE_SUPABASE_URL\s*=\s*(.+)/);
const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.+)/);

if (!urlMatch || !keyMatch) {
  console.error("Missing environment variables in .env.local");
  process.exit(1);
}

const supabaseUrl = urlMatch[1].trim();
const supabaseAnonKey = keyMatch[1].trim();

console.log("Supabase URL:", supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function trySignUp(email: string) {
  const password = "password123";
  console.log(`Attempting to sign up ${email}...`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error(`Sign up error for ${email}:`, error.message, error.code);
  } else {
    console.log(`Sign up success for ${email}:`, data.user?.id, data.user?.email);
  }
}

async function run() {
  await trySignUp("admin@mao-talacogon.gov.ph");
  await trySignUp("admin@gmail.com");
  await trySignUp("admin@test.com");
  await trySignUp("admin@talacogon.com");
}
run();
