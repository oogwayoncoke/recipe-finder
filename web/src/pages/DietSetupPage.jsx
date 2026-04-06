import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { useToast } from "../context/ToastContext";

const DIET_OPTIONS = [
  { label: "Vegan", value: "vegan" },
  { label: "Vegetarian", value: "vegetarian" },
  { label: "Keto", value: "keto" },
  { label: "Paleo", value: "paleo" },
  { label: "Gluten Free", value: "gluten free" },
  { label: "Halal", value: "halal" },
  { label: "Kosher", value: "kosher" },
  { label: "Pescetarian", value: "pescetarian" },
];

const ALLERGY_OPTIONS = [
  { label: "Dairy", value: "dairy" },
  { label: "Eggs", value: "eggs" },
  { label: "Gluten", value: "gluten" },
  { label: "Peanuts", value: "peanuts" },
  { label: "Sesame", value: "sesame" },
  { label: "Shellfish", value: "shellfish" },
  { label: "Soy", value: "soy" },
  { label: "Tree Nuts", value: "tree nuts" },
  { label: "Wheat", value: "wheat" },
];

function OptionGrid({ options, selected, onToggle, accent = false }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            type="button"
            key={opt.value}
            onClick={() => onToggle(opt.value)}
            style={{
              padding: "0.4375rem 1rem",
              borderRadius: "999px",
              border: active
                ? `1px solid color-mix(in srgb, ${accent ? "var(--accent)" : "var(--error)"} 55%, transparent)`
                : "1px solid var(--border-2)",
              background: active
                ? `color-mix(in srgb, ${accent ? "var(--accent)" : "var(--error)"} 10%, transparent)`
                : "var(--bg-card)",
              color: active
                ? accent
                  ? "var(--accent)"
                  : "var(--error)"
                : "var(--text-muted)",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              fontSize: "0.8rem",
              fontWeight: active ? 500 : 400,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: "2.25rem", textAlign: "left" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          marginBottom: "0.875rem",
        }}
      >
        <div
          style={{
            width: "3px",
            height: "0.75rem",
            borderRadius: "2px",
            backgroundColor: "var(--accent)",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.6rem",
            letterSpacing: "0.14em",
            color: "var(--text-dim)",
          }}
        >
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

export default function DietSetupPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [diets, setDiets] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [saving, setSaving] = useState(false);

  const toggleDiet = useCallback((val) => {
    setDiets((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val],
    );
  }, []);

  const toggleAllergy = useCallback((val) => {
    setAllergies((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val],
    );
  }, []);

  async function handleContinue() {
    setSaving(true);
    try {
      await api.patch("/profiles/me/", {
        diets,
        allergies,
      });
      showToast("Preferences saved!", "success");
      navigate("/discover"); // Adjust this route to wherever users should go next (e.g., home or dashboard)
    } catch (err) {
      showToast("Failed to save preferences.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative background shapes */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {[
          { size: 280, top: "15%", left: "20%", opacity: 0.06 },
          { size: 180, top: "75%", left: "80%", opacity: 0.04 },
          { size: 100, top: "25%", left: "75%", opacity: 0.05 },
          { size: 60, top: "85%", left: "25%", opacity: 0.08 },
        ].map((c, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: c.size,
              height: c.size,
              borderRadius: "50%",
              border: `1px solid var(--accent)`,
              opacity: c.opacity,
              top: c.top,
              left: c.left,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
        {/* Soft center glow */}
        <div
          style={{
            position: "absolute",
            width: 380,
            height: 380,
            borderRadius: "50%",
            backgroundColor: "var(--accent)",
            opacity: 0.03,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      {/* Main Content Container */}
      <div
        className="animate-fade-up"
        style={{
          width: "100%",
          maxWidth: "32rem",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div
          style={{
            fontFamily: "serif",
            fontSize: "2rem",
            color: "var(--text)",
            letterSpacing: "-0.05em",
            lineHeight: 1,
            marginBottom: "2rem",
            textAlign: "center",
          }}
        >
          di
          <span style={{ color: "var(--accent)", fontStyle: "italic" }}>
            sh
          </span>
        </div>

        {/* Card */}
        <div
          style={{
            backgroundColor: "var(--bg-card)",
            border: `1px solid var(--border)`,
            borderRadius: "0.5rem",
            padding: "2.5rem 2rem",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <h2
              style={{
                fontFamily: "serif",
                fontSize: "1.5rem",
                color: "var(--text)",
                marginBottom: "0.5rem",
              }}
            >
              Set up your diet
            </h2>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.875rem",
                color: "var(--text-dim)",
                lineHeight: 1.6,
              }}
            >
              Help us personalize your recipe recommendations.
            </p>
          </div>

          <Section label="DIETARY PREFERENCES">
            <OptionGrid
              options={DIET_OPTIONS}
              selected={diets}
              onToggle={toggleDiet}
              accent
            />
          </Section>

          <Section label="ALLERGIES">
            <OptionGrid
              options={ALLERGY_OPTIONS}
              selected={allergies}
              onToggle={toggleAllergy}
            />
          </Section>

          <button
            onClick={handleContinue}
            disabled={saving}
            style={{
              backgroundColor: "var(--accent)",
              color: "var(--bg)",
              fontFamily: "monospace",
              fontSize: "0.875rem",
              fontWeight: 500,
              letterSpacing: "0.05em",
              padding: "0.75rem 1.25rem",
              borderRadius: "0.25rem",
              border: "none",
              cursor: saving ? "not-allowed" : "pointer",
              transition: "opacity 0.15s",
              width: "100%",
              marginTop: "0.5rem",
              opacity: saving ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!saving) e.currentTarget.style.opacity = "0.85";
            }}
            onMouseLeave={(e) => {
              if (!saving) e.currentTarget.style.opacity = "1";
            }}
          >
            {saving ? "Saving..." : "Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
}
