import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
          Checking session...
        </div>
      </div>
    );
  }

  if (!session) {
    if (window.self !== window.top) {
      // If the app is embedded, force the browser top-level window to leave the frame.
      window.top?.location.replace(`${window.location.origin}/login`);
      return null;
    }

    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
