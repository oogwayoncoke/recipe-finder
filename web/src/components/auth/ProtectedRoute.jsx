import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Routes that guests (unauthenticated users) can access
const GUEST_ALLOWED = ["/discover"];

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "var(--bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.6875rem",
            color: "var(--text-dim)",
            letterSpacing: "0.1em",
          }}
        >
          authenticating...
        </span>
      </div>
    );
  }

  // Allow guests on certain routes
  if (!user && GUEST_ALLOWED.includes(location.pathname)) {
    return <Outlet />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
