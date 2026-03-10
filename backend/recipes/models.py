from django.db import models
from django.conf import settings


# ── Recipe core ───────────────────────────────────────────────────────────────

class Recipe(models.Model):
    external_id      = models.IntegerField(unique=True)          # Spoonacular ID
    title            = models.CharField(max_length=255)
    image_url        = models.URLField(blank=True)
    ready_in_minutes = models.IntegerField(null=True, blank=True)
    servings         = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'recipe'

    def __str__(self):
        return self.title


class Nutrition(models.Model):
    recipe   = models.OneToOneField(Recipe, on_delete=models.CASCADE, related_name='nutrition')
    calories = models.FloatField(null=True, blank=True)
    protein  = models.FloatField(null=True, blank=True)
    carbs    = models.FloatField(null=True, blank=True)
    fat      = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'nutrition'


class Instructions(models.Model):
    recipe      = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='instructions')
    step_num    = models.IntegerField()
    description = models.TextField()

    class Meta:
        db_table  = 'instructions'
        ordering  = ['step_num']
        unique_together = ('recipe', 'step_num')


class Ingredient(models.Model):
    name = models.CharField(max_length=255, unique=True)

    class Meta:
        db_table = 'ingredient'

    def __str__(self):
        return self.name


class RecipeIngredient(models.Model):
    recipe     = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='recipe_ingredients')
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    amount     = models.FloatField(null=True, blank=True)
    unit       = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table        = 'recipe_ingredient'
        unique_together = ('recipe', 'ingredient')


class Tag(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'tags'

    def __str__(self):
        return self.name


class RecipeTag(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='recipe_tags')
    tag    = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        db_table        = 'recipe_tags'
        unique_together = ('recipe', 'tag')


# ── User interactions ─────────────────────────────────────────────────────────

class Favorites(models.Model):
    user   = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                               related_name='favorites', to_field='UUID')
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE)

    class Meta:
        db_table        = 'favorites'
        unique_together = ('user', 'recipe')


class History(models.Model):
    user      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                  related_name='history', to_field='UUID')
    recipe    = models.ForeignKey(Recipe, on_delete=models.CASCADE)
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'history'
        ordering = ['-viewed_at']