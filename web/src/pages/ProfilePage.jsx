import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api";
import Navbar from "../components/layout/Navbar";

const DIET_OPTIONS = [
  { label: "Vegan", value: "vegan" },
  { label: "Vegetarian", value: "vegetarian" },
  { label: "Keto", value: "keto" },
  { label: "Paleo", value: "paleo" },
  { label: "Gluten Free", value: "gluten free" },
  { label: "Halal", value: "halal" },
  { label: "Kosher", value: "kosher" },
  { label: "Pescetarian", value: "pescetarian" },
];

const ALLERGY_OPTIONS = [
  { label: "Dairy", value: "dairy" },
  { label: "Eggs", value: "eggs" },
  { label: "Gluten", value: "gluten" },
  { label: "Peanuts", value: "peanuts" },
  { label: "Sesame", value: "sesame" },
  { label: "Shellfish", value: "shellfish" },
  { label: "Soy", value: "soy" },
  { label: "Tree Nuts", value: "tree nuts" },
  { label: "Wheat", value: "wheat" },
];

const API = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

const INPUT = {
  width: "100%",
  boxSizing: "border-box",
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: "0.25rem",
  padding: "0.5625rem 0.875rem",
  color: "var(--text)",
  fontFamily: "Inter, sans-serif",
  fontSize: "0.875rem",
  outline: "none",
  transition: "border-color 0.15s",
};


// ── Password reset panel ──────────────────────────────────────────────────────
function PasswordResetPanel({ email }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  async function handleReset() {
    setSending(true);
    setError(null);
    try {
      const token = localStorage.getItem("access");
      const res = await fetch(`${API}/authentication/password-reset/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setSent(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div
        style={{
          padding: "0.875rem 1rem",
          borderRadius: "0.25rem",
          border:
            "1px solid color-mix(in srgb, var(--success) 30%, transparent)",
          background: "color-mix(in srgb, var(--success) 8%, transparent)",
        }}
      >
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.8rem",
            color: "var(--success)",
            marginBottom: "0.25rem",
          }}
        >
          ✓ Reset link sent
        </p>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.72rem",
            color: "var(--text-dim)",
            lineHeight: 1.5,
          }}
        >
          Check <span style={{ color: "var(--text-muted)" }}>{email}</span> for
          a password reset link. It expires in 24 hours.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
      <p
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "0.8rem",
          color: "var(--text-muted)",
          lineHeight: 1.6,
        }}
      >
        We'll send a reset link to{" "}
        <span style={{ color: "var(--text)" }}>{email}</span>.
      </p>
      {error && (
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.72rem",
            color: "var(--error)",
          }}
        >
          ✕ {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleReset}
        disabled={sending}
        style={{
          alignSelf: "flex-start",
          padding: "0.5rem 1.25rem",
          borderRadius: "0.25rem",
          border: "1px solid var(--border-2)",
          background: "var(--bg-card)",
          color: sending ? "var(--text-dim)" : "var(--text-muted)",
          fontFamily: "Inter, sans-serif",
          fontSize: "0.75rem",
          letterSpacing: "0.03em",
          cursor: sending ? "not-allowed" : "pointer",
          opacity: sending ? 0.5 : 1,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          if (!sending) {
            e.currentTarget.style.borderColor = "var(--error)";
            e.currentTarget.style.color = "var(--error)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border-2)";
          e.currentTarget.style.color = "var(--text-muted)";
        }}
      >
        {sending ? "Sending…" : "Send reset link →"}
      </button>
    </div>
  );
}

// ── Pill toggle grid ──────────────────────────────────────────────────────────
function OptionGrid({ options, selected, onToggle, accent = false }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            type="button"
            key={opt.value}
            onClick={() => onToggle(opt.value)}
            style={{
              padding: "0.4375rem 1rem",
              borderRadius: "999px",
              border: active
                ? `1px solid color-mix(in srgb, ${accent ? "var(--accent)" : "var(--error)"} 55%, transparent)`
                : "1px solid var(--border-2)",
              background: active
                ? `color-mix(in srgb, ${accent ? "var(--accent)" : "var(--error)"} 10%, transparent)`
                : "var(--bg-card)",
              color: active
                ? accent
                  ? "var(--accent)"
                  : "var(--error)"
                : "var(--text-muted)",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              fontSize: "0.8rem",
              fontWeight: active ? 500 : 400,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Section wrapper — NO animation to avoid invisible elements ────────────────
function Section({ label, children }) {
  return (
    <div style={{ marginBottom: "2.25rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          marginBottom: "0.875rem",
        }}
      >
        <div
          style={{
            width: "3px",
            height: "0.75rem",
            borderRadius: "2px",
            backgroundColor: "var(--accent)",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.6rem",
            letterSpacing: "0.14em",
            color: "var(--text-dim)",
          }}
        >
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

// ── Shimmer skeleton ──────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div>
      <style>{`
        @keyframes pfShimmer {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        .pfsk {
          background: linear-gradient(90deg, var(--bg-card) 25%, var(--bg-hover) 50%, var(--bg-card) 75%);
          background-size: 600px 100%;
          animation: pfShimmer 1.5s ease-in-out infinite;
          border-radius: 0.25rem;
        }
      `}</style>
      <div
        style={{
          display: "flex",
          gap: "1.5rem",
          alignItems: "flex-end",
          paddingBottom: "2rem",
          marginBottom: "2.25rem",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          className="pfsk"
          style={{ width: 80, height: 80, borderRadius: "50%", flexShrink: 0 }}
        />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "0.625rem",
          }}
        >
          <div className="pfsk" style={{ width: "30%", height: "0.55rem" }} />
          <div className="pfsk" style={{ width: "50%", height: "1.5rem" }} />
          <div className="pfsk" style={{ width: "40%", height: "0.65rem" }} />
        </div>
      </div>
      {[55, 100, 120, 110, 80].map((h, i) => (
        <div key={i} style={{ marginBottom: "2.25rem" }}>
          <div
            className="pfsk"
            style={{ width: 80, height: "0.55rem", marginBottom: "0.875rem" }}
          />
          <div className="pfsk" style={{ width: "100%", height: h }} />
        </div>
      ))}
    </div>
  );
}

// ── Avatar uploader ───────────────────────────────────────────────────────────
function AvatarUploader({ avatarUrl, initial, onUploaded, onRemoved }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [hover, setHover] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("avatar", file);
    try {
      const res = await api.post("/profiles/me/avatar/", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUploaded(res.data.avatar_url);
    } catch {
      // silently ignore
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove(e) {
    e.stopPropagation();
    setRemoving(true);
    try {
      await api.delete("/profiles/me/avatar/");
      onRemoved();
    } catch {
      // silently ignore
    } finally {
      setRemoving(false);
    }
  }

  const busy = uploading || removing;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.5rem",
        flexShrink: 0,
      }}
    >
      <div
        style={{ position: "relative", cursor: busy ? "default" : "pointer" }}
        onClick={() => !busy && inputRef.current?.click()}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="avatar"
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid var(--border-2)",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              backgroundColor: "var(--bg-card)",
              border: "2px solid var(--border-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "2rem",
                fontWeight: 300,
                color: "var(--accent)",
                lineHeight: 1,
              }}
            >
              {initial}
            </span>
          </div>
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            backgroundColor: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: hover || busy ? 1 : 0,
            transition: "opacity 0.15s",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.6rem",
              color: "#fff",
              letterSpacing: "0.06em",
            }}
          >
            {uploading ? "UPLOADING…" : removing ? "REMOVING…" : "CHANGE"}
          </span>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 3,
            right: 3,
            width: 11,
            height: 11,
            borderRadius: "50%",
            backgroundColor: "var(--accent)",
            border: "2px solid var(--bg)",
          }}
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={handleFile}
        />
      </div>
      {avatarUrl && (
        <button
          type="button"
          onClick={handleRemove}
          disabled={busy}
          style={{
            background: "none",
            border: "none",
            cursor: busy ? "not-allowed" : "pointer",
            fontFamily: "Inter, sans-serif",
            fontSize: "0.6rem",
            letterSpacing: "0.06em",
            color: "var(--error)",
            opacity: busy ? 0.4 : 0.7,
            transition: "opacity 0.15s",
            padding: 0,
          }}
          onMouseEnter={(e) => {
            if (!busy) e.currentTarget.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            if (!busy) e.currentTarget.style.opacity = "0.7";
          }}
        >
          remove photo
        </button>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [diets, setDiets] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);

  const usernameRef = useRef("");
  const bioRef = useRef("");
  const dietsRef = useRef([]);
  const allergiesRef = useRef([]);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    api
      .get("/profiles/me/")
      .then((res) => {
        if (cancelled) return;
        const d = res.data;

        const loadedUsername = d.username ?? "";
        const loadedBio = d.bio ?? "";
        const loadedDiets = (d.diets ?? []).map((x) => x.toLowerCase());
        const loadedAllergies = (d.allergies ?? []).map((x) => x.toLowerCase());

        setAvatarUrl(d.avatar_url ?? null);
        setUsername(loadedUsername);
        setEmail(d.email ?? "");
        setBio(loadedBio);
        setDiets(loadedDiets);
        setAllergies(loadedAllergies);
        setUpdatedAt(d.updated_at ?? null);

        usernameRef.current = loadedUsername;
        bioRef.current = loadedBio;
        dietsRef.current = loadedDiets;
        allergiesRef.current = loadedAllergies;
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("profile load error:", err);
        setMessage({ type: "error", text: "Failed to load profile." });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const initial = username?.[0]?.toUpperCase() ?? "?";

  const toggleDiet = useCallback((val) => {
    const next = dietsRef.current.includes(val)
      ? dietsRef.current.filter((v) => v !== val)
      : [...dietsRef.current, val];
    dietsRef.current = next;
    setDiets(next);
  }, []);

  const toggleAllergy = useCallback((val) => {
    const next = allergiesRef.current.includes(val)
      ? allergiesRef.current.filter((v) => v !== val)
      : [...allergiesRef.current, val];
    allergiesRef.current = next;
    setAllergies(next);
  }, []);

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setMessage(null);

    const payload = {
      username: usernameRef.current,
      bio: bioRef.current,
      diets: dietsRef.current,
      allergies: allergiesRef.current,
    };

    try {
      const res = await api.patch("profiles/me/", payload);
      const d = res.data;

      const savedUsername = d.username ?? usernameRef.current;
      const savedBio = d.bio ?? bioRef.current;

      setUsername(savedUsername);
      setBio(savedBio);
      usernameRef.current = savedUsername;
      bioRef.current = savedBio;
      setUpdatedAt(d.updated_at ?? updatedAt);
      setMessage({ type: "success", text: "Profile saved." });
    } catch (err) {
      console.error("PATCH error:", err?.response?.data ?? err);
      const detail = err.response?.data;
      const msg =
        typeof detail === "object"
          ? Object.values(detail).flat().join(" ")
          : "Failed to save. Please try again.";
      setMessage({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @keyframes pfFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pf-save:hover:not(:disabled) { opacity: 0.85; }
        .pf-save { transition: opacity 0.15s; }
      `}</style>

      <Navbar />

      <main
        style={{
          flex: 1,
          maxWidth: "640px",
          width: "100%",
          margin: "0 auto",
          padding: "3rem 2rem 0",
        }}
      >
        {loading ? (
          <Skeleton />
        ) : (
          <>
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div
              style={{
                animation: "pfFadeUp 0.4s ease both",
                display: "flex",
                alignItems: "flex-end",
                gap: "1.5rem",
                paddingBottom: "2rem",
                marginBottom: "2.25rem",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <AvatarUploader
                avatarUrl={avatarUrl}
                initial={initial}
                onUploaded={setAvatarUrl}
                onRemoved={() => setAvatarUrl(null)}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.6rem",
                    letterSpacing: "0.14em",
                    color: "var(--text-dim)",
                    marginBottom: "0.3rem",
                  }}
                >
                  PROFILE
                </div>
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "1.625rem",
                    fontWeight: 400,
                    color: "var(--text)",
                    lineHeight: 1.15,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {username || "—"}
                </div>
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.78rem",
                    color: "var(--text-dim)",
                    marginTop: "0.25rem",
                  }}
                >
                  {email}
                </div>
              </div>
              {updatedAt && (
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.6rem",
                    color: "var(--text-dim)",
                    letterSpacing: "0.06em",
                    flexShrink: 0,
                    alignSelf: "flex-start",
                    paddingTop: "0.25rem",
                  }}
                >
                  // updated{" "}
                  {new Date(updatedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              )}
            </div>

            {/* ── Username ───────────────────────────────────────────────── */}
            <Section label="USERNAME">
              <input
                value={username}
                maxLength={150}
                onChange={(e) => {
                  usernameRef.current = e.target.value;
                  setUsername(e.target.value);
                }}
                style={INPUT}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--accent-dim)")
                }
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </Section>

            {/* ── Bio ────────────────────────────────────────────────────── */}
            <Section label="BIO">
              <textarea
                value={bio}
                onChange={(e) => {
                  bioRef.current = e.target.value;
                  setBio(e.target.value);
                }}
                maxLength={300}
                rows={3}
                placeholder="Tell us a bit about yourself…"
                style={{
                  ...INPUT,
                  resize: "vertical",
                  lineHeight: 1.6,
                  padding: "0.625rem 0.875rem",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--accent-dim)")
                }
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.6rem",
                  color: "var(--text-dim)",
                  textAlign: "right",
                  marginTop: "0.25rem",
                }}
              >
                {bio.length} / 300
              </div>
            </Section>

            {/* ── Dietary preferences ────────────────────────────────────── */}
            <Section label="DIETARY PREFERENCES">
              <OptionGrid
                options={DIET_OPTIONS}
                selected={diets}
                onToggle={toggleDiet}
                accent
              />
            </Section>

            {/* ── Allergies ──────────────────────────────────────────────── */}
            <Section label="ALLERGIES">
              <OptionGrid
                options={ALLERGY_OPTIONS}
                selected={allergies}
                onToggle={toggleAllergy}
              />
            </Section>

            {/* ── Password reset ─────────────────────────────────────────── */}
            <Section label="PASSWORD">
              <PasswordResetPanel email={email} />
            </Section>

            {/* ── Save row — no animation, no z-index issues ─────────────── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                paddingTop: "1rem",
                paddingBottom: "8rem",
              }}
            >
              <button
                type="button"
                className="pf-save"
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "0.625rem 1.75rem",
                  borderRadius: "0.25rem",
                  border: "none",
                  background: "var(--accent)",
                  color: "#11110e",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  letterSpacing: "0.03em",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.5 : 1,
                }}
              >
                {saving ? "Saving…" : "Save changes →"}
              </button>

              {message && (
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.75rem",
                    color:
                      message.type === "success"
                        ? "var(--success)"
                        : "var(--error)",
                  }}
                >
                  {message.type === "success" ? "✓ " : "✕ "}
                  {message.text}
                </span>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}