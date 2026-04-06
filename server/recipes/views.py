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
    """POST /recipes/search/ — public browse."""
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

        return Response({
            'results': RecipeBasicSerializer(recipes, many=True).data,
            'total':   total,
        })


class RecipeDetailView(APIView):
    """GET /recipes/<external_id>/ — public."""
    permission_classes     = [AllowAny]
    authentication_classes = []

    def get(self, request, external_id):
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
            if (
                candidate.recipe_ingredients.exists()
                and candidate.instructions.exists()
            ):
                return Response(RecipeSerializer(candidate).data)
        except Recipe.DoesNotExist:
            candidate = None

        try:
            recipe = spoonacular.fetch_recipe_detail(external_id)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

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