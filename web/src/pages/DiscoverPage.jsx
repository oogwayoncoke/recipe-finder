import { useEffect, useRef, useState } from "react";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import RecipeGrid from "../components/recipe/RecipeGrid";
import SearchPanel from "../components/search/SearchPanel";
import { trackView } from "../utils/historyTracker";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

const DEFAULT_FILTERS = {
  maxTime: "any",
  diet: [],
  cuisine: [],
  layout: "grid",
  perPage: "12",
  useMyDiet: false,
  useMyAllergies: false,
};

export default function DiscoverPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDL] = useState(false);

  const detailCache = useRef({});
  const prefetchAborts = useRef({});

  function getAuthHeader() {
    const token = localStorage.getItem("access");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  useEffect(() => {
    async function loadInitial() {
      setLoading(true);
      try {
        const res = await fetch(`${API}/recipes/search/`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeader() },
          body: JSON.stringify({ filters: { number: 12 } }),
        });
        if (res.ok) {
          const data = await res.json();
          setRecipes(data.results ?? []);
          setTotal(data.total ?? 0);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, []);

  function handleCardHover(recipe) {
    const id = recipe.external_id;
    if (!id || detailCache.current[id] || prefetchAborts.current[id]) return;
    const controller = new AbortController();
    prefetchAborts.current[id] = controller;
    fetch(`${API}/recipes/${id}/`, {
      signal: controller.signal,
      headers: getAuthHeader(),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) detailCache.current[id] = data;
      })
      .catch(() => {})
      .finally(() => {
        delete prefetchAborts.current[id];
      });
  }

  function handleCardHoverEnd(recipe) {
    const id = recipe.external_id;
    if (prefetchAborts.current[id] && !selected) {
      prefetchAborts.current[id].abort();
      delete prefetchAborts.current[id];
    }
  }

  async function handleCardClick(recipe) {
    const id = recipe.external_id;

    if (detailCache.current[id]) {
      setSelected(detailCache.current[id]);
      trackView(detailCache.current[id]);
      return;
    }

    // Open immediately with basic card data — user sees content right away
    setSelected(recipe);
    setDL(true);

    try {
      const res = await fetch(`${API}/recipes/${id}/`, {
        headers: getAuthHeader(),
      });
      if (res.ok) {
        const full = await res.json();
        detailCache.current[id] = full;
        setSelected((prev) => (prev?.external_id === id ? full : prev));
        trackView(full);
      }
    } catch {
    } finally {
      setDL(false);
    }
  }

  const activePills = [
    ...(filters.diet ?? []).map((d) => ({
      label: d,
      remove: () =>
        setFilters((f) => ({ ...f, diet: f.diet.filter((x) => x !== d) })),
    })),
    ...(filters.cuisine ?? []).map((c) => ({
      label: c,
      remove: () =>
        setFilters((f) => ({
          ...f,
          cuisine: f.cuisine.filter((x) => x !== c),
        })),
    })),
    filters.maxTime !== "any" && {
      label: `< ${filters.maxTime} min`,
      remove: () => setFilters((f) => ({ ...f, maxTime: "any" })),
    },
  ].filter(Boolean);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar filters={filters} onChange={setFilters} />
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem 2rem",
            maxWidth: "64rem",
          }}
        >
          <div style={{ marginBottom: "1.5rem" }} className="animate-fade-up">
            <h1
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "2rem",
                color: "var(--text)",
                lineHeight: 1.2,
                marginBottom: "0.25rem",
              }}
            >
              Find your next{" "}
              <span style={{ color: "var(--accent)", fontStyle: "italic" }}>
                dish.
              </span>
            </h1>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.68rem",
                color: "var(--text-dim)",
                letterSpacing: "0.1em",
              }}
            >
              // search by name or drop ingredients below
            </p>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "0.05s" }}>
            <SearchPanel
              filters={filters}
              onResults={(r, t) => {
                setRecipes(r);
                setTotal(t);
              }}
              onLoading={setLoading}
            />
          </div>

          {activePills.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.375rem",
                marginBottom: "1.25rem",
              }}
            >
              {activePills.map((pill, i) => (
                <span
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    backgroundColor:
                      "color-mix(in srgb, var(--accent) 10%, transparent)",
                    border:
                      "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
                    color: "var(--accent)",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.68rem",
                    padding: "0.125rem 0.5rem",
                    borderRadius: "0.125rem",
                  }}
                >
                  {pill.label}
                  <button
                    onClick={pill.remove}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "inherit",
                      padding: 0,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <RecipeGrid
              recipes={recipes}
              loading={loading}
              stale={loading && recipes.length > 0}
              total={total}
              layout={filters.layout}
              onCardClick={handleCardClick}
              onCardHover={handleCardHover}
              onCardHoverEnd={handleCardHoverEnd}
            />
          </div>
        </main>
      </div>

      {selected && (
        <RecipeModal
          recipe={selected}
          loading={detailLoading}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────
function IngredientsSkeleton() {
  const widths = [55, 70, 48, 65, 52, 72, 58, 44];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "0 1rem",
        marginBottom: "1.25rem",
      }}
    >
      {widths.map((w, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            borderBottom: "1px solid var(--bg-hover)",
            padding: "0.45rem 0",
          }}
        >
          {/* amount pill */}
          <div
            style={{
              width: `${w * 0.4}%`,
              height: "0.55rem",
              borderRadius: "0.25rem",
              background: "var(--bg-hover)",
              flexShrink: 0,
            }}
            className="animate-pulse"
          />
          {/* name bar */}
          <div
            style={{
              width: `${w}%`,
              height: "0.55rem",
              borderRadius: "0.25rem",
              background: "var(--bg-hover)",
            }}
            className="animate-pulse"
          />
        </div>
      ))}
    </div>
  );
}

function StepsSkeleton() {
  const widths = [88, 72, 95, 80, 66];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
      {widths.map((w, i) => (
        <div
          key={i}
          style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}
        >
          {/* step number */}
          <div
            style={{
              width: "1.25rem",
              height: "0.55rem",
              borderRadius: "0.25rem",
              background: "var(--bg-hover)",
              flexShrink: 0,
              marginTop: "0.2rem",
            }}
            className="animate-pulse"
          />
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "0.3rem",
            }}
          >
            <div
              style={{
                width: `${w}%`,
                height: "0.55rem",
                borderRadius: "0.25rem",
                background: "var(--bg-hover)",
              }}
              className="animate-pulse"
            />
            {/* second line for longer steps */}
            {w > 75 && (
              <div
                style={{
                  width: `${w - 25}%`,
                  height: "0.55rem",
                  borderRadius: "0.25rem",
                  background: "var(--bg-hover)",
                }}
                className="animate-pulse"
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function RecipeModal({ recipe, loading, onClose }) {
  const hasIngredients = (recipe.ingredients ?? []).length > 0;
  const hasInstructions = (recipe.instructions ?? []).length > 0;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.75)",
        zIndex: 50,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      className="animate-fade-up"
    >
      <style>{`
        @media (min-width: 640px) {
          .recipe-modal-sheet {
            align-self: center !important;
            border-radius: 0.5rem !important;
            max-width: 36rem !important;
            max-height: 85vh !important;
            margin: 1.5rem !important;
          }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .animate-pulse {
          background: linear-gradient(90deg, var(--bg-hover) 25%, var(--border-2) 50%, var(--bg-hover) 75%);
          background-size: 400px 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }
      `}</style>

      <div
        className="recipe-modal-sheet"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "1rem 1rem 0 0",
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "0.625rem 0 0.25rem",
          }}
        >
          <div
            style={{
              width: "2.5rem",
              height: "0.25rem",
              borderRadius: "999px",
              backgroundColor: "var(--border-2)",
            }}
          />
        </div>

        {/* Hero image — shown immediately from card data */}
        {recipe.image_url && (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            style={{
              width: "100%",
              height: "11rem",
              objectFit: "cover",
              display: "block",
            }}
          />
        )}

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem",
            padding: "0.875rem 1.25rem 0.875rem",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <h2
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "1.25rem",
              color: "var(--text)",
              lineHeight: 1.3,
            }}
          >
            {recipe.title}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: "2.5rem",
              height: "2.5rem",
              flexShrink: 0,
              backgroundColor: "var(--bg-hover)",
              border: "1px solid var(--border)",
              borderRadius: "50%",
              cursor: "pointer",
              color: "var(--text-dim)",
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "1.25rem" }}>
          {/* Meta — always visible from card data */}
          <div
            style={{ display: "flex", gap: "1.5rem", marginBottom: "1.25rem" }}
          >
            {[
              [
                "Time",
                recipe.ready_in_minutes
                  ? `${recipe.ready_in_minutes} min`
                  : "—",
              ],
              ["Servings", recipe.servings ?? "—"],
            ].map(([label, val]) => (
              <div key={label}>
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.6rem",
                    color: "var(--text-dim)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: "0.125rem",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.85rem",
                    color: "var(--accent)",
                  }}
                >
                  {val}
                </div>
              </div>
            ))}
            {/* Loading badge — replaces the old full skeleton */}
            {loading && (
              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                }}
              >
                <div
                  style={{
                    width: "0.4rem",
                    height: "0.4rem",
                    borderRadius: "50%",
                    background: "var(--accent)",
                    opacity: 0.7,
                    animation: "dishDotPulse 1s ease-in-out 0s infinite",
                  }}
                />
                <div
                  style={{
                    width: "0.4rem",
                    height: "0.4rem",
                    borderRadius: "50%",
                    background: "var(--accent)",
                    opacity: 0.7,
                    animation: "dishDotPulse 1s ease-in-out 0.2s infinite",
                  }}
                />
                <div
                  style={{
                    width: "0.4rem",
                    height: "0.4rem",
                    borderRadius: "50%",
                    background: "var(--accent)",
                    opacity: 0.7,
                    animation: "dishDotPulse 1s ease-in-out 0.4s infinite",
                  }}
                />
                <style>{`@keyframes dishDotPulse { 0%,100%{transform:scale(1);opacity:.4} 50%{transform:scale(1.5);opacity:1} }`}</style>
              </div>
            )}
          </div>

          {/* Tags — always visible from card data */}
          {(recipe.tags ?? []).length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.25rem",
                marginBottom: "1.25rem",
              }}
            >
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.62rem",
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

          {/* Ingredients — skeleton shaped like real content while loading */}
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
            Ingredients
          </div>
          {loading && !hasIngredients ? (
            <IngredientsSkeleton />
          ) : hasIngredients ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0 1rem",
                marginBottom: "1.25rem",
              }}
            >
              {recipe.ingredients.map((ing, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "0.375rem",
                    borderBottom: "1px solid var(--bg-hover)",
                    padding: "0.375rem 0",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.68rem",
                      color: "var(--accent)",
                      flexShrink: 0,
                    }}
                  >
                    {ing.amount ? `${ing.amount} ${ing.unit}`.trim() : ""}
                  </span>
                  <span
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--text-muted)",
                      fontWeight: 300,
                    }}
                  >
                    {ing.name}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          {/* Steps — skeleton shaped like real content while loading */}
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
            Steps
          </div>
          {loading && !hasInstructions ? (
            <StepsSkeleton />
          ) : hasInstructions ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {recipe.instructions.map((step) => (
                <div
                  key={step.step_num}
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    fontSize: "0.875rem",
                    color: "var(--text-muted)",
                    fontWeight: 300,
                    lineHeight: 1.6,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.68rem",
                      color: "var(--accent-dim)",
                      flexShrink: 0,
                      marginTop: "0.125rem",
                    }}
                  >
                    {String(step.step_num).padStart(2, "0")}
                  </span>
                  <span>{step.description}</span>
                </div>
              ))}
            </div>
          ) : !loading ? (
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.72rem",
                color: "var(--text-dim)",
                textAlign: "center",
                padding: "1.5rem 0",
              }}
            >
              Full details available after a real search.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
