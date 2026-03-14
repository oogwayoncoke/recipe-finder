from rest_framework import status
from rest_framework.authentication import BasicAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Recipe, History
from .serializers import RecipeSerializer, RecipeBasicSerializer
from . import spoonacular


class RecipeListView(APIView):
    """GET /recipes/ — public, no auth required."""
    permission_classes     = [AllowAny]
    authentication_classes = []

    def get(self, request):
        limit   = int(request.query_params.get('limit', 12))
        recipes = Recipe.objects.order_by('-id')[:limit]
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
        try:
            recipe = spoonacular.fetch_recipe_detail(external_id)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(RecipeSerializer(recipe).data)