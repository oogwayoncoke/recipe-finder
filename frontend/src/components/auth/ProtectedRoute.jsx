import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Wraps any route that requires auth.
 * Redirects to /login and preserves the attempted path so the
 * user lands back where they were after logging in.
 *
 * Usage in router:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/discover" element={<Discover />} />
 *     <Route path="/profile"  element={<Profile />} />
 *   </Route>
 */
export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111110] flex items-center justify-center">
        <span className="font-mono text-xs text-[#6b6b67] tracking-widest">
          authenticating...
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
