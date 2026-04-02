from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserFavourite
from .serializers import FavoriteToggleSerializer, FavoriteListSerializer
from recipes.models import Recipe

class FavouriteToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, external_id):
        # FIX: Ensure the recipe exists in our DB before liking it
        recipe, _ = Recipe.objects.get_or_create(
            external_id=external_id,
            defaults={
                'title': request.data.get('title', 'Unknown Recipe'),
                'image_url': request.data.get('image_url', '')
            }
        )

        favourite, created = UserFavourite.objects.get_or_create(
            user=request.user,
            recipe=recipe,
        )

        serializer = FavoriteToggleSerializer(favourite)
        http_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response({'saved': True, 'favourite': serializer.data}, status=http_status)

    def delete(self, request, external_id):
        recipe = get_object_or_404(Recipe, external_id=external_id)
        deleted_count, _ = UserFavourite.objects.filter(
            user=request.user,
            recipe=recipe,
        ).delete()

        if deleted_count == 0:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)

class FavouriteListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        favourites = UserFavourite.objects.filter(user=request.user).select_related('recipe')
        serializer = FavoriteListSerializer(favourites, many=True, context={'request': request})
        return Response(serializer.data)

class FavouriteStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, external_id):
        is_favourited = UserFavourite.objects.filter(
            user=request.user, 
            recipe__external_id=external_id
        ).exists()
        return Response({'is_favourited': is_favourited})