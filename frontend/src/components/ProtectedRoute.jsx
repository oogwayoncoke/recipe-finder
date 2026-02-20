import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";

function ProtectedRoute({ children, requiredRole }) {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN);

      if (!token) {
        setIsAuthorized(false);
        return;
      }

      const decoded = jwtDecode(token);
      const role = decoded.role;
      setUserRole(role);

      const tokenExpiration = decoded.exp;
      const now = Date.now() / 1000;

      if (tokenExpiration < now) {
        const refreshTokenValue = localStorage.getItem(REFRESH_TOKEN);
        try {
          const res = await api.post("/api/token/refresh/", {
            refresh: refreshTokenValue,
          });
          if (res.status === 200) {
            const newAccessToken = res.data.access;
            localStorage.setItem(ACCESS_TOKEN, newAccessToken);

            const newDecoded = jwtDecode(newAccessToken);
            setUserRole(newDecoded.role);
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
          }
        } catch (error) {
          console.error("Token refresh failed:", error);
          setIsAuthorized(false);
        }
      } else {
        setIsAuthorized(true);
      }
    };

    checkAuth().catch(() => setIsAuthorized(false));
  }, []);

  if (isAuthorized === null) {
    return (
      <div className="flex h-screen justify-center items-center bg-[#0f1115]">
        <div className="flex flex-col items-center gap-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c5a059] opacity-40"></div>
          <div className="text-center">
            <h1 className="text-[#c5a059] text-xl font-serif tracking-[0.3em] uppercase mb-1">
              Shepherd
            </h1>
            <p className="text-[#c5a059] text-[10px] uppercase tracking-[0.2em] font-serif italic opacity-70">
              Consulting the Ledger...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && userRole !== requiredRole) {
    console.warn(
      `Access denied: Required ${requiredRole}, but found ${userRole}`,
    );
    return <Navigate to="/" />; // Redirect technicians back to the main dashboard
  }

  return children;
}

export default ProtectedRoute;
