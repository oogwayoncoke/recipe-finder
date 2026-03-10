from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import History
from .serializers import RecipeSerializer, RecipeBasicSerializer
from . import spoonacular


class RecipeSearchView(APIView):
    """
    POST /recipes/search/
    { "query": "pasta", "filters": {...} }
    OR
    { "ingredients": ["eggs", "tomato"], "filters": {...} }

    Returns basic recipe data only (fast).
    """
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

        # Save to history
        History.objects.bulk_create(
            [History(user=request.user, recipe=r) for r in recipes],
            ignore_conflicts=True,
        )

        serializer = RecipeBasicSerializer(recipes, many=True)
        return Response({'results': serializer.data, 'total': total})


class RecipeDetailView(APIView):
    """
    GET /recipes/<external_id>/
    Returns full recipe data (ingredients + instructions).
    Fetches from Spoonacular only if not already in DB.
    Nutrition is fetched separately via Edamam on the frontend.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, external_id):
        try:
            recipe = spoonacular.fetch_recipe_detail(external_id)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        serializer = RecipeSerializer(recipe)
        return Response(serializer.data)