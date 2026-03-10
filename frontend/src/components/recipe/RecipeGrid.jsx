import RecipeCard from './RecipeCard'

const MOCK = [
  { id: 1, title: 'Fattoush Salad',        readyInMinutes: 20, servings: 4, vegan: true,  glutenFree: true, cuisines: ['middle eastern'] },
  { id: 2, title: 'Grilled Lemon Chicken', readyInMinutes: 35, servings: 2, cuisines: ['mediterranean'] },
  { id: 3, title: 'Red Lentil Soup',       readyInMinutes: 25, servings: 6, vegan: true,  glutenFree: true },
  { id: 4, title: 'Chicken Shawarma Bowl', readyInMinutes: 45, servings: 3, cuisines: ['middle eastern'] },
  { id: 5, title: 'Shakshuka',             readyInMinutes: 22, servings: 2, vegetarian: true, glutenFree: true },
  { id: 6, title: 'Koshari',               readyInMinutes: 55, servings: 5, vegan: true,  cuisines: ['egyptian'] },
]

function Skeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-[#1a1a18] border border-[#2e2e2b] rounded-md overflow-hidden animate-pulse">
          <div className="h-36 bg-[#222220]" />
          <div className="p-3.5 flex flex-col gap-2">
            <div className="h-3 bg-[#222220] rounded w-3/4" />
            <div className="h-2.5 bg-[#222220] rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function RecipeGrid({ recipes, loading, total, layout = 'grid', onCardClick }) {
  if (loading) return <Skeleton />

  const items  = recipes.length > 0 ? recipes : MOCK
  const isMock = recipes.length === 0 && total === 0

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-[#2e2e2b]" />
        <span className="font-mono text-[0.65rem] text-[#6b6b67] tracking-widest">
          {isMock ? 'trending recipes' : `${total} results`}
        </span>
        <div className="flex-1 h-px bg-[#2e2e2b]" />
      </div>

      {!loading && recipes.length === 0 && total > 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3 opacity-20">🍽</div>
          <p className="font-serif text-lg text-[#a8a6a0] mb-1">No recipes found</p>
          <p className="font-mono text-[0.72rem] text-[#6b6b67]">try different ingredients or filters</p>
        </div>
      ) : (
        <div className={layout === 'list' ? 'flex flex-col gap-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'}>
          {items.map((r, i) => (
            <RecipeCard key={r.id} recipe={r} index={i} onClick={() => onCardClick?.(r)} />
          ))}
        </div>
      )}
    </div>
  )
}
