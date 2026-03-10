import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

const API = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api";

function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

function isExpired(payload) {
  if (!payload?.exp) return true;
  return payload.exp * 1000 < Date.now();
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Build user object from token payload
  function userFromPayload(payload, fallbackEmail = null) {
    return {
      uuid: payload.user_id,
      username: payload.username,
      email: payload.email ?? fallbackEmail,
    };
  }

  // On mount — restore session from stored tokens
  useEffect(() => {
    const access = localStorage.getItem("access");
    const refresh = localStorage.getItem("refresh");

    if (!access) {
      setLoading(false);
      return;
    }

    const payload = decodeToken(access);

    if (!isExpired(payload)) {
      setUser(userFromPayload(payload));
      setUser(userFromPayload(payload));
      setLoading(false);
      return;
    }

    // Access expired — try silent refresh
    if (refresh) {
      axios
        .post(`${API}/authentication/token/refresh/`, { refresh })
        .then(({ data }) => {
          localStorage.setItem("access", data.access);
          const newPayload = decodeToken(data.access);
          if (newPayload) setUser(userFromPayload(newPayload));
        })
        .catch(() => {
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (identifier, password) => {
    // Accept email or username — backend resolves either
    const isEmail = identifier.includes("@");
    const response = await axios.post(
      `${API}/authentication/token/`,
      isEmail
        ? { email: identifier, password }
        : { username: identifier, password },
    );

    const { access, refresh } = response.data;
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);

    const payload = decodeToken(access);
    const userData = userFromPayload(payload, isEmail ? identifier : null);
    setUser(userData);
    return userData;
  };

  const register = async (userData) => {
    return axios.post(`${API}/authentication/register/`, userData);
  };

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);