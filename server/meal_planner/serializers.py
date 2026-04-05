import datetime
from rest_framework import serializers
from recipes.serializers import RecipeBasicSerializer
from .models import MealPlan, MealPlanEntry


class MealPlanEntrySerializer(serializers.ModelSerializer):
    recipe = RecipeBasicSerializer(read_only=True)

    class Meta:
        model  = MealPlanEntry
        fields = ['id', 'day', 'meal_slot', 'recipe']


class MealPlanEntryWriteSerializer(serializers.Serializer):
    """Used for POST/PUT — accepts external_id instead of pk."""
    day            = serializers.ChoiceField(choices=[
        'monday','tuesday','wednesday','thursday','friday','saturday','sunday'
    ])
    meal_slot      = serializers.ChoiceField(choices=[
        'breakfast','lunch','dinner','snack'
    ])
    recipe_external_id = serializers.IntegerField()


class MealPlanSerializer(serializers.ModelSerializer):
    """Full plan with all entries nested by day."""
    entries    = MealPlanEntrySerializer(many=True, read_only=True)
    week_start = serializers.DateField()

    class Meta:
        model  = MealPlan
        fields = ['id', 'week_start', 'entries']

    def validate_week_start(self, value):
        # Normalize to the Monday of whatever date was sent
        monday = value - datetime.timedelta(days=value.weekday())
        return monday
