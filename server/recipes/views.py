from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Recipe
from .serializers import RecipeSerializer, RecipeBasicSerializer
from . import spoonacular


class RecipeListView(APIView):
    """GET /recipes/ — public, no auth required."""
    permission_classes     = [AllowAny]
    authentication_classes = []

    def get(self, request):
        limit   = int(request.query_params.get('limit', 12))
        recipes = Recipe.objects.prefetch_related(
            'recipe_tags__tag'
        ).order_by('-id')[:limit]
        return Response({
            'results': RecipeBasicSerializer(recipes, many=True).data,
            'total':   Recipe.objects.count(),
        })


class RecipeSearchView(APIView):
    """POST /recipes/search/ — public browse, history saved for authed users only."""
    permission_classes     = [AllowAny]
    authentication_classes = []

    def post(self, request):
        query       = request.data.get('query', '').strip()
        ingredients = request.data.get('ingredients', [])
        filters     = request.data.get('filters', {})

        try:
            if ingredients:
                recipes, total = spoonacular.search_by_ingredients(ingredients, filters)
            elif query:
                recipes, total = spoonacular.search_by_name(query, filters)
            else:
                recipes, total = spoonacular.browse(filters)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Only log history for authenticated users
        if request.user and request.user.is_authenticated:
            History.objects.bulk_create(
                [History(user=request.user, recipe=r) for r in recipes],
                ignore_conflicts=True,
            )

        return Response({
            'results': RecipeBasicSerializer(recipes, many=True).data,
            'total':   total,
        })


class RecipeDetailView(APIView):
    """GET /recipes/<external_id>/ — public."""
    permission_classes     = [AllowAny]
    authentication_classes = []

    def get(self, request, external_id):
        # ── Optimization: serve from DB with a single JOIN when fully populated ──
        # prefetch_related fires two extra queries (ingredients + instructions)
        # instead of one per row — eliminates the N+1 problem completely.
        try:
            candidate = (
                Recipe.objects
                .prefetch_related(
                    'recipe_ingredients__ingredient',
                    'instructions',
                    'recipe_tags__tag',
                    'nutrition',
                )
                .get(external_id=external_id)
            )
            # If the record already has full detail, skip the Spoonacular call
            if (
                candidate.recipe_ingredients.exists()
                and candidate.instructions.exists()
            ):
                return Response(RecipeSerializer(candidate).data)
        except Recipe.DoesNotExist:
            candidate = None

        # Cache miss or incomplete record — fetch from Spoonacular and persist
        try:
            recipe = spoonacular.fetch_recipe_detail(external_id)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # Re-fetch with prefetch_related so the serializer doesn't hit N+1
        try:
            recipe = (
                Recipe.objects
                .prefetch_related(
                    'recipe_ingredients__ingredient',
                    'instructions',
                    'recipe_tags__tag',
                    'nutrition',
                )
                .get(pk=recipe.pk)
            )
        except Recipe.DoesNotExist:
            pass

        return Response(RecipeSerializer(recipe).data)
