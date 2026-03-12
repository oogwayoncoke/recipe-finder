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

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

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
          fontFamily: '"DM Serif Display", serif',
          fontSize: "1.4rem",
          color: "var(--text)",
          letterSpacing: "-0.02em",
        }}
      >
        di
        <span style={{ color: "var(--accent)", fontStyle: "italic" }}>sh</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
          style={{
            width: "2rem",
            height: "2rem",
            borderRadius: "0.375rem",
            border: "1px solid var(--border)",
            backgroundColor: "var(--bg-hover)",
            color: "var(--text-dim)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.85rem",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-dim)")
          }
        >
          {dark ? "☀" : "☾"}
        </button>

        {/* User menu */}
        <div style={{ position: "relative" }} ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontFamily: '"DM Mono", monospace',
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              cursor: "pointer",
              background: "none",
              border: "none",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-muted)")
            }
          >
            <span
              style={{
                width: "1.5rem",
                height: "1.5rem",
                borderRadius: "50%",
                backgroundColor: "var(--bg-hover)",
                border: "1px solid var(--border-2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.65rem",
                color: "var(--accent)",
                fontWeight: 500,
              }}
            >
              {initial}
            </span>
            {username}
            <span
              style={{
                fontSize: "0.6rem",
                transition: "transform 0.15s",
                transform: menuOpen ? "rotate(180deg)" : "none",
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
                borderRadius: "0.375rem",
                overflow: "hidden",
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                zIndex: 50,
              }}
            >
              {[
                {
                  label: "Profile",
                  path: "/profile",
                  color: "var(--text-muted)",
                },
                {
                  label: "Settings",
                  path: "/settings",
                  color: "var(--text-muted)",
                },
              ].map(({ label, path, color }) => (
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
                    fontFamily: '"DM Mono", monospace',
                    fontSize: "0.75rem",
                    color,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
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
                onClick={handleLogout}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "0.625rem 1rem",
                  fontFamily: '"DM Mono", monospace',
                  fontSize: "0.75rem",
                  color: "var(--error)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.1s",
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
      </div>
    </nav>
  );
}