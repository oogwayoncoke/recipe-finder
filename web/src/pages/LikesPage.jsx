import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import { useToast } from "../context/ToastContext";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function getAuthHeader() {
  const token = localStorage.getItem("access");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function HeartIcon({ filled, size = 13 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "var(--accent)" : "none"}
      stroke={filled ? "var(--accent)" : "var(--text-dim)"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", transition: "fill 0.15s, stroke 0.15s" }}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function SkeletonGrid() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "1rem",
      }}
    >
      <style>{`
        @keyframes likesShimmer {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        .likes-sk {
          background: linear-gradient(90deg, var(--bg-card) 25%, var(--bg-hover) 50%, var(--bg-card) 75%);
          background-size: 600px 100%;
          animation: likesShimmer 1.5s ease-in-out infinite;
          border-radius: 0.25rem;
        }
      `}</style>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "0.25rem",
            overflow: "hidden",
          }}
        >
          <div className="likes-sk" style={{ height: "6.875rem" }} />
          <div
            style={{
              padding: "0.6875rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <div
              className="likes-sk"
              style={{ height: "0.7rem", width: "80%" }}
            />
            <div
              className="likes-sk"
              style={{ height: "0.6rem", width: "50%" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LikesPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  // track which external_ids are still saved so heart toggles work
  const [savedIds, setSavedIds] = useState(new Set());

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/likes/`, {
          headers: getAuthHeader(),
        });
        if (!res.ok) throw new Error("Failed to load liked recipes.");
        const data = await res.json();
        setFavourites(data);
        setSavedIds(new Set(data.map((f) => f.recipe.external_id)));
      } catch (e) {
        showToast(e.message, "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleUnlike(recipe) {
    const id = recipe.external_id;

    // optimistic remove
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setFavourites((prev) => prev.filter((f) => f.recipe.external_id !== id));

    try {
      const res = await fetch(`${API}/likes/recipes/${id}/`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });
      if (!res.ok && res.status !== 204) throw new Error();
      showToast(`Removed "${recipe.title}" from your likes.`, "info");
    } catch {
      // roll back
      showToast("Could not remove recipe. Please try again.", "error");
      const res = await fetch(`${API}/likes/`, { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setFavourites(data);
        setSavedIds(new Set(data.map((f) => f.recipe.external_id)));
      }
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar />

      <main
        style={{
          flex: 1,
          padding: "1.5rem 2rem",
          maxWidth: "64rem",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "1.75rem" }}>
          <h1
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "2rem",
              color: "var(--text)",
              lineHeight: 1.2,
              marginBottom: "0.25rem",
            }}
          >
            Your{" "}
            <span style={{ color: "var(--accent)", fontStyle: "italic" }}>
              likes.
            </span>
          </h1>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.68rem",
              color: "var(--text-dim)",
              letterSpacing: "0.1em",
            }}
          >
            // recipes you've saved
          </p>
        </div>

        {/* Loading */}
        {loading && <SkeletonGrid />}

        {/* Empty state */}
        {!loading && favourites.length === 0 && (
          <div style={{ textAlign: "center", padding: "5rem 0" }}>
            <div
              style={{
                fontSize: "2.5rem",
                marginBottom: "0.75rem",
                opacity: 0.2,
              }}
            >
              ♡
            </div>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "1rem",
                color: "var(--text-muted)",
                marginBottom: "0.375rem",
              }}
            >
              No liked recipes yet
            </p>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.72rem",
                color: "var(--text-dim)",
                marginBottom: "1.5rem",
              }}
            >
              Heart a recipe on the discover page to save it here
            </p>
            <button
              onClick={() => navigate("/discover")}
              style={{
                padding: "0.5rem 1.25rem",
                backgroundColor: "var(--accent)",
                color: "#11110e",
                border: "none",
                borderRadius: "0.25rem",
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
                fontSize: "0.75rem",
                fontWeight: 500,
              }}
            >
              Browse recipes →
            </button>
          </div>
        )}

        {/* Count */}
        {!loading && favourites.length > 0 && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1.25rem",
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  backgroundColor: "var(--border)",
                }}
              />
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.68rem",
                  color: "var(--text-dim)",
                  letterSpacing: "0.1em",
                }}
              >
                {favourites.length} saved recipe
                {favourites.length !== 1 ? "s" : ""}
              </span>
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  backgroundColor: "var(--border)",
                }}
              />
            </div>

            {/* Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "1rem",
              }}
            >
              {favourites.map(({ recipe, saved_at }) => (
                <div
                  key={recipe.external_id}
                  style={{
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.25rem",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "var(--border-2)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "var(--border)")
                  }
                >
                  {/* Image */}
                  <div style={{ position: "relative" }}>
                    {recipe.image_url ? (
                      <img
                        src={recipe.image_url}
                        alt={recipe.title}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "6.875rem",
                          objectFit: "cover",
                          display: "block",
                          backgroundColor: "var(--bg-hover)",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "6.875rem",
                          backgroundColor: "#22221f",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            width: "2.5rem",
                            height: "2.5rem",
                            borderRadius: "50%",
                            border: "1px solid var(--border-2)",
                            opacity: 0.3,
                          }}
                        />
                      </div>
                    )}

                    {/* Unlike button */}
                    <button
                      onClick={() => handleUnlike(recipe)}
                      title="Remove from likes"
                      style={{
                        position: "absolute",
                        top: "0.4rem",
                        right: "0.4rem",
                        width: "1.625rem",
                        height: "1.625rem",
                        borderRadius: "50%",
                        backgroundColor: "rgba(10,10,9,0.65)",
                        backdropFilter: "blur(4px)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                        transition: "transform 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = "scale(1.15)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    >
                      <HeartIcon filled={true} />
                    </button>
                  </div>

                  {/* Info */}
                  <div
                    style={{
                      padding: "0.6875rem 0.6875rem 0.375rem",
                      flex: 1,
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "0.8125rem",
                        fontWeight: 400,
                        color: "var(--text)",
                        lineHeight: 1.35,
                        marginBottom: "0.5rem",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {recipe.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "0.625rem",
                        color: "var(--text-dim)",
                        marginBottom: "0.5rem",
                        whiteSpace: "pre",
                      }}
                    >
                      {`● ${recipe.ready_in_minutes ? `${recipe.ready_in_minutes} min` : "—"}  ● ${recipe.servings ?? "—"} srv`}
                    </p>
                    {(recipe.tags ?? []).length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.25rem",
                        }}
                      >
                        {recipe.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontFamily: "Inter, sans-serif",
                              fontSize: "0.625rem",
                              color: "var(--text-dim)",
                              backgroundColor: "var(--bg-hover)",
                              border: "1px solid var(--border)",
                              padding: "0.1875rem 0.5rem",
                              borderRadius: "0.125rem",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Saved date */}
                  <div
                    style={{
                      padding: "0.375rem 0.6875rem 0.625rem",
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.5625rem",
                      color: "var(--text-dim)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    saved{" "}
                    {new Date(saved_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
