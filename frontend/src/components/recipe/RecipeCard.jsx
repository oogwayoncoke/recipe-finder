export default function RecipeCard({ recipe, onClick, index = 0 }) {
  const image = recipe.image_url;
  const time = recipe.ready_in_minutes;
  const tags = (recipe.tags ?? []).slice(0, 3);

  return (
    <div
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "0.375rem",
        overflow: "hidden",
        position: "relative",
        transition: "border-color 0.15s, transform 0.15s",
        animationDelay: `${index * 0.04}s`,
        display: "flex",
        flexDirection: "column",
      }}
      className="animate-fade-up"
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent-dim)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Clickable image + info area */}
      <div onClick={onClick} style={{ cursor: "pointer", flex: 1 }}>
        {image ? (
          <img
            src={image}
            alt={recipe.title}
            style={{
              width: "100%",
              height: "9rem",
              objectFit: "cover",
              display: "block",
            }}
            loading="lazy"
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "9rem",
              backgroundColor: "var(--bg-hover)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              opacity: 0.2,
            }}
          >
            🍽
          </div>
        )}

        <div style={{ padding: "0.875rem 0.875rem 0.5rem" }}>
          <h3
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: "0.95rem",
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

          <div
            style={{ display: "flex", gap: "0.75rem", marginBottom: "0.5rem" }}
          >
            {[
              [time ? `${time} min` : "—", "time"],
              [`${recipe.servings ?? "—"} srv`, "servings"],
            ].map(([val, key]) => (
              <span
                key={key}
                style={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: "0.65rem",
                  color: "var(--text-dim)",
                }}
              >
                <span
                  style={{ color: "var(--accent)", marginRight: "0.25rem" }}
                >
                  ●
                </span>
                {val}
              </span>
            ))}
          </div>

          {tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
              {tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontFamily: '"DM Mono", monospace',
                    fontSize: "0.6rem",
                    color: "var(--text-dim)",
                    backgroundColor: "var(--bg-hover)",
                    border: "1px solid var(--border)",
                    padding: "0.125rem 0.375rem",
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

      {/* Full-width tap-friendly button — big enough for thumbs */}
      <button
        onClick={onClick}
        style={{
          width: "100%",
          padding: "0.625rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.375rem",
          backgroundColor: "var(--bg-hover)",
          borderTop: "1px solid var(--border)",
          border: "none",
          borderTop: "1px solid var(--border)",
          cursor: "pointer",
          fontFamily: '"DM Mono", monospace',
          fontSize: "0.65rem",
          letterSpacing: "0.06em",
          color: "var(--text-dim)",
          transition: "background-color 0.15s, color 0.15s",
          minHeight: "2.5rem", // 40px — comfortable tap target
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor =
            "color-mix(in srgb, var(--accent) 12%, transparent)";
          e.currentTarget.style.color = "var(--accent)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "var(--bg-hover)";
          e.currentTarget.style.color = "var(--text-dim)";
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{ flexShrink: 0 }}
        >
          <path
            d="M1 4.5V1H4.5M7.5 1H11V4.5M11 7.5V11H7.5M4.5 11H1V7.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        view recipe
      </button>
    </div>
  );
}