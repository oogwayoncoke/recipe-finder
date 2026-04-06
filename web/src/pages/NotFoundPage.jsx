import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

function BackgroundShapes() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {/* Amber filled circles */}
      {[
        { size: 340, top: "2%", left: "28%", opacity: 0.18 },
        { size: 240, top: "8%", left: "30%", opacity: 0.12 },
        { size: 280, top: "22%", left: "-6%", opacity: 0.14 },
        { size: 200, top: "15%", left: "57%", opacity: 0.13 },
      ].map((c, i) => (
        <div
          key={`fill-${i}`}
          style={{
            position: "absolute",
            width: c.size,
            height: c.size,
            borderRadius: "50%",
            top: c.top,
            left: c.left,
            transform: "translate(-50%, -50%)",
            backgroundColor: `rgba(180,140,50,${c.opacity})`,
          }}
        />
      ))}

      {/* Amber outline circles */}
      {[
        { size: 280, top: "22%", left: "-6%", opacity: 0.25 },
        { size: 200, top: "15%", left: "57%", opacity: 0.22 },
        { size: 320, top: "70%", left: "80%", opacity: 0.1 },
        { size: 160, top: "55%", left: "10%", opacity: 0.08 },
        { size: 100, top: "85%", left: "50%", opacity: 0.06 },
      ].map((c, i) => (
        <div
          key={`outline-${i}`}
          style={{
            position: "absolute",
            width: c.size,
            height: c.size,
            borderRadius: "50%",
            top: c.top,
            left: c.left,
            transform: "translate(-50%, -50%)",
            border: `1px solid rgba(212,168,67,${c.opacity})`,
            backgroundColor: "transparent",
          }}
        />
      ))}

      {/* Right side circles */}
      <div
        style={{
          position: "absolute",
          width: 220,
          height: 220,
          borderRadius: "50%",
          top: "28%",
          right: "-2%",
          backgroundColor: "rgba(180,140,50,0.12)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 220,
          height: 220,
          borderRadius: "50%",
          top: "28%",
          right: "-2%",
          border: "1px solid rgba(212,168,67,0.2)",
          backgroundColor: "transparent",
        }}
      />
    </div>
  );
}

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <BackgroundShapes />

      {/* Minimal navbar */}
      <nav
        style={{
          height: "3.5rem",
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.5rem",
          position: "relative",
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "1.375rem",
            color: "var(--text)",
            letterSpacing: "-0.01em",
            cursor: "pointer",
          }}
          onClick={() => navigate("/discover")}
        >
          di<span style={{ color: "var(--accent)" }}>sh</span>
        </div>
        <button
          onClick={toggle}
          style={{
            width: "2rem",
            height: "2rem",
            borderRadius: "0.25rem",
            border: "1px solid var(--border)",
            backgroundColor: "var(--bg-hover)",
            color: "var(--text-dim)",
            cursor: "pointer",
            fontSize: "0.875rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {dark ? "☀" : "☾"}
        </button>
      </nav>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ width: "100%", maxWidth: "26rem" }}>
          {/* Card */}
          <div
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "0.25rem",
              padding: "2.5rem",
            }}
          >
            {/* Logo */}
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "2.25rem",
                fontWeight: 400,
                marginBottom: "1.75rem",
              }}
            >
              <span style={{ color: "var(--text)" }}>di</span>
              <span style={{ color: "var(--accent)" }}>sh</span>
            </div>

            {/* Error label */}
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.625rem",
                color: "var(--text-dim)",
                letterSpacing: "0.14em",
                marginBottom: "0.5rem",
              }}
            >
              // error 404
            </div>

            {/* Accent bar + heading */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                alignItems: "flex-start",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  width: "3px",
                  height: "3rem",
                  borderRadius: "2px",
                  backgroundColor: "var(--accent)",
                  flexShrink: 0,
                  marginTop: "0.25rem",
                }}
              />
              <h1
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "2rem",
                  fontWeight: 400,
                  color: "var(--text)",
                  lineHeight: 1.2,
                }}
              >
                Page not{" "}
                <span style={{ color: "var(--accent)", fontStyle: "italic" }}>
                  found.
                </span>
              </h1>
            </div>

            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.8125rem",
                color: "var(--text-muted)",
                lineHeight: 1.65,
                marginBottom: "2rem",
              }}
            >
              This page doesn't exist or may have been moved. Check the URL or
              head back to a page that does.
            </p>

            {/* Divider */}
            <div
              style={{
                height: "1px",
                backgroundColor: "var(--border)",
                marginBottom: "1.5rem",
              }}
            />

            {/* Path display */}
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.625rem",
                color: "var(--text-dim)",
                letterSpacing: "0.06em",
                marginBottom: "1.5rem",
              }}
            >
              {window.location.pathname}
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.625rem",
              }}
            >
              <button
                onClick={() => navigate("/discover", { replace: true })}
                style={{
                  width: "100%",
                  height: "2.875rem",
                  backgroundColor: "var(--accent)",
                  color: "#11110e",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  letterSpacing: "0.03em",
                  border: "none",
                  borderRadius: "0.25rem",
                  cursor: "pointer",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Go to discover →
              </button>

              <button
                onClick={() => navigate(-1)}
                style={{
                  width: "100%",
                  height: "2.875rem",
                  backgroundColor: "transparent",
                  color: "var(--text-dim)",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.75rem",
                  letterSpacing: "0.03em",
                  border: "1px solid var(--border)",
                  borderRadius: "0.25rem",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-2)";
                  e.currentTarget.style.color = "var(--text)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--text-dim)";
                }}
              >
                ← go back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
