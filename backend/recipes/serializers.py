from rest_framework import serializers
from .models import Recipe, Nutrition, Instructions, RecipeIngredient


class RecipeBasicSerializer(serializers.ModelSerializer):
    """Returned on search — fast, no ingredients/instructions."""
    tags = serializers.SerializerMethodField()

    class Meta:
        model  = Recipe
        fields = [
            'id', 'external_id', 'title', 'image_url',
            'ready_in_minutes', 'servings', 'tags',
        ]

    def get_tags(self, obj):
        return [rt.tag.name for rt in obj.recipe_tags.select_related('tag').all()]


class NutritionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Nutrition
        fields = ['calories', 'protein', 'carbs', 'fat']


class InstructionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Instructions
        fields = ['step_num', 'description']


class RecipeIngredientSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='ingredient.name')

    class Meta:
        model  = RecipeIngredient
        fields = ['name', 'amount', 'unit']


class RecipeSerializer(serializers.ModelSerializer):
    """Returned on recipe detail click — full data."""
    tags         = serializers.SerializerMethodField()
    instructions = InstructionSerializer(many=True, read_only=True)
    ingredients  = RecipeIngredientSerializer(source='recipe_ingredients', many=True, read_only=True)
    nutrition    = NutritionSerializer(read_only=True)

    class Meta:
        model  = Recipe
        fields = [
            'id', 'external_id', 'title', 'image_url',
            'ready_in_minutes', 'servings', 'tags',
            'nutrition', 'ingredients', 'instructions',
        ]

    def get_tags(self, obj):
        return [rt.tag.name for rt in obj.recipe_tags.select_related('tag').all()]