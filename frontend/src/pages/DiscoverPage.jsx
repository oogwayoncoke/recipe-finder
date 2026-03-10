import { useState } from 'react'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import SearchPanel from '../components/search/SearchPanel'
import RecipeGrid from '../components/recipe/RecipeGrid'

const DEFAULT_FILTERS = {
  maxTime:  'any',
  diet:     [],
  cuisine:  [],
  layout:   'grid',
  perPage:  '12',
}

export default function DiscoverPage() {
  const [filters, setFilters]   = useState(DEFAULT_FILTERS)
  const [recipes, setRecipes]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [total, setTotal]       = useState(0)
  const [selected, setSelected] = useState(null)

  // Active filter pills derived from state
  const pills = [
    ...(filters.diet    ?? []).map(d => ({ label: d,            remove: () => setFilters(f => ({ ...f, diet:    f.diet.filter(x => x !== d) })) })),
    ...(filters.cuisine ?? []).map(c => ({ label: c,            remove: () => setFilters(f => ({ ...f, cuisine: f.cuisine.filter(x => x !== c) })) })),
    filters.maxTime !== 'any' && { label: `< ${filters.maxTime} min`, remove: () => setFilters(f => ({ ...f, maxTime: 'any' })) },
  ].filter(Boolean)

  return (
    <div className="min-h-screen bg-[#111110] flex flex-col">
      <Navbar />

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
        <Sidebar filters={filters} onChange={setFilters} />

        <main className="flex-1 overflow-y-auto px-8 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-serif text-[1.9rem] text-[#e8e6e0] leading-tight mb-0.5">
              Find your next <span className="text-[#d4a843] italic">dish.</span>
            </h1>
            <p className="font-mono text-[0.68rem] text-[#6b6b67] tracking-widest">
              // search by name or drop ingredients below
            </p>
          </div>

          {/* Search */}
          <SearchPanel
            filters={filters}
            onResults={(r, t) => { setRecipes(r); setTotal(t) }}
            onLoading={setLoading}
          />

          {/* Active filter pills */}
          {pills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {pills.map((pill, i) => (
                <span key={i} className="flex items-center gap-1 bg-[#d4a843]/10 border border-[#d4a843]/30 text-[#d4a843] font-mono text-[0.68rem] px-2 py-0.5 rounded-sm">
                  {pill.label}
                  <button onClick={pill.remove} className="hover:text-[#c0574a] transition-colors leading-none">×</button>
                </span>
              ))}
            </div>
          )}

          {/* Grid */}
          <RecipeGrid
            recipes={recipes}
            loading={loading}
            total={total}
            layout={filters.layout}
            onCardClick={setSelected}
          />
        </main>
      </div>

      {/* Detail modal */}
      {selected && <RecipeModal recipe={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function RecipeModal({ recipe, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#1a1a18] border border-[#2e2e2b] rounded-lg w-full max-w-xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 p-5 border-b border-[#2e2e2b]">
          <h2 className="font-serif text-xl text-[#e8e6e0] leading-snug">{recipe.title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-[#222220] border border-[#2e2e2b] hover:border-[#6b6b67] text-[#6b6b67] hover:text-[#e8e6e0] rounded flex items-center justify-center flex-shrink-0 transition-all font-mono text-sm"
          >✕</button>
        </div>

        <div className="p-5">
          {/* Meta */}
          <div className="flex gap-6 mb-5">
            {[
              ['Time',     recipe.readyInMinutes ? `${recipe.readyInMinutes} min` : '—'],
              ['Servings', recipe.servings ?? '—'],
            ].map(([label, val]) => (
              <div key={label}>
                <div className="font-mono text-[0.6rem] text-[#6b6b67] uppercase tracking-widest mb-0.5">{label}</div>
                <div className="font-mono text-[0.85rem] text-[#d4a843]">{val}</div>
              </div>
            ))}
          </div>

          {/* Summary */}
          {recipe.summary && (
            <p
              className="text-sm text-[#6b6b67] font-light leading-relaxed mb-5 line-clamp-4"
              dangerouslySetInnerHTML={{ __html: recipe.summary }}
            />
          )}

          {/* Ingredients */}
          {recipe.extendedIngredients?.length > 0 && (
            <>
              <div className="font-mono text-[0.65rem] uppercase tracking-widest text-[#6b6b67] mb-3">Ingredients</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-5">
                {recipe.extendedIngredients.map((ing, i) => (
                  <div key={i} className="flex items-baseline gap-1.5 border-b border-[#222220] py-1.5">
                    <span className="font-mono text-[0.68rem] text-[#d4a843] flex-shrink-0">
                      {ing.measures?.metric?.amount?.toFixed(0)} {ing.measures?.metric?.unitShort}
                    </span>
                    <span className="text-[0.82rem] text-[#a8a6a0] font-light">{ing.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Steps */}
          {recipe.analyzedInstructions?.[0]?.steps?.length > 0 && (
            <>
              <div className="font-mono text-[0.65rem] uppercase tracking-widest text-[#6b6b67] mb-3">Steps</div>
              <div className="flex flex-col gap-3">
                {recipe.analyzedInstructions[0].steps.map(step => (
                  <div key={step.number} className="flex gap-3 text-sm text-[#a8a6a0] font-light leading-relaxed">
                    <span className="font-mono text-[0.68rem] text-[#8a6e2a] flex-shrink-0 mt-0.5">
                      {String(step.number).padStart(2, '0')}
                    </span>
                    <span>{step.step}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Fallback for mock cards */}
          {!recipe.extendedIngredients && !recipe.analyzedInstructions && (
            <p className="font-mono text-[0.72rem] text-[#6b6b67] text-center py-6">
              Full details load once Spoonacular API key is set.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
