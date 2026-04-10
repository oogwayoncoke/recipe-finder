import { useEffect, useRef, useState } from "react";
import { useToast } from "../../context/ToastContext";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const DEBOUNCE_MS = 500;

function getToken() {
  return localStorage.getItem("access") ?? "";
}

const inputStyle = {
  flex: 1,
  backgroundColor: "var(--bg-input)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  fontSize: "0.875rem",
  fontWeight: 300,
  fontFamily: "Inter, sans-serif",
  borderRadius: "0.375rem",
  padding: "0.625rem 1rem",
  outline: "none",
  transition: "border-color 0.15s",
};

// Build the filters object to send to the backend.
// Takes the current filters and userPrefs as direct arguments — never reads
// from a ref — so the values are always exactly what triggered this search.
function buildFilters(filters, userPrefs) {
  const out = {};

  if (filters.perPage) out.number = parseInt(filters.perPage);
  if (filters.maxTime !== "any") out.maxTime = parseInt(filters.maxTime);

  const dietSet = new Set(filters.diet ?? []);
  const cuisineSet = new Set(filters.cuisine ?? []);

  // "Use my diet profile" — merge the user's saved diets into the diet filter
  if (filters.useMyDiet) {
    (userPrefs?.diets ?? []).forEach((d) => dietSet.add(d.toLowerCase()));
  }

  // "Exclude my allergies" — sent as intolerances only.
  // Do NOT add to dietSet — diet tags are "vegan", "halal" etc.
  // Adding "eggs" to diet causes the DB tag filter to return 0 results
  // and bail out before the intolerance exclude ever runs.
  if (filters.useMyAllergies) {
    const allergyList = (userPrefs?.allergies ?? []).map((a) =>
      a.toLowerCase(),
    );
    if (allergyList.length) out.intolerances = allergyList;
  }

  if (dietSet.size) out.diet = [...dietSet];
  if (cuisineSet.size) out.cuisine = [...cuisineSet];

  return out;
}

export default function SearchPanel({
  filters,
  onResults,
  onLoading,
  userPrefs,
}) {
  const { showToast } = useToast();
  const [tab, setTab] = useState("name");
  const [query, setQuery] = useState("");
  const [ingredient, setIng] = useState("");
  const [ingredients, setIngs] = useState([]);

  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  // Refs only for values the debounce timer needs to read after a delay.
  // filters and userPrefs are passed directly into every search call instead.
  const queryRef = useRef(query);
  const ingredientsRef = useRef(ingredients);
  useEffect(() => {
    queryRef.current = query;
  }, [query]);
  useEffect(() => {
    ingredientsRef.current = ingredients;
  }, [ingredients]);

  // ── Core fetch ─────────────────────────────────────────────────────────────
  async function post(body, currentFilters, currentPrefs) {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    const res = await fetch(`${API}/recipes/search/`, {
      method: "POST",
      signal: abortRef.current.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        ...body,
        filters: buildFilters(currentFilters, currentPrefs),
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? `Server error ${res.status}`);
    }
    return res.json();
  }

  // ── Search functions — always receive current filters + prefs as args ──────
  async function searchByName(q, currentFilters, currentPrefs) {
    onLoading(true);
    try {
      const data = await post(
        { query: (q ?? "").trim() },
        currentFilters,
        currentPrefs,
      );
      onResults(data.results ?? [], data.total ?? 0);
    } catch (e) {
      if (e.name === "AbortError") return;
      showToast(
        "Search failed. Please check your connection and try again.",
        "error",
      );
      onResults([], 0);
    } finally {
      onLoading(false);
    }
  }

  async function searchByIngredients(currentFilters, currentPrefs) {
    const ing = ingredientsRef.current;
    if (!ing.length) return;
    onLoading(true);
    try {
      const data = await post(
        { ingredients: ing },
        currentFilters,
        currentPrefs,
      );
      onResults(data.results ?? [], data.total ?? 0);
    } catch (e) {
      if (e.name === "AbortError") return;
      showToast(
        "Search failed. Please check your connection and try again.",
        "error",
      );
      onResults([], 0);
    } finally {
      onLoading(false);
    }
  }

  // ── Re-run search when filters or userPrefs change ─────────────────────────
  // filters and userPrefs are captured directly in this effect's closure —
  // they are exactly the values that triggered this render, so there is no
  // stale-closure problem here. No ref indirection needed.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (tab === "ingredients" && ingredientsRef.current.length) {
        searchByIngredients(filters, userPrefs);
      } else {
        searchByName(queryRef.current, filters, userPrefs);
      }
    }, 300);
  }, [filters, userPrefs]);

  // ── Debounced typing handler ───────────────────────────────────────────────
  function handleQueryChange(e) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) return;
    debounceRef.current = setTimeout(() => {
      searchByName(val, filters, userPrefs);
    }, DEBOUNCE_MS);
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────
  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    },
    [],
  );

  function addIngredient() {
    const val = ingredient.trim().toLowerCase();
    if (!val || ingredients.includes(val)) return;
    setIngs((p) => [...p, val]);
    setIng("");
  }

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border)",
          marginBottom: "1.25rem",
        }}
      >
        {[
          ["name", "By dish name"],
          ["ingredients", "By ingredients"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "0.625rem 1.25rem",
              fontSize: "0.875rem",
              fontFamily: "Inter, sans-serif",
              background: "none",
              border: "none",
              cursor: "pointer",
              borderBottom:
                tab === key
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
              color: tab === key ? "var(--text)" : "var(--text-dim)",
              marginBottom: "-1px",
              transition: "color 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "name" && (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            style={inputStyle}
            placeholder="e.g. chicken shawarma, lentil soup…"
            value={query}
            onChange={handleQueryChange}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent-dim)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (debounceRef.current) clearTimeout(debounceRef.current);
                searchByName(query, filters, userPrefs);
              }
            }}
          />
          <button
            onClick={() => {
              if (debounceRef.current) clearTimeout(debounceRef.current);
              searchByName(query, filters, userPrefs);
            }}
            style={{
              backgroundColor: "var(--accent)",
              color: "#111110",
              fontFamily: "Inter, sans-serif",
              fontSize: "0.78rem",
              fontWeight: 500,
              letterSpacing: "0.05em",
              padding: "0.625rem 1.25rem",
              borderRadius: "0.375rem",
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Search →
          </button>
        </div>
      )}

      {tab === "ingredients" && (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <div
            style={{
              backgroundColor: "var(--bg-input)",
              border: "1px solid var(--border)",
              borderRadius: "0.375rem",
              padding: "0.75rem 1rem",
              transition: "border-color 0.15s",
            }}
            onFocusCapture={(e) =>
              (e.currentTarget.style.borderColor = "var(--accent-dim)")
            }
            onBlurCapture={(e) =>
              (e.currentTarget.style.borderColor = "var(--border)")
            }
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: ingredients.length ? "0.625rem" : 0,
              }}
            >
              <input
                style={{
                  ...inputStyle,
                  border: "none",
                  padding: 0,
                  backgroundColor: "transparent",
                }}
                placeholder="Add ingredient and press Enter…"
                value={ingredient}
                onChange={(e) => setIng(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addIngredient())
                }
              />
              <button
                onClick={addIngredient}
                style={{
                  width: "1.5rem",
                  height: "1.5rem",
                  flexShrink: 0,
                  backgroundColor: "var(--bg-hover)",
                  border: "1px solid var(--border-2)",
                  borderRadius: "0.25rem",
                  color: "var(--text-dim)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.875rem",
                  transition: "all 0.1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.color = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-2)";
                  e.currentTarget.style.color = "var(--text-dim)";
                }}
              >
                +
              </button>
            </div>
            {ingredients.length > 0 && (
              <div
                style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}
              >
                {ingredients.map((ing) => (
                  <span
                    key={ing}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      backgroundColor:
                        "color-mix(in srgb, var(--accent) 10%, transparent)",
                      border:
                        "1px solid color-mix(in srgb, var(--accent) 40%, transparent)",
                      color: "var(--accent)",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.7rem",
                      padding: "0.125rem 0.5rem",
                      borderRadius: "0.125rem",
                    }}
                  >
                    {ing}
                    <button
                      onClick={() => setIngs((p) => p.filter((i) => i !== ing))}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "inherit",
                        opacity: 0.7,
                        lineHeight: 1,
                        padding: 0,
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => searchByIngredients(filters, userPrefs)}
              disabled={!ingredients.length}
              style={{
                backgroundColor: "var(--accent)",
                color: "#111110",
                fontFamily: "Inter, sans-serif",
                fontSize: "0.78rem",
                fontWeight: 500,
                letterSpacing: "0.05em",
                padding: "0.625rem 1.25rem",
                borderRadius: "0.375rem",
                border: "none",
                cursor: "pointer",
                opacity: ingredients.length ? 1 : 0.3,
                transition: "opacity 0.15s",
              }}
            >
              Find recipes →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
