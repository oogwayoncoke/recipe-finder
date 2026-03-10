export default function RecipeCard({ recipe, onClick, index = 0 }) {
  // Backend returns snake_case fields from RecipeSerializer
  const image = recipe.image_url;
  const time = recipe.ready_in_minutes;
  const tags = (recipe.tags ?? []).slice(0, 3);

  return (
    <div
      onClick={onClick}
      style={{ animationDelay: `${index * 0.04}s` }}
      className="bg-[#1a1a18] border border-[#2e2e2b] rounded-md overflow-hidden cursor-pointer hover:border-[#8a6e2a] hover:-translate-y-0.5 transition-all duration-150 animate-fade-up"
    >
      {image ? (
        <img
          src={image}
          alt={recipe.title}
          className="w-full h-36 object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-36 bg-[#222220] flex items-center justify-center text-3xl opacity-20">
          🍽
        </div>
      )}

      <div className="p-3.5">
        <h3 className="font-serif text-[0.95rem] text-[#e8e6e0] leading-snug mb-2 line-clamp-2">
          {recipe.title ?? "Untitled"}
        </h3>

        <div className="flex gap-3 mb-2.5">
          <span className="font-mono text-[0.65rem] text-[#6b6b67]">
            <span className="text-[#d4a843]">●</span>{" "}
            {time ? `${time} min` : "—"}
          </span>
          <span className="font-mono text-[0.65rem] text-[#6b6b67]">
            <span className="text-[#d4a843]">●</span> {recipe.servings ?? "—"}{" "}
            srv
          </span>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-[0.6rem] text-[#6b6b67] bg-[#222220] border border-[#2e2e2b] px-1.5 py-0.5 rounded-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}