import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface SupabaseEnvConfig {
  url: string | null;
  anonKey: string | null;
  isConfigured: boolean;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

export const supabaseConfig: SupabaseEnvConfig = {
  url: supabaseUrl || null,
  anonKey: supabaseAnonKey || null,
  isConfigured: Boolean(supabaseUrl && supabaseAnonKey),
};

export function getSupabaseConfigError() {
  const missingVariables = [];

  if (!supabaseConfig.url) {
    missingVariables.push("VITE_SUPABASE_URL");
  }

  if (!supabaseConfig.anonKey) {
    missingVariables.push("VITE_SUPABASE_ANON_KEY");
  }

  if (missingVariables.length === 0) {
    return null;
  }

  return `Missing ${missingVariables.join(" and ")}.`;
}

export const supabase: SupabaseClient | null = supabaseConfig.isConfigured
  ? createClient(supabaseConfig.url as string, supabaseConfig.anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
