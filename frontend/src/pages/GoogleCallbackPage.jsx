import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export default function GoogleCallbackPage() {
  const [error, setError] = useState(null);
  const { loginWithTokens } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function handleCallback() {
      // Google returns access_token in the URL hash fragment
      // e.g. /auth/google/callback#access_token=ya29...&token_type=Bearer
      const hash = window.location.hash.slice(1);
      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");

      if (!access_token) {
        setError("No token returned from Google.");
        return;
      }

      try {
        const res = await fetch(`${API}/authentication/google/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Google login failed.");

        loginWithTokens(data.access, data.refresh);

        const destination =
          sessionStorage.getItem("google_auth_from") ?? "/discover";
        sessionStorage.removeItem("google_auth_from");
        navigate(destination, { replace: true });
      } catch (e) {
        setError(e.message);
      }
    }

    handleCallback();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
      }}
    >
      {error ? (
        <>
          <div
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: "0.75rem",
              color: "var(--error)",
              letterSpacing: "0.05em",
            }}
          >
            {error}
          </div>
          <button
            onClick={() => navigate("/login")}
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: "0.72rem",
              color: "var(--text-dim)",
              background: "none",
              border: "none",
              cursor: "pointer",
              letterSpacing: "0.05em",
            }}
          >
            ← back to login
          </button>
        </>
      ) : (
        <>
          {/* Minimal spinner */}
          <div
            style={{
              width: "1.25rem",
              height: "1.25rem",
              border: "2px solid var(--border)",
              borderTopColor: "var(--accent)",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <div
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: "0.72rem",
              color: "var(--text-dim)",
              letterSpacing: "0.08em",
            }}
          >
            signing you in…
          </div>
        </>
      )}
    </div>
  );
}
