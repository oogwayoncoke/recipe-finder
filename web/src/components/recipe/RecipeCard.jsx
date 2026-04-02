export default function RecipeCard({ recipe, onClick, onHover, onHoverEnd, index = 0 }) {
  const image = recipe.image_url
  const time  = recipe.ready_in_minutes
  const tags  = (recipe.tags ?? []).slice(0, 3)

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '0.25rem',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.15s',
        animationDelay: `${index * 0.04}s`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--border-2)'
        // Kick off the detail prefetch as soon as the user hovers
        onHover?.(recipe)
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        onHoverEnd?.(recipe)
      }}
    >
      {/* Image + content — clickable area */}
      <div onClick={onClick} style={{ cursor: 'pointer', flex: 1 }}>
        {image ? (
          <img
            src={image}
            alt={recipe.title}
            loading="lazy"
            style={{
              width: '100%',
              height: '6.875rem',
              objectFit: 'cover',
              display: 'block',
              backgroundColor: 'var(--bg-hover)',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '6.875rem',
              backgroundColor: '#22221f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                border: '1px solid var(--border-2)',
                opacity: 0.3,
              }}
            />
          </div>
        )}

        <div style={{ padding: '0.6875rem 0.6875rem 0.375rem' }}>
          <h3
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.8125rem',
              fontWeight: 400,
              color: 'var(--text)',
              lineHeight: 1.35,
              marginBottom: '0.5rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {recipe.title ?? 'Untitled'}
          </h3>

          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.625rem',
              color: 'var(--text-dim)',
              marginBottom: '0.5rem',
              whiteSpace: 'pre',
            }}
          >
            {`● ${time ? `${time} min` : '—'}  ● ${recipe.servings ?? '—'} srv`}
          </p>

          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
              {tags.map(tag => (
                <span
                  key={tag}
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.625rem',
                    color: 'var(--text-dim)',
                    backgroundColor: 'var(--bg-hover)',
                    border: '1px solid var(--border)',
                    padding: '0.1875rem 0.5rem',
                    borderRadius: '0.125rem',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View recipe CTA */}
      <button
        onClick={onClick}
        style={{
          width: '100%',
          padding: '0.625rem',
          backgroundColor: 'var(--bg-hover)',
          borderTop: '1px solid var(--border)',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.625rem',
          letterSpacing: '0.05em',
          color: 'var(--text-dim)',
          transition: 'color 0.15s',
          minHeight: '2.375rem',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
      >
        view recipe
      </button>
    </div>
  )
}
