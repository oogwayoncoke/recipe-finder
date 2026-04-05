import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handle(e) {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const isGuest = !user;
  const initial = user?.username?.[0]?.toUpperCase() ?? "?";
  const username = user?.username ?? "guest";

  return (
    <nav
      style={{
        height: "3.5rem",
        borderBottom: "1px solid var(--border)",
        backgroundColor: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem",
        position: "sticky",
        top: 0,
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
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

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={dark ? "Light mode" : "Dark mode"}
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
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-dim)")
          }
        >
          {dark ? "☀" : "☾"}
        </button>

        {/* Guest login CTA */}
        {isGuest && (
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "0.375rem 0.875rem",
              backgroundColor: "var(--accent)",
              color: "#11110e",
              fontFamily: "Inter, sans-serif",
              fontSize: "0.75rem",
              fontWeight: 500,
              border: "none",
              borderRadius: "0.25rem",
              cursor: "pointer",
              letterSpacing: "0.03em",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Sign in →
          </button>
        )}

        {/* User menu */}
        {!isGuest && (
          <div style={{ position: "relative" }} ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                fontFamily: "Inter, sans-serif",
                fontSize: "0.6875rem",
                color: "var(--text-muted)",
                cursor: "pointer",
                background: "none",
                border: "none",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-muted)")
              }
            >
              <div
                style={{
                  width: "1.5rem",
                  height: "1.5rem",
                  borderRadius: "50%",
                  backgroundColor: "var(--bg-hover)",
                  border: "1px solid var(--border-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.625rem",
                  color: "var(--accent)",
                  fontWeight: 500,
                }}
              >
                {initial}
              </div>
              {username}
              <span
                style={{
                  fontSize: "0.5rem",
                  transform: menuOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.15s",
                }}
              >
                ▾
              </span>
            </button>

            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  marginTop: "0.5rem",
                  width: "11rem",
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.25rem",
                  overflow: "hidden",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                  zIndex: 50,
                }}
              >
                {[["Profile", "/profile"]].map(([label, path]) => (
                  <button
                    key={label}
                    onClick={() => {
                      setMenuOpen(false);
                      navigate(path);
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "0.625rem 1rem",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "var(--bg-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    {label}
                  </button>
                ))}
                <div style={{ borderTop: "1px solid var(--border)" }} />
                <button
                  onClick={() => {
                    logout();
                    navigate("/login", { replace: true });
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "0.625rem 1rem",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.75rem",
                    color: "var(--error)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
