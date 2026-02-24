import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ACCESS_TOKEN } from "../constants";

function ProtectedRoute({ children, requiredRole, requiredLevel }) {
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) {
        setIsAuthorized(false);
        return;
      }
      setIsAuthorized(true);
    };
    checkAuth();
  }, []);

  if (isAuthorized === null) return null;

  const token = localStorage.getItem(ACCESS_TOKEN);
  if (!token) return <Navigate to="/login" />;

  const decoded = jwtDecode(token);

  let userRole = decoded.role;
  if (userRole === "TECHNICIAN") userRole = "TECH";

  const userLevel =
    decoded.tech_level || decoded.techlevel || decoded.tech_Rank;

  console.log("SHIELD STATUS:", {
    role: userRole,
    level: userLevel,
    reqRole: requiredRole,
    reqLevel: requiredLevel,
  });

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" />;
  }

  if (requiredLevel && userLevel !== requiredLevel) {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;