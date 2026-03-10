import { useState } from 'react'

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

function getToken() {
  return localStorage.getItem("access") ?? "";
}

export default function SearchPanel({ filters, onResults, onLoading }) {
  const [tab, setTab] = useState("name");
  const [query, setQuery] = useState("");
  const [ingredient, setIng] = useState("");
  const [ingredients, setIngs] = useState([]);
  const [error, setError] = useState(null);

  function buildFilters() {
    const f = {};
    if (filters.perPage) f.number = parseInt(filters.perPage);
    if (filters.maxTime !== "any") f.maxTime = parseInt(filters.maxTime);
    if ((filters.diet ?? []).length) f.diet = filters.diet;
    if ((filters.cuisine ?? []).length) f.cuisine = filters.cuisine;
    return f;
  }

  async function post(body) {
    const res = await fetch(`${API}/recipes/search/`, {
      method: "POST",
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

  async function searchByName() {
    if (!query.trim()) return;
    setError(null);
    onLoading(true);
    try {
      const data = await post({ query: query.trim() });
      onResults(data.results ?? [], data.total ?? 0);
    } catch (e) {
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
      setError(e.message);
      onResults([], 0);
    } finally {
      onLoading(false);
    }
  }

  function addIngredient() {
    const val = ingredient.trim().toLowerCase();
    if (!val || ingredients.includes(val)) return;
    setIngs((p) => [...p, val]);
    setIng("");
  }

  return (
    <div className="mb-6">
      <div className="flex border-b border-[#2e2e2b] mb-5">
        {[
          ["name", "By dish name"],
          ["ingredients", "By ingredients"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={[
              "px-5 py-2.5 text-sm font-sans -mb-px border-b-2 transition-colors",
              tab === key
                ? "text-[#e8e6e0] border-[#d4a843]"
                : "text-[#6b6b67] border-transparent hover:text-[#a8a6a0]",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 px-4 py-2.5 bg-[#c0574a]/10 border border-[#c0574a]/30 rounded-md font-mono text-[0.72rem] text-[#c0574a]">
          {error}
        </div>
      )}

      {tab === "name" && (
        <div className="flex gap-2">
          <input
            className="flex-1 bg-[#1a1a18] border border-[#2e2e2b] focus:border-[#8a6e2a] text-[#e8e6e0] text-sm font-light placeholder-[#3e3e3b] rounded-md px-4 py-2.5 outline-none transition-colors"
            placeholder="e.g. chicken shawarma, lentil soup…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchByName()}
          />
          <button
            onClick={searchByName}
            className="bg-[#d4a843] text-[#111110] font-mono text-[0.78rem] font-medium tracking-wider px-5 py-2.5 rounded-md hover:opacity-85 transition-opacity whitespace-nowrap"
          >
            Search →
          </button>
        </div>
      )}

      {tab === "ingredients" && (
        <div className="flex flex-col gap-3">
          <div className="bg-[#1a1a18] border border-[#2e2e2b] focus-within:border-[#8a6e2a] rounded-md px-4 py-3 transition-colors">
            <div className="flex items-center gap-2 mb-2.5">
              <input
                className="flex-1 bg-transparent text-[#e8e6e0] text-sm font-light placeholder-[#3e3e3b] outline-none"
                placeholder="Add ingredient and press Enter…"
                value={ingredient}
                onChange={(e) => setIng(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addIngredient())
                }
              />
              <button
                onClick={addIngredient}
                className="w-6 h-6 bg-[#222220] border border-[#3e3e3b] hover:border-[#d4a843] hover:text-[#d4a843] text-[#6b6b67] rounded flex items-center justify-center text-sm transition-colors"
              >
                +
              </button>
            </div>
            {ingredients.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {ingredients.map((ing) => (
                  <span
                    key={ing}
                    className="flex items-center gap-1 bg-[#d4a843]/10 border border-[#d4a843]/40 text-[#d4a843] font-mono text-[0.7rem] px-2 py-0.5 rounded-sm"
                  >
                    {ing}
                    <button
                      onClick={() => setIngs((p) => p.filter((i) => i !== ing))}
                      className="hover:text-[#c0574a] transition-colors leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <button
              onClick={searchByIngredients}
              disabled={!ingredients.length}
              className="bg-[#d4a843] text-[#111110] font-mono text-[0.78rem] font-medium tracking-wider px-5 py-2.5 rounded-md hover:opacity-85 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
            >
              Find recipes →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}