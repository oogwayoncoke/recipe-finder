"""
Edamam Nutrition Analysis API client.

Fetches per-serving macros for a recipe given its title and ingredient list,
then writes the result into the local Nutrition table.

Edamam Nutrition Analysis API docs:
  https://developer.edamam.com/edamam-docs-nutrition-api

Environment variables required:
  EDAMAM_APP_ID     – your Nutrition Analysis app ID
  EDAMAM_APP_KEY    – your Nutrition Analysis app key

Usage:
  from edamam import fetch_and_persist_nutrition
  nutrition = fetch_and_persist_nutrition(recipe)   # returns Nutrition | None
"""

import logging
import requests
from django.conf import settings

from .models import Nutrition, Recipe  # relative import – lives in recipes/

log = logging.getLogger(__name__)

BASE_URL = "https://api.edamam.com/api/nutrition-details"

# ── Helpers ───────────────────────────────────────────────────────────────────

def _credentials():
    app_id  = getattr(settings, "EDAMAM_APP_ID",  None)
    app_key = getattr(settings, "EDAMAM_APP_KEY", None)
    if not app_id or not app_key:
        raise EnvironmentError(
            "EDAMAM_APP_ID and EDAMAM_APP_KEY must be set in settings / .env"
        )
    return app_id, app_key


def _build_ingredient_lines(recipe: Recipe) -> list[str]:
    """
    Turn RecipeIngredient rows into plain-English strings that Edamam
    understands, e.g. "2 tbsp olive oil", "1 cup flour".
    Falls back to just the ingredient name when amount / unit are missing.
    """
    lines = []
    for ri in recipe.recipe_ingredients.select_related("ingredient").all():
        parts = []
        if ri.amount:
            # strip trailing zeros: 2.0 → "2", 1.5 → "1.5"
            amount_str = (
                str(int(ri.amount)) if ri.amount == int(ri.amount)
                else str(ri.amount)
            )
            parts.append(amount_str)
        if ri.unit:
            parts.append(ri.unit)
        parts.append(ri.ingredient.name)
        lines.append(" ".join(parts))
    return lines


def _safe_nutrient(data: dict, key: str) -> float | None:
    """Extract quantity from Edamam's nested nutrient structure."""
    try:
        return data["totalNutrients"][key]["quantity"]
    except (KeyError, TypeError):
        return None


# ── Public API ────────────────────────────────────────────────────────────────

def fetch_nutrition(recipe: Recipe) -> dict | None:
    """
    POST the recipe to Edamam's Nutrition Analysis endpoint.

    Returns a dict with keys: calories, protein, carbs, fat (all per serving,
    as floats rounded to 1 dp), or None on any failure.
    """
    ingredient_lines = _build_ingredient_lines(recipe)
    if not ingredient_lines:
        log.warning("edamam: recipe %s has no ingredients – skipping", recipe.external_id)
        return None

    try:
        app_id, app_key = _credentials()
    except EnvironmentError as exc:
        log.error("edamam: %s", exc)
        return None

    payload = {
        "title":       recipe.title,
        "ingr":        ingredient_lines,
        "yield":       recipe.servings or 1,
    }

    try:
        res = requests.post(
            BASE_URL,
            params={"app_id": app_id, "app_key": app_key},
            json=payload,
            timeout=10,
        )
    except requests.RequestException as exc:
        log.error("edamam: network error for recipe %s – %s", recipe.external_id, exc)
        return None

    if res.status_code == 555:
        # Edamam returns 555 when it can't parse any ingredients
        log.warning("edamam: could not parse ingredients for recipe %s", recipe.external_id)
        return None

    if not res.ok:
        log.warning(
            "edamam: HTTP %s for recipe %s – %s",
            res.status_code, recipe.external_id, res.text[:200],
        )
        return None

    data     = res.json()
    servings = max(recipe.servings or 1, 1)

    total_cal     = data.get("calories", 0) or 0
    total_protein = _safe_nutrient(data, "PROCNT") or 0
    total_carbs   = _safe_nutrient(data, "CHOCDF") or 0
    total_fat     = _safe_nutrient(data, "FAT")   or 0

    return {
        "calories": round(total_cal     / servings, 1),
        "protein":  round(total_protein / servings, 1),
        "carbs":    round(total_carbs   / servings, 1),
        "fat":      round(total_fat     / servings, 1),
    }


def fetch_and_persist_nutrition(recipe: Recipe) -> "Nutrition | None":
    """
    Fetch nutrition from Edamam and upsert into the local Nutrition table.

    Safe to call multiple times – uses update_or_create so it won't
    duplicate rows if the recipe already has a Nutrition entry.

    Returns the Nutrition ORM instance, or None on failure.
    """
    # Skip if we already have data (avoid burning API quota)
    existing = Nutrition.objects.filter(recipe=recipe).first()
    if existing and existing.calories is not None:
        return existing

    macros = fetch_nutrition(recipe)
    if macros is None:
        return None

    nutrition, _ = Nutrition.objects.update_or_create(
        recipe=recipe,
        defaults=macros,
    )
    log.info(
        "edamam: persisted nutrition for recipe %s (%s kcal/srv)",
        recipe.external_id, macros["calories"],
    )
    return nutrition
