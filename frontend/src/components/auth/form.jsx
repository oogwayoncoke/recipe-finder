import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function AuthForm({ initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [fields, setFields] = useState({
    username: "",
    email: "",
    password1: "",
    password2: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSub] = useState(false);
  const [googleLoading, setGL] = useState(false);
  const [registered, setReg] = useState(false);

  const { login, register, loginWithTokens } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? "/discover";

  function set(key, val) {
    setFields((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined, non_field_errors: undefined }));
  }

  function switchMode(m) {
    setMode(m);
    setErrors({});
    setFields({ username: "", email: "", password1: "", password2: "" });
  }

  function parseErrors(raw) {
    if (typeof raw === "string") return { non_field_errors: raw };
    const flat = {};
    for (const [k, v] of Object.entries(raw))
      flat[k] = Array.isArray(v) ? v[0] : String(v);
    return flat;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSub(true);
    setErrors({});
    try {
      if (mode === "login") {
        await login(fields.username, fields.password1);
        navigate(from, { replace: true });
      } else {
        await register({
          username: fields.username,
          email: fields.email,
          password1: fields.password1,
          password2: fields.password2,
        });
        setReg(true);
      }
    } catch (err) {
      setErrors(parseErrors(err));
    } finally {
      setSub(false);
    }
  }

  // ── Google OAuth (redirect flow — no popup, works on mobile) ────────────
  function handleGoogleClick() {
    if (!GOOGLE_CLIENT_ID) {
      setErrors({ non_field_errors: "Google login is not configured." });
      return;
    }
    sessionStorage.setItem("google_auth_from", from);
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: window.location.origin + "/auth/google/callback",
      response_type: "token",
      scope: "openid email profile",
      prompt: "select_account",
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async function _sendGoogleToken(access_token) {
    try {
      const res = await fetch(`${API}/authentication/google/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Google login failed.");
      loginWithTokens(data.access, data.refresh);
      navigate(from, { replace: true });
    } catch (e) {
      setErrors({ non_field_errors: e.message });
    } finally {
      setGL(false);
    }
  }

  // ── Post-register ─────────────────────────────────────────────────────────
  if (registered) {
    return (
      <Page>
        <Logo />
        <div style={cardStyle}>
          <div
            style={{ fontSize: "2rem", marginBottom: "0.75rem", opacity: 0.5 }}
          >
            ✉
          </div>
          <h2
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: "1.25rem",
              color: "var(--text)",
              marginBottom: "0.5rem",
            }}
          >
            Check your email
          </h2>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--text-dim)",
              fontWeight: 300,
              lineHeight: 1.6,
              marginBottom: "1.25rem",
            }}
          >
            We sent a verification link to{" "}
            <span style={{ color: "var(--text-muted)" }}>{fields.email}</span>.
          </p>
          <button onClick={() => switchMode("login")} style={ghostBtnStyle}>
            Back to login →
          </button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <Logo />
      <p
        style={{
          fontFamily: '"DM Mono", monospace',
          fontSize: "0.68rem",
          color: "var(--text-dim)",
          letterSpacing: "0.1em",
          marginBottom: "2rem",
        }}
      >
        // find what to cook, tonight
      </p>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border)",
          marginBottom: "1.75rem",
        }}
      >
        {["login", "register"].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            style={{
              padding: "0.625rem 1.25rem",
              fontFamily: '"DM Sans", sans-serif',
              fontSize: "0.875rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              borderBottom:
                mode === m
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
              color: mode === m ? "var(--text)" : "var(--text-dim)",
              marginBottom: "-1px",
              transition: "color 0.15s",
            }}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* Google button */}
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={googleLoading}
        style={{
          width: "100%",
          padding: "0.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.625rem",
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "0.375rem",
          cursor: googleLoading ? "not-allowed" : "pointer",
          opacity: googleLoading ? 0.6 : 1,
          fontFamily: '"DM Sans", sans-serif',
          fontSize: "0.875rem",
          fontWeight: 400,
          color: "var(--text)",
          marginBottom: "1.25rem",
          transition: "border-color 0.15s, background-color 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--border-2)";
          e.currentTarget.style.backgroundColor = "var(--bg-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.backgroundColor = "var(--bg-card)";
        }}
      >
        {googleLoading ? (
          <span
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: "0.75rem",
              color: "var(--text-dim)",
            }}
          >
            connecting…
          </span>
        ) : (
          <>
            <GoogleIcon />
            Continue with Google
          </>
        )}
      </button>

      {/* Divider */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1.25rem",
        }}
      >
        <div
          style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }}
        />
        <span
          style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: "0.65rem",
            color: "var(--text-dim)",
            letterSpacing: "0.08em",
          }}
        >
          or
        </span>
        <div
          style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }}
        />
      </div>

      {/* Password form */}
      <form
        onSubmit={handleSubmit}
        noValidate
        style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
      >
        <Field
          label="username"
          id="username"
          type="text"
          value={fields.username}
          onChange={(v) => set("username", v)}
          error={errors.username}
          autoComplete="username"
        />

        {mode === "register" && (
          <Field
            label="email"
            id="email"
            type="email"
            value={fields.email}
            onChange={(v) => set("email", v)}
            error={errors.email}
            autoComplete="email"
          />
        )}

        <Field
          label="password"
          id="password1"
          type="password"
          value={fields.password1}
          onChange={(v) => set("password1", v)}
          error={errors.password1}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />

        {mode === "register" && (
          <Field
            label="confirm password"
            id="password2"
            type="password"
            value={fields.password2}
            onChange={(v) => set("password2", v)}
            error={errors.password2}
            autoComplete="new-password"
          />
        )}

        {errors.non_field_errors && (
          <div
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--error) 10%, transparent)",
              border:
                "1px solid color-mix(in srgb, var(--error) 30%, transparent)",
              color: "var(--error)",
              fontFamily: '"DM Mono", monospace',
              fontSize: "0.72rem",
              padding: "0.625rem 0.875rem",
              borderRadius: "0.375rem",
            }}
          >
            {errors.non_field_errors}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: "0.25rem",
            backgroundColor: "var(--accent)",
            color: "#111110",
            fontFamily: '"DM Mono", monospace',
            fontSize: "0.8rem",
            fontWeight: 500,
            letterSpacing: "0.06em",
            padding: "0.75rem",
            borderRadius: "0.375rem",
            border: "none",
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.4 : 1,
            transition: "opacity 0.15s",
          }}
        >
          {submitting
            ? "working…"
            : mode === "login"
              ? "Login →"
              : "Create account →"}
        </button>
      </form>

      {mode === "login" && (
        <button type="button" style={{ ...ghostBtnStyle, marginTop: "1rem" }}>
          Forgot password?
        </button>
      )}
    </Page>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────
function Page({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "22rem" }}>{children}</div>
    </div>
  );
}

function Logo() {
  return (
    <div
      style={{
        fontFamily: '"DM Serif Display", serif',
        fontSize: "2rem",
        color: "var(--text)",
        letterSpacing: "-0.02em",
        lineHeight: 1,
        marginBottom: "0.25rem",
      }}
    >
      di<span style={{ color: "var(--accent)", fontStyle: "italic" }}>sh</span>
    </div>
  );
}

function Field({ label, id, type, value, onChange, error, autoComplete }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <label
        htmlFor={id}
        style={{
          fontFamily: '"DM Mono", monospace',
          fontSize: "0.65rem",
          color: "var(--text-dim)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        spellCheck={false}
        style={{
          backgroundColor: "var(--bg-input)",
          border: `1px solid ${error ? "var(--error)" : "var(--border)"}`,
          borderRadius: "0.375rem",
          padding: "0.625rem 0.875rem",
          color: "var(--text)",
          fontSize: "0.875rem",
          fontWeight: 300,
          fontFamily: '"DM Sans", sans-serif',
          outline: "none",
          transition: "border-color 0.15s",
        }}
        onFocus={(e) =>
          (e.target.style.borderColor = error
            ? "var(--error)"
            : "var(--accent-dim)")
        }
        onBlur={(e) =>
          (e.target.style.borderColor = error
            ? "var(--error)"
            : "var(--border)")
        }
      />
      {error && (
        <span
          style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: "0.65rem",
            color: "var(--error)",
            letterSpacing: "0.05em",
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

const cardStyle = {
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "0.375rem",
  padding: "2rem",
  textAlign: "center",
  marginTop: "2rem",
};

const ghostBtnStyle = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontFamily: '"DM Mono", monospace',
  fontSize: "0.72rem",
  color: "var(--text-dim)",
  letterSpacing: "0.05em",
  transition: "color 0.15s",
};
