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

  // ─── Splash / Landing Page ─────────────────────────────────────────────────
  if (!showForm) {
    return (
      <div
        className="relative flex min-h-screen flex-col overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at 60% 40%, rgba(255,255,255,0.95) 0%, rgba(200,230,200,0.85) 35%, rgba(100,170,100,0.70) 70%, rgba(60,120,60,0.90) 100%)",
        }}
      >
        {/* Subtle inner light bloom */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 55% 38%, rgba(255,255,255,0.55) 0%, transparent 55%)",
          }}
        />

        {/* ── Top Bar ────────────────────────────────────────────────────────── */}
        <div className="relative z-10 flex items-center justify-between px-8 pt-6 md:px-14 md:pt-8">
          {/* Left Seal – Agusan del Sur */}
          <img
            src="/logos/agusan-del-sur-seal.png"
            alt="Agusan del Sur Seal"
            className="h-[72px] w-[72px] object-contain drop-shadow-md"
          />

          {/* Center Title */}
          <h2
            className="text-center text-lg font-black tracking-widest md:text-2xl"
            style={{ color: "#1a6e2a", textShadow: "0 1px 2px rgba(0,0,0,0.12)" }}
          >
            MAO Talacogon
          </h2>

          {/* Right Seal – Department of Agriculture */}
          <img
            src="/logos/da-philippines-seal.png"
            alt="Department of Agriculture Philippines"
            className="h-[72px] w-[72px] object-contain drop-shadow-md"
          />
        </div>

        {/* ── Hero Content ───────────────────────────────────────────────────── */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-10">
          <div className="flex w-full max-w-3xl items-center gap-6 md:gap-10">
            {/* Sprout Illustration */}
            <div className="flex-shrink-0">
              <svg
                viewBox="0 0 120 120"
                className="h-36 w-36 drop-shadow-xl md:h-48 md:w-48"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Soil mound */}
                <ellipse cx="60" cy="102" rx="38" ry="12" fill="#7bb36a" opacity="0.6" />
                {/* Stem */}
                <path
                  d="M60 100 Q58 80 60 55"
                  stroke="#3a8c2a"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Left leaf */}
                <path
                  d="M60 70 Q35 55 30 30 Q55 38 60 62"
                  fill="#4caf50"
                  stroke="#2e7d32"
                  strokeWidth="1.5"
                />
                {/* Right leaf */}
                <path
                  d="M60 55 Q85 38 92 15 Q68 24 60 50"
                  fill="#66bb6a"
                  stroke="#388e3c"
                  strokeWidth="1.5"
                />
                {/* Leaf veins */}
                <path d="M60 70 Q43 57 32 31" stroke="#2e7d32" strokeWidth="0.8" fill="none" opacity="0.6" />
                <path d="M60 55 Q79 40 91 16" stroke="#388e3c" strokeWidth="0.8" fill="none" opacity="0.6" />
              </svg>
            </div>

            {/* Title Block */}
            <div className="flex-1">
              <h1
                className="font-black uppercase leading-tight tracking-wide"
                style={{
                  fontSize: "clamp(1.5rem, 4vw, 2.8rem)",
                  color: "#1a6e2a",
                  textShadow: "0 2px 4px rgba(0,0,0,0.10)",
                  fontFamily: "'Impact', 'Arial Black', sans-serif",
                  letterSpacing: "0.04em",
                }}
              >
                GIS-BASED CROP MANAGEMENT
                <br />
                INFORMATION SYSTEM
              </h1>
              {/* Green underline */}
              <div
                className="mt-3 h-[4px] rounded-full"
                style={{
                  background: "linear-gradient(90deg, #1a6e2a 0%, #4caf50 60%, transparent 100%)",
                  width: "90%",
                }}
              />
            </div>
          </div>

          {/* Continue Button */}
          <button
            onClick={() => setShowForm(true)}
            className="mt-16 rounded-xl px-12 py-4 text-sm font-black uppercase tracking-[0.22em] text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-100"
            style={{
              background: "linear-gradient(135deg, #1a6e2a 0%, #2e7d32 50%, #388e3c 100%)",
              boxShadow: "0 8px 24px -6px rgba(30,100,40,0.45)",
            }}
          >
            Continue
          </button>
        </div>

        {/* Bottom credit */}
        <p
          className="relative z-10 pb-4 text-center text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: "rgba(30,80,30,0.55)" }}
        >
          Municipal Agriculture Office · Talacogon, Agusan del Sur
        </p>
      </div>
    );
  }

  // ─── Login Form ────────────────────────────────────────────────────────────
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-10"
      style={{
        background:
          "radial-gradient(ellipse at 60% 40%, rgba(255,255,255,0.95) 0%, rgba(200,230,200,0.85) 35%, rgba(100,170,100,0.70) 70%, rgba(60,120,60,0.90) 100%)",
      }}
    >
      {/* Inner light bloom */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 55% 38%, rgba(255,255,255,0.50) 0%, transparent 55%)",
        }}
      />

      <div
        className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl shadow-2xl"
        style={{
          background: "rgba(255,255,255,0.30)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(60,140,60,0.25)",
          boxShadow: "0 32px 80px -20px rgba(30,100,30,0.30)",
        }}
      >
        {/* Modal Header strip */}
        <div
          className="px-8 py-6"
          style={{
            background: "linear-gradient(135deg, rgba(26,110,42,0.15) 0%, rgba(76,175,80,0.08) 100%)",
            borderBottom: "1px solid rgba(60,140,60,0.15)",
          }}
        >
          <div className="mb-1 flex items-center justify-between">
            <button
              onClick={() => setShowForm(false)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition hover:bg-white/30"
              style={{ color: "#1a6e2a" }}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <span
              className="text-[10px] font-bold uppercase tracking-[0.28em]"
              style={{ color: "#1a6e2a" }}
            >
              Staff Portal
            </span>
          </div>

          <h2
            className="mt-3 text-2xl font-black uppercase tracking-wider"
            style={{ color: "#1a6e2a" }}
          >
            Sign In
          </h2>
          <p className="mt-1 text-xs font-medium" style={{ color: "rgba(30,80,30,0.65)" }}>
            Enter your credentials to access the GIS suite.
          </p>
        </div>

        {/* Form Body */}
        <div className="px-8 py-7">
          {!supabaseConfig.isConfigured ? (
            <div className="mb-5 rounded-2xl border border-amber-400/30 bg-amber-50/70 px-4 py-3 text-xs text-amber-700">
              {getSupabaseConfigError()}
            </div>
          ) : null}

          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div>
              <label
                className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{ color: "#1a6e2a" }}
                htmlFor="email"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                inputMode="email"
                placeholder="admin@mao-talacogon.gov.ph"
                disabled={loading}
                className="w-full rounded-2xl border px-4 py-3 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-400 disabled:opacity-60"
                style={{
                  background: "rgba(255,255,255,0.70)",
                  borderColor: "rgba(60,140,60,0.30)",
                  backdropFilter: "blur(8px)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#1a6e2a")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(60,140,60,0.30)")}
              />
            </div>

            <div>
              <label
                className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{ color: "#1a6e2a" }}
                htmlFor="password"
              >
                Security Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                disabled={loading}
                className="w-full rounded-2xl border px-4 py-3 text-sm text-zinc-800 outline-none transition placeholder:text-zinc-400 disabled:opacity-60"
                style={{
                  background: "rgba(255,255,255,0.70)",
                  borderColor: "rgba(60,140,60,0.30)",
                  backdropFilter: "blur(8px)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#1a6e2a")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(60,140,60,0.30)")}
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-300/50 bg-red-50/70 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading || !supabaseConfig.isConfigured}
              className="mt-1 w-full rounded-2xl py-3.5 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-100 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #1a6e2a 0%, #2e7d32 50%, #388e3c 100%)",
                boxShadow: "0 8px 24px -6px rgba(30,100,40,0.45)",
              }}
            >
              {loading ? "Verifying..." : "Access System"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
