import { useState } from 'react'

const DIETARY_FILTERS = [
  { slug: 'vegetarian',  label: 'Vegetarian' },
  { slug: 'vegan',       label: 'Vegan' },
  { slug: 'gluten-free', label: 'Gluten-Free' },
  { slug: 'dairy-free',  label: 'Dairy-Free' },
  { slug: 'keto',        label: 'Keto' },
  { slug: 'paleo',       label: 'Paleo' },
  { slug: 'halal',       label: 'Halal' },
]

const CUISINE_FILTERS = [
  { slug: 'middle eastern', label: 'Middle Eastern' },
  { slug: 'italian',        label: 'Italian' },
  { slug: 'asian',          label: 'Asian' },
  { slug: 'mediterranean',  label: 'Mediterranean' },
  { slug: 'american',       label: 'American' },
  { slug: 'mexican',        label: 'Mexican' },
]

function hasActiveFilters(filters) {
  return (
    filters.maxTime !== 'any' ||
    (filters.diet ?? []).length > 0 ||
    (filters.cuisine ?? []).length > 0
  )
}

function SidebarLabel({ children }) {
  return (
    <div className="font-mono text-[0.62rem] uppercase tracking-widest text-[#6b6b67] px-4 pt-4 pb-1.5">
      {children}
    </div>
  )
}

function SidebarItem({ children, active, onClick, checkbox }) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex items-center gap-2.5 w-full text-left px-4 py-2 text-[0.83rem] font-sans font-light transition-all border-l-2",
        active
          ? "text-[#d4a843] border-l-[#d4a843] bg-[#d4a843]/5"
          : "text-[#a8a6a0] border-l-transparent hover:text-[#e8e6e0] hover:bg-[#1a1a18]",
      ].join(" ")}
    >
      {checkbox && (
        <span
          className={[
            "w-3.5 h-3.5 border rounded-sm flex items-center justify-center shrink-0 transition-colors text-[0.5rem]",
            active
              ? "border-[#d4a843] bg-[#d4a843]/20 text-[#d4a843]"
              : "border-[#3e3e3b]",
          ].join(" ")}
        >
          {active && "✓"}
        </span>
      )}
      {children}
    </button>
  );
}

export default function Sidebar({ filters, onChange }) {
  const [section, setSection] = useState('filters')

  function toggleFilter(type, slug) {
    const current = filters[type] ?? []
    const next = current.includes(slug)
      ? current.filter(s => s !== slug)
      : [...current, slug]
    onChange({ ...filters, [type]: next })
  }

  function isOn(type, slug) {
    return (filters[type] ?? []).includes(slug)
  }

  return (
    <aside className="w-[220px] shrink-0 border-r border-[#2e2e2b] flex flex-col h-full overflow-y-auto bg-[#111110]">
      {/* Tabs */}
      <div className="flex border-b border-[#2e2e2b] shrink-0">
        {[
          ["filters", "Filters"],
          ["settings", "Settings"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            className={[
              "flex-1 py-3 font-mono text-[0.65rem] uppercase tracking-widest transition-colors border-b-2 -mb-px",
              section === key
                ? "text-[#d4a843] border-[#d4a843]"
                : "text-[#6b6b67] border-transparent hover:text-[#a8a6a0]",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {section === "filters" && (
        <div className="flex flex-col py-2">
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

          {hasActiveFilters(filters) && (
            <div className="px-4 pt-3 pb-1">
              <button
                onClick={() =>
                  onChange({
                    ...filters,
                    maxTime: "any",
                    diet: [],
                    cuisine: [],
                  })
                }
                className="font-mono text-[0.65rem] text-[#c0574a] hover:text-[#e8e6e0] transition-colors tracking-wide"
              >
                ✕ clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {section === "settings" && (
        <div className="flex flex-col py-2">
          <SidebarLabel>Display</SidebarLabel>
          <SidebarItem
            active={filters.layout === "grid"}
            onClick={() => onChange({ ...filters, layout: "grid" })}
          >
            ⊞ Grid
          </SidebarItem>
          <SidebarItem
            active={filters.layout === "list"}
            onClick={() => onChange({ ...filters, layout: "list" })}
          >
            ☰ List
          </SidebarItem>

          <SidebarLabel>Results per page</SidebarLabel>
          {[
            ["12", "12"],
            ["24", "24"],
            ["48", "48"],
          ].map(([val, label]) => (
            <SidebarItem
              key={val}
              active={filters.perPage === val}
              onClick={() => onChange({ ...filters, perPage: val })}
            >
              {label} recipes
            </SidebarItem>
          ))}
        </div>
      )}
    </aside>
  );
}
