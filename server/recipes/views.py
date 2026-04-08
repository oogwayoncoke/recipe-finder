from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Recipe
from .serializers import RecipeSerializer, RecipeBasicSerializer
from . import spoonacular


class RecipeListView(APIView):
    """GET /recipes/ — latest cached recipes, public."""
    permission_classes     = [AllowAny]
    authentication_classes = []

    def get(self, request):
        limit   = int(request.query_params.get('limit', 12))
        recipes = Recipe.objects.prefetch_related(
            'recipe_tags__tag',
            'nutrition',
        ).order_by('-id')[:limit]
        return Response({
            'results': RecipeBasicSerializer(recipes, many=True).data,
            'total':   Recipe.objects.count(),
        })


class RecipeSearchView(APIView):
    """POST /recipes/search/ — public browse / search."""
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
        except Exception as exc:
            return Response({'error': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        # Re-fetch with nutrition prefetched so the serializer gets the relation
        recipe_ids = [r.pk for r in recipes]
        recipes = list(
            Recipe.objects.filter(pk__in=recipe_ids)
            .prefetch_related('recipe_tags__tag', 'nutrition')
        )

        return Response({
            'results': RecipeBasicSerializer(recipes, many=True).data,
            'total':   total,
        })


class RecipeDetailView(APIView):
    """GET /recipes/<external_id>/ — full recipe with ingredients, steps & nutrition."""
    permission_classes     = [AllowAny]
    authentication_classes = []

    def get(self, request, external_id):
        try:
            recipe = spoonacular.fetch_recipe_detail(external_id)
        except Exception as exc:
            return Response({'error': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        # Re-fetch with full prefetch so serializer has all relations
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

        return Response(RecipeSerializer(recipe).data)