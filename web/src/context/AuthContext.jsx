import { createContext, useContext, useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";
const AuthContext = createContext();

function decodeToken(token) {
  return JSON.parse(atob(token.split(".")[1]));
}

function userFromPayload(payload) {
  return {
    uuid: payload.user_id,
    username: payload.username,
    email: payload.email,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) {
      try {
        const payload = decodeToken(token);
        if (payload.exp * 1000 > Date.now()) {
          setUser(userFromPayload(payload));
        } else {
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
        }
      } catch {
        localStorage.removeItem("access");
      }
    }
    setLoading(false);
  }, []);

  // Called after receiving tokens from any source (password or Google)
  function loginWithTokens(access, refresh) {
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);
    setUser(userFromPayload(decodeToken(access)));
  }

  async function login(identifier, password) {
    const isEmail = identifier.includes("@");
    const res = await fetch(`${API}/authentication/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        [isEmail ? "email" : "username"]: identifier,
        password,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    loginWithTokens(data.access, data.refresh);
  }

  async function register(fields) {
    const res = await fetch(`${API}/authentication/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    const data = await res.json();
    if (!res.ok) throw data;
  }

  function logout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, loginWithTokens, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
