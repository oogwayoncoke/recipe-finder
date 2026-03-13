import { useEffect, useState } from "react";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import RecipeGrid from "../components/recipe/RecipeGrid";
import SearchPanel from "../components/search/SearchPanel";

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

  // Initial load — filter-only browse, no query, no external API call
  useEffect(() => {
    async function loadInitial() {
      setLoading(true);
      try {
        const res = await fetch(`${API}/recipes/search/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
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

  async function handleCardClick(recipe) {
    setSelected(recipe);
    setDL(true);
    try {
      const res = await fetch(`${API}/recipes/${recipe.external_id}/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
      });
      if (res.ok) setSelected(await res.json());
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
          {/* Header */}
          <div style={{ marginBottom: "1.5rem" }} className="animate-fade-up">
            <h1
              style={{
                fontFamily: '"DM Serif Display", serif',
                fontSize: "1.9rem",
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
                fontFamily: '"DM Mono", monospace',
                fontSize: "0.68rem",
                color: "var(--text-dim)",
                letterSpacing: "0.1em",
              }}
            >
              // search by name or drop ingredients below
            </p>
          </div>

          {/* Search */}
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

          {/* Active filter pills */}
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
                    fontFamily: '"DM Mono", monospace',
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

          {/* Grid */}
          <div className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <RecipeGrid
              recipes={recipes}
              loading={loading}
              stale={loading && recipes.length > 0}
              total={total}
              layout={filters.layout}
              onCardClick={handleCardClick}
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

function RecipeModal({ recipe, loading, onClose }) {
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
        padding: "0",
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
      `}</style>
      <div
        className="recipe-modal-sheet"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "1rem 1rem 0 0", // bottom sheet on mobile
          width: "100%",
          maxHeight: "92vh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Drag handle (mobile visual cue) */}
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

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem",
            padding: "0.75rem 1.25rem 1rem",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <h2
            style={{
              fontFamily: '"DM Serif Display", serif',
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
              flexShrink: 0, // bigger tap target
              backgroundColor: "var(--bg-hover)",
              border: "1px solid var(--border)",
              borderRadius: "50%",
              cursor: "pointer",
              color: "var(--text-dim)",
              fontFamily: '"DM Mono", monospace',
              fontSize: "0.875rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.1s",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "1.25rem" }}>
          {/* Meta */}
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
                    fontFamily: '"DM Mono", monospace',
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
                    fontFamily: '"DM Mono", monospace',
                    fontSize: "0.85rem",
                    color: "var(--accent)",
                  }}
                >
                  {val}
                </div>
              </div>
            ))}
          </div>

          {/* Tags */}
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
                    fontFamily: '"DM Mono", monospace',
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

          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
              className="animate-pulse"
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: "0.5rem",
                    backgroundColor: "var(--bg-hover)",
                    borderRadius: "0.25rem",
                    width: `${60 + (i % 3) * 15}%`,
                  }}
                />
              ))}
            </div>
          ) : (
            <>
              {(recipe.ingredients ?? []).length > 0 && (
                <>
                  <div
                    style={{
                      fontFamily: '"DM Mono", monospace',
                      fontSize: "0.65rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "var(--text-dim)",
                      marginBottom: "0.75rem",
                    }}
                  >
                    Ingredients
                  </div>
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
                            fontFamily: '"DM Mono", monospace',
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
                </>
              )}
              {(recipe.instructions ?? []).length > 0 && (
                <>
                  <div
                    style={{
                      fontFamily: '"DM Mono", monospace',
                      fontSize: "0.65rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "var(--text-dim)",
                      marginBottom: "0.75rem",
                    }}
                  >
                    Steps
                  </div>
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
                            fontFamily: '"DM Mono", monospace',
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
                </>
              )}
              {!recipe.ingredients && !recipe.instructions && (
                <p
                  style={{
                    fontFamily: '"DM Mono", monospace',
                    fontSize: "0.72rem",
                    color: "var(--text-dim)",
                    textAlign: "center",
                    padding: "1.5rem 0",
                  }}
                >
                  Full details available after a real search.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
