"""
recipes/views.py

Public recipe endpoints — no authentication required.
After a full recipe detail is fetched from Spoonacular, we fire an async
Edamam Nutrition lookup so the next detail request includes macro data.
"""
import threading

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Recipe
from .serializers import RecipeSerializer, RecipeBasicSerializer
from . import spoonacular


def _hydrate_nutrition_async(recipe: Recipe) -> None:
    """
    Trigger an Edamam nutrition fetch in a background thread so the detail
    response isn't blocked.  The result is written to the DB and will be
    present on the *next* detail request for the same recipe.
    """
    def _run():
        try:
            # Late import avoids circular-import issues at module load time
            from recipes.edamam import fetch_and_persist_nutrition  # noqa: PLC0415
            fetch_and_persist_nutrition(recipe)
        except Exception:  # noqa: BLE001
            pass  # never crash the request thread

    threading.Thread(target=_run, daemon=True).start()


class RecipeListView(APIView):
    """GET /recipes/ — latest cached recipes, public, no auth required."""
    permission_classes     = [AllowAny]
    authentication_classes = []

    def get(self, request):
        limit   = int(request.query_params.get("limit", 12))
        recipes = Recipe.objects.prefetch_related(
            "recipe_tags__tag"
        ).order_by("-id")[:limit]
        return Response({
            "results": RecipeBasicSerializer(recipes, many=True).data,
            "total":   Recipe.objects.count(),
        })


class RecipeSearchView(APIView):
    """POST /recipes/search/ — public browse / search."""
    permission_classes     = [AllowAny]
    authentication_classes = []

    def post(self, request):
        query       = request.data.get("query", "").strip()
        ingredients = request.data.get("ingredients", [])
        filters     = request.data.get("filters", {})

        try:
            if ingredients:
                recipes, total = spoonacular.search_by_ingredients(ingredients, filters)
            elif query:
                recipes, total = spoonacular.search_by_name(query, filters)
            else:
                recipes, total = spoonacular.browse(filters)
        except Exception as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({
            "results": RecipeBasicSerializer(recipes, many=True).data,
            "total":   total,
        })


class RecipeDetailView(APIView):
    """GET /recipes/<external_id>/ — full recipe with ingredients, steps & nutrition."""
    permission_classes     = [AllowAny]
    authentication_classes = []

    def get(self, request, external_id):
        # ── 1. Try DB cache first ─────────────────────────────────────────────
        try:
            candidate = (
                Recipe.objects
                .prefetch_related(
                    "recipe_ingredients__ingredient",
                    "instructions",
                    "recipe_tags__tag",
                    "nutrition",
                )
                .get(external_id=external_id)
            )
            if (
                candidate.recipe_ingredients.exists()
                and candidate.instructions.exists()
            ):
                # Kick off nutrition hydration in the background if missing
                if not hasattr(candidate, "nutrition") or candidate.nutrition is None:
                    _hydrate_nutrition_async(candidate)
                return Response(RecipeSerializer(candidate).data)
        except Recipe.DoesNotExist:
            candidate = None

        # ── 2. Cache miss — fetch from Spoonacular ────────────────────────────
        try:
            recipe = spoonacular.fetch_recipe_detail(external_id)
        except Exception as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Re-fetch with full prefetch so serializer has all relations
        try:
            recipe = (
                Recipe.objects
                .prefetch_related(
                    "recipe_ingredients__ingredient",
                    "instructions",
                    "recipe_tags__tag",
                    "nutrition",
                )
                .get(pk=recipe.pk)
            )
        except Recipe.DoesNotExist:
            pass

        # Kick off Edamam nutrition in the background (no ingredients needed
        # because spoonacular.fetch_recipe_detail already persisted them)
        _hydrate_nutrition_async(recipe)

        return Response(RecipeSerializer(recipe).data)
