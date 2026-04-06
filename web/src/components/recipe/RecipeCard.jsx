export default function RecipeCard({
  recipe,
  onClick,
  onHover,
  onHoverEnd,
  index = 0,
  isFavourited = false,
  onToggleFavourite,
}) {
  const image      = recipe.image_url;
  const time       = recipe.ready_in_minutes;
  const tags       = (recipe.tags ?? []).slice(0, 3);
  const nutrition  = recipe.nutrition ?? null;

  function handleHeartClick(e) {
    e.stopPropagation();
    onToggleFavourite?.(recipe);
  }

  return (
    <div
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "0.25rem",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.15s",
        animationDelay: `${index * 0.04}s`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-2)";
        onHover?.(recipe);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        onHoverEnd?.(recipe);
      }}
    >
      {/* Image + content — clickable area */}
      <div onClick={onClick} style={{ cursor: "pointer", flex: 1 }}>
        {/* Image with heart button overlaid */}
        <div style={{ position: "relative" }}>
          {image ? (
            <img
              src={image}
              alt={recipe.title}
              loading="lazy"
              style={{
                width: "100%",
                height: "6.875rem",
                objectFit: "cover",
                display: "block",
                backgroundColor: "var(--bg-hover)",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "6.875rem",
                backgroundColor: "#22221f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  borderRadius: "50%",
                  border: "1px solid var(--border-2)",
                  opacity: 0.3,
                }}
              />
            </div>
          )}

          {/* Nutrition pill overlay — top-left when data exists */}
          {nutrition?.calories != null && (
            <div
              style={{
                position: "absolute",
                top: "0.4rem",
                left: "0.4rem",
                backgroundColor: "rgba(10,10,9,0.72)",
                backdropFilter: "blur(4px)",
                border: "1px solid rgba(212,168,67,0.25)",
                borderRadius: "0.2rem",
                padding: "0.15rem 0.45rem",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.575rem",
                  color: "var(--accent)",
                  letterSpacing: "0.04em",
                  fontWeight: 500,
                }}
              >
                {Math.round(nutrition.calories)}
              </span>
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.5rem",
                  color: "rgba(212,168,67,0.6)",
                  letterSpacing: "0.06em",
                }}
              >
                kcal
              </span>
            </div>
          )}

          {/* Heart button */}
          {onToggleFavourite && (
            <button
              onClick={handleHeartClick}
              title={
                isFavourited ? "Remove from favourites" : "Save to favourites"
              }
              style={{
                position: "absolute",
                top: "0.4rem",
                right: "0.4rem",
                width: "1.625rem",
                height: "1.625rem",
                borderRadius: "50%",
                backgroundColor: "rgba(10,10,9,0.65)",
                backdropFilter: "blur(4px)",
                border: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.15s, background-color 0.15s",
                padding: 0,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.15)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              <HeartIcon filled={isFavourited} />
            </button>
          )}
        </div>

        <div style={{ padding: "0.6875rem 0.6875rem 0.375rem" }}>
          <h3
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.8125rem",
              fontWeight: 400,
              color: "var(--text)",
              lineHeight: 1.35,
              marginBottom: "0.5rem",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {recipe.title ?? "Untitled"}
          </h3>

          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.625rem",
              color: "var(--text-dim)",
              marginBottom: "0.5rem",
              whiteSpace: "pre",
            }}
          >
            {`● ${time ? `${time} min` : "—"}  ● ${recipe.servings ?? "—"} srv`}
          </p>

          {/* Macro row — only shown when nutrition data is available */}
          {nutrition && (
            <MacroRow nutrition={nutrition} />
          )}

          {!nutrition && tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
              {tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.625rem",
                    color: "var(--text-dim)",
                    backgroundColor: "var(--bg-hover)",
                    border: "1px solid var(--border)",
                    padding: "0.1875rem 0.5rem",
                    borderRadius: "0.125rem",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View recipe CTA */}
      <button
        onClick={onClick}
        style={{
          width: "100%",
          padding: "0.625rem",
          backgroundColor: "var(--bg-hover)",
          borderTop: "1px solid var(--border)",
          border: "none",
          cursor: "pointer",
          fontFamily: "Inter, sans-serif",
          fontSize: "0.625rem",
          letterSpacing: "0.05em",
          color: "var(--text-dim)",
          transition: "color 0.15s",
          minHeight: "2.375rem",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-dim)")}
      >
        view recipe
      </button>
    </div>
  );
}

// ── Macro row ─────────────────────────────────────────────────────────────────
const MACROS = [
  { key: "protein", label: "P", color: "#5a8a5a", title: "Protein" },
  { key: "carbs",   label: "C", color: "#6a7aaa", title: "Carbs"   },
  { key: "fat",     label: "F", color: "#c09040", title: "Fat"     },
];

function MacroRow({ nutrition }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.375rem",
        marginTop: "0.125rem",
      }}
    >
      {MACROS.map(({ key, label, color, title }) => {
        const val = nutrition[key];
        if (val == null) return null;
        return (
          <div
            key={key}
            title={`${title}: ${val}g`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.2rem",
              backgroundColor: `${color}18`,
              border: `1px solid ${color}33`,
              borderRadius: "0.15rem",
              padding: "0.15rem 0.375rem",
            }}
          >
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.5rem",
                color: color,
                fontWeight: 600,
                letterSpacing: "0.06em",
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.575rem",
                color: `${color}cc`,
                letterSpacing: "0.03em",
              }}
            >
              {Math.round(val)}g
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Heart SVG ─────────────────────────────────────────────────────────────────
function HeartIcon({ filled }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill={filled ? "var(--accent)" : "none"}
      stroke={filled ? "var(--accent)" : "rgba(255,255,255,0.55)"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", transition: "fill 0.15s, stroke 0.15s" }}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
