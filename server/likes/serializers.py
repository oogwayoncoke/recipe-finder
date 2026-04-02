from rest_framework import serializers
from .models import UserFavourite
# Import your recipe serializer to show recipe details in the list
from recipes.serializers import RecipeBasicSerializer 

class FavoriteToggleSerializer(serializers.ModelSerializer):
    """Returns basic confirmation after a toggle."""
    external_id = serializers.ReadOnlyField(source='recipe.external_id')

    class Meta:
        model  = UserFavourite
        fields = ['id', 'external_id', 'saved_at']

class FavoriteListSerializer(serializers.ModelSerializer):
    """Returns the full recipe object for the 'Liked' page."""
    recipe = RecipeBasicSerializer(read_only=True)

    class Meta:
        model  = UserFavourite
        fields = ['id', 'recipe', 'saved_at']