import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthForm() {
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [fields, setFields] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSub] = useState(false);
  const [registered, setReg] = useState(false);

  const { login, register } = useAuth();
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
    setFields({ username: "", email: "", password: "", password2: "" });
  }

  function parseErrors(raw) {
    if (typeof raw === "string") return { non_field_errors: raw };
    const flat = {};
    for (const [k, v] of Object.entries(raw)) {
      flat[k] = Array.isArray(v) ? v[0] : String(v);
    }
    return flat;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSub(true);
    setErrors({});
    try {
      if (mode === "login") {
        await login(fields.username, fields.password);
        navigate(from, { replace: true });
      } else {
        await register({
          username: fields.username,
          email: fields.email,
          password: fields.password,
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

  // ── Post-register: check your email ──────────────────────────────────────
  if (registered) {
    return (
      <Page>
        <Logo />
        <div className="mt-8 bg-[#1a1a18] border border-[#2e2e2b] rounded-md p-8 text-center animate-fade-up">
          <div className="text-3xl mb-3 opacity-50">✉</div>
          <h2 className="font-serif text-xl text-[#e8e6e0] mb-2">
            Check your email
          </h2>
          <p className="text-sm text-[#6b6b67] font-light leading-relaxed mb-5">
            We sent a verification link to{" "}
            <span className="text-[#a8a6a0]">{fields.email}</span>.
            <br />
            Click it to activate your account.
          </p>
          <button
            onClick={() => switchMode("login")}
            className="font-mono text-xs text-[#6b6b67] hover:text-[#a8a6a0] transition-colors tracking-wide"
          >
            Back to login →
          </button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <Logo />
      <p className="font-mono text-[0.68rem] text-[#6b6b67] tracking-widest mb-8">
        // find what to cook, tonight
      </p>

      {/* Tabs */}
      <div className="flex border-b border-[#2e2e2b] mb-7">
        {["login", "register"].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={[
              "px-5 py-2.5 text-sm font-sans -mb-px border-b-2 transition-colors duration-150",
              mode === m
                ? "text-[#e8e6e0] border-[#d4a843]"
                : "text-[#6b6b67] border-transparent hover:text-[#a8a6a0]",
            ].join(" ")}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
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
          id="password"
          type="password"
          value={fields.password}
          onChange={(v) => set("password", v)}
          error={errors.password}
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
          <div className="bg-[#c0574a]/10 border border-[#c0574a]/30 text-[#c0574a] font-mono text-xs px-3.5 py-2.5 rounded-md tracking-wide">
            {errors.non_field_errors}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 bg-[#d4a843] text-[#111110] font-mono text-[0.8rem] font-medium tracking-wider px-4 py-3 rounded-md hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {submitting
            ? "working..."
            : mode === "login"
              ? "Login →"
              : "Create account →"}
        </button>
      </form>

      {mode === "login" && (
        <button
          type="button"
          className="mt-4 font-mono text-[0.72rem] text-[#6b6b67] hover:text-[#a8a6a0] transition-colors tracking-wide"
        >
          Forgot password?
        </button>
      )}
    </Page>
  );
}

// ── Shared layout ─────────────────────────────────────────────────────────────
function Page({ children }) {
  return (
    <div className="min-h-screen bg-[#111110] flex items-center justify-center p-8">
      <div className="w-full max-w-sm animate-fade-up">{children}</div>
    </div>
  );
}

function Logo() {
  return (
    <div className="font-serif text-[2rem] text-[#e8e6e0] tracking-tight leading-none mb-1">
      di<span className="text-[#d4a843] italic">sh</span>
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, id, type, value, onChange, error, autoComplete }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="font-mono text-[0.65rem] text-[#6b6b67] uppercase tracking-widest"
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
        className={[
          "bg-[#1a1a18] border rounded-md px-3.5 py-2.5",
          "text-[#e8e6e0] text-sm font-light font-sans",
          "outline-none placeholder-[#3e3e3b]",
          "transition-colors duration-150",
          error
            ? "border-[#c0574a] focus:border-[#c0574a]"
            : "border-[#2e2e2b] focus:border-[#8a6e2a]",
        ].join(" ")}
      />
      {error && (
        <span className="font-mono text-[0.65rem] text-[#c0574a] tracking-wide">
          {error}
        </span>
      )}
    </div>
  );
}
