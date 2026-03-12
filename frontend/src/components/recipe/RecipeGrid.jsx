import RecipeCard from "./RecipeCard";

const MOCK_RECIPES = [
  {
    id: 1,
    title: "Fattoush Salad",
    ready_in_minutes: 20,
    servings: 4,
    tags: ["vegan", "gluten-free", "middle eastern"],
  },
  {
    id: 2,
    title: "Grilled Lemon Chicken",
    ready_in_minutes: 35,
    servings: 2,
    tags: ["mediterranean"],
  },
  {
    id: 3,
    title: "Red Lentil Soup",
    ready_in_minutes: 25,
    servings: 6,
    tags: ["vegan", "gluten-free"],
  },
  {
    id: 4,
    title: "Chicken Shawarma Bowl",
    ready_in_minutes: 45,
    servings: 3,
    tags: ["middle eastern"],
  },
  {
    id: 5,
    title: "Shakshuka",
    ready_in_minutes: 22,
    servings: 2,
    tags: ["vegetarian", "gluten-free"],
  },
  {
    id: 6,
    title: "Koshari",
    ready_in_minutes: 55,
    servings: 5,
    tags: ["vegan", "egyptian"],
  },
];

export default function RecipeGrid({
  recipes,
  loading,
  stale,
  total,
  layout = "grid",
  onCardClick,
}) {
  const isMock = recipes.length === 0 && total === null;
  const items = isMock ? MOCK_RECIPES : recipes;

  if (loading && !stale) return <LoadingGrid />;

  const gridStyle =
    layout === "list"
      ? { display: "flex", flexDirection: "column", gap: "0.75rem" }
      : {
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "1rem",
        };

  return (
    <div>
      {/* Divider label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1.25rem",
        }}
      >
        <div
          style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }}
        />
        <span
          style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: "0.68rem",
            color: "var(--text-dim)",
            letterSpacing: "0.1em",
          }}
        >
          {loading
            ? "loading…"
            : isMock
              ? "no recipes yet"
              : `${total} recipes`}
        </span>
        <div
          style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }}
        />
      </div>

      {!isMock && items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 0" }}>
          <div
            style={{
              fontSize: "2.5rem",
              marginBottom: "0.75rem",
              opacity: 0.2,
            }}
          >
            🍽
          </div>
          <p
            style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: "1.125rem",
              color: "var(--text-muted)",
              marginBottom: "0.25rem",
            }}
          >
            No recipes found
          </p>
          <p
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: "0.72rem",
              color: "var(--text-dim)",
            }}
          >
            try different ingredients or filters
          </p>
        </div>
      ) : (
        <div
          style={{
            opacity: stale ? 0.4 : 1,
            pointerEvents: stale ? "none" : "auto",
            transition: "opacity 0.2s",
          }}
        >
          <div style={gridStyle}>
            {items.map((recipe, i) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                index={i}
                onClick={() => onCardClick?.(recipe)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingGrid() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "1rem",
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "0.375rem",
            overflow: "hidden",
          }}
          className="animate-pulse"
        >
          <div style={{ height: "9rem", backgroundColor: "var(--bg-hover)" }} />
          <div
            style={{
              padding: "0.875rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <div
              style={{
                height: "0.75rem",
                backgroundColor: "var(--bg-hover)",
                borderRadius: "0.25rem",
                width: "75%",
              }}
            />
            <div
              style={{
                height: "0.625rem",
                backgroundColor: "var(--bg-hover)",
                borderRadius: "0.25rem",
                width: "50%",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
