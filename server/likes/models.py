from django.conf import settings
from django.db import models


class UserFavourite(models.Model):
    """
    Stores a favorited recipe for a specific user.

    Linked directly to the Recipe model (via external_id-based UUID PK),
    not via Django's generic ContentType framework — the dish app only
    ever favorites recipes, so the generic approach adds complexity with
    no benefit.

    Usage:
        UserFavourite.objects.create(user=request.user, recipe=recipe_instance)
        UserFavourite.objects.filter(user=request.user).select_related('recipe')
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favourites',
        to_field='UUID',
    )

    recipe = models.ForeignKey(
        'recipes.Recipe',
        on_delete=models.CASCADE,
        related_name='favourited_by',
    )

    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table        = 'user_favourites'
        ordering        = ['-saved_at']
        # One row per (user, recipe) — toggling the heart cannot create duplicates
        unique_together = ('user', 'recipe')
        indexes = [
            models.Index(fields=['user', 'recipe']),
        ]

    def __str__(self):
        return f"{self.user.username} ♥ {self.recipe.title}"