from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Recipe, History
from .serializers import RecipeSerializer, RecipeBasicSerializer
from . import spoonacular


class RecipeListView(APIView):
    """GET /recipes/ — returns latest seeded/cached recipes, no external API call."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        limit   = int(request.query_params.get('limit', 12))
        recipes = Recipe.objects.order_by('-id')[:limit]
        return Response({
            'results': RecipeBasicSerializer(recipes, many=True).data,
            'total':   Recipe.objects.count(),
        })


class RecipeSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        query       = request.data.get('query', '').strip()
        ingredients = request.data.get('ingredients', [])
        filters     = request.data.get('filters', {})

        if not query and not ingredients:
            return Response(
                {'error': 'Provide either query or ingredients.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            if ingredients:
                recipes, total = spoonacular.search_by_ingredients(ingredients, filters)
            else:
                recipes, total = spoonacular.search_by_name(query, filters)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        History.objects.bulk_create(
            [History(user=request.user, recipe=r) for r in recipes],
            ignore_conflicts=True,
        )

        return Response({
            'results': RecipeBasicSerializer(recipes, many=True).data,
            'total':   total,
        })


class RecipeDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, external_id):
        try:
            recipe = spoonacular.fetch_recipe_detail(external_id)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(RecipeSerializer(recipe).data)