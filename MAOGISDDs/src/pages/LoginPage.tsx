import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { getSupabaseConfigError, supabase, supabaseConfig } from "../lib/supabase";

function getFriendlyAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid email or password") ||
    normalized.includes("400")
  ) {
    return "Invalid email or password.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }

  if (normalized.includes("too many requests")) {
    return "Too many attempts. Please wait and try again.";
  }

  return "Sign in failed. Please check your credentials and try again.";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  
  // Transition state between the Welcome layout and the Credentials form
  const [showForm, setShowForm] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      navigate("/farmers", { replace: true });
    }
  }, [navigate, session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    const passwordValue = password;

    setError(null);

    if (!trimmedEmail || !passwordValue.trim()) {
      setError("Email and password are required.");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (!supabase) {
      setError(getSupabaseConfigError() ?? "Supabase is not configured.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: passwordValue,
      });

      if (signInError) {
        setError(getFriendlyAuthError(signInError.message));
        return;
      }

      navigate("/farmers", { replace: true });
    } catch (caughtError) {
      setError("Unable to sign in right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Welcome / Splash Layout
  if (!showForm) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-between bg-gradient-to-b from-green-900 via-emerald-950 to-zinc-950 p-6 md:p-12 text-white">
        {/* Top Header */}
        <div className="w-full max-w-4xl flex items-center justify-between mt-4">
          {/* MAO Logo placeholder */}
          <div className="w-16 h-16 rounded-full bg-emerald-800 border-2 border-emerald-500/40 flex items-center justify-center shadow-lg">
            <span className="text-xl font-black text-emerald-300">MAO</span>
          </div>
          <span className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-200/70">
            MAO Talacogon
          </span>
          {/* Municipal Logo placeholder */}
          <div className="w-16 h-16 rounded-full bg-emerald-800 border-2 border-emerald-500/40 flex items-center justify-center shadow-lg">
            <span className="text-xl font-black text-emerald-300">GIS</span>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl text-center my-10">
          {/* Sprout Icon */}
          <div className="mb-8 p-6 rounded-full bg-emerald-900/50 border border-emerald-500/30 shadow-inner animate-pulse">
            <svg
              className="w-24 h-24 text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight uppercase">
            GIS-Based Crop Management <br />
            <span className="text-emerald-400">Information System</span>
          </h1>
          <p className="mt-4 text-emerald-100/70 text-sm md:text-base max-w-lg font-medium">
            Municipal Agriculture Office Crop Field &amp; AID Allocation Directory
          </p>
        </div>

        {/* Continue trigger */}
        <div className="w-full max-w-xs mb-10">
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold uppercase tracking-wider text-sm shadow-xl transition-all active:scale-95 duration-200"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Credentials Entry Form View
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-[2.5rem] border border-zinc-800 bg-zinc-900 shadow-2xl p-8 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setShowForm(false)}
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
            Staff Portal
          </span>
        </div>

        <div className="text-left mb-6">
          <h2 className="text-2xl font-black text-white">Sign In</h2>
          <p className="mt-1 text-sm text-zinc-400">Enter your credentials to access the GIS suite.</p>
        </div>

        {!supabaseConfig.isConfigured ? (
          <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
            {getSupabaseConfigError()}
          </div>
        ) : null}

        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              inputMode="email"
              className="mt-2 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-emerald-500"
              placeholder="admin@mao-talacogon.gov.ph"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider" htmlFor="password">
              Security Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="mt-2 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-emerald-500"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3.5 text-sm text-rose-300">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || !supabaseConfig.isConfigured}
            className="w-full mt-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 py-3.5 text-sm font-bold uppercase tracking-wider text-zinc-950 shadow-lg shadow-emerald-500/10 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {loading ? "Verifying..." : "Access System"}
          </button>
        </form>
      </div>
    </div>
  );
}
