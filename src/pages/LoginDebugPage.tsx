import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { getSupabaseConfigError, supabaseConfig } from "../lib/supabase";
import { checkSupabaseConnection, type SupabaseHealthReport } from "../lib/supabaseHealth";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}

function formatMaybe(value: string | null | undefined) {
  return value && value.trim() ? value : "Not set";
}

export default function LoginDebugPage() {
  const { session, user, loading: authLoading } = useAuth();
  const [report, setReport] = useState<SupabaseHealthReport | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshReport() {
    setLoading(true);

    try {
      const nextReport = await checkSupabaseConnection();
      setReport(nextReport);

      if (import.meta.env.DEV) {
        console.debug("Login debug report", nextReport);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Failed to load login debug report", error);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshReport();
  }, []);

  const confirmedAt =
    report?.user?.emailConfirmedAt ?? report?.user?.confirmedAt ?? null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_32%),linear-gradient(180deg,_#0f172a_0%,_#111827_100%)] px-4 py-10 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/95 p-6 text-slate-900 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-700">MAO Talacogon</p>
              <h1 className="mt-2 text-3xl font-semibold">Login Debug Screen</h1>
              <p className="mt-2 text-sm text-slate-600">
                Use this page to verify Supabase env vars, session state, and user confirmation status.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void refreshReport()}
                disabled={loading}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Refreshing..." : "Refresh report"}
              </button>
              <Link
                to="/login"
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-700"
              >
                Back to login
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-white">Summary</h2>
            <p className="mt-1 text-sm text-slate-300">
              This is the quickest way to isolate whether the 400 is caused by credentials, confirmation, or config.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Supabase configured" value={supabaseConfig.isConfigured ? "Yes" : "No"} />
              <Field label="Auth client reachable" value={report?.reachable ? "Yes" : "No"} />
              <Field label="Current session" value={session ? "Present" : "Missing"} />
              <Field label="Auth user" value={user ? "Present" : "Missing"} />
              <Field label="Email confirmed" value={confirmedAt ? "Yes" : "No"} />
              <Field label="Auth loading" value={authLoading ? "Yes" : "No"} />
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              {getSupabaseConfigError() ?? "Supabase config variables are present."}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Configured URL" value={formatMaybe(supabaseConfig.url)} />
              <Field label="Anon key" value={supabaseConfig.anonKey ? "Loaded" : "Missing"} />
              <Field
                label="Report error"
                value={report?.error ? report.error : "None"}
              />
              <Field
                label="Session user id"
                value={report?.session?.userId ?? "None"}
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/95 p-6 text-slate-900 shadow-2xl backdrop-blur">
            <h2 className="text-lg font-semibold">Details</h2>
            <p className="mt-1 text-sm text-slate-500">
              Confirmed user state and session timestamps.
            </p>

            <div className="mt-6 space-y-3 text-sm">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">User email</div>
                <div className="mt-1 font-medium text-slate-900">{report?.user?.email ?? "None"}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Email confirmed at</div>
                <div className="mt-1 font-medium text-slate-900">{confirmedAt ?? "None"}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Last sign-in</div>
                <div className="mt-1 font-medium text-slate-900">
                  {formatMaybe(report?.user?.lastSignInAt)}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Session expires at</div>
                <div className="mt-1 font-medium text-slate-900">
                  {report?.session?.expiresAt ?? "None"}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-950 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Raw report</div>
              <pre className="mt-3 max-h-[24rem] overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-slate-100">
                {JSON.stringify(report, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
