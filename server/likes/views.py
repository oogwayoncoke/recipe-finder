from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Favorite
from .serializers import FavoriteToggleSerializer, FavoriteListSerializer

# Import the Recipe model + its card serializer for the list view
from recipes.models import Recipe
from recipes.serializers import RecipeBasicSerializer


class FavoriteToggleView(APIView):
    """
    Save or unsave any object the app supports.

    POST   /favorites/recipes/<external_id>/   → save
    DELETE /favorites/recipes/<external_id>/   → unsave
    """
    permission_classes = [IsAuthenticated]

    def _get_recipe(self, external_id):
        return get_object_or_404(Recipe, external_id=external_id)

    def post(self, request, external_id):
        recipe       = self._get_recipe(external_id)
        content_type = ContentType.objects.get_for_model(Recipe)

        favorite, created = Favorite.objects.get_or_create(
            user         = request.user,
            content_type = content_type,
            object_id    = recipe.pk,
        )

        serializer  = FavoriteToggleSerializer(favorite)
        http_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response({'saved': True, 'favorite': serializer.data}, status=http_status)

    def delete(self, request, external_id):
        recipe        = self._get_recipe(external_id)
        content_type  = ContentType.objects.get_for_model(Recipe)
        deleted_count, _ = Favorite.objects.filter(
            user         = request.user,
            content_type = content_type,
            object_id    = recipe.pk,
        ).delete()

        if deleted_count == 0:
            return Response(
                {'detail': 'Recipe was not in your favorites.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class FavoriteListView(APIView):
    """
    GET /favorites/  — all saved items for the logged-in user.

    Returns a unified list. Each entry has { id, object_id, saved_at, item }
    where `item` is the full card data from the object's own serializer.
    """
    permission_classes = [IsAuthenticated]

    # Maps ContentType → serializer class.
    # Add a new entry here whenever a new model becomes favoritable.
    SERIALIZER_MAP_BY_MODEL = {
        Recipe: RecipeBasicSerializer,
    }

    def get(self, request):
        favorites = (
            Favorite.objects
            .filter(user=request.user)
            .select_related('content_type')
            .order_by('-saved_at')
        )

        # Build { content_type.pk: SerializerClass } for the serializer context
        serializer_map = {
            ContentType.objects.get_for_model(model).pk: serializer_cls
            for model, serializer_cls in self.SERIALIZER_MAP_BY_MODEL.items()
        }

        # Prefetch the actual objects to avoid N+1 queries
        self._prefetch_objects(favorites)

        serializer = FavoriteListSerializer(
            favorites,
            many    = True,
            context = {'serializer_map': serializer_map, 'request': request},
        )
        return Response(serializer.data)

    @staticmethod
    def _prefetch_objects(favorites):
        """
        Group favorites by content_type, fetch all related objects in one
        query per type, then attach them back to avoid N+1 queries.
        """
        from collections import defaultdict

        groups = defaultdict(list)
        for fav in favorites:
            groups[fav.content_type].append(fav)

        for ct, favs in groups.items():
            model      = ct.model_class()
            ids        = [f.object_id for f in favs]
            obj_map    = {obj.pk: obj for obj in model.objects.filter(pk__in=ids)}
            for fav in favs:
                fav.content_object = obj_map.get(fav.object_id)


class FavoriteStatusView(APIView):
    """
    GET /favorites/recipes/<external_id>/status/
    Returns { "is_favorited": true|false } — used by RecipeDetail
    to set the initial heart-icon state without fetching the full list.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, external_id):
        recipe       = get_object_or_404(Recipe, external_id=external_id)
        content_type = ContentType.objects.get_for_model(Recipe)
        is_favorited = Favorite.objects.filter(
            user         = request.user,
            content_type = content_type,
            object_id    = recipe.pk,
        ).exists()
        return Response({'is_favorited': is_favorited})
