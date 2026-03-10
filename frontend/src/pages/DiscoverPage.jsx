import { useState } from 'react'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import RecipeGrid from "../components/recipe/RecipeGrid";
import SearchPanel from '../components/search/SearchPanel'

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

  async function handleCardClick(recipe) {
    // Show modal immediately with basic data, then load full details
    setSelected(recipe);
    setDL(true);
    try {
      const res = await fetch(`${API}/recipes/${recipe.external_id}/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
      });
      if (res.ok) {
        const full = await res.json();
        setSelected(full);
      }
    } catch {
      /* keep basic data */
    } finally {
      setDL(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#111110] flex flex-col">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar filters={filters} onChange={setFilters} />

        <main className="flex-1 overflow-y-auto px-8 py-6 max-w-5xl">
          <div className="mb-6 animate-fade-up">
            <h1 className="font-serif text-[1.9rem] text-[#e8e6e0] leading-tight mb-0.5">
              Find your next{" "}
              <span className="text-[#d4a843] italic">dish.</span>
            </h1>
            <p className="font-mono text-[0.68rem] text-[#6b6b67] tracking-widest">
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

          <ActiveFilters filters={filters} onChange={setFilters} />

          <div className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <RecipeGrid
              recipes={recipes}
              loading={loading}
              total={total ?? 0}
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

// ── Active filter pills ───────────────────────────────────────────────────────
function ActiveFilters({ filters, onChange }) {
  const pills = [
    ...(filters.diet ?? []).map((d) => ({
      label: d,
      remove: () =>
        onChange({ ...filters, diet: filters.diet.filter((x) => x !== d) }),
    })),
    ...(filters.cuisine ?? []).map((c) => ({
      label: c,
      remove: () =>
        onChange({
          ...filters,
          cuisine: filters.cuisine.filter((x) => x !== c),
        }),
    })),
    filters.maxTime !== "any" && {
      label: `< ${filters.maxTime} min`,
      remove: () => onChange({ ...filters, maxTime: "any" }),
    },
  ].filter(Boolean);

  if (!pills.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mb-5">
      {pills.map((pill, i) => (
        <span
          key={i}
          className="flex items-center gap-1 bg-[#d4a843]/10 border border-[#d4a843]/30 text-[#d4a843] font-mono text-[0.68rem] px-2 py-0.5 rounded-sm"
        >
          {pill.label}
          <button
            onClick={pill.remove}
            className="hover:text-[#c0574a] transition-colors leading-none"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

// ── Recipe detail modal ───────────────────────────────────────────────────────
function RecipeModal({ recipe, loading, onClose }) {
  const nutrition = recipe.nutrition ?? {};

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 animate-fade-up"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#1a1a18] border border-[#2e2e2b] rounded-lg w-full max-w-xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 border-b border-[#2e2e2b]">
          <h2 className="font-serif text-xl text-[#e8e6e0] leading-snug">
            {recipe.title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-[#222220] border border-[#2e2e2b] hover:border-[#6b6b67] text-[#6b6b67] hover:text-[#e8e6e0] rounded flex items-center justify-center shrink-0 transition-all font-mono text-sm"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          {/* Meta row */}
          <div className="flex gap-6 mb-5">
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
                <div className="font-mono text-[0.6rem] text-[#6b6b67] uppercase tracking-widest mb-0.5">
                  {label}
                </div>
                <div className="font-mono text-[0.85rem] text-[#d4a843]">
                  {val}
                </div>
              </div>
            ))}
          </div>

          {/* Tags */}
          {(recipe.tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1 mb-5">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[0.62rem] text-[#6b6b67] bg-[#222220] border border-[#2e2e2b] px-1.5 py-0.5 rounded-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Loading skeleton for detail sections */}
          {loading ? (
            <div className="flex flex-col gap-3 animate-pulse">
              <div className="h-2.5 bg-[#222220] rounded w-1/4 mb-2" />
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-2 bg-[#222220] rounded w-full" />
              ))}
              <div className="h-2.5 bg-[#222220] rounded w-1/4 mt-3 mb-2" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-2 bg-[#222220] rounded w-3/4" />
              ))}
            </div>
          ) : (
            <>
              {/* Ingredients */}
              {(recipe.ingredients ?? []).length > 0 && (
                <>
                  <div className="font-mono text-[0.65rem] uppercase tracking-widest text-[#6b6b67] mb-3">
                    Ingredients
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 mb-5">
                    {recipe.ingredients.map((ing, i) => (
                      <div
                        key={i}
                        className="flex items-baseline gap-1.5 border-b border-[#222220] py-1.5"
                      >
                        <span className="font-mono text-[0.68rem] text-[#d4a843] shrink-0">
                          {ing.amount ? `${ing.amount} ${ing.unit}`.trim() : ""}
                        </span>
                        <span className="text-[0.82rem] text-[#a8a6a0] font-light">
                          {ing.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Instructions */}
              {(recipe.instructions ?? []).length > 0 && (
                <>
                  <div className="font-mono text-[0.65rem] uppercase tracking-widest text-[#6b6b67] mb-3">
                    Steps
                  </div>
                  <div className="flex flex-col gap-3">
                    {recipe.instructions.map((step) => (
                      <div
                        key={step.step_num}
                        className="flex gap-3 text-sm text-[#a8a6a0] font-light leading-relaxed"
                      >
                        <span className="font-mono text-[0.68rem] text-[#8a6e2a] shrink-0 mt-0.5">
                          {String(step.step_num).padStart(2, "0")}
                        </span>
                        <span>{step.description}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Fallback for mock data */}
              {!recipe.ingredients && !recipe.instructions && (
                <p className="font-mono text-[0.72rem] text-[#6b6b67] text-center py-6">
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