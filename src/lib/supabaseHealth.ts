import { getSupabaseConfigError, supabase, supabaseConfig } from "./supabase";

export interface SupabaseHealthReport {
  configured: boolean;
  reachable: boolean;
  configError: string | null;
  session: {
    accessTokenPresent: boolean;
    expiresAt: string | null;
    userId: string | null;
  } | null;
  user: {
    id: string;
    email: string | null;
    emailConfirmedAt: string | null;
    confirmedAt: string | null;
    lastSignInAt: string | null;
  } | null;
  error: string | null;
}

export async function checkSupabaseConnection(): Promise<SupabaseHealthReport> {
  if (!supabase) {
    return {
      configured: false,
      reachable: false,
      configError: getSupabaseConfigError(),
      session: null,
      user: null,
      error: "Supabase client is not configured.",
    };
  }

  const [{ data: sessionData }, { data: userData, error }] = await Promise.all([
    supabase.auth.getSession(),
    supabase.auth.getUser(),
  ]);

  const session = sessionData.session
    ? {
        accessTokenPresent: Boolean(sessionData.session.access_token),
        expiresAt: sessionData.session.expires_at
          ? new Date(sessionData.session.expires_at * 1000).toISOString()
          : null,
        userId: sessionData.session.user.id ?? null,
      }
    : null;

  const user = userData.user
    ? {
        id: userData.user.id,
        email: userData.user.email ?? null,
        emailConfirmedAt: userData.user.email_confirmed_at ?? null,
        confirmedAt: userData.user.confirmed_at ?? null,
        lastSignInAt: userData.user.last_sign_in_at ?? null,
      }
    : null;

  return {
    configured: supabaseConfig.isConfigured,
    reachable: !error,
    configError: null,
    session,
    user,
    error: error?.message ?? null,
  };
}

export async function checkCurrentSupabaseUser() {
  const report = await checkSupabaseConnection();

  return {
    connected: report.reachable,
    signedIn: Boolean(report.session),
    confirmed: Boolean(report.user?.emailConfirmedAt ?? report.user?.confirmedAt),
    report,
  };
}
