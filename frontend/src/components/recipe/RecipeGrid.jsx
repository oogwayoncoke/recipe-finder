import RecipeCard from "./RecipeCard";

const MOCK_RECIPES = [
  {
    id: 1,
    title: "Fattoush Salad",
    ready_in_minutes: 20,
    servings: 4,
    tags: ["vegan", "gluten-free", "middle eastern"],
  },
  {
    id: 2,
    title: "Grilled Lemon Chicken",
    ready_in_minutes: 35,
    servings: 2,
    tags: ["mediterranean"],
  },
  {
    id: 3,
    title: "Red Lentil Soup",
    ready_in_minutes: 25,
    servings: 6,
    tags: ["vegan", "gluten-free"],
  },
  {
    id: 4,
    title: "Chicken Shawarma Bowl",
    ready_in_minutes: 45,
    servings: 3,
    tags: ["middle eastern"],
  },
  {
    id: 5,
    title: "Shakshuka",
    ready_in_minutes: 22,
    servings: 2,
    tags: ["vegetarian", "gluten-free"],
  },
  {
    id: 6,
    title: "Koshari",
    ready_in_minutes: 55,
    servings: 5,
    tags: ["vegan", "egyptian"],
  },
];

export default function RecipeGrid({
  recipes,
  loading,
  total,
  layout = "grid",
  onCardClick,
}) {
  const isMock = recipes.length === 0 && total === 0;
  const items = isMock ? MOCK_RECIPES : recipes;

  if (loading) return <LoadingGrid />;

  return (
    <div>
      {/* Divider label */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-[#2e2e2b]" />
        <span className="font-mono text-[0.68rem] text-[#6b6b67] tracking-widest">
          {isMock ? "trending recipes" : `${total} results`}
        </span>
        <div className="flex-1 h-px bg-[#2e2e2b]" />
      </div>

      {/* No results state */}
      {!isMock && items.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3 opacity-20">🍽</div>
          <p className="font-serif text-lg text-[#a8a6a0] mb-1">
            No recipes found
          </p>
          <p className="font-mono text-[0.72rem] text-[#6b6b67]">
            try different ingredients or filters
          </p>
        </div>
      ) : (
        <div
          className={
            layout === "list"
              ? "flex flex-col gap-3"
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          }
        >
          {items.map((recipe, i) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              index={i}
              onClick={() => onCardClick?.(recipe)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-[#1a1a18] border border-[#2e2e2b] rounded-md overflow-hidden animate-pulse"
        >
          <div className="h-36 bg-[#222220]" />
          <div className="p-3.5 flex flex-col gap-2">
            <div className="h-3 bg-[#222220] rounded w-3/4" />
            <div className="h-2.5 bg-[#222220] rounded w-1/2" />
            <div className="flex gap-1 mt-1">
              <div className="h-2 bg-[#222220] rounded w-14" />
              <div className="h-2 bg-[#222220] rounded w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}