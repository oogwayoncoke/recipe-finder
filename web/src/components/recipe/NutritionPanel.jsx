/**
 * NutritionPanel
 *
 * Renders macro bars + calorie display for a recipe detail modal.
 * Receives the `nutrition` object from the serializer:
 *   { calories, protein, carbs, fat }  (all per-serving, grams / kcal)
 *
 * Shows nothing when data is null/undefined — the parent decides whether
 * to render a skeleton or omit the section entirely.
 */

const MACRO_CONFIG = [
  {
    key:   "protein",
    label: "Protein",
    unit:  "g",
    color: "#5a8a5a",
    track: "#1a2e1a",
    // 50 g/serving is treated as 100 % of the bar
    max:   50,
  },
  {
    key:   "carbs",
    label: "Carbs",
    unit:  "g",
    color: "#6a7aaa",
    track: "#1a1e2e",
    max:   100,
  },
  {
    key:   "fat",
    label: "Fat",
    unit:  "g",
    color: "#c09040",
    track: "#2e2210",
    max:   40,
  },
];

export default function NutritionPanel({ nutrition, loading }) {
  if (!nutrition && !loading) return null;

  return (
    <div style={{ marginBottom: "1.25rem" }}>
      {/* Section label */}
      <div
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "0.65rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--text-dim)",
          marginBottom: "0.75rem",
        }}
      >
        Nutrition <span style={{ opacity: 0.5 }}>· per serving</span>
      </div>

      {loading && !nutrition ? (
        <NutritionSkeleton />
      ) : (
        <div
          style={{
            backgroundColor: "var(--bg-hover)",
            border: "1px solid var(--border)",
            borderRadius: "0.375rem",
            padding: "0.875rem 1rem",
          }}
        >
          {/* Calorie hero */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "0.375rem",
              marginBottom: "0.875rem",
              paddingBottom: "0.75rem",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "1.75rem",
                fontWeight: 300,
                color: "var(--accent)",
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}
            >
              {nutrition?.calories != null
                ? Math.round(nutrition.calories)
                : "—"}
            </span>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.7rem",
                color: "var(--text-dim)",
                letterSpacing: "0.08em",
              }}
            >
              kcal
            </span>
          </div>

          {/* Macro bars */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.625rem",
            }}
          >
            {MACRO_CONFIG.map(({ key, label, unit, color, track, max }) => {
              const val  = nutrition?.[key];
              const pct  = val != null ? Math.min((val / max) * 100, 100) : 0;
              return (
                <div key={key}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginBottom: "0.3rem",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "0.6875rem",
                        color: "var(--text-muted)",
                        letterSpacing: "0.03em",
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "0.75rem",
                        color: color,
                        fontWeight: 500,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {val != null ? `${Math.round(val)}${unit}` : "—"}
                    </span>
                  </div>
                  {/* Track */}
                  <div
                    style={{
                      height: "4px",
                      borderRadius: "2px",
                      backgroundColor: track,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        borderRadius: "2px",
                        backgroundColor: color,
                        transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.55rem",
              color: "var(--text-dim)",
              letterSpacing: "0.04em",
              marginTop: "0.75rem",
              opacity: 0.7,
            }}
          >
            Powered by Spoonacular · estimates only
          </p>
        </div>
      )}
    </div>
  );
}

function NutritionSkeleton() {
  return (
    <div
      style={{
        backgroundColor: "var(--bg-hover)",
        border: "1px solid var(--border)",
        borderRadius: "0.375rem",
        padding: "0.875rem 1rem",
      }}
    >
      <style>{`
        @keyframes nutrShimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .nutr-sk {
          background: linear-gradient(90deg,
            var(--bg-card) 25%,
            var(--border-2) 50%,
            var(--bg-card) 75%
          );
          background-size: 400px 100%;
          animation: nutrShimmer 1.4s ease-in-out infinite;
          border-radius: 0.25rem;
        }
      `}</style>
      {/* Calorie hero skeleton */}
      <div className="nutr-sk" style={{ width: "5rem", height: "1.75rem", marginBottom: "0.875rem" }} />
      <div style={{ height: "1px", backgroundColor: "var(--border)", marginBottom: "0.75rem" }} />
      {/* Three macro rows */}
      {[70, 90, 55].map((w, i) => (
        <div key={i} style={{ marginBottom: "0.625rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
            <div className="nutr-sk" style={{ width: `${w * 0.4}%`, height: "0.6rem" }} />
            <div className="nutr-sk" style={{ width: "2.5rem",       height: "0.6rem" }} />
          </div>
          <div className="nutr-sk" style={{ width: "100%", height: "4px" }} />
        </div>
      ))}
    </div>
  );
}
