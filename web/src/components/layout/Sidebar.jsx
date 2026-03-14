import { useState } from "react";

const DIETARY_FILTERS = [
  { slug: "vegetarian", label: "Vegetarian" },
  { slug: "vegan", label: "Vegan" },
  { slug: "gluten-free", label: "Gluten-Free" },
  { slug: "halal", label: "Halal" },
  { slug: "keto", label: "Keto" },
  { slug: "paleo", label: "Paleo" },
  { slug: "kosher", label: "Kosher" },
];

const CUISINE_FILTERS = [
  { slug: "middle eastern", label: "Middle Eastern" },
  { slug: "italian", label: "Italian" },
  { slug: "asian", label: "Asian" },
  { slug: "mediterranean", label: "Mediterranean" },
  { slug: "american", label: "American" },
  { slug: "mexican", label: "Mexican" },
];

export default function Sidebar({ filters, onChange }) {
  const [section, setSection] = useState("filters");

  function toggleFilter(type, slug) {
    const current = filters[type] ?? [];
    onChange({
      ...filters,
      [type]: current.includes(slug)
        ? current.filter((s) => s !== slug)
        : [...current, slug],
    });
  }

  function isOn(type, slug) {
    return (filters[type] ?? []).includes(slug);
  }

  const hasActive =
    filters.maxTime !== "any" ||
    (filters.diet ?? []).length > 0 ||
    (filters.cuisine ?? []).length > 0;

  return (
    <aside
      style={{
        width: "200px",
        flexShrink: 0,
        borderRight: "1px solid var(--border)",
        backgroundColor: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflowY: "auto",
      }}
    >
      {/* Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
          height: "2.5rem",
        }}
      >
        {[
          ["filters", "FILTERS"],
          ["settings", "SETTINGS"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              fontSize: "0.625rem",
              letterSpacing: "0.12em",
              fontWeight: 400,
              color: section === key ? "var(--accent)" : "var(--text-dim)",
              borderBottom:
                section === key
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
              marginBottom: "-1px",
              transition: "color 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {section === "filters" && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <FilterLabel>TIME</FilterLabel>
          {[
            ["any", "Any time"],
            ["30", "< 30 min"],
            ["15", "< 15 min"],
          ].map(([val, label]) => (
            <FilterItem
              key={val}
              active={filters.maxTime === val}
              onClick={() => onChange({ ...filters, maxTime: val })}
            >
              {label}
            </FilterItem>
          ))}

          <FilterLabel>DIET</FilterLabel>
          {DIETARY_FILTERS.map(({ slug, label }) => (
            <FilterItem
              key={slug}
              active={isOn("diet", slug)}
              onClick={() => toggleFilter("diet", slug)}
            >
              {label}
            </FilterItem>
          ))}

          <FilterLabel>CUISINE</FilterLabel>
          {CUISINE_FILTERS.map(({ slug, label }) => (
            <FilterItem
              key={slug}
              active={isOn("cuisine", slug)}
              onClick={() => toggleFilter("cuisine", slug)}
            >
              {label}
            </FilterItem>
          ))}

          {hasActive && (
            <div style={{ padding: "0.75rem 1rem 0.5rem" }}>
              <button
                onClick={() =>
                  onChange({
                    ...filters,
                    maxTime: "any",
                    diet: [],
                    cuisine: [],
                  })
                }
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.625rem",
                  color: "var(--error)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  letterSpacing: "0.04em",
                }}
              >
                ✕ clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {section === "settings" && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <FilterLabel>DISPLAY</FilterLabel>
          <FilterItem
            active={filters.layout === "grid"}
            onClick={() => onChange({ ...filters, layout: "grid" })}
          >
            ⊞ Grid view
          </FilterItem>
          <FilterItem
            active={filters.layout === "list"}
            onClick={() => onChange({ ...filters, layout: "list" })}
          >
            ☰ List view
          </FilterItem>

          <FilterLabel>RESULTS</FilterLabel>
          {[
            ["12", "12 per page"],
            ["24", "24 per page"],
            ["48", "48 per page"],
          ].map(([val, label]) => (
            <FilterItem
              key={val}
              active={filters.perPage === val}
              onClick={() => onChange({ ...filters, perPage: val })}
            >
              {label}
            </FilterItem>
          ))}

          <FilterLabel>PREFERENCES</FilterLabel>
          <FilterItem
            active={filters.useMyDiet}
            onClick={() =>
              onChange({ ...filters, useMyDiet: !filters.useMyDiet })
            }
          >
            Use my diet profile
          </FilterItem>
          <FilterItem
            active={filters.useMyAllergies}
            onClick={() =>
              onChange({ ...filters, useMyAllergies: !filters.useMyAllergies })
            }
          >
            Exclude my allergies
          </FilterItem>
        </div>
      )}
    </aside>
  );
}

function FilterLabel({ children }) {
  return (
    <div
      style={{
        fontFamily: "Inter, sans-serif",
        fontSize: "0.625rem",
        letterSpacing: "0.12em",
        color: "var(--text-dim)",
        padding: "0.75rem 1rem 0.375rem",
      }}
    >
      {children}
    </div>
  );
}

function FilterItem({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        textAlign: "left",
        padding: "0.5rem 1rem",
        fontFamily: "Inter, sans-serif",
        fontSize: "0.8125rem",
        fontWeight: active ? 500 : 400,
        background: active ? "rgba(212,168,67,0.08)" : "none",
        border: "none",
        borderLeft: active
          ? "2px solid var(--accent)"
          : "2px solid transparent",
        color: active ? "var(--accent)" : "var(--text-muted)",
        cursor: "pointer",
        transition: "all 0.1s",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--text)";
          e.currentTarget.style.backgroundColor = "var(--bg-hover)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = "var(--text-muted)";
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
    >
      {children}
    </button>
  );
}
