import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export default function VerifyEmail() {
  const { key } = useParams(); // route: /verify-email/:key
  const navigate = useNavigate();

  useEffect(() => {
    // If there is no key in the URL, send them straight to login
    if (!key) {
      navigate("/login", { replace: true });
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

        // IF FAILED: Go directly to login
        if (!res.ok || data.error) {
          navigate("/login", { replace: true });
          return;
        }

        // IF SUCCESS: The link is valid. Auto-login by saving the tokens.
        if (data.access || data.key || data.token) {
          const accessToken = data.access || data.key || data.token;
          localStorage.setItem("access", accessToken);
          if (data.refresh) localStorage.setItem("refresh", data.refresh);
        }

        // Send them straight to diet setup.
        // (If tokens were saved, they will stay here. If no tokens were returned
        // by your backend, your app's router will likely bounce them to /login).
        navigate("/diet-setup", { replace: true });
      })
      .catch(() => {
        // IF FAILED (Network error): Go directly to login
        navigate("/login", { replace: true });
      });
  }, [key, navigate]);

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
        overflow: "hidden",
      }}
    >
      {/* Decorative circles from GetStartedPage */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        {[
          { size: 280, top: "8%", left: "55%", opacity: 0.06 },
          { size: 180, top: "25%", left: "20%", opacity: 0.04 },
          { size: 100, top: "55%", left: "70%", opacity: 0.05 },
          { size: 60, top: "15%", left: "35%", opacity: 0.08 },
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
        {/* Soft center glow from GetStartedPage */}
        <div
          style={{
            position: "absolute",
            width: 320,
            height: 320,
            borderRadius: "50%",
            backgroundColor: "var(--accent)",
            opacity: 0.04,
            top: "30%",
            left: "60%",
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
          position: "relative",
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

        {/* Loading Card */}
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
