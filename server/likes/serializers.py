from rest_framework import serializers
from recipes.serializers import RecipeBasicSerializer
from .models import UserFavourite


class FavouriteToggleSerializer(serializers.ModelSerializer):
    """
    Lightweight response for POST /api/recipes/favourites/toggle/ —
    confirms the save and returns the recipe's external_id so the
    frontend can flip the heart icon on the correct RecipeCard.
    """
    external_id = serializers.CharField(source='recipe.external_id', read_only=True)

    class Meta:
        model            = UserFavourite
        fields           = ['id', 'external_id', 'saved_at']
        read_only_fields = fields


class FavouriteListSerializer(serializers.ModelSerializer):
    """
    Used by FavouriteListView — embeds the full basic recipe data so
    the Favorites page gets everything it needs in one request.

    The nested RecipeBasicSerializer returns: external_id, title,
    image_url, ready_in_minutes, servings, and diet_tags — exactly
    what RecipeCard renders on the web and Flutter clients.
    """
    recipe = RecipeBasicSerializer(read_only=True)

    class Meta:
        model  = UserFavourite
        fields = ['id', 'saved_at', 'recipe']