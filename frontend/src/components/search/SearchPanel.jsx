import { useCallback, useEffect, useRef, useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";
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
  fontFamily: '"DM Sans", sans-serif',
  borderRadius: "0.375rem",
  padding: "0.625rem 1rem",
  outline: "none",
  transition: "border-color 0.15s",
};

export default function SearchPanel({ filters, onResults, onLoading }) {
  const [tab, setTab] = useState("name");
  const [query, setQuery] = useState("");
  const [ingredient, setIng] = useState("");
  const [ingredients, setIngs] = useState([]);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  // Keep a ref to latest filters so async callbacks always read fresh values
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  function buildFilters() {
    const f = filtersRef.current;
    const out = {};
    if (f.perPage) out.number = parseInt(f.perPage);
    if (f.maxTime !== "any") out.maxTime = parseInt(f.maxTime);
    if ((f.diet ?? []).length) out.diet = f.diet;
    if ((f.cuisine ?? []).length) out.cuisine = f.cuisine;
    return out;
  }

  async function post(body) {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const res = await fetch(`${API}/recipes/search/`, {
      method: "POST",
      signal: abortRef.current.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ ...body, filters: buildFilters() }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? `Server error ${res.status}`);
    }
    return res.json();
  }

  async function searchByName(q = query) {
    // allow empty query — backend handles filter-only browse
    setError(null);
    onLoading(true);
    try {
      const data = await post({ query: q.trim() });
      onResults(data.results ?? [], data.total ?? 0);
    } catch (e) {
      if (e.name === "AbortError") return;
      setError(e.message);
      onResults([], 0);
    } finally {
      onLoading(false);
    }
  }

  async function searchByIngredients() {
    if (!ingredients.length) return;
    setError(null);
    onLoading(true);
    try {
      const data = await post({ ingredients });
      onResults(data.results ?? [], data.total ?? 0);
    } catch (e) {
      if (e.name === "AbortError") return;
      setError(e.message);
      onResults([], 0);
    } finally {
      onLoading(false);
    }
  }

  const debouncedSearch = useCallback(
    (value) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!value.trim()) return;
      debounceRef.current = setTimeout(() => searchByName(value), DEBOUNCE_MS);
    },
    [filters],
  );

  // Re-run last search when filters change
  const queryRef = useRef(query);
  const ingredientsRef = useRef(ingredients);
  useEffect(() => {
    queryRef.current = query;
  }, [query]);
  useEffect(() => {
    ingredientsRef.current = ingredients;
  }, [ingredients]);

  useEffect(() => {
    const q = queryRef.current.trim();
    const ing = ingredientsRef.current;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (tab === "ingredients" && ing.length) searchByIngredients();
      else searchByName(q); // fires with empty query for filter-only browse
    }, 300);
  }, [filters]);

  function handleQueryChange(e) {
    setQuery(e.target.value);
    debouncedSearch(e.target.value);
  }

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
      {/* Tabs */}
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
              fontFamily: '"DM Sans", sans-serif',
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

      {error && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.625rem 1rem",
            backgroundColor:
              "color-mix(in srgb, var(--error) 10%, transparent)",
            border:
              "1px solid color-mix(in srgb, var(--error) 30%, transparent)",
            borderRadius: "0.375rem",
            fontFamily: '"DM Mono", monospace',
            fontSize: "0.72rem",
            color: "var(--error)",
          }}
        >
          {error}
        </div>
      )}

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
                searchByName();
              }
            }}
          />
          <button
            onClick={() => {
              if (debounceRef.current) clearTimeout(debounceRef.current);
              searchByName();
            }}
            style={{
              backgroundColor: "var(--accent)",
              color: "#111110",
              fontFamily: '"DM Mono", monospace',
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
                      fontFamily: '"DM Mono", monospace',
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
              onClick={searchByIngredients}
              disabled={!ingredients.length}
              style={{
                backgroundColor: "var(--accent)",
                color: "#111110",
                fontFamily: '"DM Mono", monospace',
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
