import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const STATUS = {
  LOADING: "loading",
  SUCCESS: "success",
  FAILED: "failed",
};

export default function VerifyEmail() {
  const { key } = useParams(); // route: /verify-email/:key
  const navigate = useNavigate();
  const [status, setStatus] = useState(STATUS.LOADING);

  useEffect(() => {
    if (!key) {
      setStatus(STATUS.FAILED);
      return;
    }

    // Remove trailing slashes and whitespace that break Django's decoder
    const cleanKey = key.replace(/\/$/, "").trim();

    fetch(`${API}/authentication/verify-email/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: cleanKey }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || data.error) {
          setStatus(STATUS.FAILED);
          return;
        }
        setStatus(STATUS.SUCCESS);
      })
      .catch(() => setStatus(STATUS.FAILED));
  }, [key]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        position: "relative",
        overflow: "hidden", // Prevents shapes from creating scrollbars
      }}
    >
      {/* Decorative background shapes */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      >
        {[
          { size: 280, top: "15%", left: "20%", opacity: 0.06 },
          { size: 180, top: "75%", left: "80%", opacity: 0.04 },
          { size: 100, top: "25%", left: "75%", opacity: 0.05 },
          { size: 60, top: "85%", left: "25%", opacity: 0.08 },
        ].map((c, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: c.size,
              height: c.size,
              borderRadius: "50%",
              border: `1px solid var(--accent)`,
              opacity: c.opacity,
              top: c.top,
              left: c.left,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
        {/* Soft center glow */}
        <div
          style={{
            position: "absolute",
            width: 380,
            height: 380,
            borderRadius: "50%",
            backgroundColor: "var(--accent)",
            opacity: 0.03,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      {/* Main Content Container */}
      <div
        className="animate-fade-up"
        style={{
          width: "100%",
          maxWidth: "24rem",
          position: "relative", // Keep content above the background shapes
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontFamily: "serif",
            fontSize: "2rem",
            color: "var(--text)",
            letterSpacing: "-0.05em",
            lineHeight: 1,
            marginBottom: "2rem",
            textAlign: "center",
          }}
        >
          di
          <span style={{ color: "var(--accent)", fontStyle: "italic" }}>
            sh
          </span>
        </div>

        {/* Card */}
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            border: `1px solid var(--border)`,
            borderRadius: "0.5rem",
            padding: "2rem",
            textAlign: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          }}
        >
          {status === STATUS.LOADING && (
            <>
              <Spinner />
              <h2
                style={{
                  fontFamily: "serif",
                  fontSize: "1.25rem",
                  color: "var(--text)",
                  marginBottom: "0.5rem",
                }}
              >
                Verifying your email
              </h2>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                  color: "var(--text-dim)",
                  letterSpacing: "0.05em",
                }}
              >
                hang on a second...
              </p>
            </>
          )}

          {status === STATUS.SUCCESS && (
            <>
              <div
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  borderRadius: "50%",
                  backgroundColor:
                    "color-mix(in srgb, #5a8a5a 15%, transparent)",
                  border:
                    "1px solid color-mix(in srgb, #5a8a5a 40%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                  color: "#5a8a5a",
                  fontFamily: "monospace",
                }}
              >
                ✓
              </div>
              <h2
                style={{
                  fontFamily: "serif",
                  fontSize: "1.25rem",
                  color: "var(--text)",
                  marginBottom: "0.5rem",
                }}
              >
                You're verified
              </h2>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.875rem",
                  color: "var(--text-dim)",
                  lineHeight: 1.6,
                  marginBottom: "1.5rem",
                }}
              >
                Your account is active. You can log in now.
              </p>
              <button
                onClick={() => navigate("/login", { replace: true })}
                style={{
                  backgroundColor: "var(--accent)",
                  color: "var(--bg)",
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  letterSpacing: "0.05em",
                  padding: "0.625rem 1.25rem",
                  borderRadius: "0.25rem",
                  border: "none",
                  cursor: "pointer",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Go to login →
              </button>
            </>
          )}

          {status === STATUS.FAILED && (
            <>
              <div
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  borderRadius: "50%",
                  backgroundColor:
                    "color-mix(in srgb, #c0574a 15%, transparent)",
                  border:
                    "1px solid color-mix(in srgb, #c0574a 40%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                  color: "#c0574a",
                  fontFamily: "monospace",
                }}
              >
                ✕
              </div>
              <h2
                style={{
                  fontFamily: "serif",
                  fontSize: "1.25rem",
                  color: "var(--text)",
                  marginBottom: "0.5rem",
                }}
              >
                Link invalid or expired
              </h2>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.875rem",
                  color: "var(--text-dim)",
                  lineHeight: 1.6,
                  marginBottom: "1.5rem",
                }}
              >
                This verification link has expired or already been used. Try
                registering again.
              </p>
              <button
                onClick={() => navigate("/login", { replace: true })}
                style={{
                  background: "none",
                  border: "none",
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                  color: "var(--text-dim)",
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--text)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-dim)")
                }
              >
                Back to login →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        marginBottom: "1rem",
      }}
    >
      <style>{`
        @keyframes customSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          width: "2rem",
          height: "2rem",
          border: "2px solid var(--border)",
          borderTopColor: "var(--accent)",
          borderRadius: "50%",
          animation: "customSpin 1s linear infinite",
        }}
      />
    </div>
  );
}