import { useState } from "react";

const DIETARY_FILTERS = [
  { slug: "vegetarian", label: "Vegetarian" },
  { slug: "vegan", label: "Vegan" },
  { slug: "gluten-free", label: "Gluten-Free" },
  { slug: "dairy-free", label: "Dairy-Free" },
  { slug: "keto", label: "Keto" },
  { slug: "paleo", label: "Paleo" },
  { slug: "halal", label: "Halal" },
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
    const next = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug];
    onChange({ ...filters, [type]: next });
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
        width: "240px",
        flexShrink: 0,
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflowY: "auto",
        backgroundColor: "var(--bg)",
      }}
    >
      {/* Section tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        {[
          ["filters", "Filters"],
          ["settings", "Settings"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            style={{
              flex: 1,
              padding: "0.75rem 0",
              fontFamily: '"DM Mono", monospace',
              fontSize: "0.68rem",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              background: "none",
              border: "none",
              borderBottom:
                section === key
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
              color: section === key ? "var(--accent)" : "var(--text-dim)",
              cursor: "pointer",
              marginBottom: "-1px",
              transition: "color 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {section === "filters" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            paddingTop: "0.5rem",
          }}
        >
          <SidebarLabel>Time</SidebarLabel>
          {[
            ["any", "Any time"],
            ["30", "< 30 min"],
            ["15", "< 15 min"],
          ].map(([val, label]) => (
            <SidebarItem
              key={val}
              active={filters.maxTime === val}
              onClick={() => onChange({ ...filters, maxTime: val })}
            >
              {label}
            </SidebarItem>
          ))}

          <SidebarLabel>Diet</SidebarLabel>
          {DIETARY_FILTERS.map(({ slug, label }) => (
            <SidebarItem
              key={slug}
              active={isOn("diet", slug)}
              onClick={() => toggleFilter("diet", slug)}
              checkbox
            >
              {label}
            </SidebarItem>
          ))}

          <SidebarLabel>Cuisine</SidebarLabel>
          {CUISINE_FILTERS.map(({ slug, label }) => (
            <SidebarItem
              key={slug}
              active={isOn("cuisine", slug)}
              onClick={() => toggleFilter("cuisine", slug)}
              checkbox
            >
              {label}
            </SidebarItem>
          ))}

          {hasActive && (
            <div style={{ padding: "0.75rem 1rem 0.25rem" }}>
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
                  fontFamily: '"DM Mono", monospace',
                  fontSize: "0.65rem",
                  color: "var(--error)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                }}
              >
                ✕ clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {section === "settings" && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            paddingTop: "0.5rem",
          }}
        >
          <SidebarLabel>Display</SidebarLabel>
          <SidebarItem
            active={filters.layout === "grid"}
            onClick={() => onChange({ ...filters, layout: "grid" })}
          >
            ⊞ Grid view
          </SidebarItem>
          <SidebarItem
            active={filters.layout === "list"}
            onClick={() => onChange({ ...filters, layout: "list" })}
          >
            ☰ List view
          </SidebarItem>

          <SidebarLabel>Results</SidebarLabel>
          {[
            ["12", "12 per page"],
            ["24", "24 per page"],
            ["48", "48 per page"],
          ].map(([val, label]) => (
            <SidebarItem
              key={val}
              active={filters.perPage === val}
              onClick={() => onChange({ ...filters, perPage: val })}
            >
              {label}
            </SidebarItem>
          ))}

          <SidebarLabel>Preferences</SidebarLabel>
          <SidebarItem
            active={filters.useMyDiet}
            onClick={() =>
              onChange({ ...filters, useMyDiet: !filters.useMyDiet })
            }
            checkbox
          >
            Use my diet profile
          </SidebarItem>
          <SidebarItem
            active={filters.useMyAllergies}
            onClick={() =>
              onChange({ ...filters, useMyAllergies: !filters.useMyAllergies })
            }
            checkbox
          >
            Exclude my allergies
          </SidebarItem>
        </div>
      )}
    </aside>
  );
}

function SidebarLabel({ children }) {
  return (
    <div
      style={{
        fontFamily: '"DM Mono", monospace',
        fontSize: "0.62rem",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "var(--text-dim)",
        padding: "1rem 1rem 0.375rem",
      }}
    >
      {children}
    </div>
  );
}

function SidebarItem({ children, active, onClick, checkbox }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.625rem",
        width: "100%",
        textAlign: "left",
        padding: "0.5rem 1rem",
        fontSize: "0.83rem",
        fontFamily: '"DM Sans", sans-serif',
        fontWeight: 300,
        background: active
          ? "color-mix(in srgb, var(--accent) 8%, transparent)"
          : "none",
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
      {checkbox && (
        <span
          style={{
            width: "0.875rem",
            height: "0.875rem",
            border: active
              ? "1px solid var(--accent)"
              : "1px solid var(--border-2)",
            borderRadius: "0.125rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: "0.5rem",
            color: "var(--accent)",
            backgroundColor: active
              ? "color-mix(in srgb, var(--accent) 15%, transparent)"
              : "transparent",
            transition: "all 0.1s",
          }}
        >
          {active && "✓"}
        </span>
      )}
      {children}
    </button>
  );
}