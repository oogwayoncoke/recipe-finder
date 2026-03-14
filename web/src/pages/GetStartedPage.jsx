import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function GetStartedPage() {
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();

  function handleGetStarted() {
    navigate("/register");
  }

  function handleSkip() {
    navigate("/discover");
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
      {/* Navbar */}
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
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "1.375rem",
            color: "var(--text)",
          }}
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

      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Left hero panel */}
        <div
          style={{
            width: "43%",
            flexShrink: 0,
            backgroundColor: "var(--bg-card)",
            borderRight: "1px solid var(--border)",
            padding: "7.5rem 3rem 3rem 3rem",
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          {/* Amber accent bar */}
          <div
            style={{
              position: "absolute",
              left: "3rem",
              top: "7.5rem",
              width: "3px",
              height: "4rem",
              borderRadius: "2px",
              backgroundColor: "var(--accent)",
            }}
          />

          <h1
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "3.25rem",
              fontWeight: 400,
              color: "var(--text)",
              lineHeight: 1.15,
              marginLeft: "1.5rem",
              marginBottom: "1rem",
            }}
          >
            Cook with
            <br />
            <span style={{ color: "var(--accent)" }}>intention.</span>
          </h1>

          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "1.0625rem",
              fontWeight: 400,
              color: "var(--text-muted)",
              lineHeight: 1.65,
              marginLeft: "1.5rem",
              marginBottom: "2.5rem",
              maxWidth: "28rem",
            }}
          >
            Tell us how you eat and we'll find recipes that fit your life — not
            the other way around.
          </p>

          {/* Feature list */}
          {[
            "Personalised to your diet",
            "Allergies always excluded",
            "Cuisine preferences saved",
          ].map((item, i) => (
            <div key={i}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1.5rem",
                  marginLeft: "1.5rem",
                  padding: "0.75rem 0",
                }}
              >
                <span
                  style={{
                    color: "var(--accent)",
                    fontSize: "0.625rem",
                    flexShrink: 0,
                  }}
                >
                  ◆
                </span>
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.875rem",
                    color: "var(--text-muted)",
                  }}
                >
                  {item}
                </span>
              </div>
              <div
                style={{
                  height: "1px",
                  backgroundColor: "var(--border)",
                  marginLeft: "1.5rem",
                }}
              />
            </div>
          ))}

          <div style={{ flex: 1 }} />
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.6875rem",
              color: "var(--text-dim)",
              letterSpacing: "0.05em",
              marginLeft: "1.5rem",
            }}
          >
            // 10,000+ recipes waiting for you
          </p>
        </div>

        {/* Right background deco + card */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {/* Decorative circles */}
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

          {/* Onboarding card */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "26rem",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "0.25rem",
              padding: "2.5rem",
            }}
          >
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.75rem",
                color: "var(--text-dim)",
                letterSpacing: "0.03em",
                marginBottom: "0.5rem",
              }}
            >
              Welcome to
            </p>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "2.25rem",
                fontWeight: 400,
                marginBottom: "0.75rem",
              }}
            >
              <span style={{ color: "var(--text)" }}>di</span>
              <span style={{ color: "var(--accent)" }}>sh</span>
            </div>

            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.8125rem",
                color: "var(--text-muted)",
                lineHeight: 1.65,
                marginBottom: "1.5rem",
              }}
            >
              Set up your profile in 2 quick steps and we'll personalise
              everything for you.
            </p>

            {/* Progress bar */}
            <div
              style={{
                position: "relative",
                height: "2px",
                backgroundColor: "var(--border)",
                borderRadius: "1px",
                marginBottom: "0.5rem",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "50%",
                  height: "100%",
                  backgroundColor: "var(--accent)",
                  borderRadius: "1px",
                }}
              />
            </div>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.625rem",
                color: "var(--text-dim)",
                letterSpacing: "0.03em",
                marginBottom: "1.25rem",
              }}
            >
              Step 1 of 2 — Diet & Allergies
            </p>

            <div
              style={{
                height: "1px",
                backgroundColor: "var(--border)",
                marginBottom: "1.25rem",
              }}
            />

            {/* Steps */}
            {[
              {
                title: "Diet preferences",
                sub: "We filter recipes to match what you eat",
              },
              {
                title: "Allergy exclusions",
                sub: "Never see ingredients you can't have",
              },
              {
                title: "Cuisine favourites",
                sub: "Discover food that suits your taste",
              },
            ].map((step, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  marginBottom: "1.25rem",
                }}
              >
                <div
                  style={{
                    width: "0.5rem",
                    height: "0.5rem",
                    borderRadius: "50%",
                    backgroundColor: "var(--accent)",
                    flexShrink: 0,
                    marginTop: "0.25rem",
                  }}
                />
                <div>
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      color: "var(--text)",
                      marginBottom: "0.125rem",
                    }}
                  >
                    {step.title}
                  </p>
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.6875rem",
                      color: "var(--text-dim)",
                      lineHeight: 1.5,
                    }}
                  >
                    {step.sub}
                  </p>
                </div>
              </div>
            ))}

            <button
              onClick={handleGetStarted}
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
                marginTop: "0.75rem",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Get started →
            </button>

            <button
              onClick={handleSkip}
              style={{
                width: "100%",
                marginTop: "0.875rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                fontSize: "0.75rem",
                color: "var(--text-dim)",
                textAlign: "center",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text-muted)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-dim)")
              }
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
