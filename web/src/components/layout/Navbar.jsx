import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

function CompassIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function BasketIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
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

  const navTabs = [
    { label: "Discover", path: "/discover", icon: <CompassIcon /> },
    { label: "Liked", path: "/likes", icon: <HeartIcon /> },
    { label: "Meal Planner", path: "/meal-planner", icon: <CalendarIcon /> },
    { label: "Grocery List", path: "/grocery-list", icon: <BasketIcon /> },
  ];

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
      {/* Left — Logo + tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
        {/* Logo */}
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "1.375rem",
            color: "var(--text)",
            letterSpacing: "-0.01em",
            cursor: "pointer",
            marginRight: "1rem",
          }}
          onClick={() => navigate("/discover")}
        >
          di<span style={{ color: "var(--accent)" }}>sh</span>
        </div>

        {/* Nav tabs */}
        {navTabs.map(({ label, path, icon }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              title={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.375rem 0.75rem",
                borderRadius: "0.25rem",
                border: active
                  ? "1px solid var(--border-2)"
                  : "1px solid transparent",
                backgroundColor: active ? "var(--bg-hover)" : "transparent",
                color: active ? "var(--accent)" : "var(--text-dim)",
                fontFamily: "Inter, sans-serif",
                fontSize: "0.75rem",
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                  e.currentTarget.style.color = "var(--text)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--text-dim)";
                }
              }}
            >
              {icon}
              {label}
            </button>
          );
        })}
      </div>

      {/* Right — theme toggle, auth */}
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
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/profile");
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
                    (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  Profile
                </button>
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